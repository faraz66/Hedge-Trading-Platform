from flask import Flask, render_template, request, jsonify, send_file
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from datetime import datetime, timedelta
import calendar
import numpy as np
import ta
import io
import json
import ccxt
import sys
import os
import argparse

# Add the project root to Python path
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

from trading_bot.backtesting.grid_backtester import GridBacktester
from trading_bot.config.strategy_config import GRID_CONFIGS
from trading_bot.strategies import AVAILABLE_STRATEGIES
from itertools import product
import time
from pathlib import Path
import pickle
from typing import Optional, Dict, Any
from concurrent.futures import ThreadPoolExecutor, as_completed
import multiprocessing
from functools import partial
import psutil
from flask_cors import CORS
from trading_bot.strategies.base_strategy import StrategyRegistry

app = Flask(__name__, template_folder='templates')
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# Print available strategies for debugging
print("Available strategies:", AVAILABLE_STRATEGIES)

# Add cache directory configuration
CACHE_DIR = Path("trading_bot/cache")
CACHE_DIR.mkdir(parents=True, exist_ok=True)

# Add available timeframes
AVAILABLE_TIMEFRAMES = {
    '1m': '1 minute',
    '5m': '5 minutes',
    '15m': '15 minutes',
    '30m': '30 minutes',
    '1h': '1 hour',
    '4h': '4 hours',
    '1d': '1 day'
}

def get_cache_key(symbol: str, timeframe: str, start_date: str, end_date: Optional[str]) -> str:
    """Generate a unique cache key for the data request"""
    end_str = end_date if end_date else 'latest'
    symbol_dir = symbol.replace('/', '')
    return f"{symbol_dir}_{timeframe}_{start_date}_{end_str}.pkl"

def load_from_cache(cache_key: str) -> Optional[pd.DataFrame]:
    """Load data from cache if available"""
    cache_file = CACHE_DIR / cache_key
    if cache_file.exists():
        # Check if cache is less than 24 hours old for longer backtests
        if time.time() - cache_file.stat().st_mtime < 86400:
            try:
                with open(cache_file, 'rb') as f:
                    return pickle.load(f)
            except Exception as e:
                app.logger.warning(f"Failed to load cache: {e}")
    return None

def save_to_cache(cache_key: str, data: pd.DataFrame) -> None:
    """Save data to cache"""
    try:
        cache_file = CACHE_DIR / cache_key
        cache_file.parent.mkdir(parents=True, exist_ok=True)
        with open(cache_file, 'wb') as f:
            pickle.dump(data, f)
    except Exception as e:
        app.logger.warning(f"Failed to save cache: {e}")

def load_historical_data(symbol: str, start_date: str, end_date: str = None, timeframe: str = '1h') -> pd.DataFrame:
    """Load historical data using CCXT with caching and multiple timeframes"""
    try:
        # Check cache first
        cache_key = get_cache_key(symbol, timeframe, start_date, end_date)
        cached_data = load_from_cache(cache_key)
        if cached_data is not None:
            app.logger.info(f"Loaded data from cache for {symbol}")
            return cached_data

        # Initialize exchange with proper timeout settings
        exchange = ccxt.binance({
            'enableRateLimit': True,
            'timeout': 30000,
            'options': {
                'defaultType': 'spot',
            }
        })
        
        # Convert dates to timestamps
        start_ts = int(pd.Timestamp(start_date).timestamp() * 1000)
        end_ts = int(pd.Timestamp(end_date).timestamp() * 1000) if end_date else int(datetime.now().timestamp() * 1000)
        
        all_candles = []
        since = start_ts
        max_retries = 3
        retry_delay = 5
        
        while since < end_ts:
            for attempt in range(max_retries):
                try:
                    app.logger.info(f"Fetching {timeframe} data for {symbol} from {pd.Timestamp(since, unit='ms')}")
                    
                    candles = exchange.fetch_ohlcv(
                        symbol,
                        timeframe=timeframe,
                        since=since,
                        limit=1000
                    )
                    
                    if candles:
                        all_candles.extend(candles)
                        # Update since based on timeframe
                        timeframe_seconds = exchange.parse_timeframe(timeframe)
                        since = candles[-1][0] + (timeframe_seconds * 1000)
                        
                        exchange.sleep(1)
                        break
                    else:
                        app.logger.warning(f"No data received for {symbol} at {pd.Timestamp(since, unit='ms')}")
                        break
                        
                except (ccxt.RequestTimeout, ccxt.NetworkError) as e:
                    if attempt == max_retries - 1:
                        raise ValueError(f"Error after {max_retries} attempts: {str(e)}")
                    app.logger.warning(f"Attempt {attempt + 1}/{max_retries} failed. Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                    
                except Exception as e:
                    raise ValueError(f"Unexpected error: {str(e)}")
            
            if len(candles) < 1000:
                break
        
        if not all_candles:
            raise ValueError(f"No data available for {symbol} in the specified date range")
        
        df = pd.DataFrame(all_candles, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
        df.set_index('timestamp', inplace=True)
        df = df[~df.index.duplicated(keep='first')]
        df.sort_index(inplace=True)
        
        # Save to cache
        save_to_cache(cache_key, df)
        
        app.logger.info(f"Successfully loaded {len(df)} data points for {symbol}")
        return df
        
    except Exception as e:
        error_msg = f"Error loading historical data: {str(e)}"
        app.logger.error(error_msg)
        raise ValueError(error_msg)

def create_heatmap(equity_df: pd.DataFrame, period: str = 'M') -> go.Figure:
    """Create a modern heatmap of returns with enhanced visualization"""
    try:
        # Ensure we have a DataFrame with datetime index
        if 'timestamp' in equity_df.columns:
            equity_df = equity_df.set_index('timestamp')
        
        # Calculate returns
        returns = equity_df['equity'].pct_change()
        returns_df = pd.DataFrame({'returns': returns})
        
        if period == 'M':
            # Monthly returns heatmap
            pivot_table = returns_df.groupby([
                returns_df.index.year,
                returns_df.index.month
            ])['returns'].sum().unstack()
            
            # Format month names and ensure all months are present
            all_months = range(1, 13)
            pivot_table = pivot_table.reindex(columns=all_months)
            pivot_table.columns = [calendar.month_abbr[m] for m in all_months]
            
            title = 'Monthly Returns Distribution'
            xaxis_title = 'Month'
            yaxis_title = 'Year'
            
            # Calculate statistics for hover text
            monthly_stats = returns_df.groupby([
                returns_df.index.year,
                returns_df.index.month
            ]).agg({
                'returns': ['sum', 'mean', 'std', 'count']
            })
            
            # Create hover text
            hover_text = []
            for year in pivot_table.index:
                row_text = []
                for month in range(1, 13):
                    try:
                        stats = monthly_stats.loc[(year, month)]['returns']
                        text = (f"Year: {year}<br>"
                               f"Month: {calendar.month_abbr[month]}<br>"
                               f"Total Return: {stats['sum']:.2%}<br>"
                               f"Avg Daily Return: {stats['mean']:.2%}<br>"
                               f"Volatility: {stats['std']:.2%}<br>"
                               f"Trading Days: {int(stats['count'])}")
                    except:
                        text = f"No trading activity<br>Year: {year}<br>Month: {calendar.month_abbr[month]}"
                    row_text.append(text)
                hover_text.append(row_text)
            
        else:
            # Daily returns heatmap
            pivot_table = returns_df.groupby([
                returns_df.index.dayofweek,
                returns_df.index.hour
            ])['returns'].mean().unstack()
            
            # Ensure all hours are present
            all_hours = range(24)
            pivot_table = pivot_table.reindex(columns=all_hours)
            
            # Format day names
            days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            pivot_table.index = days
            
            title = 'Intraday Returns Pattern'
            xaxis_title = 'Hour of Day'
            yaxis_title = 'Day of Week'
            
            # Calculate statistics for hover text
            hourly_stats = returns_df.groupby([
                returns_df.index.dayofweek,
                returns_df.index.hour
            ]).agg({
                'returns': ['mean', 'std', 'count']
            })
            
            # Create hover text
            hover_text = []
            for day_idx, day in enumerate(days):
                row_text = []
                for hour in range(24):
                    try:
                        stats = hourly_stats.loc[(day_idx, hour)]['returns']
                        text = (f"Day: {day}<br>"
                               f"Hour: {hour:02d}:00<br>"
                               f"Avg Return: {stats['mean']:.2%}<br>"
                               f"Volatility: {stats['std']:.2%}<br>"
                               f"Samples: {int(stats['count'])}")
                    except:
                        text = f"No trading activity<br>{day} {hour:02d}:00"
                    row_text.append(text)
                hover_text.append(row_text)
        
        # Create modern colorscale
        max_abs_val = np.nanmax(np.abs(pivot_table.values))
        colorscale = [
            [0, 'rgb(165,0,38)'],          # Deep Red for significant losses
            [0.25, 'rgb(215,48,39)'],      # Red
            [0.4, 'rgb(244,109,67)'],      # Light Red
            [0.5, 'rgb(255,255,255)'],     # White for neutral
            [0.6, 'rgb(116,173,209)'],     # Light Green
            [0.75, 'rgb(49,130,189)'],     # Green
            [1, 'rgb(0,104,55)']           # Deep Green for significant gains
        ]
        
        # Create heatmap with modern styling
        fig = go.Figure(data=go.Heatmap(
            z=pivot_table.values,
            x=pivot_table.columns,
            y=pivot_table.index,
            colorscale=colorscale,
            zmid=0,
            zmin=-max_abs_val,
            zmax=max_abs_val,
            colorbar=dict(
                title=dict(
                    text='Return %',
                    font=dict(size=12)
                ),
                tickformat='.1%',
                len=0.9,
                thickness=15,
                outlinewidth=0
            ),
            hoverongaps=False,
            text=hover_text,
            hoverinfo='text'
        ))
        
        # Update layout with modern styling
        fig.update_layout(
            title=dict(
                text=title,
                x=0.5,
                y=0.95,
                xanchor='center',
                yanchor='top',
                font=dict(size=16)
            ),
            xaxis=dict(
                title=xaxis_title,
                tickfont=dict(size=10),
                showgrid=False,
                showline=True,
                linecolor='rgba(0,0,0,0.2)',
                linewidth=1,
                ticks='outside',
                ticklen=5
            ),
            yaxis=dict(
                title=yaxis_title,
                tickfont=dict(size=10),
                showgrid=False,
                showline=True,
                linecolor='rgba(0,0,0,0.2)',
                linewidth=1,
                ticks='outside',
                ticklen=5
            ),
            height=400,
            margin=dict(l=50, r=50, t=50, b=30),
            paper_bgcolor='white',
            plot_bgcolor='white',
            font=dict(family='Arial, sans-serif')
        )
        
        return fig
    except Exception as e:
        app.logger.warning(f"Error creating returns heatmap: {str(e)}")
        return go.Figure()

def calculate_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate enhanced technical indicators with optimized performance"""
    try:
        # Create a copy to avoid modifying the original dataframe
        df = df.copy()
        
        # Calculate basic price indicators first (most important)
        df['sma_20'] = ta.trend.sma_indicator(df['close'], window=20, fillna=True)
        df['sma_50'] = ta.trend.sma_indicator(df['close'], window=50, fillna=True)
        df['sma_200'] = ta.trend.sma_indicator(df['close'], window=200, fillna=True)
        
        # Calculate Bollinger Bands (important for grid strategy)
        bb = ta.volatility.BollingerBands(df['close'], fillna=True)
        df['bb_upper'] = bb.bollinger_hband()
        df['bb_lower'] = bb.bollinger_lband()
        
        # Calculate ATR with proper window size
        if len(df) >= 14:  # Ensure enough data points for ATR
            df['atr'] = ta.volatility.average_true_range(df['high'], df['low'], df['close'], window=14, fillna=True)
        else:
            df['atr'] = 0  # Default value for small chunks
        
        # Calculate only essential additional indicators
        df['rsi'] = ta.momentum.rsi(df['close'], fillna=True)
        macd = ta.trend.MACD(df['close'], fillna=True)
        df['macd_line'] = macd.macd()
        df['macd_signal'] = macd.macd_signal()
        
        # Calculate custom indicators
        df['volatility_ratio'] = df['atr'] / df['close']
        
        return df
    except Exception as e:
        app.logger.error(f"Error calculating indicators: {str(e)}")
        raise

def process_chunk_with_indicators(chunk: pd.DataFrame) -> pd.DataFrame:
    """Process a single chunk of data with indicators"""
    try:
        return calculate_indicators(chunk)
    except Exception as e:
        app.logger.error(f"Error processing chunk: {str(e)}")
        raise

def parallel_process_indicators(historical_data: pd.DataFrame, max_workers: int = None) -> pd.DataFrame:
    """Process indicators in parallel with optimized chunk sizes"""
    if max_workers is None:
        max_workers = max(1, multiprocessing.cpu_count() - 1)
    
    # Ensure minimum chunk size for technical indicators (especially ATR)
    min_chunk_size = 250  # Minimum size needed for proper indicator calculation
    optimal_chunk_size = max(min_chunk_size, len(historical_data) // max_workers)
    
    # Adjust chunk size to ensure proper overlap for indicator calculation
    chunk_size = optimal_chunk_size + 200  # Add overlap period
    
    chunks = []
    for i in range(0, len(historical_data), optimal_chunk_size):
        # Get chunk with overlap
        chunk_end = min(i + chunk_size, len(historical_data))
        chunk = historical_data[i:chunk_end].copy()
        chunks.append((i, chunk))
    
    app.logger.info(f"Processing {len(historical_data)} data points in {len(chunks)} chunks using {max_workers} workers...")
    
    processed_chunks = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_chunk = {executor.submit(process_chunk_with_indicators, chunk_data): (i, chunk_idx) 
                         for chunk_idx, (i, chunk_data) in enumerate(chunks)}
        
        for future in as_completed(future_to_chunk):
            start_idx, chunk_num = future_to_chunk[future]
            try:
                processed_chunk = future.result()
                # Remove overlap except for the last chunk
                if chunk_num < len(chunks) - 1:
                    processed_chunk = processed_chunk.iloc[:optimal_chunk_size]
                processed_chunks.append((start_idx, processed_chunk))
                app.logger.info(f"Completed processing chunk {chunk_num + 1}/{len(chunks)}")
            except Exception as e:
                app.logger.error(f"Error processing chunk {chunk_num + 1}: {str(e)}")
                raise
    
    # Sort chunks by their start index and concatenate
    processed_chunks.sort(key=lambda x: x[0])
    return pd.concat([chunk for _, chunk in processed_chunks])

def optimize_strategy(symbol: str, historical_data: pd.DataFrame, param_ranges: dict) -> dict:
    """Run grid search optimization with chunking for better performance"""
    results = []
    param_combinations = [dict(zip(param_ranges.keys(), v)) for v in product(*param_ranges.values())]
    
    # Split data into chunks for optimization
    chunk_size = min(len(historical_data), 50000)
    data_chunk = historical_data.tail(chunk_size)
    
    app.logger.info(f"Running optimization on {len(param_combinations)} parameter combinations...")
    
    for i, params in enumerate(param_combinations):
        if i % 5 == 0:  # Log progress every 5 combinations
            app.logger.info(f"Optimization progress: {i}/{len(param_combinations)}")
            
        backtester = GridBacktester(symbol=symbol, initial_capital=100000.0, **params)
        result = backtester.run_backtest(data_chunk)
        results.append({
            'params': params,
            'sharpe_ratio': result['sharpe_ratio'],
            'total_return': result['total_return'],
            'max_drawdown': result['max_drawdown']
        })
    
    # Sort by Sharpe ratio
    results.sort(key=lambda x: x['sharpe_ratio'], reverse=True)
    return results[0]

def parallel_optimize_strategy(symbol: str, historical_data: pd.DataFrame, param_ranges: dict, max_workers: int = None) -> dict:
    """Run grid search optimization in parallel"""
    if max_workers is None:
        max_workers = max(1, multiprocessing.cpu_count() - 1)
    
    param_combinations = [dict(zip(param_ranges.keys(), v)) for v in product(*param_ranges.values())]
    chunk_size = min(len(historical_data), 50000)
    data_chunk = historical_data.tail(chunk_size)
    
    app.logger.info(f"Running parallel optimization on {len(param_combinations)} parameter combinations using {max_workers} workers...")
    
    results = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        def optimize_single(params):
            backtester = GridBacktester(symbol=symbol, initial_capital=100000.0, **params)
            result = backtester.run_backtest(data_chunk)
            return {
                'params': params,
                'sharpe_ratio': result['sharpe_ratio'],
                'total_return': result['total_return'],
                'max_drawdown': result['max_drawdown']
            }
        
        future_to_params = {executor.submit(optimize_single, params): i 
                          for i, params in enumerate(param_combinations)}
        
        completed = 0
        for future in as_completed(future_to_params):
            try:
                result = future.result()
                results.append(result)
                completed += 1
                if completed % 5 == 0:
                    app.logger.info(f"Optimization progress: {completed}/{len(param_combinations)}")
            except Exception as e:
                app.logger.error(f"Error in optimization: {str(e)}")
                raise
    
    results.sort(key=lambda x: x['sharpe_ratio'], reverse=True)
    return results[0]

def calculate_advanced_metrics(equity_curve: pd.DataFrame, trades: list) -> dict:
    """Calculate additional performance metrics"""
    returns = equity_curve['equity'].pct_change()
    
    # Risk metrics
    sortino_ratio = np.sqrt(252) * returns.mean() / returns[returns < 0].std()
    calmar_ratio = returns.mean() * 252 / abs(returns.cummin().min())
    
    # Trade metrics
    trade_returns = pd.Series([t['value'] for t in trades])
    avg_win = trade_returns[trade_returns > 0].mean() if len(trade_returns[trade_returns > 0]) > 0 else 0
    avg_loss = trade_returns[trade_returns < 0].mean() if len(trade_returns[trade_returns < 0]) > 0 else 0
    profit_factor = abs(trade_returns[trade_returns > 0].sum() / trade_returns[trade_returns < 0].sum()) if len(trade_returns[trade_returns < 0]) > 0 else float('inf')
    
    return {
        'sortino_ratio': sortino_ratio,
        'calmar_ratio': calmar_ratio,
        'avg_win': avg_win,
        'avg_loss': avg_loss,
        'profit_factor': profit_factor,
        'recovery_factor': returns.mean() * 252 / abs(returns.cummin().min()) if abs(returns.cummin().min()) > 0 else float('inf'),
        'risk_return_ratio': returns.mean() / returns.std() if returns.std() > 0 else float('inf')
    }

def create_equity_curve(equity_df: pd.DataFrame) -> go.Figure:
    """Create equity curve chart"""
    fig = go.Figure()
    
    # Add equity line
    fig.add_trace(go.Scatter(
        x=equity_df['timestamp'],
        y=equity_df['equity'],
        name='Equity',
        line=dict(color='#2ecc71', width=2)
    ))
    
    # Add drawdown fill
    equity = equity_df['equity'].values
    peak = np.maximum.accumulate(equity)
    drawdown = (equity - peak) / peak * 100
    
    fig.add_trace(go.Scatter(
        x=equity_df['timestamp'],
        y=drawdown,
        name='Drawdown',
        fill='tonexty',
        line=dict(color='rgba(231, 76, 60, 0.3)'),
        yaxis='y2'
    ))
    
    # Update layout
    fig.update_layout(
        title='Equity Curve and Drawdown',
        yaxis=dict(title='Equity', side='left'),
        yaxis2=dict(title='Drawdown %', side='right', overlaying='y'),
        showlegend=True,
        height=500
    )
    
    return fig

def normalize_symbol(symbol: str) -> str:
    """Normalize symbol format by removing '/' and converting to uppercase"""
    return symbol.replace('/', '').upper()

@app.route('/')
def index():
    # Convert GRID_CONFIGS keys to display format (with '/')
    display_symbols = [f"{symbol[:3]}/{symbol[3:]}" for symbol in GRID_CONFIGS.keys()]
    return render_template('index.html', 
                         symbols=display_symbols,
                         default_params=GRID_CONFIGS[list(GRID_CONFIGS.keys())[0]],
                         timeframes=AVAILABLE_TIMEFRAMES)

@app.route('/ensure_cache', methods=['POST'])
def ensure_cache():
    try:
        data = request.get_json()
        symbol = data.get('symbol', '').replace('/', '')
        cache_dir = os.path.join('trading_bot', 'cache', symbol)
        os.makedirs(cache_dir, exist_ok=True)
        return jsonify({'status': 'success'})
    except Exception as e:
        app.logger.error(f"Error creating cache directory: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/run_backtest', methods=['POST'])
def run_backtest():
    try:
        app.logger.info("Starting backtest process...")
        data = request.get_json()
        
        # Extract parameters
        symbol = data.get('symbol')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        optimize = data.get('optimize', False)
        
        if not all([symbol, start_date]):
            raise ValueError("Missing required parameters")

        # Normalize symbol for configuration lookup
        normalized_symbol = normalize_symbol(symbol)
        if normalized_symbol not in GRID_CONFIGS:
            raise ValueError(f"Configuration not found for symbol: {symbol}")

        app.logger.info("Loading historical data...")
        historical_data = load_historical_data(symbol, start_date, end_date)
        
        # Calculate optimal number of workers based on system resources
        available_memory = psutil.virtual_memory().available / (1024 * 1024 * 1024)  # Available memory in GB
        data_size = len(historical_data)
        
        # Adjust workers based on available memory and data size
        memory_based_workers = max(1, int(available_memory / 2))  # Use 2GB per worker as estimate
        size_based_workers = max(1, data_size // 10000)  # One worker per 10k data points
        num_workers = min(
            max(1, multiprocessing.cpu_count() - 1),  # CPU-based
            memory_based_workers,                      # Memory-based
            size_based_workers                         # Data size-based
        )
        
        app.logger.info(f"Using {num_workers} workers based on system resources...")
        
        # Process indicators in parallel with optimized chunks
        app.logger.info("Processing indicators in parallel...")
        historical_data = parallel_process_indicators(historical_data, max_workers=num_workers)
        
        app.logger.info("Running backtest...")
        start_time = time.time()
        
        if optimize:
            app.logger.info("Starting parallel optimization process...")
            param_ranges = {
                'grid_size': range(5, 15, 2),
                'grid_spacing': np.arange(0.005, 0.02, 0.005),
                'size_multiplier': np.arange(1.0, 1.3, 0.1)
            }
            best_params = parallel_optimize_strategy(normalized_symbol, historical_data, param_ranges, max_workers=num_workers)
            backtester = GridBacktester(symbol=normalized_symbol, initial_capital=100000.0, **best_params['params'])
        else:
            backtester = GridBacktester(symbol=normalized_symbol, initial_capital=100000.0)
        
        results = backtester.run_backtest(historical_data)
        
        elapsed_time = time.time() - start_time
        app.logger.info(f"Backtest completed in {elapsed_time:.2f} seconds")

        # Ensure results has all required keys
        if 'equity_curve' not in results:
            raise ValueError("Backtest results missing equity curve data")
        
        # Calculate additional metrics
        app.logger.info("Calculating performance metrics...")
        equity_df = pd.DataFrame(results['equity_curve'])
        trades = results.get('trades', [])
        advanced_metrics = calculate_advanced_metrics(equity_df, trades)
        
        # Create base metrics dictionary
        metrics = {
            'total_return': results.get('total_return', 0),
            'sharpe_ratio': results.get('sharpe_ratio', 0),
            'max_drawdown': results.get('max_drawdown', 0),
            'win_rate': results.get('win_rate', 0),
            'number_of_trades': len(trades),
            'final_capital': results.get('final_capital', 100000.0)
        }
        
        # Update with advanced metrics
        metrics.update(advanced_metrics)
        
        # Format metrics for display
        formatted_metrics = {
            'total_return': f"{metrics['total_return']:.2%}",
            'sharpe_ratio': f"{metrics['sharpe_ratio']:.2f}",
            'sortino_ratio': f"{metrics['sortino_ratio']:.2f}",
            'calmar_ratio': f"{metrics['calmar_ratio']:.2f}",
            'max_drawdown': f"{metrics['max_drawdown']:.2%}",
            'win_rate': f"{metrics['win_rate']:.2%}",
            'profit_factor': f"{metrics['profit_factor']:.2f}",
            'recovery_factor': f"{metrics['recovery_factor']:.2f}",
            'risk_return_ratio': f"{metrics['risk_return_ratio']:.2f}",
            'avg_win': f"${metrics['avg_win']:.2f}",
            'avg_loss': f"${abs(metrics['avg_loss']):.2f}",
            'number_of_trades': metrics['number_of_trades'],
            'final_capital': f"${metrics['final_capital']:,.2f}"
        }
        
        # Create enhanced charts
        app.logger.info("Generating charts...")
        charts = create_enhanced_charts(historical_data, equity_df, trades)
        
        app.logger.info("Backtest completed successfully.")
        return jsonify({
            'status': 'success',
            'metrics': formatted_metrics,
            'charts': charts,
            'trades': trades,
            'optimized_params': best_params if optimize else None
        })
        
    except Exception as e:
        app.logger.error(f"Error in backtest: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/export_results', methods=['POST'])
def export_results():
    try:
        data = request.json
        if not data:
            raise ValueError("No data provided for export")

        # Create Excel writer with better formatting
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='xlsxwriter', mode='binary') as writer:
            workbook = writer.book

            # Create formats
            header_format = workbook.add_format({
                'bold': True,
                'bg_color': '#D3D3D3',
                'border': 1
            })
            cell_format = workbook.add_format({
                'border': 1
            })
            number_format = workbook.add_format({
                'border': 1,
                'num_format': '#,##0.00'
            })
            percent_format = workbook.add_format({
                'border': 1,
                'num_format': '0.00%'
            })
            
            # Write metrics if available
            if 'metrics' in data:
                metrics_df = pd.DataFrame([data['metrics']])
                metrics_sheet = workbook.add_worksheet('Metrics')
                metrics_sheet.set_column('A:Z', 15)  # Set column width
                
                # Write headers
                for col, value in enumerate(metrics_df.columns):
                    metrics_sheet.write(0, col, value, header_format)
                
                # Write data with formatting
                for row in range(len(metrics_df)):
                    for col, value in enumerate(metrics_df.iloc[row]):
                        if isinstance(value, str):
                            if '%' in value:
                                try:
                                    value = float(value.strip('%')) / 100
                                    metrics_sheet.write(row + 1, col, value, percent_format)
                                except:
                                    metrics_sheet.write(row + 1, col, value, cell_format)
                            elif '$' in value:
                                try:
                                    value = float(value.strip('$').replace(',', ''))
                                    metrics_sheet.write(row + 1, col, value, number_format)
                                except:
                                    metrics_sheet.write(row + 1, col, value, cell_format)
                            else:
                                metrics_sheet.write(row + 1, col, value, cell_format)
                        else:
                            metrics_sheet.write(row + 1, col, value, number_format)
            
            # Write trades if available
            if 'trades' in data and data['trades']:
                trades_df = pd.DataFrame(data['trades'])
                if not trades_df.empty:
                    trades_df['timestamp'] = pd.to_datetime(trades_df['timestamp'])
                    
                    # Create Trade History sheet with enhanced information
                    history_sheet = workbook.add_worksheet('Trade History')
                    history_sheet.set_column('A:K', 15)  # Set column width
                    
                    # Define headers for trade history
                    headers = [
                        'Date & Time', 'Type', 'Price', 'Size', 'Value', 
                        'Running P&L', 'Duration', 'Entry Price', 'Exit Price',
                        'Price Change %', 'Trade Result'
                    ]
                    
                    # Write headers
                    for col, header in enumerate(headers):
                        history_sheet.write(0, col, header, header_format)
                    
                    # Calculate additional trade metrics
                    running_pnl = 0
                    prev_trade_time = None
                    entry_price = None
                    
                    # Write trade data with enhanced information
                    for row, trade in enumerate(data['trades'], start=1):
                        trade_time = pd.to_datetime(trade['timestamp'])
                        running_pnl += float(trade['value'])
                        
                        # Calculate trade duration if we have a previous trade
                        duration = ''
                        if prev_trade_time:
                            duration = str(trade_time - prev_trade_time)
                        
                        # Calculate price change percentage
                        price_change_pct = ''
                        if trade['type'] == 'SELL' and entry_price:
                            price_change_pct = (trade['price'] - entry_price) / entry_price * 100
                        
                        # Update entry price for next calculation
                        if trade['type'] == 'BUY':
                            entry_price = trade['price']
                        
                        # Write trade data with appropriate formatting
                        history_sheet.write(row, 0, trade_time.strftime('%Y-%m-%d %H:%M:%S'), cell_format)
                        history_sheet.write(row, 1, trade['type'], cell_format)
                        history_sheet.write(row, 2, trade['price'], number_format)
                        history_sheet.write(row, 3, trade['size'], number_format)
                        history_sheet.write(row, 4, trade['value'], number_format)
                        history_sheet.write(row, 5, running_pnl, number_format)
                        history_sheet.write(row, 6, duration, cell_format)
                        history_sheet.write(row, 7, entry_price if entry_price else '', number_format)
                        history_sheet.write(row, 8, trade['price'] if trade['type'] == 'SELL' else '', number_format)
                        history_sheet.write(row, 9, f"{price_change_pct:.2f}%" if price_change_pct else '', percent_format)
                        history_sheet.write(row, 10, 'Win' if trade['value'] > 0 else 'Loss' if trade['value'] < 0 else 'Break Even', cell_format)
                        
                        prev_trade_time = trade_time
                    
                    # Add summary statistics at the bottom
                    summary_start_row = len(data['trades']) + 3
                    history_sheet.write(summary_start_row, 0, 'Summary Statistics', header_format)
                    
                    trades_df = pd.DataFrame(data['trades'])
                    win_trades = trades_df[trades_df['value'] > 0]
                    loss_trades = trades_df[trades_df['value'] < 0]
                    
                    summary_stats = [
                        ('Total Trades', len(trades_df)),
                        ('Winning Trades', len(win_trades)),
                        ('Losing Trades', len(loss_trades)),
                        ('Win Rate', len(win_trades) / len(trades_df) if len(trades_df) > 0 else 0),
                        ('Average Win', win_trades['value'].mean() if len(win_trades) > 0 else 0),
                        ('Average Loss', loss_trades['value'].mean() if len(loss_trades) > 0 else 0),
                        ('Largest Win', win_trades['value'].max() if len(win_trades) > 0 else 0),
                        ('Largest Loss', loss_trades['value'].min() if len(loss_trades) > 0 else 0),
                        ('Total P&L', trades_df['value'].sum())
                    ]
                    
                    for i, (label, value) in enumerate(summary_stats):
                        history_sheet.write(summary_start_row + i + 1, 0, label, cell_format)
                        if isinstance(value, float):
                            if 'Rate' in label:
                                history_sheet.write(summary_start_row + i + 1, 1, value, percent_format)
                            else:
                                history_sheet.write(summary_start_row + i + 1, 1, value, number_format)
                        else:
                            history_sheet.write(summary_start_row + i + 1, 1, value, cell_format)

        # Reset buffer position
        output.seek(0)
        
        # Generate filename with safe timestamp format
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")  # Using a simpler timestamp format
        filename = f'backtest_results_{timestamp}.xlsx'
        
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        app.logger.error(f"Error exporting results: {str(e)}")
        return jsonify({'error': str(e)}), 500

def create_trade_heatmap(trades: list, period: str = 'M') -> go.Figure:
    """Create a modern trade activity heatmap with enhanced visualization"""
    try:
        # Convert trades to DataFrame and ensure proper datetime handling
        trades_df = pd.DataFrame(trades)
        if trades_df.empty:
            return go.Figure()
        
        trades_df['timestamp'] = pd.to_datetime(trades_df['timestamp'])
        trades_df.set_index('timestamp', inplace=True)
        
        # Calculate trade metrics
        trades_df['profit'] = trades_df['value']  # Assuming value represents P&L
        trades_df['is_win'] = trades_df['profit'] > 0
        
        if period == 'M':
            # Monthly trade heatmap
            stats = trades_df.groupby([
                trades_df.index.year,
                trades_df.index.month
            ]).agg({
                'profit': ['count', 'sum', 'mean', 'std'],
                'is_win': 'sum',
                'price': ['mean', 'min', 'max']
            }).round(2)
            
            # Prepare data for heatmap
            years = sorted(trades_df.index.year.unique())
            months = range(1, 13)
            
            # Initialize matrices
            trade_counts = np.zeros((len(years), 12))
            pnl_values = np.zeros((len(years), 12))
            win_rates = np.zeros((len(years), 12))
            
            # Create hover text with detailed statistics
            hover_text = []
            for year in years:
                row_text = []
                for month in months:
                    try:
                        month_stats = stats.loc[(year, month)]
                        total_trades = month_stats[('profit', 'count')]
                        total_pnl = month_stats[('profit', 'sum')]
                        win_count = month_stats[('is_win', 'sum')]
                        win_rate = (win_count / total_trades * 100) if total_trades > 0 else 0
                        
                        text = (
                            f"Period: {calendar.month_abbr[month]} {year}<br>"
                            f"Number of Trades: {int(total_trades)}<br>"
                            f"Win Rate: {win_rate:.1f}%<br>"
                            f"Total P&L: ${total_pnl:,.2f}<br>"
                            f"Avg Trade P&L: ${float(month_stats[('profit', 'mean')]):,.2f}<br>"
                            f"Avg Price: ${float(month_stats[('price', 'mean')]):,.2f}<br>"
                            f"Price Range: ${float(month_stats[('price', 'min')]):,.2f} - ${float(month_stats[('price', 'max')]):,.2f}"
                        )
                        
                        year_idx = years.index(year)
                        trade_counts[year_idx, month-1] = total_trades
                        pnl_values[year_idx, month-1] = total_pnl
                        win_rates[year_idx, month-1] = win_rate
                    except:
                        text = f"No trading activity<br>{calendar.month_abbr[month]} {year}"
                        
                    row_text.append(text)
                hover_text.append(row_text)
            
            title = 'Monthly Trading Performance'
            xaxis_title = 'Month'
            yaxis_title = 'Year'
            x_labels = [calendar.month_abbr[m] for m in months]
            y_labels = years
            
        else:
            # Daily trade heatmap
            stats = trades_df.groupby([
                trades_df.index.dayofweek,
                trades_df.index.hour
            ]).agg({
                'profit': ['count', 'sum', 'mean', 'std'],
                'is_win': 'sum',
                'price': ['mean', 'min', 'max']
            }).round(2)
            
            days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            hours = range(24)
            
            # Initialize matrices
            trade_counts = np.zeros((7, 24))
            pnl_values = np.zeros((7, 24))
            win_rates = np.zeros((7, 24))
            
            # Create hover text with detailed statistics
            hover_text = []
            for day_idx, day in enumerate(days):
                row_text = []
                for hour in hours:
                    try:
                        hour_stats = stats.loc[(day_idx, hour)]
                        total_trades = hour_stats[('profit', 'count')]
                        total_pnl = hour_stats[('profit', 'sum')]
                        win_count = hour_stats[('is_win', 'sum')]
                        win_rate = (win_count / total_trades * 100) if total_trades > 0 else 0
                        
                        text = (
                            f"Time: {day} {hour:02d}:00<br>"
                            f"Number of Trades: {int(total_trades)}<br>"
                            f"Win Rate: {win_rate:.1f}%<br>"
                            f"Total P&L: ${total_pnl:,.2f}<br>"
                            f"Avg Trade P&L: ${float(hour_stats[('profit', 'mean')]):,.2f}<br>"
                            f"Avg Price: ${float(hour_stats[('price', 'mean')]):,.2f}<br>"
                            f"Price Range: ${float(hour_stats[('price', 'min')]):,.2f} - ${float(hour_stats[('price', 'max')]):,.2f}"
                        )
                        
                        trade_counts[day_idx, hour] = total_trades
                        pnl_values[day_idx, hour] = total_pnl
                        win_rates[day_idx, hour] = win_rate
                    except:
                        text = f"No trading activity<br>{day} {hour:02d}:00"
                    
                    row_text.append(text)
                hover_text.append(row_text)
            
            title = 'Intraday Trading Pattern'
            xaxis_title = 'Hour of Day'
            yaxis_title = 'Day of Week'
            x_labels = [f"{h:02d}:00" for h in hours]
            y_labels = days
        
        # Create modern colorscale for P&L
        max_abs_val = np.nanmax(np.abs(pnl_values))
        colorscale = [
            [0, 'rgb(165,0,38)'],          # Deep Red for significant losses
            [0.25, 'rgb(215,48,39)'],      # Red
            [0.4, 'rgb(244,109,67)'],      # Light Red
            [0.5, 'rgb(255,255,255)'],     # White for neutral
            [0.6, 'rgb(116,173,209)'],     # Light Green
            [0.75, 'rgb(49,130,189)'],     # Green
            [1, 'rgb(0,104,55)']           # Deep Green for significant gains
        ]
        
        # Create figure with subplots for P&L and Win Rate
        fig = make_subplots(
            rows=1, cols=2,
            subplot_titles=('P&L Distribution', 'Win Rate Distribution'),
            horizontal_spacing=0.1
        )
        
        # Add P&L heatmap
        fig.add_trace(
            go.Heatmap(
                z=pnl_values,
                x=x_labels,
                y=y_labels,
                colorscale=colorscale,
                zmid=0,
                zmin=-max_abs_val if max_abs_val > 0 else -1,
                zmax=max_abs_val if max_abs_val > 0 else 1,
                colorbar=dict(
                    title=dict(text='P&L ($)', font=dict(size=12)),
                    tickformat='$,.0f',
                    len=0.9,
                    thickness=15,
                    x=0.45
                ),
                text=hover_text,
                hoverinfo='text',
                name='P&L'
            ),
            row=1, col=1
        )
        
        # Add Win Rate heatmap
        fig.add_trace(
            go.Heatmap(
                z=win_rates,
                x=x_labels,
                y=y_labels,
                colorscale='RdYlGn',
                zmin=0,
                zmax=100,
                colorbar=dict(
                    title=dict(text='Win Rate %', font=dict(size=12)),
                    tickformat='.0f',
                    len=0.9,
                    thickness=15,
                    x=1.0
                ),
                text=hover_text,
                hoverinfo='text',
                name='Win Rate'
            ),
            row=1, col=2
        )
        
        # Add trade count contours to both heatmaps
        for col in [1, 2]:
            fig.add_trace(
                go.Contour(
                    z=trade_counts,
                    x=x_labels,
                    y=y_labels,
                    colorscale='Greys',
                    showscale=False,
                    opacity=0.3,
                    contours=dict(
                        showlabels=True,
                        labelfont=dict(size=8, color='gray')
                    ),
                    line=dict(width=0),
                    hoverinfo='skip',
                    name='Trade Count'
                ),
                row=1, col=col
            )
        
        # Update layout with modern styling
        fig.update_layout(
            title=dict(
                text=title,
                x=0.5,
                y=0.95,
                xanchor='center',
                yanchor='top',
                font=dict(size=16)
            ),
            height=500,
            margin=dict(l=50, r=50, t=80, b=30),
            paper_bgcolor='white',
            plot_bgcolor='white',
            font=dict(family='Arial, sans-serif')
        )
        
        # Update axes
        for i in [1, 2]:
            fig.update_xaxes(
                title=xaxis_title,
                tickfont=dict(size=10),
                showgrid=False,
                showline=True,
                linecolor='rgba(0,0,0,0.2)',
                linewidth=1,
                ticks='outside',
                ticklen=5,
                row=1, col=i
            )
            fig.update_yaxes(
                title=yaxis_title if i == 1 else None,
                tickfont=dict(size=10),
                showgrid=False,
                showline=True,
                linecolor='rgba(0,0,0,0.2)',
                linewidth=1,
                ticks='outside',
                ticklen=5,
                row=1, col=i
            )
        
        return fig
    except Exception as e:
        app.logger.warning(f"Error creating trade heatmap: {str(e)}")
        return go.Figure()

def create_enhanced_charts(historical_data: pd.DataFrame, equity_df: pd.DataFrame, trades: list) -> dict:
    """Create enhanced charts with technical indicators"""
    try:
        app.logger.info("Creating main price chart...")
        # Main chart with price and indicators
        fig_main = make_subplots(rows=2, cols=1, shared_xaxes=True,
                                vertical_spacing=0.03, row_heights=[0.7, 0.3])

        # Add candlesticks
        fig_main.add_trace(go.Candlestick(
            x=historical_data.index,
            open=historical_data['open'],
            high=historical_data['high'],
            low=historical_data['low'],
            close=historical_data['close'],
            name='Price'
        ), row=1, col=1)
        
        # Add moving averages
        fig_main.add_trace(go.Scatter(x=historical_data.index, y=historical_data['sma_20'],
                                     name='SMA 20', line=dict(color='blue', width=1)), row=1, col=1)
        fig_main.add_trace(go.Scatter(x=historical_data.index, y=historical_data['sma_50'],
                                     name='SMA 50', line=dict(color='orange', width=1)), row=1, col=1)
        fig_main.add_trace(go.Scatter(x=historical_data.index, y=historical_data['sma_200'],
                                     name='SMA 200', line=dict(color='purple', width=1)), row=1, col=1)
        
        # Add Bollinger Bands
        fig_main.add_trace(go.Scatter(x=historical_data.index, y=historical_data['bb_upper'],
                                     name='BB Upper', line=dict(color='gray', dash='dash')), row=1, col=1)
        fig_main.add_trace(go.Scatter(x=historical_data.index, y=historical_data['bb_lower'],
                                     name='BB Lower', line=dict(color='gray', dash='dash')), row=1, col=1)
        
        # Add volume
        colors = ['red' if row['open'] > row['close'] else 'green' for _, row in historical_data.iterrows()]
        fig_main.add_trace(go.Bar(x=historical_data.index, y=historical_data['volume'],
                                 name='Volume', marker_color=colors), row=2, col=1)
        
        app.logger.info("Adding trade markers...")
        # Add trades if available
        trades_df = pd.DataFrame(trades)
        if len(trades_df) > 0:
            trades_df['timestamp'] = pd.to_datetime(trades_df['timestamp'])
            buys = trades_df[trades_df['type'] == 'BUY']
            sells = trades_df[trades_df['type'] == 'SELL']
            
            fig_main.add_trace(go.Scatter(
                x=buys['timestamp'], y=buys['price'],
                mode='markers', name='Buy',
                marker=dict(color='green', size=8, symbol='triangle-up')
            ), row=1, col=1)
            fig_main.add_trace(go.Scatter(
                x=sells['timestamp'], y=sells['price'],
                mode='markers', name='Sell',
                marker=dict(color='red', size=8, symbol='triangle-down')
            ), row=1, col=1)
        
        # Update layout
        fig_main.update_layout(
            title='Price Action and Volume',
            xaxis_title='Date',
            yaxis_title='Price',
            yaxis2_title='Volume',
            height=800
        )
        
        app.logger.info("Creating technical indicators chart...")
        # Create technical indicators subplots
        fig_indicators = make_subplots(rows=4, cols=1,
                                     shared_xaxes=True,
                                     vertical_spacing=0.05,
                                     subplot_titles=('MACD', 'RSI', 'Stochastic', 'ADX/DMI'))
        
        # MACD
        fig_indicators.add_trace(go.Scatter(x=historical_data.index, y=historical_data['macd_line'],
                                          name='MACD'), row=1, col=1)
        fig_indicators.add_trace(go.Scatter(x=historical_data.index, y=historical_data['macd_signal'],
                                          name='Signal'), row=1, col=1)
        fig_indicators.add_trace(go.Bar(x=historical_data.index, y=historical_data['macd_hist'],
                                      name='MACD Hist'), row=1, col=1)
        
        # RSI
        fig_indicators.add_trace(go.Scatter(x=historical_data.index, y=historical_data['rsi'],
                                          name='RSI'), row=2, col=1)
        fig_indicators.add_hline(y=70, line_dash="dash", line_color="red", row=2, col=1)
        fig_indicators.add_hline(y=30, line_dash="dash", line_color="green", row=2, col=1)
        
        # Stochastic
        fig_indicators.add_trace(go.Scatter(x=historical_data.index, y=historical_data['stoch_k'],
                                          name='Stoch %K'), row=3, col=1)
        fig_indicators.add_trace(go.Scatter(x=historical_data.index, y=historical_data['stoch_d'],
                                          name='Stoch %D'), row=3, col=1)
        fig_indicators.add_hline(y=80, line_dash="dash", line_color="red", row=3, col=1)
        fig_indicators.add_hline(y=20, line_dash="dash", line_color="green", row=3, col=1)
        
        # ADX/DMI
        fig_indicators.add_trace(go.Scatter(x=historical_data.index, y=historical_data['adx'],
                                          name='ADX'), row=4, col=1)
        fig_indicators.add_trace(go.Scatter(x=historical_data.index, y=historical_data['dmi_plus'],
                                          name='DMI+'), row=4, col=1)
        fig_indicators.add_trace(go.Scatter(x=historical_data.index, y=historical_data['dmi_minus'],
                                          name='DMI-'), row=4, col=1)
        
        # Update layout
        fig_indicators.update_layout(
            height=1000,
            showlegend=True,
            title_text="Technical Indicators"
        )
        
        app.logger.info("Creating additional charts...")
        charts = {
            'main_chart': fig_main.to_json(),
            'indicators': fig_indicators.to_json(),
            'equity_curve': create_equity_curve(equity_df).to_json(),
            'monthly_heatmap': create_heatmap(equity_df, 'M').to_json(),
            'daily_heatmap': create_heatmap(equity_df, 'D').to_json(),
            'monthly_trade_heatmap': create_trade_heatmap(trades, 'M').to_json(),
            'daily_trade_heatmap': create_trade_heatmap(trades, 'D').to_json()
        }
        
        return charts
    except Exception as e:
        app.logger.error(f"Error creating charts: {str(e)}")
        return {}

@app.route('/api/strategies', methods=['GET'])
def get_strategies():
    """Return list of available trading strategies"""
    try:
        app.logger.info("Fetching available strategies...")
        strategies = []
        
        # Get registered strategies from the registry
        registered_strategies = StrategyRegistry._strategies
        app.logger.info(f"Found {len(registered_strategies)} registered strategies: {list(registered_strategies.keys())}")
        
        for name, strategy_class in registered_strategies.items():
            app.logger.info(f"Processing strategy: {name}")
            try:
                # Use a dummy symbol and default parameters
                dummy_symbol = "BTCUSDT"
                # Get default parameters from the strategy class
                app.logger.info(f"Creating temporary instance of {name} to get default parameters...")
                temp_strategy = strategy_class(symbol=dummy_symbol)
                default_params = temp_strategy.get_parameters()
                app.logger.info(f"Default parameters for {name}: {default_params}")
                
                # Initialize strategy with default parameters
                app.logger.info(f"Initializing {name} with default parameters...")
                strategy = strategy_class(symbol=dummy_symbol, params=default_params)
                
                strategy_info = {
                    'name': name,
                    'description': strategy_class.__doc__ or f'Implementation of {name}',
                    'parameters': default_params,
                    'type': strategy_class.__name__,
                    'status': 'active'
                }
                app.logger.info(f"Successfully created strategy info for {name}: {strategy_info}")
                strategies.append(strategy_info)
            except Exception as e:
                app.logger.error(f"Failed to process strategy {name}: {str(e)}", exc_info=True)
                continue
        
        app.logger.info(f"Returning {len(strategies)} strategies")
        return jsonify({
            'status': 'success',
            'strategies': strategies
        })
    except Exception as e:
        app.logger.error(f"Error fetching strategies: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Failed to fetch available strategies: {str(e)}'
        }), 500

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Start the Flask server')
    parser.add_argument('--port', type=int, default=5001, help='Port to run the server on')
    args = parser.parse_args()
    app.run(debug=True, port=args.port) 
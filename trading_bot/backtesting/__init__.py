"""Backtesting module for trading strategies."""
import logging
from typing import Dict, Any, List
import pandas as pd
from datetime import datetime, timedelta
import numpy as np
from ..core.strategy import BaseStrategy

logger = logging.getLogger(__name__)

def generate_mock_data(
    start_date: str,
    end_date: str,
    interval: str = '1h'
) -> pd.DataFrame:
    """Generate mock price data for testing."""
    start = pd.to_datetime(start_date)
    end = pd.to_datetime(end_date)
    
    # Generate timestamps
    timestamps = pd.date_range(start=start, end=end, freq=interval)
    
    # Generate mock prices with some randomness
    base_price = 40000  # Starting price
    price_data = []
    current_price = base_price
    
    for _ in range(len(timestamps)):
        # Add random walk
        change = np.random.normal(0, 100)
        current_price += change
        
        # Generate OHLCV data
        high = current_price * (1 + abs(np.random.normal(0, 0.005)))
        low = current_price * (1 - abs(np.random.normal(0, 0.005)))
        open_price = current_price * (1 + np.random.normal(0, 0.003))
        volume = abs(np.random.normal(10, 3))
        
        price_data.append({
            'timestamp': timestamps[_],
            'open': open_price,
            'high': high,
            'low': low,
            'close': current_price,
            'volume': volume
        })
    
    return pd.DataFrame(price_data)

def calculate_metrics(trades: List[Dict[str, Any]], data: pd.DataFrame) -> Dict[str, Any]:
    """Calculate performance metrics from trades."""
    if not trades:
        return {
            'total_trades': 0,
            'win_rate': 0.0,
            'profit_loss': 0.0,
            'max_drawdown': 0.0,
            'sharpe_ratio': 0.0
        }
    
    total_trades = len(trades)
    profitable_trades = sum(1 for trade in trades if trade.get('profit', 0) > 0)
    win_rate = profitable_trades / total_trades if total_trades > 0 else 0
    
    # Calculate total P&L
    total_pnl = sum(trade.get('profit', 0) for trade in trades)
    
    # Calculate basic metrics
    return {
        'total_trades': total_trades,
        'win_rate': win_rate,
        'profit_loss': total_pnl,
        'max_drawdown': 0.0,  # TODO: Implement proper drawdown calculation
        'sharpe_ratio': 0.0   # TODO: Implement Sharpe ratio calculation
    }

def run_backtest(
    strategy: BaseStrategy,
    start_date: str = None,
    end_date: str = None,
    optimize: bool = False
) -> Dict[str, Any]:
    """Run a backtest for the given strategy.
    
    Args:
        strategy: Instance of a trading strategy
        start_date: Start date for backtest (YYYY-MM-DD)
        end_date: End date for backtest (YYYY-MM-DD)
        optimize: Whether to optimize strategy parameters
        
    Returns:
        Dict containing backtest results
    """
    logger.info(f"Starting backtest for strategy: {strategy.name}")
    
    # Use default dates if not provided
    if not start_date:
        start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
    if not end_date:
        end_date = datetime.now().strftime('%Y-%m-%d')
    
    # Generate or load historical data
    data = generate_mock_data(start_date, end_date)
    
    # Run strategy
    signals_df = strategy.generate_signals(data)
    
    # Convert signals to trades
    trades = []
    position = 0
    entry_price = 0
    
    for idx, row in signals_df.iterrows():
        if row['signal'] == 1 and position <= 0:  # Buy signal
            trades.append({
                'timestamp': row['timestamp'],
                'side': 'buy',
                'price': row['close'],
                'amount': strategy.parameters.get('amount', 1)
            })
            position = 1
            entry_price = row['close']
        elif row['signal'] == -1 and position >= 0:  # Sell signal
            if position > 0:
                profit = (row['close'] - entry_price) * strategy.parameters.get('amount', 1)
                trades.append({
                    'timestamp': row['timestamp'],
                    'side': 'sell',
                    'price': row['close'],
                    'amount': strategy.parameters.get('amount', 1),
                    'profit': profit
                })
            position = -1
            entry_price = row['close']
    
    # Calculate metrics
    metrics = calculate_metrics(trades, data)
    
    # Prepare historical data for visualization
    historical_data = data[['timestamp', 'close']].to_dict('records')
    
    return {
        'historical_data': historical_data,
        'trades': trades,
        'metrics': metrics
    }
 
from typing import Dict, List, Any, Type, Optional
import pandas as pd
import numpy as np
from concurrent.futures import ThreadPoolExecutor, as_completed
from ..utils.config import logger, DEFAULT_INITIAL_CAPITAL
from .strategy import BaseStrategy, StrategyRegistry
from ..analysis.indicators import calculate_indicators
from ..analysis.metrics import calculate_advanced_metrics

class Backtester:
    """Enhanced backtester with support for multiple strategies"""
    
    def __init__(
        self,
        symbol: str,
        strategy_name: str,
        initial_capital: float = DEFAULT_INITIAL_CAPITAL,
        strategy_params: Optional[Dict[str, Any]] = None
    ):
        self.symbol = symbol
        self.initial_capital = initial_capital
        self.strategy_params = strategy_params or {}
        
        # Initialize strategy
        strategy_class = StrategyRegistry.get_strategy(strategy_name)
        self.strategy = strategy_class(symbol, self.strategy_params)
        
        # Initialize trading state
        self.position = 0
        self.capital = initial_capital
        self.trades: List[Dict[str, Any]] = []
        
    def prepare_data(self, data: pd.DataFrame) -> pd.DataFrame:
        """Prepare data with required indicators"""
        df = data.copy()
        
        # Calculate required indicators
        df = calculate_indicators(df)
        
        # Ensure all required indicators are present
        missing_indicators = [ind for ind in self.strategy.required_indicators 
                            if ind not in df.columns]
        if missing_indicators:
            raise ValueError(f"Missing required indicators: {missing_indicators}")
        
        return df
    
    def execute_trade(self, timestamp: pd.Timestamp, price: float, signal: int) -> Optional[Dict[str, Any]]:
        """Execute a trade based on signal"""
        if signal == 0 or (signal > 0 and self.position > 0) or (signal < 0 and self.position < 0):
            return None
        
        # Calculate trade size based on available capital
        size = abs(self.capital * 0.02 / price)  # Use 2% of capital per trade
        
        # Apply size multiplier if specified in strategy params
        if 'size_multiplier' in self.strategy_params:
            size *= self.strategy_params['size_multiplier']
        
        # Execute trade
        trade_value = -size * price if signal > 0 else size * price
        self.capital += trade_value
        self.position = size if signal > 0 else -size
        
        return {
            'timestamp': timestamp,
            'type': 'BUY' if signal > 0 else 'SELL',
            'price': price,
            'size': size,
            'value': trade_value
        }
    
    def run_backtest(self, data: pd.DataFrame, timeframe: str = '1h') -> Dict[str, Any]:
        """Run backtest with the selected strategy"""
        try:
            # Prepare data
            df = self.prepare_data(data)
            
            # Generate signals
            df = self.strategy.generate_signals(df)
            
            # Initialize results tracking
            equity_curve = []
            self.trades = []
            self.position = 0
            self.capital = self.initial_capital
            
            # Variables to track open trades and their maximum potential profit/drawdown
            open_trade = None
            max_profit = 0
            max_drawdown = 0
            entry_price = 0
            
            # Simulate trading
            for timestamp, row in df.iterrows():
                current_price = row['close']
                
                # If we have an open position, calculate potential profit and drawdown
                if self.position != 0 and open_trade:
                    # Calculate unrealized profit/loss
                    unrealized_pnl = 0
                    
                    if self.position > 0:  # Long position
                        unrealized_pnl = (current_price - entry_price) * abs(self.position)
                    else:  # Short position
                        unrealized_pnl = (entry_price - current_price) * abs(self.position)
                    
                    # Update max profit (runup) - only track positive values
                    if unrealized_pnl > 0 and unrealized_pnl > max_profit:
                        max_profit = unrealized_pnl
                    
                    # Update max drawdown - track the worst negative excursion from entry
                    if unrealized_pnl < 0 and abs(unrealized_pnl) > max_drawdown:
                        max_drawdown = abs(unrealized_pnl)
                
                # Execute trade if signal exists
                if row['signal'] != 0:
                    trade = self.execute_trade(timestamp, current_price, row['signal'])
                    if trade:
                        # If closing a position, add runup and drawdown information
                        if open_trade and ((self.position <= 0 and open_trade['type'] == 'BUY') or 
                                          (self.position >= 0 and open_trade['type'] == 'SELL')):
                            # Runup is always positive or zero (maximum unrealized profit)
                            open_trade['runup'] = max_profit
                            
                            # Drawdown is always positive or zero (maximum unrealized loss)
                            open_trade['drawdown'] = max_drawdown
                            
                            # Reset tracking variables
                            max_profit = 0
                            max_drawdown = 0
                        
                        # Record this as a new open trade
                        self.trades.append(trade)
                        open_trade = trade
                        entry_price = current_price
                
                # Track equity
                current_equity = self.capital + (self.position * current_price)
                equity_curve.append({
                    'timestamp': timestamp,
                    'equity': current_equity
                })
            
            # Calculate performance metrics
            metrics = calculate_advanced_metrics(
                df, 
                self.trades, 
                self.initial_capital, 
                self.capital + (self.position * df['close'].iloc[-1])
            )
            
            # Include timeframe in results
            metrics['timeframe'] = timeframe
            
            return {
                'metrics': metrics,
                'trades': self.trades,
                'equity_curve': equity_curve,
                'timeframe': timeframe  # Include timeframe at the top level too
            }
            
        except Exception as e:
            logger.error(f"Backtest error: {str(e)}")
            raise
    
    @classmethod
    def optimize_strategy(
        cls,
        symbol: str,
        strategy_name: str,
        data: pd.DataFrame,
        timeframe: str = '1h',
        max_workers: Optional[int] = None
    ) -> Dict[str, Any]:
        """Optimize strategy parameters"""
        try:
            strategy_class = StrategyRegistry.get_strategy(strategy_name)
            strategy = strategy_class(symbol, {})
            param_ranges = strategy.get_parameter_ranges()
            
            # Generate parameter combinations
            from itertools import product
            param_combinations = [
                dict(zip(param_ranges.keys(), values))
                for values in product(*param_ranges.values())
            ]
            
            logger.info(f"Running optimization with {len(param_combinations)} parameter combinations...")
            
            results = []
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                future_to_params = {
                    executor.submit(
                        cls(symbol, strategy_name, strategy_params=params).run_backtest,
                        data,
                        timeframe
                    ): params
                    for params in param_combinations
                }
                
                for future in as_completed(future_to_params):
                    params = future_to_params[future]
                    try:
                        result = future.result()
                        results.append({
                            'params': params,
                            'metrics': result['metrics']
                        })
                    except Exception as e:
                        logger.error(f"Error optimizing with params {params}: {str(e)}")
            
            # Sort results by Sharpe ratio
            results.sort(key=lambda x: x['metrics']['sharpe_ratio'], reverse=True)
            return results[0]
            
        except Exception as e:
            logger.error(f"Error in strategy optimization: {str(e)}")
            raise 
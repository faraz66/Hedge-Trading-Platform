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
    
    def run_backtest(self, data: pd.DataFrame) -> Dict[str, Any]:
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
            
            # Simulate trading
            for timestamp, row in df.iterrows():
                # Execute trade if signal exists
                if row['signal'] != 0:
                    trade = self.execute_trade(timestamp, row['close'], row['signal'])
                    if trade:
                        self.trades.append(trade)
                
                # Track equity
                current_equity = self.capital + (self.position * row['close'])
                equity_curve.append({
                    'timestamp': timestamp,
                    'equity': current_equity
                })
            
            # Calculate performance metrics
            equity_df = pd.DataFrame(equity_curve)
            metrics = calculate_advanced_metrics(equity_df, self.trades)
            
            return {
                'equity_curve': equity_curve,
                'trades': self.trades,
                'metrics': metrics,
                'final_capital': self.capital,
                'strategy_params': self.strategy_params
            }
            
        except Exception as e:
            logger.error(f"Error in backtest: {str(e)}")
            raise
    
    @classmethod
    def optimize_strategy(
        cls,
        symbol: str,
        strategy_name: str,
        data: pd.DataFrame,
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
                        data
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
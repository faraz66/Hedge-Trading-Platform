from typing import Dict, List, Optional
import pandas as pd
import numpy as np
from datetime import datetime
import logging
from ..strategies.grid_hedge_strategy import GridHedgeStrategy, GridLevel
from ..config.strategy_config import GRID_CONFIGS, RISK_SETTINGS

class GridBacktester:
    def __init__(self, 
                 symbol: str,
                 initial_capital: float = 100000.0,
                 commission_rate: float = 0.001):
        self.symbol = symbol
        self.initial_capital = initial_capital
        self.current_capital = initial_capital
        self.commission_rate = commission_rate
        
        # Load strategy configuration
        self.config = GRID_CONFIGS[symbol]
        self.strategy = GridHedgeStrategy(
            symbol=symbol,
            **{k: v for k, v in self.config.items() if k != 'timeframes'}
        )
        
        # Performance tracking
        self.equity_curve = []
        self.trades = []
        self.positions: List[Dict] = []
        
        # Setup logging
        self.logger = self._setup_logger()
        
    def _setup_logger(self) -> logging.Logger:
        logger = logging.getLogger(f'GridBacktester_{self.symbol}')
        logger.setLevel(logging.INFO)
        if not logger.handlers:
            fh = logging.FileHandler(f'grid_backtest_{self.symbol}.log')
            fh.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
            logger.addHandler(fh)
        return logger
        
    def run_backtest(self, data: pd.DataFrame) -> Dict:
        """Run backtest on historical data"""
        self.logger.info(f"Starting backtest for {self.symbol}")
        
        # Reset state
        self.current_capital = self.initial_capital
        self.equity_curve = []
        self.trades = []
        self.positions = []
        
        for i in range(len(data)):
            current_bar = data.iloc[i]
            current_price = current_bar['close']
            timestamp = current_bar.name
            
            # Update strategy state
            if i >= 20:  # Need enough data for indicators
                lookback_data = data.iloc[max(0, i-50):i+1]
                self.strategy.update_support_resistance(lookback_data)
                market_condition = self.strategy.analyze_market_condition(lookback_data)
                
                # Adjust grid if needed
                if self.strategy.should_adjust_grid(current_price):
                    self.strategy.adjust_grid(current_price)
                    
                # Process grid levels
                self._process_grid_levels(current_price, timestamp)
                
                # Manage positions
                self.strategy.manage_positions(current_price)
                
            # Record equity
            self.equity_curve.append({
                'timestamp': timestamp,
                'equity': self.current_capital,
                'price': current_price
            })
            
        return self._calculate_performance_metrics()
        
    def _process_grid_levels(self, current_price: float, timestamp: datetime):
        """Process grid levels for potential trades"""
        for level in self.strategy.grid_levels:
            if not level.is_active or level.is_filled:
                continue
                
            # Check if price crosses level
            if (level.type == 'BUY' and current_price <= level.price) or \
               (level.type == 'SELL' and current_price >= level.price):
                self._execute_trade(level, current_price, timestamp)
                
    def _execute_trade(self, level: GridLevel, price: float, timestamp: datetime):
        """Execute trade and update position tracking"""
        position_value = level.size * price
        commission = position_value * self.commission_rate
        
        # Check if we have enough capital
        if position_value + commission > self.current_capital:
            self.logger.warning(f"Insufficient capital for trade at {price}")
            return
            
        # Record trade
        trade = {
            'timestamp': timestamp,
            'type': level.type,
            'price': price,
            'size': level.size,
            'commission': commission,
            'value': position_value
        }
        self.trades.append(trade)
        
        # Update capital
        self.current_capital -= commission
        if level.type == 'BUY':
            self.current_capital -= position_value
        else:
            self.current_capital += position_value
            
        # Update level status
        level.is_filled = True
        level.fill_price = price
        level.fill_time = timestamp
        
        self.logger.info(f"Executed {level.type} at {price}, size: {level.size}")
        
    def _calculate_performance_metrics(self) -> Dict:
        """Calculate backtest performance metrics"""
        equity_df = pd.DataFrame(self.equity_curve)
        trades_df = pd.DataFrame(self.trades)
        
        if len(equity_df) == 0:
            return {'error': 'No trades executed'}
            
        # Calculate returns
        equity_df['returns'] = equity_df['equity'].pct_change()
        
        # Basic metrics
        total_return = (self.current_capital - self.initial_capital) / self.initial_capital
        n_trades = len(self.trades)
        win_trades = len([t for t in self.trades if t['value'] > 0])
        win_rate = win_trades / n_trades if n_trades > 0 else 0
        
        # Risk metrics
        daily_returns = equity_df.set_index('timestamp')['returns'].resample('D').sum()
        sharpe_ratio = np.sqrt(252) * daily_returns.mean() / daily_returns.std() if len(daily_returns) > 0 else 0
        max_drawdown = self._calculate_max_drawdown(equity_df['equity'])
        
        return {
            'total_return': total_return,
            'sharpe_ratio': sharpe_ratio,
            'max_drawdown': max_drawdown,
            'win_rate': win_rate,
            'number_of_trades': n_trades,
            'final_capital': self.current_capital,
            'equity_curve': equity_df.to_dict('records'),
            'trades': self.trades
        }
        
    def _calculate_max_drawdown(self, equity: pd.Series) -> float:
        """Calculate maximum drawdown from equity curve"""
        rolling_max = equity.expanding().max()
        drawdowns = equity / rolling_max - 1.0
        return abs(drawdowns.min()) if len(drawdowns) > 0 else 0.0 
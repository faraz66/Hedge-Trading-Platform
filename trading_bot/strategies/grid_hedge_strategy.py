from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd
from datetime import datetime
import logging
from .base_hedge_strategy import BaseHedgeStrategy

class GridLevel:
    def __init__(self, price: float, type: str, size: float, paired_level: Optional['GridLevel'] = None):
        self.price = price
        self.type = type  # 'BUY' or 'SELL'
        self.size = size
        self.paired_level = paired_level
        self.order_id = None
        self.is_active = True
        self.is_filled = False
        self.fill_price = None
        self.fill_time = None
        self.profit = 0.0
        
    def pair_with(self, other_level: 'GridLevel'):
        self.paired_level = other_level
        other_level.paired_level = self

class GridHedgeStrategy(BaseHedgeStrategy):
    """Grid-based hedging strategy that creates a grid of hedge positions around the main position."""
    
    def __init__(self, symbol: str, params: Dict[str, Any] = None):
        # Initialize base strategy
        super().__init__(symbol, params)
        
        # Grid levels and positions
        self.grid_levels: List[GridLevel] = []
        self.active_positions: List[Dict] = []
        
        # Support/Resistance levels
        self.support_levels: List[float] = []
        self.resistance_levels: List[float] = []
        
        # Performance tracking
        self.total_profit = 0.0
        self.trades_history: List[Dict] = []
        
        # Initialize logger
        self.logger = self._setup_logger()
    
    def get_required_parameters(self) -> List[str]:
        """Get list of required parameters."""
        return ['grid_levels', 'grid_spacing', 'position_size']
    
    def get_parameters(self) -> Dict[str, Any]:
        """Get default strategy parameters."""
        params = super().get_parameters()
        params.update({
            'grid_levels': 5,       # Number of grid levels above and below current price
            'grid_spacing': 0.01,   # Price spacing between grid levels (1%)
            'position_size': 0.1,   # Base position size as fraction of balance
            'max_positions': 10,    # Maximum number of open positions
            'min_profit': 0.005,    # Minimum profit to close a grid position (0.5%)
            'size_multiplier': 1.0, # Multiplier for position size at each level
            'base_order_size': 0.01 # Base order size
        })
        return params
    
    def get_parameter_ranges(self) -> Dict[str, Dict[str, Any]]:
        """Get parameter ranges for optimization."""
        ranges = super().get_parameter_ranges()
        ranges.update({
            'grid_levels': {
                'min': 3,
                'max': 10,
                'step': 1
            },
            'grid_spacing': {
                'min': 0.005,
                'max': 0.02,
                'step': 0.001
            },
            'position_size': {
                'min': 0.05,
                'max': 0.2,
                'step': 0.01
            },
            'max_positions': {
                'min': 5,
                'max': 20,
                'step': 1
            },
            'min_profit': {
                'min': 0.002,
                'max': 0.01,
                'step': 0.001
            }
        })
        return ranges
    
    def generate_signals(self, data: pd.DataFrame) -> pd.DataFrame:
        """Generate trading signals based on grid levels."""
        df = data.copy()
        
        # Calculate grid levels
        price = df['close'].iloc[-1]
        grid_spacing = self._params['grid_spacing']
        num_levels = self._params['grid_levels']
        
        grid_levels = [
            price * (1 + grid_spacing * i)
            for i in range(-num_levels, num_levels + 1)
        ]
        
        # Initialize signals
        df['signal'] = 0
        df['grid_level'] = 0
        df['position_size'] = 0
        
        for i in range(len(df)-1):
            current_price = df['close'].iloc[i]
            next_price = df['close'].iloc[i+1]
            
            # Check each grid level
            for level_idx, level in enumerate(grid_levels):
                # Buy signal when price crosses grid level from above
                if current_price >= level and next_price < level:
                    df.loc[df.index[i+1], 'signal'] = 1
                    df.loc[df.index[i+1], 'grid_level'] = level_idx
                    df.loc[df.index[i+1], 'position_size'] = self._params['position_size']
                
                # Sell signal when price crosses grid level from below
                elif current_price <= level and next_price > level:
                    df.loc[df.index[i+1], 'signal'] = -1
                    df.loc[df.index[i+1], 'grid_level'] = level_idx
                    df.loc[df.index[i+1], 'position_size'] = self._params['position_size']
        
        # Calculate profit targets for each grid level
        df['take_profit'] = df.apply(
            lambda row: grid_levels[int(row['grid_level'])] * (1 + self._params['min_profit'])
            if row['signal'] != 0 else 0,
            axis=1
        )
        
        return df
    
    @property
    def required_indicators(self) -> List[str]:
        """Get list of required technical indicators."""
        indicators = super().required_indicators
        indicators.extend(['rsi', 'macd', 'signal'])
        return indicators

    def _setup_logger(self) -> logging.Logger:
        """Setup strategy logger"""
        logger = logging.getLogger(f'GridHedge_{self.symbol}')
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            fh = logging.FileHandler(f'grid_hedge_{self.symbol}.log')
            fh.setLevel(logging.INFO)
            formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
            fh.setFormatter(formatter)
            logger.addHandler(fh)
            
        return logger
        
    def calculate_grid_levels(self, current_price: float) -> List[GridLevel]:
        """Calculate grid levels based on current price and support/resistance"""
        levels = []
        
        # Calculate price range
        price_range = current_price * self._params['grid_spacing'] * self._params['grid_levels']
        min_price = current_price - (price_range / 2)
        
        for i in range(self._params['grid_levels'] * 2):  # Create levels above and below current price
            price = min_price + (i * current_price * self._params['grid_spacing'])
            size = self._params['base_order_size'] * (1 + (i // 2) * (self._params['size_multiplier'] - 1))
            
            # Create buy level
            if price < current_price:
                buy_level = GridLevel(price=price, type='BUY', size=size)
                levels.append(buy_level)
                
            # Create sell level
            if price > current_price:
                sell_level = GridLevel(price=price, type='SELL', size=size)
                levels.append(sell_level)
                
                # Pair buy and sell levels
                if len(levels) >= 2:
                    buy_level = next((l for l in reversed(levels) if l.type == 'BUY' and l.paired_level is None), None)
                    if buy_level:
                        buy_level.pair_with(sell_level)
        
        return levels
        
    def update_support_resistance(self, ohlcv_data: pd.DataFrame):
        """Update support and resistance levels using price action"""
        if len(ohlcv_data) < 20:  # Need enough data for calculation
            return
            
        # Calculate potential levels using price swings
        highs = ohlcv_data['high'].values
        lows = ohlcv_data['low'].values
        
        # Find local maxima and minima
        resistance = self._find_peaks(highs, 5)  # Look for peaks in last 5 periods
        support = self._find_peaks(-lows, 5)     # Negative to find troughs
        
        # Update levels
        self.resistance_levels = sorted(resistance)
        self.support_levels = sorted(-np.array(support))  # Convert back to positive
        
        self.logger.info(f"Updated S/R levels - Support: {self.support_levels}, Resistance: {self.resistance_levels}")
        
    def _find_peaks(self, data: np.ndarray, window: int) -> List[float]:
        """Find peaks in data using rolling window"""
        peaks = []
        for i in range(window, len(data) - window):
            if all(data[i] > data[i-window:i]) and all(data[i] > data[i+1:i+window+1]):
                peaks.append(data[i])
        return peaks
        
    def should_adjust_grid(self, current_price: float) -> bool:
        """Determine if grid needs adjustment based on price movement"""
        if not self.grid_levels:
            return True
            
        # Check if price is near grid boundaries
        min_price = min(level.price for level in self.grid_levels)
        max_price = max(level.price for level in self.grid_levels)
        
        price_range = max_price - min_price
        buffer = price_range * 0.1  # 10% buffer
        
        return (current_price < min_price + buffer) or (current_price > max_price - buffer)
        
    def adjust_grid(self, current_price: float):
        """Adjust grid levels based on current price"""
        new_levels = self.calculate_grid_levels(current_price)
        
        # Keep active positions, remove unfilled orders
        active_levels = [level for level in self.grid_levels if level.is_filled]
        
        # Merge active positions with new levels
        self.grid_levels = active_levels + new_levels
        
        self.logger.info(f"Adjusted grid levels around price {current_price}")
        
    def analyze_market_condition(self, ohlcv_data: pd.DataFrame) -> Dict:
        """Analyze market conditions for strategy adjustment"""
        if len(ohlcv_data) < 20:
            return {'trend': 'neutral', 'volatility': 'medium'}
            
        # Calculate basic indicators
        close_prices = ohlcv_data['close'].values
        sma20 = np.mean(close_prices[-20:])
        volatility = np.std(close_prices[-20:]) / np.mean(close_prices[-20:])
        
        # Determine trend
        current_price = close_prices[-1]
        trend = 'uptrend' if current_price > sma20 else 'downtrend'
        
        # Classify volatility
        vol_level = 'high' if volatility > 0.02 else 'low' if volatility < 0.01 else 'medium'
        
        return {
            'trend': trend,
            'volatility': vol_level,
            'sma20': sma20,
            'current_volatility': volatility
        }
        
    def manage_positions(self, current_price: float):
        """Manage open positions and take profits/losses"""
        for level in self.grid_levels:
            if not level.is_filled:
                continue
                
            # Check paired level
            if level.paired_level and level.paired_level.is_filled:
                # Both levels filled, check for profit taking
                profit = self._calculate_pair_profit(level, current_price)
                
                if profit >= self._params['min_profit']:
                    self._close_position_pair(level)
                elif profit <= -self._params['max_loss_pct']:
                    # Close losing position if paired trade is in profit
                    if self._is_paired_trade_profitable(level):
                        self._close_position_pair(level)
                        
    def _calculate_pair_profit(self, level: GridLevel, current_price: float) -> float:
        """Calculate profit/loss for a paired position"""
        if not level.paired_level or not level.is_filled or not level.paired_level.is_filled:
            return 0.0
            
        if level.type == 'BUY':
            buy_price = level.fill_price
            sell_price = level.paired_level.fill_price
        else:
            buy_price = level.paired_level.fill_price
            sell_price = level.fill_price
            
        return (sell_price - buy_price) / buy_price
        
    def _is_paired_trade_profitable(self, level: GridLevel) -> bool:
        """Check if the paired trade is profitable"""
        if not level.paired_level or not level.paired_level.is_filled:
            return False
            
        profit = self._calculate_pair_profit(level, 0)  # Current price not needed for closed trades
        return profit > 0
        
    def _close_position_pair(self, level: GridLevel):
        """Close a pair of positions and record profit"""
        if not level.paired_level:
            return
            
        profit = self._calculate_pair_profit(level, 0)
        self.total_profit += profit
        
        trade_record = {
            'open_time': min(level.fill_time, level.paired_level.fill_time),
            'close_time': datetime.now(),
            'buy_price': level.fill_price if level.type == 'BUY' else level.paired_level.fill_price,
            'sell_price': level.fill_price if level.type == 'SELL' else level.paired_level.fill_price,
            'size': level.size,
            'profit': profit
        }
        
        self.trades_history.append(trade_record)
        self.logger.info(f"Closed position pair with profit: {profit:.2%}")
        
        # Reset levels
        level.is_active = False
        level.paired_level.is_active = False
        
    def get_strategy_state(self) -> Dict:
        """Get current strategy state for monitoring"""
        return {
            'symbol': self.symbol,
            'total_profit': self.total_profit,
            'active_positions': len([l for l in self.grid_levels if l.is_filled]),
            'grid_levels': len(self.grid_levels),
            'support_levels': self.support_levels,
            'resistance_levels': self.resistance_levels,
            'trades_count': len(self.trades_history)
        } 
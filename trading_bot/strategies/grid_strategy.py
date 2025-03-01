"""Grid Trading Strategy implementation."""
from typing import Dict, List, Any
import pandas as pd
import numpy as np
from ..core.strategy import BaseStrategy, StrategyRegistry

@StrategyRegistry.register
class GridStrategy(BaseStrategy):
    """
    A grid trading strategy that places buy and sell orders at regular price intervals.
    The strategy creates a grid of price levels and executes trades when price crosses these levels.
    Includes position sizing, stop-loss, and trend following components.
    """

    description = "Grid trading strategy with position sizing, stop-loss, and trend following"
    default_parameters = {
        'grid_size': 20,
        'grid_spacing': 0.005,
        'size_multiplier': 1.0,
        'min_profit': 0.001,
        'stop_loss': 0.02,
        'trend_period': 20,
        'risk_per_trade': 0.01
    }

    def __init__(self, symbol: str = "BTC/USDT", params: Dict[str, Any] = None):
        """
        Initialize the grid trading strategy.
        
        Args:
            symbol (str): Trading pair symbol (e.g., 'BTC/USDT')
            params (Dict[str, Any]): Strategy parameters including:
                grid_size (int): Number of grid levels above and below the initial price
                grid_spacing (float): Percentage distance between grid levels
                size_multiplier (float): Multiplier for position sizes
                min_profit (float): Minimum profit target per trade
                stop_loss (float): Stop loss percentage
                trend_period (int): Period for trend calculation
                risk_per_trade (float): Risk per trade as a fraction of account
        """
        super().__init__(symbol=symbol, params=params)
        self.grid_levels = []
        self.current_position = 0
        self.entry_price = None
        self.stop_loss_price = None

    def get_required_parameters(self) -> List[str]:
        """Get the list of required parameters for the strategy."""
        return ['grid_size', 'grid_spacing', 'size_multiplier', 'min_profit', 
                'stop_loss', 'trend_period', 'risk_per_trade']

    def get_parameters(self) -> Dict[str, Any]:
        """Get the current parameter values."""
        return {
            'grid_size': self.parameters['grid_size'],
            'grid_spacing': self.parameters['grid_spacing'],
            'size_multiplier': self.parameters['size_multiplier'],
            'min_profit': self.parameters['min_profit'],
            'stop_loss': self.parameters['stop_loss'],
            'trend_period': self.parameters['trend_period'],
            'risk_per_trade': self.parameters['risk_per_trade']
        }

    def get_parameter_ranges(self) -> Dict[str, Dict[str, Any]]:
        """Get the valid ranges for each parameter."""
        return {
            'grid_size': {
                'min': 5,
                'max': 50,
                'default': 20,
                'type': 'int',
                'description': 'Number of grid levels above and below the initial price'
            },
            'grid_spacing': {
                'min': 0.001,
                'max': 0.05,
                'default': 0.005,
                'type': 'float',
                'description': 'Percentage distance between grid levels'
            },
            'size_multiplier': {
                'min': 0.1,
                'max': 5.0,
                'default': 1.0,
                'type': 'float',
                'description': 'Multiplier for position sizes'
            },
            'min_profit': {
                'min': 0.0001,
                'max': 0.01,
                'default': 0.001,
                'type': 'float',
                'description': 'Minimum profit target per trade'
            },
            'stop_loss': {
                'min': 0.005,
                'max': 0.05,
                'default': 0.02,
                'type': 'float',
                'description': 'Stop loss percentage'
            },
            'trend_period': {
                'min': 10,
                'max': 50,
                'default': 20,
                'type': 'int',
                'description': 'Period for trend calculation'
            },
            'risk_per_trade': {
                'min': 0.001,
                'max': 0.05,
                'default': 0.01,
                'type': 'float',
                'description': 'Risk per trade as a fraction of account'
            }
        }

    def calculate_position_size(self, price: float, stop_loss: float) -> float:
        """
        Calculate position size based on risk per trade.
        
        Args:
            price (float): Current price
            stop_loss (float): Stop loss price
            
        Returns:
            float: Position size in base currency
        """
        risk_amount = 10000 * self.parameters['risk_per_trade']  # Assuming $10,000 account
        risk_per_unit = abs(price - stop_loss)
        return (risk_amount / risk_per_unit) * self.parameters['size_multiplier']

    def generate_signals(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Generate trading signals based on grid levels and trend.
        
        Args:
            data (pd.DataFrame): Historical price data with 'close' column
            
        Returns:
            pd.DataFrame: DataFrame with added 'signal' column (1 for buy, -1 for sell, 0 for hold)
        """
        # Initialize signal column
        data['signal'] = 0
        
        # Calculate trend
        trend_period = self.parameters['trend_period']
        data['sma'] = data['close'].rolling(window=trend_period).mean()
        data['trend'] = np.where(data['close'] > data['sma'], 1, -1)
        
        # Get initial price (first closing price)
        initial_price = data['close'].iloc[0]
        
        # Generate grid levels
        grid_size = self.parameters['grid_size']
        grid_spacing = self.parameters['grid_spacing']
        grid_range = grid_size * grid_spacing
        lower_bound = initial_price * (1 - grid_range)
        upper_bound = initial_price * (1 + grid_range)
        
        # Create grid levels
        self.grid_levels = np.linspace(lower_bound, upper_bound, 2 * grid_size + 1)
        
        # Initialize variables for tracking positions
        last_grid_index = None
        self.current_position = 0
        self.entry_price = None
        self.stop_loss_price = None
        
        # Generate signals
        for i in range(trend_period, len(data)):
            current_price = data['close'].iloc[i]
            current_trend = data['trend'].iloc[i]
            
            # Check stop loss
            if self.entry_price is not None and self.stop_loss_price is not None:
                if self.current_position > 0 and current_price <= self.stop_loss_price:
                    # Stop loss hit for long position
                    data.loc[data.index[i], 'signal'] = -1
                    self.current_position = 0
                    self.entry_price = None
                    self.stop_loss_price = None
                    continue
                elif self.current_position < 0 and current_price >= self.stop_loss_price:
                    # Stop loss hit for short position
                    data.loc[data.index[i], 'signal'] = 1
                    self.current_position = 0
                    self.entry_price = None
                    self.stop_loss_price = None
                    continue
            
            # Find the closest grid level
            grid_index = np.abs(self.grid_levels - current_price).argmin()
            
            if last_grid_index is not None and grid_index != last_grid_index:
                # Price has crossed a grid level
                if grid_index > last_grid_index and current_trend < 0:
                    # Price moved up in downtrend, sell signal
                    data.loc[data.index[i], 'signal'] = -1
                    self.current_position -= 1
                    self.entry_price = current_price
                    self.stop_loss_price = current_price * (1 + self.parameters['stop_loss'])
                elif grid_index < last_grid_index and current_trend > 0:
                    # Price moved down in uptrend, buy signal
                    data.loc[data.index[i], 'signal'] = 1
                    self.current_position += 1
                    self.entry_price = current_price
                    self.stop_loss_price = current_price * (1 - self.parameters['stop_loss'])
            
            last_grid_index = grid_index
        
        return data

    def analyze(self, data: pd.DataFrame) -> Dict[str, Any]:
        """
        Analyze the strategy performance.
        
        Args:
            data (pd.DataFrame): Historical price data with signals
            
        Returns:
            Dict[str, Any]: Performance metrics
        """
        signals = data['signal'].values
        prices = data['close'].values
        
        # Calculate returns
        position = 0
        returns = []
        trades = []
        
        for i in range(len(signals)):
            if signals[i] != 0:
                # Calculate position size
                stop_loss = prices[i] * (1 - self.parameters['stop_loss'])
                size = self.calculate_position_size(prices[i], stop_loss)
                
                # Record trade
                trade_type = "BUY" if signals[i] == 1 else "SELL"
                trades.append({
                    'timestamp': str(data.index[i]),
                    'type': trade_type,
                    'price': float(prices[i]),
                    'size': float(size)
                })
                
                # Update position and calculate returns
                position += signals[i]
                if len(trades) > 1:
                    returns.append((prices[i] - prices[i-1]) / prices[i-1] * position)
        
        # Calculate metrics
        if returns:
            total_return = float(sum(returns))
            sharpe_ratio = float(np.mean(returns) / np.std(returns) if np.std(returns) > 0 else 0)
            max_drawdown = float(min(returns) if returns else 0)
            win_rate = float(len([r for r in returns if r > 0]) / len(returns) if returns else 0)
        else:
            total_return = 0.0
            sharpe_ratio = 0.0
            max_drawdown = 0.0
            win_rate = 0.0
        
        return {
            'total_return': total_return,
            'sharpe_ratio': sharpe_ratio,
            'max_drawdown': max_drawdown,
            'win_rate': win_rate,
            'total_trades': len(trades),
            'trades': trades
        }

    @property
    def required_indicators(self) -> List[str]:
        """Get the list of required technical indicators."""
        return []

    def analyze_market_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze market data and return trading signals."""
        current_price = data.get('close', 0)
        grid_size = self.parameters['grid_size']
        grid_spacing = self.parameters['grid_spacing']
        
        # Calculate grid levels
        base_price = current_price * (1 - (grid_size / 2) * grid_spacing)
        grid_levels = [base_price * (1 + i * grid_spacing) for i in range(grid_size)]
        
        # Find closest grid levels
        closest_below = max((p for p in grid_levels if p <= current_price), default=None)
        closest_above = min((p for p in grid_levels if p > current_price), default=None)
        
        return {
            'signal': 'buy' if closest_below == current_price else 'sell' if closest_above == current_price else 'hold',
            'grid_levels': grid_levels,
            'current_price': current_price
        } 
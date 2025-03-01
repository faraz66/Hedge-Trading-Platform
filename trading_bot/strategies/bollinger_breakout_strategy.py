"""Bollinger Breakout Strategy implementation."""
from typing import Dict, List, Any
import pandas as pd
from ..core.strategy import BaseStrategy, StrategyRegistry

@StrategyRegistry.register
class BollingerBreakoutStrategy(BaseStrategy):
    """Trading strategy based on Bollinger Bands breakouts."""

    description = "Generates signals when price breaks out of Bollinger Bands"
    default_parameters = {
        'bb_period': 20,  # Period for Bollinger Bands calculation
        'bb_std': 2,  # Number of standard deviations for bands
        'amount': 100,  # Amount to trade per signal
        'stop_loss': 0.02,  # Stop loss percentage (2%)
        'take_profit': 0.04,  # Take profit percentage (4%)
    }

    def get_required_parameters(self) -> List[str]:
        """Get list of required parameters."""
        return ['bb_period', 'bb_std', 'amount', 'stop_loss', 'take_profit']
    
    def get_parameters(self) -> Dict[str, Any]:
        """Get the current strategy parameters."""
        return self.parameters.copy()
    
    def get_parameter_ranges(self) -> Dict[str, Dict[str, Any]]:
        """Get parameter ranges for optimization."""
        return {
            'bb_period': {
                'min': 10,
                'max': 50,
                'step': 5
            },
            'bb_std': {
                'min': 1.5,
                'max': 3.0,
                'step': 0.1
            },
            'amount': {
                'min': 50,
                'max': 200,
                'step': 50
            },
            'stop_loss': {
                'min': 0.01,
                'max': 0.05,
                'step': 0.005
            },
            'take_profit': {
                'min': 0.03,
                'max': 0.06,
                'step': 0.005
            }
        }
    
    def generate_signals(self, data: pd.DataFrame) -> pd.DataFrame:
        """Generate trading signals based on Bollinger Bands breakouts."""
        df = data.copy()
        
        # Calculate Bollinger Bands
        bb_period = self.parameters['bb_period']
        bb_std = self.parameters['bb_std']
        
        df['bb_middle'] = df['close'].rolling(window=bb_period).mean()
        rolling_std = df['close'].rolling(window=bb_period).std()
        df['bb_upper'] = df['bb_middle'] + (rolling_std * bb_std)
        df['bb_lower'] = df['bb_middle'] - (rolling_std * bb_std)
        
        # Generate signals based on Bollinger Bands
        df['signal'] = 0
        
        # Buy signals: price below lower band
        df.loc[(df['close'] < df['bb_lower']), 'signal'] = 1
        
        # Sell signals: price above upper band
        df.loc[(df['close'] > df['bb_upper']), 'signal'] = -1
        
        return df
    
    @property
    def required_indicators(self) -> List[str]:
        """Get list of required technical indicators."""
        return ['bb_upper', 'bb_lower', 'bb_middle']

    def analyze(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze market data and return Bollinger Bands breakout signals.
        
        Args:
            data: Market data including price and Bollinger Bands
            
        Returns:
            Dict containing analysis results and trading signals
        """
        current_price = data.get('close', 0)
        bb_upper = data.get('bb_upper', current_price * 1.02)
        bb_lower = data.get('bb_lower', current_price * 0.98)
        bb_middle = data.get('bb_middle', current_price)

        # Generate signals
        signal = None
        if current_price > bb_upper:
            signal = {
                'type': 'sell',
                'price': current_price,
                'amount': self.parameters['amount'],
                'stop_loss': current_price * (1 + self.parameters['stop_loss']),
                'take_profit': current_price * (1 - self.parameters['take_profit'])
            }
        elif current_price < bb_lower:
            signal = {
                'type': 'buy',
                'price': current_price,
                'amount': self.parameters['amount'],
                'stop_loss': current_price * (1 - self.parameters['stop_loss']),
                'take_profit': current_price * (1 + self.parameters['take_profit'])
            }

        return {
            'current_price': current_price,
            'bb_upper': bb_upper,
            'bb_lower': bb_lower,
            'bb_middle': bb_middle,
            'signal': signal
        } 
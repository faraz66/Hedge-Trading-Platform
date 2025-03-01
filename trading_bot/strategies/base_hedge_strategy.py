from .base_strategy import BaseStrategy
from typing import Dict, Any, List
import pandas as pd

class BaseHedgeStrategy(BaseStrategy):
    """Base class for hedging strategies."""
    
    def __init__(self, symbol: str, params: Dict[str, Any] = None):
        super().__init__(symbol, params)
        self.validate_parameters()
    
    def validate_parameters(self) -> None:
        """Validate strategy parameters."""
        required_params = self.get_required_parameters()
        if not all(param in self._params for param in required_params):
            missing = [p for p in required_params if p not in self._params]
            raise ValueError(f"Missing required parameters: {', '.join(missing)}")
    
    def get_required_parameters(self) -> List[str]:
        """Get list of required parameters."""
        return []
    
    def get_parameters(self) -> Dict[str, Any]:
        """Get default strategy parameters."""
        return {
            'hedge_ratio': 1.0,  # Ratio of hedge position size to main position
            'min_spread': 0.001,  # Minimum price spread to open positions
            'max_spread': 0.05,   # Maximum price spread to open positions
            'take_profit': 0.02,  # Take profit threshold
            'stop_loss': 0.01,    # Stop loss threshold
        }
    
    def get_parameter_ranges(self) -> Dict[str, Dict[str, Any]]:
        """Get parameter ranges for optimization."""
        return {
            'hedge_ratio': {
                'min': 0.5,
                'max': 2.0,
                'step': 0.1
            },
            'min_spread': {
                'min': 0.0005,
                'max': 0.005,
                'step': 0.0005
            },
            'max_spread': {
                'min': 0.01,
                'max': 0.1,
                'step': 0.01
            },
            'take_profit': {
                'min': 0.01,
                'max': 0.05,
                'step': 0.005
            },
            'stop_loss': {
                'min': 0.005,
                'max': 0.02,
                'step': 0.001
            }
        }
    
    def calculate_position_sizes(self, price: float, balance: float) -> Dict[str, float]:
        """Calculate position sizes based on available balance and hedge ratio."""
        base_size = balance * 0.95  # Use 95% of available balance
        hedge_size = base_size * self._params.get('hedge_ratio', 1.0)
        
        return {
            'base_size': base_size,
            'hedge_size': hedge_size
        }
    
    def calculate_spread(self, data: pd.DataFrame) -> pd.DataFrame:
        """Calculate price spread between main and hedge instruments."""
        df = data.copy()
        df['spread'] = df['hedge_price'] - df['price']
        df['spread_pct'] = df['spread'] / df['price']
        return df
    
    @property
    def required_indicators(self) -> List[str]:
        """Get list of required technical indicators."""
        return ['sma_20', 'bb_upper', 'bb_lower', 'atr'] 
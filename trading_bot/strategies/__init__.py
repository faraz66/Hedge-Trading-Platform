"""Initialize and register all trading strategies."""
from ..core.strategy import BaseStrategy, StrategyRegistry

# Import strategy modules to ensure they are registered
from .grid_strategy import GridStrategy
from .bollinger_breakout_strategy import BollingerBreakoutStrategy

# Define available strategies
AVAILABLE_STRATEGIES = {
    'GridStrategy': GridStrategy,
    'BollingerBreakoutStrategy': BollingerBreakoutStrategy
}

# Export available classes
__all__ = [
    'BaseStrategy',
    'StrategyRegistry',
    'GridStrategy',
    'BollingerBreakoutStrategy',
    'AVAILABLE_STRATEGIES'
]

# Ensure strategies are registered
for name, strategy in AVAILABLE_STRATEGIES.items():
    if name not in StrategyRegistry._strategies:
        StrategyRegistry.register(strategy) 
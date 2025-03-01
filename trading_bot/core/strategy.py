"""Base classes and registry for trading strategies."""
import logging
from abc import ABC, abstractmethod
from typing import Dict, List, Any, Type, Optional
import pandas as pd

logger = logging.getLogger(__name__)

class BaseStrategy(ABC):
    """Base class for all trading strategies."""
    
    # Default parameters that can be overridden by subclasses
    default_parameters: Dict[str, Any] = {}
    
    def __init__(self, symbol: str = "BTCUSDT", params: Optional[Dict[str, Any]] = None):
        """Initialize the strategy.
        
        Args:
            symbol: Trading pair symbol (e.g., 'BTCUSDT')
            params: Optional strategy parameters
        """
        self.symbol = symbol
        self.parameters = {**self.default_parameters, **(params or {})}
        self.validate_parameters()
    
    def validate_parameters(self) -> None:
        """Validate strategy parameters."""
        required_params = self.get_required_parameters()
        if not all(param in self.parameters for param in required_params):
            missing = [p for p in required_params if p not in self.parameters]
            raise ValueError(f"Missing required parameters: {', '.join(missing)}")
    
    def get_required_parameters(self) -> List[str]:
        """Get list of required parameters."""
        return list(self.default_parameters.keys())
    
    @abstractmethod
    def generate_signals(self, data: pd.DataFrame) -> pd.DataFrame:
        """Generate trading signals from market data."""
        pass
    
    def get_parameters(self) -> Dict[str, Any]:
        """Get the current strategy parameters."""
        return self.parameters.copy()
    
    def set_parameters(self, params: Dict[str, Any]) -> None:
        """Set strategy parameters."""
        self.parameters = {**self.default_parameters, **params}
        self.validate_parameters()
    
    def get_parameter_ranges(self) -> Dict[str, Dict[str, Any]]:
        """Get valid ranges for strategy parameters for optimization."""
        return {
            param: {
                'min': 1,
                'max': 100,
                'step': 1,
                'description': f'{param} parameter'
            }
            for param in self.get_parameters()
        }
    
    @property
    def name(self) -> str:
        """Get the strategy name."""
        return self.__class__.__name__
    
    @property
    def description(self) -> str:
        """Get the strategy description."""
        return self.__doc__ or "No description available."

    @abstractmethod
    def analyze(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze market data and return trading signals."""
        pass

class StrategyRegistry:
    """Registry for trading strategies."""
    _strategies: Dict[str, Type[BaseStrategy]] = {}
    
    @classmethod
    def register(cls, strategy_class: Type[BaseStrategy]) -> Type[BaseStrategy]:
        """Register a strategy class."""
        try:
            logger.info(f"Registering strategy: {strategy_class.__name__}")
            if not issubclass(strategy_class, BaseStrategy):
                raise ValueError(f"{strategy_class.__name__} must inherit from BaseStrategy")
            
            cls._strategies[strategy_class.__name__] = strategy_class
            logger.info(f"Successfully registered strategy: {strategy_class.__name__}")
            logger.debug(f"Current registered strategies: {list(cls._strategies.keys())}")
            return strategy_class
        except Exception as e:
            logger.error(f"Error registering strategy {strategy_class.__name__}: {str(e)}", exc_info=True)
            raise
    
    @classmethod
    def get_strategy(cls, name: str) -> Type[BaseStrategy]:
        """Get a strategy class by name."""
        try:
            logger.debug(f"Getting strategy: {name}")
            if name not in cls._strategies:
                logger.error(f"Strategy not found: {name}")
                raise ValueError(f"Strategy not found: {name}")
            
            strategy = cls._strategies[name]
            logger.debug(f"Found strategy: {strategy.__name__}")
            return strategy
        except Exception as e:
            logger.error(f"Error getting strategy {name}: {str(e)}", exc_info=True)
            raise
    
    @classmethod
    def list_strategies(cls) -> Dict[str, Type[BaseStrategy]]:
        """List all registered strategies."""
        strategies = cls._strategies.copy()
        logger.info(f"Listed {len(strategies)} registered strategies: {list(strategies.keys())}")
        return strategies 
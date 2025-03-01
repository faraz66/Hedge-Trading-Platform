"""
Trading Bot package for algorithmic trading
"""

__version__ = '0.1.0'

# Main package initialization
from pathlib import Path
from typing import Dict, Type, Any
import logging
from .core.strategy import BaseStrategy, StrategyRegistry

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Define package-level paths
PACKAGE_ROOT = Path(__file__).parent
TEMPLATES_DIR = PACKAGE_ROOT / 'web' / 'templates'
STATIC_DIR = PACKAGE_ROOT / 'web' / 'static'

# Import strategies to ensure they are registered
from .strategies.grid_strategy import GridStrategy
from .strategies.bollinger_breakout_strategy import BollingerBreakoutStrategy

__all__ = ['BaseStrategy', 'StrategyRegistry', 'GridStrategy', 'BollingerBreakoutStrategy'] 
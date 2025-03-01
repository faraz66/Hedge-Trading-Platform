import logging
from pathlib import Path
import sys

# Base directory configuration
BASE_DIR = Path(__file__).parent.parent.parent
CACHE_DIR = BASE_DIR / "trading_bot/cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

# Available timeframes configuration
AVAILABLE_TIMEFRAMES = {
    '1m': '1 minute',
    '5m': '5 minutes',
    '15m': '15 minutes',
    '30m': '30 minutes',
    '1h': '1 hour',
    '4h': '4 hours',
    '1d': '1 day'
}

# Configure logging
logger = logging.getLogger('trading_bot')
logger.setLevel(logging.INFO)

# Create console handler with formatting
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)

# Create file handler
file_handler = logging.FileHandler(BASE_DIR / 'trading_bot.log')
file_handler.setLevel(logging.INFO)
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)

# Trading configuration
DEFAULT_INITIAL_CAPITAL = 100000.0

# Performance metrics configuration
ANNUALIZATION_FACTOR = 252  # Trading days in a year
RISK_FREE_RATE = 0.02      # 2% risk-free rate for Sharpe ratio calculation

# Technical analysis configuration
INDICATOR_SETTINGS = {
    'sma': [20, 50, 200],
    'bollinger_bands': {
        'window': 20,
        'num_std': 2
    },
    'rsi': {
        'window': 14
    },
    'macd': {
        'fast': 12,
        'slow': 26,
        'signal': 9
    }
} 
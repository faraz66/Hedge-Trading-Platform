from pathlib import Path
import pickle
import time
from typing import Optional
import pandas as pd
from ..utils.config import logger, CACHE_DIR

def get_cache_key(symbol: str, timeframe: str, start_date: str, end_date: Optional[str]) -> str:
    """Generate a unique cache key for the data request"""
    end_str = end_date if end_date else 'latest'
    symbol_dir = symbol.replace('/', '')
    return f"{symbol_dir}_{timeframe}_{start_date}_{end_str}.pkl"

def load_from_cache(cache_key: str) -> Optional[pd.DataFrame]:
    """Load data from cache if available"""
    cache_file = CACHE_DIR / cache_key
    if cache_file.exists():
        # Check if cache is less than 24 hours old for longer backtests
        if time.time() - cache_file.stat().st_mtime < 86400:
            try:
                with open(cache_file, 'rb') as f:
                    return pickle.load(f)
            except Exception as e:
                logger.warning(f"Failed to load cache: {e}")
    return None

def save_to_cache(cache_key: str, data: pd.DataFrame) -> None:
    """Save data to cache"""
    try:
        cache_file = CACHE_DIR / cache_key
        cache_file.parent.mkdir(parents=True, exist_ok=True)
        with open(cache_file, 'wb') as f:
            pickle.dump(data, f)
    except Exception as e:
        logger.warning(f"Failed to save cache: {e}")

def ensure_cache_directory(symbol: str) -> None:
    """Ensure cache directory exists for a given symbol"""
    try:
        symbol_dir = CACHE_DIR / symbol.replace('/', '')
        symbol_dir.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        logger.error(f"Error creating cache directory: {e}")
        raise 
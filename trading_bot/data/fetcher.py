import pandas as pd
import ccxt
import time
from ..utils.config import logger
from .cache import load_from_cache, save_to_cache, get_cache_key

def load_historical_data(symbol: str, start_date: str, end_date: str = None, timeframe: str = '1h') -> pd.DataFrame:
    """Load historical data using CCXT with caching and multiple timeframes"""
    try:
        # Check cache first
        cache_key = get_cache_key(symbol, timeframe, start_date, end_date)
        cached_data = load_from_cache(cache_key)
        if cached_data is not None:
            logger.info(f"Loaded data from cache for {symbol}")
            return cached_data

        # Initialize exchange with proper timeout settings
        exchange = ccxt.binance({
            'enableRateLimit': True,
            'timeout': 30000,
            'options': {
                'defaultType': 'spot',
            }
        })
        
        # Convert dates to timestamps
        start_ts = int(pd.Timestamp(start_date).timestamp() * 1000)
        end_ts = int(pd.Timestamp(end_date).timestamp() * 1000) if end_date else int(time.time() * 1000)
        
        all_candles = []
        since = start_ts
        max_retries = 3
        retry_delay = 5
        
        while since < end_ts:
            for attempt in range(max_retries):
                try:
                    logger.info(f"Fetching {timeframe} data for {symbol} from {pd.Timestamp(since, unit='ms')}")
                    
                    candles = exchange.fetch_ohlcv(
                        symbol,
                        timeframe=timeframe,
                        since=since,
                        limit=1000
                    )
                    
                    if candles:
                        all_candles.extend(candles)
                        timeframe_seconds = exchange.parse_timeframe(timeframe)
                        since = candles[-1][0] + (timeframe_seconds * 1000)
                        exchange.sleep(1)
                        break
                    else:
                        logger.warning(f"No data received for {symbol} at {pd.Timestamp(since, unit='ms')}")
                        break
                        
                except (ccxt.RequestTimeout, ccxt.NetworkError) as e:
                    if attempt == max_retries - 1:
                        raise ValueError(f"Error after {max_retries} attempts: {str(e)}")
                    logger.warning(f"Attempt {attempt + 1}/{max_retries} failed. Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                    
                except Exception as e:
                    raise ValueError(f"Unexpected error: {str(e)}")
            
            if len(candles) < 1000:
                break
        
        if not all_candles:
            raise ValueError(f"No data available for {symbol} in the specified date range")
        
        df = pd.DataFrame(all_candles, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
        df.set_index('timestamp', inplace=True)
        df = df[~df.index.duplicated(keep='first')]
        df.sort_index(inplace=True)
        
        # Save to cache
        save_to_cache(cache_key, df)
        
        logger.info(f"Successfully loaded {len(df)} data points for {symbol}")
        return df
        
    except Exception as e:
        error_msg = f"Error loading historical data: {str(e)}"
        logger.error(error_msg)
        raise ValueError(error_msg) 
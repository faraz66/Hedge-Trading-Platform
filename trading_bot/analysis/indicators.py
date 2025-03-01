import pandas as pd
import ta
from concurrent.futures import ThreadPoolExecutor, as_completed
import multiprocessing
from ..utils.config import logger, INDICATOR_SETTINGS

def calculate_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate enhanced technical indicators with optimized performance"""
    try:
        # Create a copy to avoid modifying the original dataframe
        df = df.copy()
        
        # Calculate basic price indicators first (most important)
        for window in INDICATOR_SETTINGS['sma']:
            df[f'sma_{window}'] = ta.trend.sma_indicator(df['close'], window=window, fillna=True)
        
        # Calculate Bollinger Bands
        bb = ta.volatility.BollingerBands(
            df['close'], 
            window=INDICATOR_SETTINGS['bollinger_bands']['window'],
            window_dev=INDICATOR_SETTINGS['bollinger_bands']['num_std'],
            fillna=True
        )
        df['bb_upper'] = bb.bollinger_hband()
        df['bb_lower'] = bb.bollinger_lband()
        
        # Calculate ATR
        if len(df) >= 14:
            df['atr'] = ta.volatility.average_true_range(df['high'], df['low'], df['close'], window=14, fillna=True)
        else:
            df['atr'] = 0
        
        # Calculate momentum indicators
        df['rsi'] = ta.momentum.rsi(df['close'], window=INDICATOR_SETTINGS['rsi']['window'], fillna=True)
        
        # Calculate MACD
        macd = ta.trend.MACD(
            df['close'],
            window_fast=INDICATOR_SETTINGS['macd']['fast'],
            window_slow=INDICATOR_SETTINGS['macd']['slow'],
            window_sign=INDICATOR_SETTINGS['macd']['signal'],
            fillna=True
        )
        df['macd_line'] = macd.macd()
        df['macd_signal'] = macd.macd_signal()
        df['macd_hist'] = macd.macd_diff()
        
        # Calculate custom indicators
        df['volatility_ratio'] = df['atr'] / df['close']
        
        return df
    except Exception as e:
        logger.error(f"Error calculating indicators: {str(e)}")
        raise

def process_chunk_with_indicators(chunk: pd.DataFrame) -> pd.DataFrame:
    """Process a single chunk of data with indicators"""
    try:
        return calculate_indicators(chunk)
    except Exception as e:
        logger.error(f"Error processing chunk: {str(e)}")
        raise

def parallel_process_indicators(historical_data: pd.DataFrame, max_workers: int = None) -> pd.DataFrame:
    """Process indicators in parallel with optimized chunk sizes"""
    if max_workers is None:
        max_workers = max(1, multiprocessing.cpu_count() - 1)
    
    # Ensure minimum chunk size for technical indicators
    min_chunk_size = 250
    optimal_chunk_size = max(min_chunk_size, len(historical_data) // max_workers)
    chunk_size = optimal_chunk_size + 200  # Add overlap period
    
    chunks = []
    for i in range(0, len(historical_data), optimal_chunk_size):
        chunk_end = min(i + chunk_size, len(historical_data))
        chunk = historical_data[i:chunk_end].copy()
        chunks.append((i, chunk))
    
    logger.info(f"Processing {len(historical_data)} data points in {len(chunks)} chunks using {max_workers} workers...")
    
    processed_chunks = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_chunk = {
            executor.submit(process_chunk_with_indicators, chunk_data): (i, chunk_idx) 
            for chunk_idx, (i, chunk_data) in enumerate(chunks)
        }
        
        for future in as_completed(future_to_chunk):
            start_idx, chunk_num = future_to_chunk[future]
            try:
                processed_chunk = future.result()
                if chunk_num < len(chunks) - 1:
                    processed_chunk = processed_chunk.iloc[:optimal_chunk_size]
                processed_chunks.append((start_idx, processed_chunk))
                logger.info(f"Completed processing chunk {chunk_num + 1}/{len(chunks)}")
            except Exception as e:
                logger.error(f"Error processing chunk {chunk_num + 1}: {str(e)}")
                raise
    
    processed_chunks.sort(key=lambda x: x[0])
    return pd.concat([chunk for _, chunk in processed_chunks]) 
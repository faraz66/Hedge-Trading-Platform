from typing import Dict, List
import pandas as pd
from datetime import datetime
from trading_bot.exchange.binance_client import BinanceClient

class MarketData:
    def __init__(self, exchange: BinanceClient):
        self.exchange = exchange
        
    def get_ohlcv(self, symbol: str, timeframe: str = '1m', limit: int = 100) -> pd.DataFrame:
        """Fetch and process OHLCV data"""
        ohlcv = self.exchange.fetch_ohlcv(symbol, timeframe, limit=limit)
        df = pd.DataFrame(ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
        df.set_index('timestamp', inplace=True)
        return df
    
    def get_order_book(self, symbol: str) -> Dict:
        """Fetch order book data"""
        return self.exchange.fetch_order_book(symbol)
    
    def get_ticker(self, symbol: str) -> Dict:
        """Fetch current ticker data"""
        return self.exchange.fetch_ticker(symbol)
    
    def get_historical_data(self, symbol: str, start_date: datetime, end_date: datetime, timeframe: str = '1h') -> pd.DataFrame:
        """Fetch historical OHLCV data for backtesting"""
        try:
            # Convert dates to timestamps
            since = int(start_date.timestamp() * 1000)
            
            # Fetch historical data
            ohlcv = self.exchange.fetch_ohlcv(symbol, timeframe, since=since, limit=1000)
            
            # Convert to DataFrame
            df = pd.DataFrame(ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
            df.set_index('timestamp', inplace=True)
            
            # Filter by date range
            df = df[start_date:end_date]
            
            return df
            
        except Exception as e:
            raise Exception(f"Error fetching historical data: {str(e)}") 
import ccxt
from typing import Dict, List
from trading_bot.utils.logger import setup_logger

class BinanceClient:
    def __init__(self, api_key: str, api_secret: str):
        self.logger = setup_logger(__name__)
        self.exchange = ccxt.binance({
            'apiKey': api_key,
            'secret': api_secret,
            'enableRateLimit': True,
            'options': {
                'defaultType': 'future'
            }
        })
    
    def create_order(self, symbol: str, order_type: str, side: str, amount: float, price: float = None) -> Dict:
        try:
            return self.exchange.create_order(symbol, order_type, side, amount, price)
        except Exception as e:
            self.logger.error(f"Order creation failed: {str(e)}")
            raise
    
    def get_balance(self) -> Dict:
        return self.exchange.fetch_balance()
    
    def cancel_order(self, order_id: str, symbol: str) -> Dict:
        return self.exchange.cancel_order(order_id, symbol)
    
    def fetch_ohlcv(self, symbol: str, timeframe: str = '1m', since: int = None, limit: int = 100) -> List:
        """Fetch OHLCV data from exchange"""
        return self.exchange.fetch_ohlcv(symbol, timeframe, since=since, limit=limit)
    
    def fetch_order_book(self, symbol: str) -> Dict:
        """Fetch order book data"""
        return self.exchange.fetch_order_book(symbol)
    
    def fetch_ticker(self, symbol: str) -> Dict:
        """Fetch current ticker data"""
        return self.exchange.fetch_ticker(symbol) 
from typing import Dict
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # API Configuration
    API_KEY = os.getenv('BINANCE_API_KEY')
    API_SECRET = os.getenv('BINANCE_API_SECRET')
    
    # Trading Parameters
    TRADING_PAIRS = ['BTC/USDT', 'ETH/USDT']
    TIMEFRAME = '1m'
    
    # Risk Management
    MAX_POSITION_SIZE = 1000  # USDT
    STOP_LOSS_PERCENTAGE = 2.0
    TAKE_PROFIT_PERCENTAGE = 4.0
    
    # System Configuration
    UPDATE_INTERVAL = 5  # seconds
    LOG_LEVEL = 'INFO' 
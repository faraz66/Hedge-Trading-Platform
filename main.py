from trading_bot.config.config import Config
from trading_bot.exchange.binance_client import BinanceClient
from trading_bot.data.market_data import MarketData
from trading_bot.strategies.hedging_strategy import HedgingStrategy
from trading_bot.utils.logger import setup_logger
import time
from datetime import datetime

def safe_format(value, format_spec='.2f'):
    """Safely format a value that might be None"""
    if value is None:
        return 'N/A'
    try:
        return format(value, format_spec)
    except (ValueError, TypeError):
        return str(value)

def display_market_data(market_data: MarketData, symbol: str):
    last_update_time = time.time()
    last_price = None
    
    while True:
        try:
            start_time = time.time()
            
            # Get ticker data
            ticker = market_data.get_ticker(symbol)
            current_price = ticker.get('last')
            
            # Calculate latency
            fetch_latency = (time.time() - start_time) * 1000  # in milliseconds
            update_latency = (time.time() - last_update_time) * 1000  # in milliseconds
            
            # Calculate price change since last update
            price_change = None
            if last_price and current_price:
                price_change = ((current_price - last_price) / last_price) * 100
            
            # Clear screen
            print("\033c", end="")
            
            # Format and display data
            print(f"=== {symbol} Market Data === {datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]} ===")
            print(f"Current Price: ${safe_format(current_price, ',.2f')}")
            print(f"24h High: ${safe_format(ticker.get('high'), ',.2f')}")
            print(f"24h Low: ${safe_format(ticker.get('low'), ',.2f')}")
            print(f"24h Volume: {safe_format(ticker.get('baseVolume'), ',.2f')} BTC")
            
            # Display price change since last update
            if price_change is not None:
                direction = "↑" if price_change > 0 else "↓" if price_change < 0 else "→"
                print(f"Price Change: {direction} {safe_format(abs(price_change), '.4f')}%")
            
            # Safely handle 24h percentage
            percentage = ticker.get('percentage')
            if percentage is not None:
                print(f"24h Change: {safe_format(percentage, '.2f')}%")
            else:
                print("24h Change: N/A")
                
            print(f"Bid: ${safe_format(ticker.get('bid'), ',.2f')}")
            print(f"Ask: ${safe_format(ticker.get('ask'), ',.2f')}")
            print("\nPerformance Metrics:")
            print(f"Data Fetch Latency: {safe_format(fetch_latency, '.1f')} ms")
            print(f"Update Interval: {safe_format(update_latency, '.1f')} ms")
            
            if ticker.get('timestamp'):
                exchange_time = datetime.fromtimestamp(ticker['timestamp']/1000)
                data_age = (datetime.now() - exchange_time).total_seconds() * 1000
                print(f"Data Age: {safe_format(data_age, '.1f')} ms")
            
            print("=====================================")
            
            # Update tracking variables
            last_price = current_price
            last_update_time = time.time()
            
            # Dynamic sleep to maintain consistent update interval
            elapsed = time.time() - start_time
            sleep_time = max(0, 1.0 - elapsed)  # Aim for 1-second updates
            time.sleep(sleep_time)
            
        except Exception as e:
            print(f"Error fetching data: {str(e)}")
            time.sleep(5)

def main():
    logger = setup_logger(__name__)
    
    try:
        # Initialize exchange client
        exchange = BinanceClient(Config.API_KEY, Config.API_SECRET)
        
        # Initialize market data handler
        market_data = MarketData(exchange)
        
        logger.info("Market data monitor started")
        
        # Monitor BTC/USDT price
        display_market_data(market_data, "BTC/USDT")
                
    except Exception as e:
        logger.error(f"An error occurred: {str(e)}")
        raise

if __name__ == "__main__":
    main() 
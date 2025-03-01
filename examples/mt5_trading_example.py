import sys
from pathlib import Path

# Add the project root to Python path
project_root = str(Path(__file__).parent.parent)
sys.path.insert(0, project_root)

from trading_bot.exchange.exness_mt5_client import ExnessMT5Trader, OrderType
from datetime import datetime, timedelta
import pandas as pd
import time

def main():
    # Initialize the trader with your credentials
    trader = ExnessMT5Trader(
        login=79529704,
        server="Exness-MT5Trial8",
        password="N@zizf167143"
    )
    
    try:
        # Initialize connection
        if not trader.initialize():
            print("Failed to initialize MT5 connection")
            return
            
        # Get account information
        account_info = trader.get_account_info()
        if not account_info:
            print("Failed to get account information")
            return
            
        print("\nAccount Information:")
        print(f"Balance: ${account_info['balance']:.2f}")
        print(f"Equity: ${account_info['equity']:.2f}")
        print(f"Free Margin: ${account_info['free_margin']:.2f}")
        print(f"Leverage: {account_info['leverage']}:1")
        
        # Get symbol information for EURUSD
        symbol = "EURUSD"
        symbol_info = trader.get_symbol_info(symbol)
        if not symbol_info:
            print(f"Failed to get {symbol} information")
            return
            
        print(f"\n{symbol} Information:")
        print(f"Bid: {symbol_info['bid']}")
        print(f"Ask: {symbol_info['ask']}")
        print(f"Spread: {symbol_info['spread']} points")
        
        # Calculate position size based on risk
        lot_size = trader.calculate_position_size(
            symbol=symbol,
            risk_percent=1.0,  # 1% risk
            stop_loss_pips=50  # 50 pips stop loss
        )
        
        print(f"\nCalculated lot size for 1% risk: {lot_size}")
        
        # Get current positions
        positions = trader.get_positions()
        print("\nCurrent Positions:")
        if positions:
            for pos in positions:
                print(f"Ticket: {pos['ticket']}")
                print(f"Symbol: {pos['symbol']}")
                print(f"Type: {pos['type']}")
                print(f"Volume: {pos['volume']}")
                print(f"Profit: ${pos['profit']:.2f}")
                print("---")
        else:
            print("No open positions")
            
    except Exception as e:
        print(f"An error occurred: {str(e)}")
    finally:
        # Always shut down MT5 connection
        trader.shutdown()

if __name__ == "__main__":
    main() 
from binance.client import Client
import pandas as pd
from datetime import datetime, timedelta
import json
from trading_bot.execution.grid_executor import GridExecutor
from trading_bot.backtesting.grid_backtester import GridBacktester
from trading_bot.strategies.grid_hedge_strategy import GridHedgeStrategy

def load_historical_data(client: Client, symbol: str, start_date: str) -> pd.DataFrame:
    """Load historical data from Binance"""
    klines = client.get_historical_klines(
        symbol,
        Client.KLINE_INTERVAL_1HOUR,
        start_date
    )
    
    df = pd.DataFrame(klines, columns=[
        'timestamp', 'open', 'high', 'low', 'close', 'volume',
        'close_time', 'quote_volume', 'trades', 'taker_buy_base',
        'taker_buy_quote', 'ignored'
    ])
    
    df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
    df.set_index('timestamp', inplace=True)
    
    # Convert string values to float
    for col in ['open', 'high', 'low', 'close', 'volume']:
        df[col] = df[col].astype(float)
        
    return df

def run_backtest(symbol: str = 'BTCUSDT'):
    """Run backtest on historical data"""
    # Initialize backtester
    backtester = GridBacktester(symbol=symbol, initial_capital=100000.0)
    
    # Load historical data (last 30 days)
    client = Client()
    start_date = (datetime.now() - timedelta(days=30)).strftime("%d %b %Y %H:%M:%S")
    historical_data = load_historical_data(client, symbol, start_date)
    
    # Run backtest
    results = backtester.run_backtest(historical_data)
    
    # Print results
    print("\nBacktest Results:")
    print(f"Total Return: {results['total_return']:.2%}")
    print(f"Sharpe Ratio: {results['sharpe_ratio']:.2f}")
    print(f"Max Drawdown: {results['max_drawdown']:.2%}")
    print(f"Win Rate: {results['win_rate']:.2%}")
    print(f"Number of Trades: {results['number_of_trades']}")
    print(f"Final Capital: ${results['final_capital']:,.2f}")
    
    # Save results to file
    with open(f'backtest_results_{symbol}.json', 'w') as f:
        json.dump(results, f, indent=4, default=str)

def run_live_trading(api_key: str, api_secret: str, symbol: str = 'BTCUSDT'):
    """Run live trading with the grid strategy"""
    # Initialize Binance client
    client = Client(api_key, api_secret)
    
    # Initialize strategy and executor
    strategy = GridHedgeStrategy(symbol=symbol)
    executor = GridExecutor(client, symbol)
    
    # Initial grid setup
    current_price = float(client.get_symbol_ticker(symbol=symbol)['price'])
    grid_levels = strategy.calculate_grid_levels(current_price)
    
    # Place initial orders
    executor.place_grid_orders(grid_levels)
    
    print(f"\nInitial grid setup complete for {symbol}")
    print(f"Current price: ${current_price:,.2f}")
    print(f"Number of grid levels: {len(grid_levels)}")
    
    # Note: In a real implementation, you would run this in a loop
    # with proper error handling and position management

if __name__ == "__main__":
    # Run backtest
    print("Running backtest...")
    run_backtest()
    
    # For live trading, uncomment and add your API keys
    # run_live_trading('your_api_key', 'your_api_secret') 
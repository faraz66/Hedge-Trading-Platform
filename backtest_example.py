from datetime import datetime, timedelta
from trading_bot.config.config import Config
from trading_bot.exchange.binance_client import BinanceClient
from trading_bot.data.market_data import MarketData
from trading_bot.strategies.hedging_strategy import HedgingStrategy
from trading_bot.backtesting.backtester import Backtester
from trading_bot.analysis.performance import PerformanceAnalyzer

def run_backtest():
    # Initialize components
    exchange = BinanceClient(Config.API_KEY, Config.API_SECRET)
    market_data = MarketData(exchange)
    strategy = HedgingStrategy(exchange, Config)
    
    # Initialize backtester
    backtester = Backtester(market_data, strategy)
    
    # Set backtest period
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)  # Last 30 days
    
    # Run backtest
    results = backtester.run("BTC/USDT", start_date, end_date, timeframe='1h')
    
    # Analyze performance
    analyzer = PerformanceAnalyzer()
    analysis = analyzer.analyze(
        returns=backtester.returns,
        trades=backtester.trades,
        equity_curve=backtester.equity_curve
    )
    
    # After running the analysis
    analyzer.print_summary()
    analyzer.generate_report(save_path='backtest_report.html')
    
    # Print key metrics
    print("\n=== Backtest Results ===")
    print(f"Total Return: {results['total_return']:.2f}%")
    print(f"Sharpe Ratio: {results['sharpe_ratio']:.2f}")
    print(f"Max Drawdown: {results['max_drawdown']:.2f}%")
    print(f"Win Rate: {results['win_rate']:.2f}%")
    print(f"Profit Factor: {results['profit_factor']:.2f}")
    print(f"Total Trades: {results['total_trades']}")
    print("=====================")

if __name__ == "__main__":
    run_backtest() 
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
import quantstats as qs
from ..models.order import Order

class Backtester:
    def __init__(self, market_data, strategy, initial_capital: float = 100000.0):
        self.market_data = market_data
        self.strategy = strategy
        self.initial_capital = initial_capital
        self.current_capital = initial_capital
        self.positions: Dict = {}
        self.trades: List[Dict] = []
        self.performance_metrics = {}
        self.returns = []
        self.equity_curve = []
        
    def _open_position(self, signal: Dict, market_data: Dict):
        """Open a new position"""
        try:
            symbol = signal.get('symbol', 'BTC/USDT')  # Default to BTC/USDT if not specified
            position_id = f"{symbol}_{signal['side']}_{len(self.trades)}"
            
            # Calculate position size based on available capital
            price = signal['price']
            quantity = self.strategy.calculate_position_size(price, self.current_capital)
            
            # Create position
            self.positions[position_id] = {
                'symbol': symbol,
                'side': signal['side'],
                'entry_price': price,
                'quantity': quantity,
                'entry_time': market_data['timestamp'],
                'type': signal['type']
            }
            
            # Update capital (subtract the position cost)
            position_cost = price * quantity
            self.current_capital -= position_cost
            
        except Exception as e:
            self.logger.error(f"Error opening position: {str(e)}")
    
    def _close_position(self, signal: Dict, market_data: Dict):
        """Close an existing position"""
        try:
            symbol = signal.get('symbol', 'BTC/USDT')
            # Find matching position
            position_to_close = None
            position_id = None
            
            for pid, pos in self.positions.items():
                if pos['symbol'] == symbol and pos['side'] == signal['side']:
                    position_to_close = pos
                    position_id = pid
                    break
            
            if position_to_close:
                # Calculate PnL
                exit_price = signal['price']
                quantity = position_to_close['quantity']
                entry_price = position_to_close['entry_price']
                
                if position_to_close['side'] == 'long':
                    pnl = (exit_price - entry_price) * quantity
                else:  # short
                    pnl = (entry_price - exit_price) * quantity
                
                # Record the trade
                self.trades.append({
                    'symbol': symbol,
                    'side': position_to_close['side'],
                    'entry_price': entry_price,
                    'exit_price': exit_price,
                    'quantity': quantity,
                    'pnl': pnl,
                    'entry_time': position_to_close['entry_time'],
                    'exit_time': market_data['timestamp'],
                    'type': position_to_close['type']
                })
                
                # Update capital (add the position value plus PnL)
                self.current_capital += (quantity * exit_price)
                
                # Remove the position
                del self.positions[position_id]
                
        except Exception as e:
            self.logger.error(f"Error closing position: {str(e)}")
    
    def run(self, symbol: str, start_date: datetime, end_date: datetime, timeframe: str = '1h') -> Dict:
        """Run backtest for the specified period"""
        # Fetch historical data
        historical_data = self.market_data.get_historical_data(symbol, start_date, end_date, timeframe)
        
        # Initialize performance tracking
        self.equity_curve = []
        drawdown = []
        self.returns = []
        
        for timestamp, row in historical_data.iterrows():
            # Prepare market data for strategy
            market_data = {
                'timestamp': timestamp,
                'open': row['open'],
                'high': row['high'],
                'low': row['low'],
                'close': row['close'],
                'volume': row['volume']
            }
            
            # Get strategy signals
            signals = self.strategy.analyze(market_data)
            
            # Execute trades based on signals
            self._execute_trades(signals, market_data)
            
            # Track performance
            equity = self._calculate_equity(market_data['close'])
            self.equity_curve.append(equity)
            self.returns.append((equity - self.current_capital) / self.current_capital if self.current_capital else 0)
            
            # Update current capital
            self.current_capital = equity
        
        # Convert lists to Series for analysis
        self.returns = pd.Series(self.returns, index=historical_data.index)
        self.equity_curve = pd.Series(self.equity_curve, index=historical_data.index)
        
        # Calculate performance metrics
        self.performance_metrics = self._calculate_performance_metrics(self.returns, self.equity_curve)
        
        return self.performance_metrics
    
    def _execute_trades(self, signals: List[Dict], market_data: Dict):
        """Execute trades based on strategy signals"""
        if not signals:  # Handle case when no signals are generated
            return
        
        for signal in signals:
            if signal['action'] == 'buy':
                self._open_position(signal, market_data)
            elif signal['action'] == 'sell':
                self._close_position(signal, market_data)
    
    def _calculate_equity(self, current_price: float) -> float:
        """Calculate current equity"""
        equity = self.current_capital
        for position in self.positions.values():
            equity += position['quantity'] * (current_price - position['entry_price'])
        return equity
    
    def _calculate_performance_metrics(self, returns: pd.Series, equity_curve: pd.Series) -> Dict:
        """Calculate comprehensive performance metrics"""
        metrics = {}
        
        try:
            # Basic metrics
            metrics['total_return'] = (equity_curve.iloc[-1] - self.initial_capital) / self.initial_capital * 100
            
            # Calculate Sharpe Ratio
            risk_free_rate = 0.02  # 2% annual risk-free rate
            excess_returns = returns - (risk_free_rate / 252)  # Daily risk-free rate
            sharpe_ratio = np.sqrt(252) * (excess_returns.mean() / excess_returns.std())
            metrics['sharpe_ratio'] = sharpe_ratio if not np.isnan(sharpe_ratio) else 0.0
            
            # Calculate Maximum Drawdown
            rolling_max = equity_curve.expanding().max()
            drawdowns = (equity_curve - rolling_max) / rolling_max
            metrics['max_drawdown'] = abs(drawdowns.min()) * 100 if not drawdowns.empty else 0.0
            
            # Trading metrics
            metrics['win_rate'] = self._calculate_win_rate()
            metrics['profit_factor'] = self._calculate_profit_factor()
            
            # Risk metrics
            annualized_volatility = returns.std() * np.sqrt(252)
            metrics['volatility'] = annualized_volatility if not np.isnan(annualized_volatility) else 0.0
            
            # Sortino Ratio (only considers negative returns in risk calculation)
            negative_returns = returns[returns < 0]
            downside_std = negative_returns.std() * np.sqrt(252)
            sortino_ratio = (returns.mean() * 252) / downside_std if downside_std != 0 else 0.0
            metrics['sortino_ratio'] = sortino_ratio if not np.isnan(sortino_ratio) else 0.0
            
            # Calmar Ratio (return / max drawdown)
            calmar_ratio = abs(metrics['total_return'] / metrics['max_drawdown']) if metrics['max_drawdown'] != 0 else 0.0
            metrics['calmar_ratio'] = calmar_ratio if not np.isnan(calmar_ratio) else 0.0
            
            # Trading metrics
            metrics['total_trades'] = len(self.trades)
            metrics['avg_trade_duration'] = self._calculate_avg_trade_duration()
            
            # Additional metrics
            metrics['avg_trade_return'] = np.mean([trade['pnl'] for trade in self.trades]) if self.trades else 0.0
            metrics['best_trade'] = max([trade['pnl'] for trade in self.trades], default=0.0)
            metrics['worst_trade'] = min([trade['pnl'] for trade in self.trades], default=0.0)
            
            # Risk-adjusted metrics
            metrics['risk_adjusted_return'] = metrics['total_return'] / metrics['volatility'] if metrics['volatility'] != 0 else 0.0
            
        except Exception as e:
            self.logger.error(f"Error calculating performance metrics: {str(e)}")
            # Provide default values in case of calculation errors
            metrics = {
                'total_return': 0.0,
                'sharpe_ratio': 0.0,
                'max_drawdown': 0.0,
                'win_rate': 0.0,
                'profit_factor': 0.0,
                'volatility': 0.0,
                'sortino_ratio': 0.0,
                'calmar_ratio': 0.0,
                'total_trades': 0,
                'avg_trade_duration': timedelta(0),
                'avg_trade_return': 0.0,
                'best_trade': 0.0,
                'worst_trade': 0.0,
                'risk_adjusted_return': 0.0
            }
        
        return metrics
    
    def _calculate_win_rate(self) -> float:
        """Calculate win rate from trades"""
        if not self.trades:
            return 0.0
        winning_trades = sum(1 for trade in self.trades if trade['pnl'] > 0)
        return winning_trades / len(self.trades)
    
    def _calculate_profit_factor(self) -> float:
        """Calculate profit factor"""
        gross_profit = sum(trade['pnl'] for trade in self.trades if trade['pnl'] > 0)
        gross_loss = abs(sum(trade['pnl'] for trade in self.trades if trade['pnl'] < 0))
        return gross_profit / gross_loss if gross_loss != 0 else float('inf')
    
    def _calculate_avg_trade_duration(self) -> timedelta:
        """Calculate average trade duration"""
        if not self.trades:
            return timedelta(0)
        durations = [trade['exit_time'] - trade['entry_time'] for trade in self.trades]
        return sum(durations, timedelta(0)) / len(durations) 
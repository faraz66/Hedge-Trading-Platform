import pandas as pd
import numpy as np
from typing import Dict, List, Any
from ..utils.config import logger, ANNUALIZATION_FACTOR, RISK_FREE_RATE

def calculate_advanced_metrics(equity_curve: pd.DataFrame, trades: List[Dict[str, Any]]) -> Dict[str, float]:
    """Calculate comprehensive performance metrics"""
    try:
        returns = equity_curve['equity'].pct_change()
        
        # Basic return metrics
        total_return = (equity_curve['equity'].iloc[-1] / equity_curve['equity'].iloc[0]) - 1
        annualized_return = (1 + total_return) ** (ANNUALIZATION_FACTOR / len(returns)) - 1
        
        # Risk metrics
        volatility = returns.std() * np.sqrt(ANNUALIZATION_FACTOR)
        downside_returns = returns[returns < 0]
        downside_volatility = downside_returns.std() * np.sqrt(ANNUALIZATION_FACTOR)
        max_drawdown = abs(returns.cummin().min())
        
        # Risk-adjusted return metrics
        sharpe_ratio = (annualized_return - RISK_FREE_RATE) / volatility if volatility > 0 else float('inf')
        sortino_ratio = (annualized_return - RISK_FREE_RATE) / downside_volatility if downside_volatility > 0 else float('inf')
        calmar_ratio = annualized_return / max_drawdown if max_drawdown > 0 else float('inf')
        
        # Trade metrics
        trade_returns = pd.Series([t['value'] for t in trades])
        winning_trades = trade_returns[trade_returns > 0]
        losing_trades = trade_returns[trade_returns < 0]
        
        num_trades = len(trades)
        num_winning = len(winning_trades)
        num_losing = len(losing_trades)
        
        win_rate = num_winning / num_trades if num_trades > 0 else 0
        avg_win = winning_trades.mean() if len(winning_trades) > 0 else 0
        avg_loss = losing_trades.mean() if len(losing_trades) > 0 else 0
        largest_win = winning_trades.max() if len(winning_trades) > 0 else 0
        largest_loss = losing_trades.min() if len(losing_trades) > 0 else 0
        
        # Advanced trade metrics
        profit_factor = abs(winning_trades.sum() / losing_trades.sum()) if len(losing_trades) > 0 else float('inf')
        recovery_factor = total_return / max_drawdown if max_drawdown > 0 else float('inf')
        risk_return_ratio = returns.mean() / returns.std() if returns.std() > 0 else float('inf')
        
        # Calculate trade duration statistics
        trade_durations = []
        for i in range(1, len(trades)):
            current_time = pd.to_datetime(trades[i]['timestamp'])
            prev_time = pd.to_datetime(trades[i-1]['timestamp'])
            duration = (current_time - prev_time).total_seconds() / 3600  # Duration in hours
            trade_durations.append(duration)
        
        avg_trade_duration = np.mean(trade_durations) if trade_durations else 0
        
        return {
            'total_return': total_return,
            'annualized_return': annualized_return,
            'volatility': volatility,
            'sharpe_ratio': sharpe_ratio,
            'sortino_ratio': sortino_ratio,
            'calmar_ratio': calmar_ratio,
            'max_drawdown': max_drawdown,
            'win_rate': win_rate,
            'profit_factor': profit_factor,
            'recovery_factor': recovery_factor,
            'risk_return_ratio': risk_return_ratio,
            'num_trades': num_trades,
            'num_winning': num_winning,
            'num_losing': num_losing,
            'avg_win': avg_win,
            'avg_loss': avg_loss,
            'largest_win': largest_win,
            'largest_loss': largest_loss,
            'avg_trade_duration': avg_trade_duration
        }
        
    except Exception as e:
        logger.error(f"Error calculating performance metrics: {str(e)}")
        raise

def format_metrics(metrics: Dict[str, float]) -> Dict[str, str]:
    """Format metrics for display"""
    try:
        return {
            'total_return': f"{metrics['total_return']:.2%}",
            'annualized_return': f"{metrics['annualized_return']:.2%}",
            'volatility': f"{metrics['volatility']:.2%}",
            'sharpe_ratio': f"{metrics['sharpe_ratio']:.2f}",
            'sortino_ratio': f"{metrics['sortino_ratio']:.2f}",
            'calmar_ratio': f"{metrics['calmar_ratio']:.2f}",
            'max_drawdown': f"{metrics['max_drawdown']:.2%}",
            'win_rate': f"{metrics['win_rate']:.2%}",
            'profit_factor': f"{metrics['profit_factor']:.2f}",
            'recovery_factor': f"{metrics['recovery_factor']:.2f}",
            'risk_return_ratio': f"{metrics['risk_return_ratio']:.2f}",
            'num_trades': str(metrics['num_trades']),
            'num_winning': str(metrics['num_winning']),
            'num_losing': str(metrics['num_losing']),
            'avg_win': f"${metrics['avg_win']:.2f}",
            'avg_loss': f"${abs(metrics['avg_loss']):.2f}",
            'largest_win': f"${metrics['largest_win']:.2f}",
            'largest_loss': f"${abs(metrics['largest_loss']):.2f}",
            'avg_trade_duration': f"{metrics['avg_trade_duration']:.1f} hours"
        }
    except Exception as e:
        logger.error(f"Error formatting metrics: {str(e)}")
        raise 
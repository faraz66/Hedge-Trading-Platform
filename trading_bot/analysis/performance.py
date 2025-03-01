import pandas as pd
import numpy as np
from typing import Dict, List
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from datetime import datetime

class PerformanceAnalyzer:
    def __init__(self):
        self.metrics = {}
        self.trades = []
        self.equity_curve = None
    
    def analyze(self, returns: pd.Series, trades: List[Dict], equity_curve: pd.Series) -> Dict:
        """Analyze strategy performance and generate report"""
        self.trades = trades
        self.equity_curve = equity_curve
        
        try:
            # Calculate core metrics
            self.metrics = {
                'total_return': self._calculate_total_return(),
                'sharpe_ratio': self._calculate_sharpe_ratio(returns),
                'sortino_ratio': self._calculate_sortino_ratio(returns),
                'max_drawdown': self._calculate_max_drawdown(),
                'win_rate': self._calculate_win_rate(),
                'profit_factor': self._calculate_profit_factor(),
                'volatility': self._calculate_volatility(returns),
                'calmar_ratio': self._calculate_calmar_ratio(),
                'avg_trade_return': self._calculate_avg_trade_return(),
                'avg_win_loss_ratio': self._calculate_avg_win_loss_ratio()
            }
            
        except Exception as e:
            print(f"Error in performance analysis: {str(e)}")
            self.metrics = self._get_default_metrics()
        
        return self.metrics
    
    def _calculate_sharpe_ratio(self, returns: pd.Series) -> float:
        """Calculate Sharpe Ratio"""
        if returns.empty:
            return 0.0
        risk_free_rate = 0.02  # 2% annual risk-free rate
        excess_returns = returns - (risk_free_rate / 252)  # Daily risk-free rate
        if excess_returns.std() == 0:
            return 0.0
        return np.sqrt(252) * (excess_returns.mean() / excess_returns.std())
    
    def _calculate_sortino_ratio(self, returns: pd.Series) -> float:
        """Calculate Sortino Ratio"""
        if returns.empty:
            return 0.0
        negative_returns = returns[returns < 0]
        if negative_returns.empty or negative_returns.std() == 0:
            return 0.0
        return np.sqrt(252) * (returns.mean() / negative_returns.std())
    
    def _calculate_max_drawdown(self) -> float:
        """Calculate Maximum Drawdown"""
        if self.equity_curve is None or self.equity_curve.empty:
            return 0.0
        rolling_max = self.equity_curve.expanding().max()
        drawdowns = (self.equity_curve - rolling_max) / rolling_max
        return abs(drawdowns.min()) * 100
    
    def _calculate_volatility(self, returns: pd.Series) -> float:
        """Calculate annualized volatility"""
        if returns.empty:
            return 0.0
        return returns.std() * np.sqrt(252)
    
    def _calculate_calmar_ratio(self) -> float:
        """Calculate Calmar Ratio"""
        max_dd = self._calculate_max_drawdown()
        if max_dd == 0:
            return 0.0
        return abs(self._calculate_total_return() / max_dd)
    
    def _calculate_total_return(self) -> float:
        """Calculate total return percentage"""
        if self.equity_curve is None or len(self.equity_curve) < 2:
            return 0.0
        return ((self.equity_curve.iloc[-1] / self.equity_curve.iloc[0]) - 1) * 100
    
    def _calculate_win_rate(self) -> float:
        """Calculate win rate from trades"""
        if not self.trades:
            return 0.0
        winning_trades = sum(1 for trade in self.trades if trade['pnl'] > 0)
        return (winning_trades / len(self.trades)) * 100
    
    def _calculate_profit_factor(self) -> float:
        """Calculate profit factor"""
        if not self.trades:
            return 0.0
        gross_profit = sum(trade['pnl'] for trade in self.trades if trade['pnl'] > 0)
        gross_loss = abs(sum(trade['pnl'] for trade in self.trades if trade['pnl'] < 0))
        return gross_profit / gross_loss if gross_loss != 0 else float('inf')
    
    def _calculate_avg_trade_return(self) -> float:
        """Calculate average return per trade"""
        if not self.trades:
            return 0.0
        return sum(trade['pnl'] for trade in self.trades) / len(self.trades)
    
    def _calculate_avg_win_loss_ratio(self) -> float:
        """Calculate average win/loss ratio"""
        winning_trades = [trade['pnl'] for trade in self.trades if trade['pnl'] > 0]
        losing_trades = [abs(trade['pnl']) for trade in self.trades if trade['pnl'] < 0]
        
        if not winning_trades or not losing_trades:
            return 0.0
            
        avg_win = sum(winning_trades) / len(winning_trades)
        avg_loss = sum(losing_trades) / len(losing_trades)
        
        return avg_win / avg_loss if avg_loss != 0 else float('inf')
    
    def _get_default_metrics(self) -> Dict:
        """Return default metrics in case of calculation errors"""
        return {
            'total_return': 0.0,
            'sharpe_ratio': 0.0,
            'sortino_ratio': 0.0,
            'max_drawdown': 0.0,
            'win_rate': 0.0,
            'profit_factor': 0.0,
            'volatility': 0.0,
            'calmar_ratio': 0.0,
            'avg_trade_return': 0.0,
            'avg_win_loss_ratio': 0.0
        }
    
    def generate_report(self, save_path: str = None):
        """Generate comprehensive performance report"""
        # Create plots with specific spacing and sizes
        fig = make_subplots(
            rows=3, cols=1,
            subplot_titles=('Equity Curve', 'Drawdown', 'Monthly Returns'),
            vertical_spacing=0.12,
            row_heights=[0.4, 0.3, 0.3],
            specs=[[{"type": "scatter"}],
                   [{"type": "scatter"}],
                   [{"type": "heatmap"}]]
        )
        
        # Equity curve
        fig.add_trace(
            go.Scatter(
                x=self.equity_curve.index,
                y=self.equity_curve.values,
                name='Equity',
                line=dict(color='rgb(49,130,189)', width=2)
            ),
            row=1, col=1
        )
        
        # Drawdown
        drawdown = self._calculate_drawdown()
        fig.add_trace(
            go.Scatter(
                x=drawdown.index,
                y=drawdown.values * 100,
                name='Drawdown',
                fill='tonexty',
                line=dict(color='rgba(255,69,0,0.7)', width=1),
                fillcolor='rgba(255,69,0,0.3)'
            ),
            row=2, col=1
        )
        
        # Monthly returns heatmap
        monthly_returns = self._calculate_monthly_returns()
        if not monthly_returns.empty:
            # Convert to percentage and handle NaN values
            heatmap_data = monthly_returns.fillna(0) * 100
            z_values = heatmap_data.values
            
            # Create text matrix with proper formatting
            text_matrix = [[f"{val:.1f}%" if not np.isnan(val) else "" 
                           for val in row] for row in z_values]
            
            fig.add_trace(
                go.Heatmap(
                    z=z_values,
                    x=monthly_returns.columns,
                    y=monthly_returns.index,
                    colorscale=[
                        [0, 'rgb(255,0,0)'],
                        [0.5, 'rgb(255,255,255)'],
                        [1, 'rgb(0,255,0)']
                    ],
                    zmid=0,
                    text=text_matrix,
                    texttemplate="%{text}",
                    textfont={"size": 10},
                    colorbar=dict(
                        title='Return %',
                        titleside='right',
                        thickness=15,
                        len=0.6,
                        y=0.2
                    )
                ),
                row=3, col=1
            )
        
        # Update layout with better formatting
        fig.update_layout(
            height=1000,
            title=dict(
                text="Strategy Performance Analysis",
                x=0.5,
                y=0.95,
                xanchor='center',
                yanchor='top',
                font=dict(size=20)
            ),
            showlegend=True,
            legend=dict(
                orientation="h",
                yanchor="bottom",
                y=1.02,
                xanchor="right",
                x=1
            ),
            template='plotly_white'
        )
        
        # Update axes labels and formatting
        fig.update_xaxes(title_text="Date", row=1, col=1)
        fig.update_yaxes(title_text="Portfolio Value ($)", row=1, col=1)
        fig.update_xaxes(title_text="Date", row=2, col=1)
        fig.update_yaxes(title_text="Drawdown (%)", row=2, col=1)
        fig.update_xaxes(title_text="Month", row=3, col=1)
        fig.update_yaxes(title_text="Year", row=3, col=1)
        
        if save_path:
            fig.write_html(save_path)
        
        return fig
    
    def _calculate_drawdown(self) -> pd.Series:
        """Calculate drawdown series"""
        if self.equity_curve is None or self.equity_curve.empty:
            return pd.Series()
        rolling_max = self.equity_curve.expanding().max()
        return (self.equity_curve - rolling_max) / rolling_max
    
    def _calculate_monthly_returns(self) -> pd.DataFrame:
        """Calculate monthly returns heatmap data"""
        if self.equity_curve is None or self.equity_curve.empty:
            return pd.DataFrame()
        
        # Calculate daily returns
        returns = self.equity_curve.pct_change()
        
        # Convert to monthly returns and create a matrix
        monthly_returns = returns.resample('M').apply(lambda x: (1 + x).prod() - 1)
        monthly_matrix = pd.DataFrame(
            index=monthly_returns.index.year.unique(),
            columns=range(1, 13)
        )
        
        for date, value in monthly_returns.items():
            monthly_matrix.loc[date.year, date.month] = value
        
        # Rename columns to month names
        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        monthly_matrix.columns = month_names
        
        return monthly_matrix
    
    def print_summary(self):
        """Print a formatted summary of the performance metrics"""
        print("\n=== Strategy Performance Summary ===")
        print(f"Total Return: {self.metrics['total_return']:.2f}%")
        print(f"Sharpe Ratio: {self.metrics['sharpe_ratio']:.2f}")
        print(f"Sortino Ratio: {self.metrics['sortino_ratio']:.2f}")
        print(f"Max Drawdown: {self.metrics['max_drawdown']:.2f}%")
        print(f"Win Rate: {self.metrics['win_rate']:.2f}%")
        print(f"Profit Factor: {self.metrics['profit_factor']:.2f}")
        print(f"Volatility (Ann.): {self.metrics['volatility']*100:.2f}%")
        print(f"Calmar Ratio: {self.metrics['calmar_ratio']:.2f}")
        print(f"Avg Trade Return: ${self.metrics['avg_trade_return']:.2f}")
        print(f"Win/Loss Ratio: {self.metrics['avg_win_loss_ratio']:.2f}")
        print("\n=== Trading Statistics ===")
        print(f"Total Trades: {len(self.trades)}")
        if self.trades:
            print(f"Best Trade: ${max(trade['pnl'] for trade in self.trades):.2f}")
            print(f"Worst Trade: ${min(trade['pnl'] for trade in self.trades):.2f}")
        print("=============================") 
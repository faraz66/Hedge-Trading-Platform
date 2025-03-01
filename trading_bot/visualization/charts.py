import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from typing import Dict, List, Any

def create_enhanced_charts(
    historical_data: pd.DataFrame,
    equity_df: pd.DataFrame,
    trades: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Create enhanced interactive charts for backtest visualization"""
    
    # Create figure with secondary y-axis
    fig = make_subplots(
        rows=2, cols=1,
        shared_xaxes=True,
        vertical_spacing=0.05,
        subplot_titles=('Price and Trades', 'Portfolio Value'),
        row_heights=[0.7, 0.3]
    )

    # Add candlestick chart
    fig.add_trace(
        go.Candlestick(
            x=historical_data.index,
            open=historical_data['open'],
            high=historical_data['high'],
            low=historical_data['low'],
            close=historical_data['close'],
            name='Price'
        ),
        row=1, col=1
    )

    # Add buy trades
    buy_trades = [t for t in trades if t['type'] == 'BUY']
    if buy_trades:
        buy_times = [t['timestamp'] for t in buy_trades]
        buy_prices = [t['price'] for t in buy_trades]
        fig.add_trace(
            go.Scatter(
                x=buy_times,
                y=buy_prices,
                mode='markers',
                name='Buy',
                marker=dict(
                    symbol='triangle-up',
                    size=10,
                    color='green',
                    line=dict(width=1, color='darkgreen')
                )
            ),
            row=1, col=1
        )

    # Add sell trades
    sell_trades = [t for t in trades if t['type'] == 'SELL']
    if sell_trades:
        sell_times = [t['timestamp'] for t in sell_trades]
        sell_prices = [t['price'] for t in sell_trades]
        fig.add_trace(
            go.Scatter(
                x=sell_times,
                y=sell_prices,
                mode='markers',
                name='Sell',
                marker=dict(
                    symbol='triangle-down',
                    size=10,
                    color='red',
                    line=dict(width=1, color='darkred')
                )
            ),
            row=1, col=1
        )

    # Add equity curve
    fig.add_trace(
        go.Scatter(
            x=equity_df.index,
            y=equity_df['equity'],
            name='Portfolio Value',
            line=dict(color='blue')
        ),
        row=2, col=1
    )

    # Update layout
    fig.update_layout(
        title='Backtest Results',
        xaxis_title='Date',
        yaxis_title='Price',
        yaxis2_title='Portfolio Value',
        showlegend=True,
        height=800,
        xaxis_rangeslider_visible=False,
        template='plotly_white'
    )

    # Create trade analysis chart
    trade_analysis = make_subplots(
        rows=2, cols=2,
        subplot_titles=(
            'Cumulative Returns', 'Trade Sizes',
            'Trade Results Distribution', 'Trade Duration'
        )
    )

    # Calculate trade metrics
    trade_df = pd.DataFrame(trades)
    if not trade_df.empty:
        trade_df['cumulative_value'] = trade_df['value'].cumsum()
        trade_df['duration'] = pd.to_datetime(trade_df['timestamp']).diff()

        # Cumulative returns
        trade_analysis.add_trace(
            go.Scatter(
                x=trade_df.index,
                y=trade_df['cumulative_value'],
                name='Cumulative P&L'
            ),
            row=1, col=1
        )

        # Trade sizes
        trade_analysis.add_trace(
            go.Histogram(
                x=trade_df['size'],
                name='Trade Sizes'
            ),
            row=1, col=2
        )

        # Trade results distribution
        trade_analysis.add_trace(
            go.Histogram(
                x=trade_df['value'],
                name='Trade Results'
            ),
            row=2, col=1
        )

        # Trade duration
        trade_analysis.add_trace(
            go.Histogram(
                x=trade_df['duration'].dt.total_seconds() / 3600,  # Convert to hours
                name='Trade Duration (hours)'
            ),
            row=2, col=2
        )

    trade_analysis.update_layout(
        height=600,
        showlegend=False,
        template='plotly_white'
    )

    # Convert figures to JSON for frontend
    return {
        'main_chart': fig.to_json(),
        'trade_analysis': trade_analysis.to_json()
    } 
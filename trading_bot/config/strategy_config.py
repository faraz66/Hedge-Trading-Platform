from typing import Dict

# Grid Strategy Configurations
GRID_CONFIGS = {
    'BTCUSDT': {
        'grid_size': 10,
        'grid_spacing': 0.01,  # 1% between levels
        'base_order_size': 0.01,  # Base position size in BTC
        'size_multiplier': 1.1,  # Increase size by 10% for each level
        'max_active_positions': 5,
        'profit_target_pct': 0.02,  # 2% profit target
        'max_loss_pct': 0.05,  # 5% max loss
        'timeframes': ['4h', '1h', '1d']
    },
    'XAUUSDT': {  # Gold futures on Binance
        'grid_size': 8,
        'grid_spacing': 0.005,  # 0.5% between levels
        'base_order_size': 0.1,  # Base position size
        'size_multiplier': 1.1,
        'max_active_positions': 4,
        'profit_target_pct': 0.015,  # 1.5% profit target
        'max_loss_pct': 0.04,  # 4% max loss
        'timeframes': ['4h', '1h', '1d']
    },
    'ETHUSDT': {
        'grid_size': 10,
        'grid_spacing': 0.012,  # 1.2% between levels
        'base_order_size': 0.1,  # Base position size in ETH
        'size_multiplier': 1.1,
        'max_active_positions': 5,
        'profit_target_pct': 0.025,  # 2.5% profit target
        'max_loss_pct': 0.05,  # 5% max loss
        'timeframes': ['4h', '1h', '1d']
    }
}

# Risk Management Settings
RISK_SETTINGS = {
    'max_daily_loss_pct': 0.03,  # 3% max daily loss
    'max_position_size_pct': 0.1,  # Max 10% of account per position
    'min_free_margin_pct': 0.3,  # Maintain 30% free margin
    'max_drawdown_pct': 0.15,  # 15% max drawdown
}

# Technical Analysis Parameters
ANALYSIS_PARAMS = {
    'support_resistance_periods': 20,
    'volatility_lookback': 20,
    'trend_ma_period': 20,
    'volume_ma_period': 20,
}

def get_symbol_config(symbol: str) -> Dict:
    """Get configuration for a specific symbol"""
    if symbol not in GRID_CONFIGS:
        raise ValueError(f"Configuration not found for symbol {symbol}. Available symbols: {list(GRID_CONFIGS.keys())}")
    return GRID_CONFIGS[symbol] 
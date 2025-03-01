from typing import Dict, List, Optional
import logging
from datetime import datetime
import pandas as pd
from binance.client import Client
from binance.exceptions import BinanceAPIException
from ..strategies.grid_hedge_strategy import GridLevel
from ..config.strategy_config import RISK_SETTINGS

class GridExecutor:
    def __init__(self, binance_client: Client, symbol: str):
        self.client = binance_client
        self.symbol = symbol
        self.active_orders: Dict[str, GridLevel] = {}  # order_id -> GridLevel
        self.logger = self._setup_logger()
        
    def _setup_logger(self) -> logging.Logger:
        logger = logging.getLogger(f'GridExecutor_{self.symbol}')
        logger.setLevel(logging.INFO)
        if not logger.handlers:
            fh = logging.FileHandler(f'grid_executor_{self.symbol}.log')
            fh.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
            logger.addHandler(fh)
        return logger
        
    def place_grid_orders(self, grid_levels: List[GridLevel]) -> List[GridLevel]:
        """Place orders for all grid levels"""
        for level in grid_levels:
            if not level.is_active or level.order_id:
                continue
                
            try:
                order = self._place_order(level)
                if order:
                    level.order_id = order['orderId']
                    self.active_orders[str(order['orderId'])] = level
                    self.logger.info(f"Placed {level.type} order at {level.price} for {level.size}")
            except BinanceAPIException as e:
                self.logger.error(f"Failed to place order: {e}")
                
        return grid_levels
        
    def _place_order(self, level: GridLevel) -> Dict:
        """Place a single order on Binance"""
        try:
            params = {
                'symbol': self.symbol,
                'side': level.type,
                'type': 'LIMIT',
                'timeInForce': 'GTC',
                'quantity': level.size,
                'price': level.price
            }
            
            # Check risk limits before placing order
            if not self._check_risk_limits(level):
                self.logger.warning(f"Risk limits exceeded for {level.type} order at {level.price}")
                return None
                
            order = self.client.create_order(**params)
            return order
        except BinanceAPIException as e:
            self.logger.error(f"Error placing order: {e}")
            return None
            
    def _check_risk_limits(self, level: GridLevel) -> bool:
        """Check if order complies with risk management rules"""
        try:
            account = self.client.get_account()
            total_balance = float(account['totalAsset'])
            
            # Check position size limit
            position_size_usd = level.size * level.price
            if position_size_usd / total_balance > RISK_SETTINGS['max_position_size_pct']:
                return False
                
            # Check free margin
            free_margin = float(account['availableBalance'])
            if free_margin / total_balance < RISK_SETTINGS['min_free_margin_pct']:
                return False
                
            return True
        except Exception as e:
            self.logger.error(f"Error checking risk limits: {e}")
            return False
            
    def update_filled_orders(self):
        """Check and update status of active orders"""
        for order_id, level in list(self.active_orders.items()):
            try:
                order = self.client.get_order(symbol=self.symbol, orderId=order_id)
                if order['status'] == 'FILLED':
                    level.is_filled = True
                    level.fill_price = float(order['price'])
                    level.fill_time = datetime.fromtimestamp(order['time'] / 1000)
                    self.logger.info(f"Order {order_id} filled at {level.fill_price}")
                    del self.active_orders[order_id]
            except BinanceAPIException as e:
                self.logger.error(f"Error checking order {order_id}: {e}")
                
    def cancel_grid_orders(self, grid_levels: List[GridLevel]):
        """Cancel all active orders in the grid"""
        for level in grid_levels:
            if level.order_id and not level.is_filled:
                try:
                    self.client.cancel_order(symbol=self.symbol, orderId=level.order_id)
                    level.order_id = None
                    level.is_active = False
                    if str(level.order_id) in self.active_orders:
                        del self.active_orders[str(level.order_id)]
                    self.logger.info(f"Cancelled order for level at {level.price}")
                except BinanceAPIException as e:
                    self.logger.error(f"Error cancelling order: {e}")
                    
    def close_position_pair(self, level: GridLevel, market_price: float):
        """Close a pair of positions at market price"""
        if not level.paired_level or not level.is_filled or not level.paired_level.is_filled:
            return False
            
        try:
            # Close both positions at market
            for pos in [level, level.paired_level]:
                close_side = 'SELL' if pos.type == 'BUY' else 'BUY'
                order = self.client.create_order(
                    symbol=self.symbol,
                    side=close_side,
                    type='MARKET',
                    quantity=pos.size
                )
                self.logger.info(f"Closed position at {market_price} for level {pos.price}")
                
            return True
        except BinanceAPIException as e:
            self.logger.error(f"Error closing positions: {e}")
            return False
            
    def get_market_price(self) -> float:
        """Get current market price"""
        try:
            ticker = self.client.get_symbol_ticker(symbol=self.symbol)
            return float(ticker['price'])
        except BinanceAPIException as e:
            self.logger.error(f"Error getting market price: {e}")
            return None 
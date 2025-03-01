import sys
import os
import pandas as pd
import numpy as np
from datetime import datetime, timezone
import pytz
from typing import Dict, List, Optional, Tuple, Union
import time
import MetaTrader5 as mt5
from dateutil.parser import parse
from enum import Enum

class OrderType(Enum):
    BUY = mt5.ORDER_TYPE_BUY
    SELL = mt5.ORDER_TYPE_SELL
    BUY_LIMIT = mt5.ORDER_TYPE_BUY_LIMIT
    SELL_LIMIT = mt5.ORDER_TYPE_SELL_LIMIT
    BUY_STOP = mt5.ORDER_TYPE_BUY_STOP
    SELL_STOP = mt5.ORDER_TYPE_SELL_STOP

class ExnessMT5Trader:
    def __init__(self, login: int, server: str, password: str = ""):
        """
        Initialize the Exness MT5 trader using MetaTrader5
        
        Args:
            login: MT5 account login number
            server: MT5 server name
            password: MT5 account password
        """
        self.login = login
        self.server = server
        self.password = password
        self.initialized = False
        self.timezone = pytz.timezone('UTC')
        self._hedge_enabled = False
        
    def initialize(self) -> bool:
        """Initialize MT5 connection"""
        try:
            # Initialize MT5
            if not mt5.initialize():
                print("MetaTrader5 initialization failed")
                return False
                
            # Connect to the account
            authorized = mt5.login(
                login=self.login,
                server=self.server,
                password=self.password
            )
            
            if not authorized:
                print(f"Failed to connect to account {self.login}")
                mt5.shutdown()
                return False
                
            self.initialized = True
            print(f"Connected to account #{self.login}")
            
            # Get account information to verify connection
            account_info = self.get_account_info()
            if account_info:
                print(f"Account Balance: ${account_info['balance']:.2f}")
                print(f"Account Currency: {account_info['currency']}")
                print(f"Account Type: {account_info.get('account_type', 'Unknown')}")
                
            # Check if hedging is enabled
            self._hedge_enabled = self._check_hedging_enabled()
            if self._hedge_enabled:
                print("Hedging is enabled on this account")
            
            return True
            
        except Exception as e:
            print(f"Error during initialization: {str(e)}")
            return False
        
    def _check_hedging_enabled(self) -> bool:
        """Check if hedging is enabled for the account"""
        try:
            account_info = mt5.account_info()
            return account_info.margin_mode == 1  # 1 indicates hedging is enabled
        except:
            return False

    def create_hedge_position(self,
                            symbol: str,
                            volume: float,
                            stop_loss: Optional[float] = None,
                            take_profit: Optional[float] = None) -> Dict:
        """
        Create a hedging position opposite to existing positions
        
        Args:
            symbol: Trading pair symbol
            volume: Trading volume in lots
            stop_loss: Stop loss price
            take_profit: Take profit price
        """
        if not self._hedge_enabled:
            return {'error': 'Hedging is not enabled on this account'}
            
        try:
            # Get existing positions for the symbol
            positions = self.get_positions(symbol=symbol)
            if not positions:
                return {'error': 'No positions to hedge'}
                
            # Calculate net position
            net_volume = sum(pos['volume'] * (1 if pos['type'] == 'BUY' else -1) for pos in positions)
            
            if net_volume == 0:
                return {'error': 'No net position to hedge'}
                
            # Create opposite position
            hedge_type = 'SELL' if net_volume > 0 else 'BUY'
            return self.create_order(
                symbol=symbol,
                order_type=hedge_type,
                volume=abs(net_volume),
                stop_loss=stop_loss,
                take_profit=take_profit,
                comment="Hedge position"
            )
            
        except Exception as e:
            return {'error': f"Hedge error: {str(e)}"}

    def create_advanced_order(self,
                            symbol: str,
                            order_type: Union[OrderType, str],
                            volume: float,
                            price: Optional[float] = None,
                            stop_loss: Optional[float] = None,
                            take_profit: Optional[float] = None,
                            expiration: Optional[datetime] = None,
                            deviation: int = 10,
                            comment: str = "") -> Dict:
        """
        Create an advanced order with additional parameters
        
        Args:
            symbol: Trading pair symbol
            order_type: Order type from OrderType enum
            volume: Trading volume in lots
            price: Order price for limit/stop orders
            stop_loss: Stop loss price
            take_profit: Take profit price
            expiration: Order expiration time
            deviation: Maximum price deviation for market orders
            comment: Order comment
        """
        if isinstance(order_type, str):
            try:
                order_type = OrderType(order_type.upper())
            except ValueError:
                return {'error': f'Invalid order type: {order_type}'}
                
        params = {
            'symbol': symbol,
            'volume': volume,
            'type': order_type.value,
            'deviation': deviation,
            'comment': comment
        }
        
        if price is not None:
            params['price'] = price
        if stop_loss is not None:
            params['sl'] = stop_loss
        if take_profit is not None:
            params['tp'] = take_profit
        if expiration is not None:
            params['expiration'] = int(expiration.timestamp())
            
        try:
            result = mt5.order_send(params)
            
            if result.retcode != 10009:
                return {
                    'error': f"Order failed: {result.comment}",
                    'retcode': result.retcode
                }
                
            return {
                'order_id': result.order,
                'volume': result.volume,
                'price': result.price,
                'comment': result.comment
            }
            
        except Exception as e:
            return {'error': f"Order error: {str(e)}"}

    def modify_position_partial(self,
                              ticket: int,
                              volume: float,
                              stop_loss: Optional[float] = None,
                              take_profit: Optional[float] = None) -> Dict:
        """
        Partially close or modify a position
        
        Args:
            ticket: Position ticket number
            volume: Volume to close (must be less than position volume)
            stop_loss: New stop loss price
            take_profit: New take profit price
        """
        try:
            position = next((p for p in mt5.positions_get() if p['ticket'] == ticket), None)
            if not position:
                return {'error': f'Position {ticket} not found'}
                
            if volume >= position['volume']:
                return {'error': 'Volume must be less than position volume for partial close'}
                
            # Close partial position
            result = mt5.order_send({
                'action': 'DEAL',
                'symbol': position['symbol'],
                'volume': volume,
                'type': 'SELL' if position['type'] == 0 else 'BUY',
                'position': ticket,
                'comment': f"Partial close #{ticket}"
            })
            
            if result.retcode != 10009:
                return {
                    'error': f"Partial close failed: {result.comment}",
                    'retcode': result.retcode
                }
                
            # Modify remaining position if SL/TP provided
            if stop_loss is not None or take_profit is not None:
                modify_result = self.modify_position(
                    ticket=ticket,
                    stop_loss=stop_loss,
                    take_profit=take_profit
                )
                if 'error' in modify_result:
                    return {
                        'warning': f"Position partially closed but modification failed: {modify_result['error']}",
                        'closed_volume': volume,
                        'price': result.price
                    }
                    
            return {
                'closed_volume': volume,
                'remaining_volume': position['volume'] - volume,
                'price': result.price,
                'comment': result.comment
            }
            
        except Exception as e:
            return {'error': f"Partial close error: {str(e)}"}

    def get_positions(self, symbol: Optional[str] = None) -> List[Dict]:
        """
        Get open positions with optional symbol filter
        
        Args:
            symbol: Optional symbol to filter positions
        """
        if not self.initialized:
            return []
            
        try:
            positions = mt5.positions_get(symbol=symbol)
            return [{
                'ticket': pos['ticket'],
                'symbol': pos['symbol'],
                'type': 'BUY' if pos['type'] == 0 else 'SELL',
                'volume': pos['volume'],
                'open_price': pos['price_open'],
                'current_price': pos['price_current'],
                'sl': pos['sl'],
                'tp': pos['tp'],
                'profit': pos['profit'],
                'swap': pos['swap'],
                'commission': pos.get('commission', 0),
                'comment': pos['comment'],
                'time': datetime.fromtimestamp(pos['time'])
            } for pos in positions]
        except Exception as e:
            print(f"Error getting positions: {str(e)}")
            return []

    def get_account_details(self) -> Dict:
        """Get detailed account information including trading history"""
        if not self.initialized:
            return {}
            
        try:
            account_info = self.get_account_info()
            
            # Get today's trading statistics
            from_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            history = mt5.history_deals_get(from_date)
            
            if history:
                today_profit = sum(deal['profit'] for deal in history)
                today_volume = sum(deal['volume'] for deal in history)
                today_trades = len(history)
            else:
                today_profit = today_volume = today_trades = 0
                
            return {
                **account_info,
                'today_profit': today_profit,
                'today_volume': today_volume,
                'today_trades': today_trades,
                'server_time': mt5.symbol_info_tick('EURUSD').time,
                'margin_level': account_info.get('margin_level', 0),
                'margin_call_level': account_info.get('margin_so_call', 0),
                'stop_out_level': account_info.get('margin_so_so', 0)
            }
            
        except Exception as e:
            print(f"Error getting account details: {str(e)}")
            return {}

    def calculate_position_size(self,
                              symbol: str,
                              risk_percent: float,
                              stop_loss_pips: float) -> float:
        """
        Calculate position size based on risk percentage
        
        Args:
            symbol: Trading pair symbol
            risk_percent: Risk percentage of account balance (0-100)
            stop_loss_pips: Stop loss distance in pips
        """
        try:
            account_info = self.get_account_info()
            symbol_info = self.get_symbol_info(symbol)
            
            if not account_info or not symbol_info:
                return 0.0
                
            # Calculate pip value
            pip_value = symbol_info['point'] * 10
            
            # Calculate risk amount
            risk_amount = account_info['balance'] * (risk_percent / 100)
            
            # Calculate position size
            stop_loss_amount = stop_loss_pips * pip_value
            position_size = risk_amount / stop_loss_amount
            
            # Round to valid lot size
            lot_step = symbol_info['lot_step']
            position_size = round(position_size / lot_step) * lot_step
            
            # Ensure within limits
            position_size = max(symbol_info['min_lot'], min(symbol_info['max_lot'], position_size))
            
            return position_size
            
        except Exception as e:
            print(f"Error calculating position size: {str(e)}")
            return 0.0
        
    def shutdown(self):
        """Shutdown MT5 connection"""
        if self.initialized:
            try:
                mt5.shutdown()
            except Exception as e:
                print(f"Error during shutdown: {str(e)}")
            finally:
                self.initialized = False
                
    def get_account_info(self) -> Dict:
        """Get account information"""
        if not self.initialized:
            return {}
            
        try:
            account_info = mt5.account_info()
            if account_info is None:
                return {}
                
            return {
                'balance': float(account_info.balance),
                'equity': float(account_info.equity),
                'margin': float(account_info.margin),
                'free_margin': float(account_info.margin_free),
                'leverage': int(account_info.leverage),
                'currency': account_info.currency
            }
        except Exception as e:
            print(f"Error getting account info: {str(e)}")
            return {}
        
    def get_symbol_info(self, symbol: str) -> Dict:
        """Get symbol information"""
        if not self.initialized:
            return {}
            
        try:
            symbol_info = mt5.symbol_info(symbol)
            if symbol_info is None:
                return {}
                
            return {
                'bid': float(symbol_info.bid),
                'ask': float(symbol_info.ask),
                'spread': float(symbol_info.spread),
                'digits': int(symbol_info.digits),
                'min_lot': float(symbol_info.volume_min),
                'max_lot': float(symbol_info.volume_max),
                'lot_step': float(symbol_info.volume_step),
                'point': float(symbol_info.point)
            }
        except Exception as e:
            print(f"Error getting symbol info: {str(e)}")
            return {}
        
    def get_ohlcv(self, 
                  symbol: str, 
                  timeframe: str = '1h',
                  since: Optional[datetime] = None,
                  limit: int = 1000) -> pd.DataFrame:
        """
        Get OHLCV data for a symbol
        
        Args:
            symbol: Trading pair symbol
            timeframe: Time frame (1m, 5m, 15m, 30m, 1h, 4h, 1d)
            since: Start time
            limit: Number of candles to fetch
        """
        if not self.initialized:
            return pd.DataFrame()
            
        try:
            # Convert timeframe string to mt5 format
            timeframe_map = {
                '1m': 'M1',
                '5m': 'M5',
                '15m': 'M15',
                '30m': 'M30',
                '1h': 'H1',
                '4h': 'H4',
                '1d': 'D1'
            }
            
            tf = timeframe_map.get(timeframe, 'H1')
            
            # Get rates
            rates = mt5.copy_rates_from(
                symbol,
                tf,
                since.timestamp() if since else None,
                limit
            )
            
            if not rates:
                return pd.DataFrame()
                
            # Convert to DataFrame
            df = pd.DataFrame(rates)
            df['time'] = pd.to_datetime(df['time'], unit='s')
            df.set_index('time', inplace=True)
            
            return df
            
        except Exception as e:
            print(f"Error getting OHLCV data: {str(e)}")
            return pd.DataFrame()
        
    def create_order(self,
                    symbol: str,
                    order_type: str,
                    volume: float,
                    price: Optional[float] = None,
                    stop_loss: Optional[float] = None,
                    take_profit: Optional[float] = None,
                    comment: str = "") -> Dict:
        """
        Create a trading order
        
        Args:
            symbol: Trading pair symbol
            order_type: Order type (BUY, SELL)
            volume: Trading volume in lots
            price: Order price (for limit orders)
            stop_loss: Stop loss price
            take_profit: Take profit price
            comment: Order comment
        """
        if not self.initialized:
            return {'error': 'MT5 not initialized'}
            
        try:
            # Prepare order parameters
            params = {
                'symbol': symbol,
                'volume': volume,
                'type': order_type.upper(),
                'comment': comment
            }
            
            if price is not None:
                params['price'] = price
            if stop_loss is not None:
                params['sl'] = stop_loss
            if take_profit is not None:
                params['tp'] = take_profit
                
            # Send order
            result = mt5.order_send(params)
            
            if result.retcode != 10009:  # mt5 success code
                return {
                    'error': f"Order failed: {result.comment}",
                    'retcode': result.retcode
                }
                
            return {
                'order_id': result.order,
                'volume': result.volume,
                'price': result.price,
                'comment': result.comment
            }
            
        except Exception as e:
            return {'error': f"Order error: {str(e)}"}
        
    def close_position(self, ticket: int) -> Dict:
        """
        Close a specific position
        
        Args:
            ticket: Position ticket number
        """
        if not self.initialized:
            return {'error': 'MT5 not initialized'}
            
        try:
            position = next((p for p in mt5.positions_get() if p['ticket'] == ticket), None)
            if not position:
                return {'error': f'Position {ticket} not found'}
                
            # Prepare close request
            result = mt5.order_send({
                'action': 'DEAL',
                'symbol': position['symbol'],
                'volume': position['volume'],
                'type': 'SELL' if position['type'] == 0 else 'BUY',
                'position': ticket,
                'comment': f"Close position #{ticket}"
            })
            
            if result.retcode != 10009:
                return {
                    'error': f"Close failed: {result.comment}",
                    'retcode': result.retcode
                }
                
            return {
                'closed_ticket': ticket,
                'volume': result.volume,
                'price': result.price,
                'comment': result.comment
            }
            
        except Exception as e:
            return {'error': f"Close error: {str(e)}"}
        
    def __enter__(self):
        """Context manager entry"""
        self.initialize()
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.shutdown() 
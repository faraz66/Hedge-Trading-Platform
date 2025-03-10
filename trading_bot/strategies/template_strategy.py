"""
Template for creating new trading strategies.
Copy this file and modify it to create your own strategy.
"""

from typing import Dict, Any
from trading_bot.core.strategy import Strategy
from trading_bot.core.types import Trade, Position
from trading_bot.core.logger import get_logger

class TemplateStrategy(Strategy):
    """
    Template strategy class showing the basic structure and required methods.
    """

    def __init__(self):
        super().__init__()
        self.logger = get_logger(__name__)
        
        # Define your strategy parameters here
        self.parameters = {
            "param1": {
                "type": "float",
                "description": "Description of parameter 1",
                "default": 1.0,
                "min": 0.0,
                "max": 10.0
            },
            "param2": {
                "type": "int",
                "description": "Description of parameter 2",
                "default": 10,
                "min": 1,
                "max": 100
            }
        }

        # Initialize any other instance variables
        self.last_price = None
        self.position = None

    def initialize(self) -> None:
        """
        Called once before trading starts.
        Use this method to initialize any strategy state.
        """
        self.logger.info("Initializing strategy with parameters:", self.parameters)
        self.last_price = None
        self.position = None

    def on_tick(self, tick: Dict[str, Any]) -> None:
        """
        Main strategy logic - called for each new price update.

        Args:
            tick: Dictionary containing current market data
                {
                    'timestamp': int,
                    'open': float,
                    'high': float,
                    'low': float,
                    'close': float,
                    'volume': float
                }
        """
        try:
            # Get current price
            current_price = tick['close']

            # Your strategy logic here
            # Example:
            if self.should_buy(current_price):
                self.create_order(
                    side='buy',
                    amount=self.calculate_position_size(),
                    price=current_price
                )
            elif self.should_sell(current_price):
                self.create_order(
                    side='sell',
                    amount=self.calculate_position_size(),
                    price=current_price
                )

            # Update state
            self.last_price = current_price

        except Exception as e:
            self.logger.error(f"Error in strategy execution: {e}")
            raise

    def should_buy(self, price: float) -> bool:
        """
        Implement your buy signal logic here.
        
        Args:
            price: Current price
            
        Returns:
            bool: True if should buy, False otherwise
        """
        # Example logic - replace with your own
        if self.last_price is None:
            return False
        return price < self.last_price * (1 - self.parameters['param1']['default'])

    def should_sell(self, price: float) -> bool:
        """
        Implement your sell signal logic here.
        
        Args:
            price: Current price
            
        Returns:
            bool: True if should sell, False otherwise
        """
        # Example logic - replace with your own
        if self.last_price is None:
            return False
        return price > self.last_price * (1 + self.parameters['param1']['default'])

    def calculate_position_size(self) -> float:
        """
        Calculate the position size for orders.
        
        Returns:
            float: Position size to use for orders
        """
        # Example logic - replace with your own
        return float(self.parameters['param2']['default']) / 100.0

    def on_trade(self, trade: Trade) -> None:
        """
        Called when a trade is executed.
        
        Args:
            trade: Trade object containing execution details
        """
        self.logger.info(f"Trade executed: {trade}")
        # Add any trade-specific logic here

    def on_position_update(self, position: Position) -> None:
        """
        Called when position changes.
        
        Args:
            position: Position object containing current position details
        """
        self.logger.info(f"Position updated: {position}")
        self.position = position
        # Add any position-specific logic here

    def on_stop(self) -> None:
        """
        Called when the strategy is stopped.
        Use this method to clean up any resources.
        """
        self.logger.info("Strategy stopped")
        # Add any cleanup logic here 
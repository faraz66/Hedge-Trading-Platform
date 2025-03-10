# Creating a New Trading Strategy

This guide will walk you through the process of creating and integrating a new trading strategy in HedgeBot.

## Overview

To add a new strategy, you'll need to:
1. Create a strategy class in the backend
2. Register the strategy with the system
3. Add strategy parameters to the frontend
4. Test the strategy through the UI

## Step 1: Create Strategy Class

Create a new file in `trading_bot/strategies/` (e.g., `my_strategy.py`):

```python
from typing import Dict, Any
from trading_bot.core.strategy import Strategy
from trading_bot.core.types import Trade, Position

class MyStrategy(Strategy):
    def __init__(self):
        super().__init__()
        # Define strategy parameters with their defaults and ranges
        self.parameters = {
            "threshold": {
                "type": "float",
                "description": "Price movement threshold",
                "default": 0.02,
                "min": 0.001,
                "max": 0.1
            },
            "position_size": {
                "type": "float",
                "description": "Position size in base currency",
                "default": 0.1,
                "min": 0.01,
                "max": 1.0
            }
            # Add more parameters as needed
        }

    def initialize(self) -> None:
        """Called once before trading starts"""
        self.last_price = None

    def on_tick(self, tick: Dict[str, Any]) -> None:
        """
        Main strategy logic - called for each new price update
        
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
        current_price = tick['close']
        
        if self.last_price is None:
            self.last_price = current_price
            return

        # Example strategy logic
        price_change = (current_price - self.last_price) / self.last_price
        
        if abs(price_change) > self.parameters['threshold']['default']:
            if price_change > 0:
                # Price increased beyond threshold - buy
                self.create_order(
                    side='buy',
                    amount=self.parameters['position_size']['default'],
                    price=current_price
                )
            else:
                # Price decreased beyond threshold - sell
                self.create_order(
                    side='sell',
                    amount=self.parameters['position_size']['default'],
                    price=current_price
                )

        self.last_price = current_price

    def on_trade(self, trade: Trade) -> None:
        """Called when a trade is executed"""
        print(f"Trade executed: {trade}")

    def on_position_update(self, position: Position) -> None:
        """Called when position changes"""
        print(f"Position updated: {position}")
```

## Step 2: Register the Strategy

Add your strategy to `trading_bot/strategies/__init__.py`:

```python
from .my_strategy import MyStrategy
from trading_bot.core.registry import register_strategy

# Register the strategy
register_strategy('MyStrategy', MyStrategy)
```

## Step 3: Update Frontend Types

Add your strategy's parameter types to `src/types/index.ts`:

```typescript
// Add to existing Strategy interface if needed
export interface MyStrategyParameters {
  threshold: number;
  position_size: number;
}

// Update StrategyParameters type union if needed
export type StrategyParameters = GridStrategyParameters | BollingerBandsParameters | MyStrategyParameters;
```

## Step 4: Add Strategy Documentation

Create a documentation file in `docs/strategies/my_strategy.md`:

```markdown
# My Strategy

## Overview
Brief description of what your strategy does and its main features.

## Parameters

- threshold (float):
  - Description: Price movement threshold for triggering trades
  - Default: 0.02
  - Range: 0.001 to 0.1

- position_size (float):
  - Description: Size of each trading position
  - Default: 0.1
  - Range: 0.01 to 1.0

## Logic

Explain how your strategy works:
1. Monitor price changes
2. Compare against threshold
3. Execute trades when conditions are met

## Backtest Results

Include example backtest results and performance metrics.
```

## Testing Your Strategy

1. Start the backend server:
   ```bash
   npm run start:backend
   ```

2. Start the frontend:
   ```bash
   npm run start:frontend
   ```

3. Access the UI at `http://localhost:5173/strategies`

4. Your strategy should now appear in the strategies list

5. Click on your strategy to:
   - View parameters
   - Modify parameter values
   - Run backtests
   - View performance metrics

## API Endpoints

Your strategy will automatically be available through these endpoints:

- GET `/api/strategies` - Lists all strategies including yours
- POST `/api/strategies/MyStrategy/parameters` - Updates strategy parameters
- POST `/api/backtest/MyStrategy` - Runs backtest with current parameters

## Best Practices

1. **Parameter Validation**
   - Always define min/max ranges for parameters
   - Include clear descriptions
   - Use appropriate parameter types

2. **Error Handling**
   ```python
   def on_tick(self, tick: Dict[str, Any]) -> None:
       try:
           # Your strategy logic
           pass
       except Exception as e:
           self.logger.error(f"Error in strategy: {e}")
           # Handle the error appropriately
   ```

3. **Logging**
   ```python
   def initialize(self) -> None:
       self.logger.info("Strategy initialized with parameters:", self.parameters)
   ```

4. **Testing**
   - Create unit tests in `tests/strategies/test_my_strategy.py`
   - Test edge cases and parameter boundaries
   - Verify order creation logic

## Common Issues

1. **Strategy Not Appearing in UI**
   - Check strategy registration in `__init__.py`
   - Verify backend server is running
   - Check browser console for errors

2. **Parameter Updates Not Working**
   - Verify parameter types match between frontend and backend
   - Check API endpoint responses
   - Verify parameter ranges

3. **Backtest Errors**
   - Ensure historical data is available
   - Check parameter validation
   - Verify strategy logic handles all cases

## Next Steps

1. Monitor your strategy's performance
2. Fine-tune parameters based on backtesting
3. Add additional features or conditions
4. Contribute improvements back to the project

For more examples, see the existing strategies in `trading_bot/strategies/`. 
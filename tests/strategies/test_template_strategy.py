"""
Template for testing trading strategies.
Copy this file and modify it to test your own strategy.
"""

import pytest
from trading_bot.strategies.template_strategy import TemplateStrategy

@pytest.fixture
def strategy():
    """Create a strategy instance for testing."""
    return TemplateStrategy()

def test_strategy_initialization(strategy):
    """Test strategy initialization and parameter setup."""
    assert strategy is not None
    assert isinstance(strategy.parameters, dict)
    assert "param1" in strategy.parameters
    assert "param2" in strategy.parameters

def test_parameter_validation(strategy):
    """Test parameter validation logic."""
    # Test param1
    assert strategy.parameters["param1"]["min"] <= strategy.parameters["param1"]["default"]
    assert strategy.parameters["param1"]["default"] <= strategy.parameters["param1"]["max"]
    
    # Test param2
    assert strategy.parameters["param2"]["min"] <= strategy.parameters["param2"]["default"]
    assert strategy.parameters["param2"]["default"] <= strategy.parameters["param2"]["max"]

def test_buy_signal(strategy):
    """Test buy signal logic."""
    strategy.initialize()
    
    # First tick should not generate buy signal (no previous price)
    assert not strategy.should_buy(100.0)
    
    # Update last price
    strategy.last_price = 100.0
    
    # Test buy signal with price drop
    assert strategy.should_buy(90.0)  # Price dropped by 10%
    assert not strategy.should_buy(95.0)  # Price dropped by 5%

def test_sell_signal(strategy):
    """Test sell signal logic."""
    strategy.initialize()
    
    # First tick should not generate sell signal (no previous price)
    assert not strategy.should_sell(100.0)
    
    # Update last price
    strategy.last_price = 100.0
    
    # Test sell signal with price increase
    assert strategy.should_sell(110.0)  # Price increased by 10%
    assert not strategy.should_sell(105.0)  # Price increased by 5%

def test_position_size_calculation(strategy):
    """Test position size calculation."""
    size = strategy.calculate_position_size()
    assert isinstance(size, float)
    assert size > 0

def test_tick_processing(strategy):
    """Test tick processing logic."""
    strategy.initialize()
    
    # Create a sample tick
    tick = {
        'timestamp': 1625097600,
        'open': 100.0,
        'high': 101.0,
        'low': 99.0,
        'close': 100.5,
        'volume': 1000.0
    }
    
    # Process tick
    strategy.on_tick(tick)
    
    # Verify state updates
    assert strategy.last_price == tick['close']

def test_error_handling(strategy):
    """Test error handling in tick processing."""
    strategy.initialize()
    
    # Create an invalid tick
    invalid_tick = {
        'timestamp': 1625097600,
        # Missing required fields
    }
    
    # Verify error handling
    with pytest.raises(Exception):
        strategy.on_tick(invalid_tick)

def test_strategy_lifecycle(strategy):
    """Test complete strategy lifecycle."""
    # Initialize
    strategy.initialize()
    assert strategy.last_price is None
    assert strategy.position is None
    
    # Process some ticks
    ticks = [
        {'timestamp': 1625097600, 'open': 100.0, 'high': 101.0, 'low': 99.0, 'close': 100.0, 'volume': 1000.0},
        {'timestamp': 1625097601, 'open': 100.0, 'high': 102.0, 'low': 98.0, 'close': 90.0, 'volume': 1000.0},
        {'timestamp': 1625097602, 'open': 90.0, 'high': 92.0, 'low': 88.0, 'close': 110.0, 'volume': 1000.0},
    ]
    
    for tick in ticks:
        strategy.on_tick(tick)
        assert strategy.last_price == tick['close']
    
    # Stop strategy
    strategy.on_stop()

def test_parameter_updates():
    """Test parameter update functionality."""
    strategy = TemplateStrategy()
    
    # Original parameters
    original_param1 = strategy.parameters["param1"]["default"]
    
    # Update parameters
    new_params = {
        "param1": 2.0,  # Within allowed range
        "param2": 20    # Within allowed range
    }
    
    # Verify updates within range are accepted
    for param_name, value in new_params.items():
        assert value >= strategy.parameters[param_name]["min"]
        assert value <= strategy.parameters[param_name]["max"]
    
    # Test invalid parameter values
    with pytest.raises(ValueError):
        strategy.parameters["param1"]["default"] = -1.0  # Below min
    
    with pytest.raises(ValueError):
        strategy.parameters["param2"]["default"] = 101  # Above max 
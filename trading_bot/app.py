import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from trading_bot.core.strategy import StrategyRegistry
from trading_bot.strategies.grid_strategy import GridStrategy
from trading_bot.strategies.bollinger_breakout_strategy import BollingerBreakoutStrategy
from trading_bot.strategies import AVAILABLE_STRATEGIES
from trading_bot.backtesting import run_backtest
from trading_bot.config import load_config, save_config
import argparse

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('trading_bot.log')
    ]
)

logger = logging.getLogger(__name__)

# Define valid settings categories and their allowed fields
SETTINGS_SCHEMA = {
    'exchange': ['api_key', 'api_secret', 'paper_trading'],
    'trading': ['default_amount', 'max_trades', 'risk_level'],
    'interface': ['theme', 'notifications_enabled', 'refresh_interval'],
    'notifications': ['email', 'telegram', 'webhook_url']
}

def create_app():
    """Create and configure the Flask application."""
    logger.info("Creating Flask application...")
    
    app = Flask(__name__)
    
    # Configure CORS - More permissive for development
    logger.info("Configuring CORS...")
    CORS(app, resources={
        r"/*": {
            "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "Accept"],
            "expose_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
            "send_wildcard": True
        }
    })
    
    # Load initial config
    config = load_config()
    
    # Register strategies
    logger.info("Registering strategies...")
    # Register all available strategies from the AVAILABLE_STRATEGIES dictionary
    for strategy_name, strategy_class in AVAILABLE_STRATEGIES.items():
        if strategy_class not in StrategyRegistry._strategies.values():
            StrategyRegistry.register(strategy_class)
    logger.info(f"Registered strategies: {list(StrategyRegistry._strategies.keys())}")
    
    @app.route('/run_backtest', methods=['POST'])
    def run_backtest_endpoint():
        """Run a backtest with the specified strategy and parameters."""
        try:
            data = request.json
            logger.debug(f"Received backtest request: {data}")
            
            # Validate required parameters
            required_params = ['strategyName', 'symbol', 'startDate', 'endDate']
            missing_params = [param for param in required_params if param not in data]
            if missing_params:
                return jsonify({
                    'status': 'error',
                    'message': f'Missing required parameters: {", ".join(missing_params)}'
                }), 400

            # Get strategy class
            strategy_name = data['strategyName']
            try:
                strategy_class = StrategyRegistry.get_strategy(strategy_name)
            except ValueError as e:
                return jsonify({
                    'status': 'error',
                    'message': str(e)
                }), 404

            # Create strategy instance
            try:
                # Check if the strategy requires a symbol parameter
                import inspect
                sig = inspect.signature(strategy_class.__init__)
                params = list(sig.parameters.keys())
                
                # Create the strategy instance with the appropriate parameters
                if 'symbol' in params:
                    strategy = strategy_class(
                        symbol=data['symbol'],
                        params=data.get('strategyParams', {})
                    )
                else:
                    # For strategies that don't require a symbol
                    strategy = strategy_class()
                    # Set parameters if the strategy has a set_parameters method
                    if hasattr(strategy, 'set_parameters') and callable(getattr(strategy, 'set_parameters')):
                        strategy.set_parameters(data.get('strategyParams', {}))
            except ValueError as e:
                return jsonify({
                    'status': 'error',
                    'message': f'Invalid strategy parameters: {str(e)}'
                }), 400

            # Run backtest
            try:
                results = run_backtest(
                    strategy=strategy,
                    start_date=data['startDate'],
                    end_date=data['endDate'],
                    optimize=data.get('optimize', False)
                )
                return jsonify({
                    'status': 'success',
                    'results': results
                })
            except Exception as e:
                logger.error(f"Error running backtest: {str(e)}", exc_info=True)
                return jsonify({
                    'status': 'error',
                    'message': f'Backtest error: {str(e)}'
                }), 500

        except Exception as e:
            logger.error(f"Error handling backtest request: {str(e)}", exc_info=True)
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 500

    @app.route('/api/strategies', methods=['GET'])
    def list_strategies():
        try:
            logger.info("Getting available strategies...")
            strategies = StrategyRegistry.list_strategies()
            logger.info(f"Found strategies: {list(strategies.keys())}")
            
            # Create a simplified list of strategies
            strategy_list = []
            for name, strategy_class in strategies.items():
                logger.info(f"Processing strategy: {name}")
                
                # Create a basic strategy info object
                strategy_info = {
                    'name': name,
                    'description': strategy_class.__doc__ or f'Implementation of {name}',
                    'parameters': {}
                }
                
                # Add default parameters based on strategy type
                if name == 'HedgingStrategy':
                    strategy_info['parameters'] = {
                        'hedge_threshold': {
                            'type': 'float',
                            'default': 0.02,
                            'description': 'Price movement threshold to trigger hedge',
                            'range': {'min': 0.01, 'max': 0.05, 'step': 0.005}
                        },
                        'risk_factor': {
                            'type': 'float',
                            'default': 1.0,
                            'description': 'Risk adjustment factor for hedge positions',
                            'range': {'min': 0.5, 'max': 2.0, 'step': 0.1}
                        },
                        'correlation_window': {
                            'type': 'int',
                            'default': 20,
                            'description': 'Window for calculating correlations',
                            'range': {'min': 10, 'max': 50, 'step': 5}
                        },
                        'volatility_window': {
                            'type': 'int',
                            'default': 14,
                            'description': 'Window for calculating volatility',
                            'range': {'min': 7, 'max': 21, 'step': 1}
                        },
                        'min_hedge_ratio': {
                            'type': 'float',
                            'default': 0.5,
                            'description': 'Minimum hedge ratio',
                            'range': {'min': 0.1, 'max': 1.0, 'step': 0.1}
                        },
                        'max_hedge_ratio': {
                            'type': 'float',
                            'default': 2.0,
                            'description': 'Maximum hedge ratio',
                            'range': {'min': 1.0, 'max': 5.0, 'step': 0.5}
                        }
                    }
                elif name == 'GridHedgeStrategy':
                    # Create an instance to get actual parameters
                    try:
                        grid_hedge_strategy = strategy_class(symbol="BTCUSDT")
                        actual_params = grid_hedge_strategy.get_parameters()
                        logger.debug(f"Actual GridHedgeStrategy parameters: {actual_params}")
                        
                        # Parameter display mappings for frontend
                        strategy_info['parameters'] = {
                            'grid_levels': {
                                'type': 'int',
                                'default': actual_params.get('grid_levels', 5),
                                'description': 'Number of grid levels',
                                'range': {'min': 3, 'max': 10, 'step': 1}
                            },
                            'grid_spacing': {
                                'type': 'float',
                                'default': actual_params.get('grid_spacing', 0.01),
                                'description': 'Price spacing between grid levels',
                                'range': {'min': 0.005, 'max': 0.02, 'step': 0.001}
                            },
                            'position_size': {
                                'type': 'float',
                                'default': actual_params.get('position_size', 0.1),
                                'description': 'Base position size as fraction of balance',
                                'range': {'min': 0.05, 'max': 0.2, 'step': 0.01}
                            },
                            'min_profit': {
                                'type': 'float',
                                'default': actual_params.get('min_profit', 0.005),
                                'description': 'Minimum profit threshold for grid hedge strategy',
                                'range': {'min': 0.001, 'max': 0.01, 'step': 0.001}
                            }
                        }
                    except Exception as e:
                        logger.error(f"Error creating GridHedgeStrategy instance: {str(e)}")
                        # Fallback to default values
                        strategy_info['parameters'] = {
                            'grid_levels': {
                                'type': 'int',
                                'default': 5,
                                'description': 'Number of grid levels',
                                'range': {'min': 3, 'max': 10, 'step': 1}
                            },
                            'grid_spacing': {
                                'type': 'float',
                                'default': 0.01,
                                'description': 'Price spacing between grid levels',
                                'range': {'min': 0.005, 'max': 0.02, 'step': 0.001}
                            },
                            'position_size': {
                                'type': 'float',
                                'default': 0.1,
                                'description': 'Base position size as fraction of balance',
                                'range': {'min': 0.05, 'max': 0.2, 'step': 0.01}
                            },
                            'min_profit': {
                                'type': 'float',
                                'default': 0.005,
                                'description': 'Minimum profit threshold for grid hedge strategy',
                                'range': {'min': 0.001, 'max': 0.01, 'step': 0.001}
                            }
                        }
                elif name == 'GridStrategy':
                    # Create an instance to get actual parameters
                    try:
                        grid_strategy = strategy_class(symbol="BTCUSDT")
                        actual_params = grid_strategy.get_parameters()
                        logger.debug(f"Actual GridStrategy parameters: {actual_params}")
                        
                        # Parameter display mappings for frontend
                        strategy_info['parameters'] = {
                            'grid_size': {
                                'type': 'int',
                                'default': actual_params.get('grid_size', 5),
                                'description': 'Number of grid levels',
                                'range': {'min': 3, 'max': 10, 'step': 1}
                            },
                            'grid_spacing': {
                                'type': 'float',
                                'default': actual_params.get('grid_spacing', 0.01),
                                'description': 'Price spacing between grid levels',
                                'range': {'min': 0.005, 'max': 0.02, 'step': 0.001}
                            }
                        }
                    except Exception as e:
                        logger.error(f"Error creating GridStrategy instance: {str(e)}")
                        # Fallback to default values
                        strategy_info['parameters'] = {
                            'grid_size': {
                                'type': 'int',
                                'default': 5,
                                'description': 'Number of grid levels',
                                'range': {'min': 3, 'max': 10, 'step': 1}
                            },
                            'grid_spacing': {
                                'type': 'float',
                                'default': 0.01,
                                'description': 'Price spacing between grid levels',
                                'range': {'min': 0.005, 'max': 0.02, 'step': 0.001}
                            }
                        }
                elif name == 'BollingerBreakoutStrategy':
                    strategy_info['parameters'] = {
                        'bb_period': {
                            'type': 'int',
                            'default': 20,
                            'description': 'Bollinger Bands period',
                            'range': {'min': 10, 'max': 50, 'step': 5}
                        },
                        'bb_std': {
                            'type': 'float',
                            'default': 2.0,
                            'description': 'Bollinger Bands standard deviation',
                            'range': {'min': 1.0, 'max': 3.0, 'step': 0.1}
                        }
                    }
                
                strategy_list.append(strategy_info)
                logger.info(f"Successfully processed strategy: {name}")
            
            logger.info(f"Returning {len(strategy_list)} strategies")
            return jsonify({
                'status': 'success',
                'strategies': strategy_list
            })
        except Exception as e:
            logger.error(f"Error listing strategies: {str(e)}", exc_info=True)
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 500

    @app.route('/api/strategies/update', methods=['POST'])
    def update_strategy_parameters():
        try:
            data = request.json
            logger.debug(f"Updating strategy parameters: {data}")
            
            if not data or 'strategyName' not in data or 'parameters' not in data:
                logger.error("Missing required fields in request")
                return jsonify({
                    'status': 'error',
                    'message': 'Missing required fields: strategyName and parameters'
                }), 400
            
            strategy_name = data['strategyName']
            parameters = data['parameters']
            
            try:
                # Get the strategy class
                strategy_class = StrategyRegistry.get_strategy(strategy_name)
                logger.debug(f"Found strategy class: {strategy_class.__name__}")
                
                # Special handling for strategies with complex inheritance
                if strategy_name == 'HedgingStrategy':
                    # Create a temporary instance with correct parameters
                    # First, get default parameters from class to ensure we have all required ones
                    params = {
                        'hedge_threshold': 0.02,
                        'risk_factor': 1.0,
                        'correlation_window': 20,
                        'volatility_window': 14,
                        'min_hedge_ratio': 0.5,
                        'max_hedge_ratio': 2.0,
                        'hedge_ratio': 1.0,
                        'min_spread': 0.001,
                        'max_spread': 0.05,
                        'take_profit': 0.02,
                        'stop_loss': 0.01
                    }
                    # Update with provided parameters
                    params.update(parameters)
                    temp_strategy = strategy_class(symbol="BTCUSDT", params=params)
                    logger.debug(f"Created HedgingStrategy instance with parameters: {params}")
                elif strategy_name == 'GridHedgeStrategy':
                    # Create a temporary instance with correct parameters
                    # First, get default parameters from class to ensure we have all required ones
                    params = {
                        'grid_levels': 5,
                        'grid_spacing': 0.01,
                        'position_size': 0.1,
                        'min_profit': 0.005,
                        # Adding base class parameters that might be required
                        'hedge_ratio': 1.0,
                        'min_spread': 0.001,
                        'max_spread': 0.05,
                        'take_profit': 0.02,
                        'stop_loss': 0.01
                    }
                    # Update with provided parameters
                    params.update(parameters)
                    temp_strategy = strategy_class(symbol="BTCUSDT", params=params)
                    logger.debug(f"Created GridHedgeStrategy instance with parameters: {params}")
                else:
                    # Create a temporary instance to validate parameters
                    try:
                        # If the strategy requires a symbol parameter, provide a default one
                        temp_strategy = strategy_class(symbol="BTCUSDT")
                        logger.debug(f"Created temp strategy instance with symbol")
                    except TypeError:
                        # If symbol is not accepted, create without it
                        temp_strategy = strategy_class()
                        logger.debug(f"Created temp strategy instance without symbol")
                
                # Get current parameters
                current_params = temp_strategy.get_parameters()
                logger.debug(f"Current parameters: {current_params}")
                
                # Parameter name mappings for backward compatibility
                parameter_mappings = {
                    'grid_levels': 'grid_size',
                }
                
                # Create a copy of parameters with mapped names
                mapped_parameters = {}
                for param_name, value in parameters.items():
                    # If a mapping exists, use the mapped name instead
                    mapped_name = parameter_mappings.get(param_name, param_name)
                    mapped_parameters[mapped_name] = value
                    logger.debug(f"Mapped parameter: {param_name} -> {mapped_name}")
                
                # Check if parameters exist after mapping
                for param_name in mapped_parameters.keys():
                    if param_name not in current_params and strategy_name not in ['HedgingStrategy', 'GridHedgeStrategy']:  # Skip validation for special cases
                        logger.error(f"Unknown parameter: {param_name}")
                        return jsonify({
                            'status': 'error',
                            'message': f'Unknown parameter: {param_name}'
                        }), 400
                
                # Update the default parameters in the strategy class
                if hasattr(strategy_class, 'default_parameters'):
                    logger.debug(f"Updating default_parameters in class")
                    for param_name, value in mapped_parameters.items():
                        strategy_class.default_parameters[param_name] = value
                        logger.debug(f"Updated {param_name} = {value}")
                else:
                    # If the strategy doesn't have default_parameters, create it
                    logger.debug(f"Creating default_parameters for class")
                    strategy_class.default_parameters = current_params.copy()
                    for param_name, value in mapped_parameters.items():
                        strategy_class.default_parameters[param_name] = value
                        logger.debug(f"Set {param_name} = {value}")
                
                logger.info(f"Successfully updated parameters for strategy: {strategy_name}")
                return jsonify({
                    'status': 'success',
                    'message': f'Parameters for {strategy_name} updated successfully',
                    'updatedParameters': strategy_class.default_parameters
                })
                
            except ValueError as e:
                logger.error(f"Error updating strategy parameters: {str(e)}")
                return jsonify({
                    'status': 'error',
                    'message': str(e)
                }), 400  # Change to 400 instead of 404 for validation errors
                
        except Exception as e:
            logger.error(f"Error updating strategy parameters: {str(e)}", exc_info=True)
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 500

    @app.route('/api/settings/<category>', methods=['GET', 'POST'])
    def handle_settings(category):
        """Handle settings for specific categories."""
        try:
            if category not in SETTINGS_SCHEMA:
                return jsonify({
                    'status': 'error',
                    'message': f'Invalid settings category: {category}'
                }), 400

            if request.method == 'GET':
                settings = config.get(category, {})
                return jsonify({
                    'status': 'success',
                    'settings': settings,
                    'allowed_fields': SETTINGS_SCHEMA[category]
                })
            
            new_settings = request.json
            # Validate that only allowed fields are being set
            invalid_fields = [field for field in new_settings if field not in SETTINGS_SCHEMA[category]]
            if invalid_fields:
                return jsonify({
                    'status': 'error',
                    'message': f'Invalid fields for {category}: {", ".join(invalid_fields)}'
                }), 400

            if category not in config:
                config[category] = {}
            config[category].update(new_settings)
            save_config(config)
            
            return jsonify({
                'status': 'success',
                'message': f'{category.capitalize()} settings saved successfully'
            })
        except Exception as e:
            logger.error(f"Error handling {category} settings: {str(e)}", exc_info=True)
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 500

    @app.route('/api/backtest/settings', methods=['GET', 'POST'])
    def handle_backtest_settings():
        """Handle backtest-specific settings."""
        try:
            if request.method == 'GET':
                backtest_settings = config.get('backtest', {})
                strategies = StrategyRegistry.list_strategies()
                
                strategy_info = []
                for name, strategy_class in strategies.items():
                    try:
                        logger.info(f"Processing strategy for backtest: {name}")
                        
                        # Create a basic strategy info object
                        strategy_info_obj = {
                            'name': name,
                            'description': strategy_class.__doc__ or f'Implementation of {name}',
                            'parameters': {},
                            'parameter_ranges': {}
                        }
                        
                        # Try to get parameters from class or instance
                        try:
                            # Check if the strategy requires a symbol parameter
                            import inspect
                            sig = inspect.signature(strategy_class.__init__)
                            params = list(sig.parameters.keys())
                            
                            # If the strategy requires a symbol parameter, provide a default one
                            if 'symbol' in params:
                                try:
                                    temp_strategy = strategy_class(symbol='BTC/USDT')
                                    strategy_info_obj['parameters'] = temp_strategy.get_parameters()
                                    strategy_info_obj['parameter_ranges'] = temp_strategy.get_parameter_ranges()
                                except Exception as e:
                                    logger.warning(f"Could not instantiate {name} with symbol: {str(e)}")
                                    # Use default parameters from the API endpoint
                                    if name == 'HedgingStrategy':
                                        strategy_info_obj['parameters'] = {
                                            'hedge_threshold': 0.02,
                                            'risk_factor': 1.0,
                                            'correlation_window': 20,
                                            'volatility_window': 14,
                                            'min_hedge_ratio': 0.5,
                                            'max_hedge_ratio': 2.0
                                        }
                                    elif name == 'GridHedgeStrategy':
                                        strategy_info_obj['parameters'] = {
                                            'grid_levels': 5,
                                            'grid_spacing': 0.01,
                                            'position_size': 0.1,
                                            'min_profit': 0.005
                                        }
                            else:
                                # For strategies that don't require a symbol
                                try:
                                    temp_strategy = strategy_class()
                                    if hasattr(temp_strategy, 'get_parameters'):
                                        strategy_info_obj['parameters'] = temp_strategy.get_parameters()
                                    if hasattr(temp_strategy, 'get_parameter_ranges'):
                                        strategy_info_obj['parameter_ranges'] = temp_strategy.get_parameter_ranges()
                                except Exception as e:
                                    logger.warning(f"Could not instantiate {name}: {str(e)}")
                        except Exception as e:
                            logger.warning(f"Error getting parameters for {name}: {str(e)}")
                        
                        strategy_info.append(strategy_info_obj)
                        logger.info(f"Successfully processed strategy for backtest: {name}")
                    except Exception as e:
                        logger.error(f"Error processing strategy {name} for backtest settings: {str(e)}", exc_info=True)
                
                return jsonify({
                    'status': 'success',
                    'settings': backtest_settings,
                    'strategies': strategy_info
                })
            
            new_settings = request.json
            if 'backtest' not in config:
                config['backtest'] = {}
            config['backtest'].update(new_settings)
            save_config(config)
            
            return jsonify({
                'status': 'success',
                'message': 'Backtest settings saved successfully'
            })
        except Exception as e:
            logger.error(f"Error handling backtest settings: {str(e)}", exc_info=True)
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 500
    
    return app

if __name__ == '__main__':
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Start the trading bot server')
    parser.add_argument('--port', type=int, default=5002, help='Port to run the server on')
    args = parser.parse_args()
    
    app = create_app()
    logger.info(f"Starting Flask application on port {args.port}...")
    app.run(host='127.0.0.1', port=args.port, debug=True) 
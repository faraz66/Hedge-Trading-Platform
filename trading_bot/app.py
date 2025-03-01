import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from .core.strategy import StrategyRegistry
from .strategies.grid_strategy import GridStrategy
from .strategies.bollinger_breakout_strategy import BollingerBreakoutStrategy
from .backtesting import run_backtest
from .config import load_config, save_config

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
    if GridStrategy not in StrategyRegistry._strategies.values():
        StrategyRegistry.register(GridStrategy)
    if BollingerBreakoutStrategy not in StrategyRegistry._strategies.values():
        StrategyRegistry.register(BollingerBreakoutStrategy)
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
                strategy = strategy_class(
                    symbol=data['symbol'],
                    params=data.get('strategyParams', {})
                )
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
            logger.debug("Getting available strategies...")
            strategies = StrategyRegistry.list_strategies()
            logger.debug(f"Found strategies: {list(strategies.keys())}")
            
            strategy_list = []
            for name, strategy_class in strategies.items():
                logger.debug(f"Processing strategy: {name}")
                try:
                    # Create a temporary instance to get parameter ranges
                    logger.debug(f"Creating instance of {name}")
                    temp_strategy = strategy_class()
                    logger.debug(f"Getting parameter ranges for {name}")
                    param_ranges = temp_strategy.get_parameter_ranges()
                    logger.debug(f"Parameter ranges for {name}: {param_ranges}")
                    
                    strategy_info = {
                        'name': name,
                        'description': strategy_class.__doc__ or f'Implementation of {name}',
                        'parameters': {
                            param_name: {
                                'type': 'float' if isinstance(value, float) else 'int',
                                'default': value,
                                'description': param_ranges[param_name].get('description', f'{param_name} parameter'),
                                'range': {
                                    'min': param_ranges[param_name]['min'],
                                    'max': param_ranges[param_name]['max'],
                                    'step': param_ranges[param_name].get('step', 1 if isinstance(value, int) else 0.1)
                                }
                            }
                            for param_name, value in strategy_class.default_parameters.items()
                        }
                    }
                    strategy_list.append(strategy_info)
                    logger.debug(f"Successfully processed strategy: {name}")
                except Exception as e:
                    logger.error(f"Error processing strategy {name}: {str(e)}", exc_info=True)
            
            logger.debug(f"Returning {len(strategy_list)} strategies")
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
                
                # Create a temporary instance to validate parameters
                temp_strategy = strategy_class()
                param_ranges = temp_strategy.get_parameter_ranges()
                
                # Validate parameters against ranges - REMOVED validation
                for param_name, value in parameters.items():
                    if param_name not in temp_strategy.get_parameters():
                        return jsonify({
                            'status': 'error',
                            'message': f'Unknown parameter: {param_name}'
                        }), 400
                    
                    # No range validation - accept any value
                
                # Update the default parameters in the strategy class
                for param_name, value in parameters.items():
                    strategy_class.default_parameters[param_name] = value
                
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
                }), 404
                
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
                
                return jsonify({
                    'status': 'success',
                    'settings': backtest_settings,
                    'strategies': [
                        {
                            'name': name,
                            'description': strategy_class.description if hasattr(strategy_class, 'description') else '',
                            'parameters': strategy_class.default_parameters if hasattr(strategy_class, 'default_parameters') else {},
                            'parameter_ranges': strategy_class.get_parameter_ranges() if hasattr(strategy_class, 'get_parameter_ranges') else {}
                        }
                        for name, strategy_class in strategies.items()
                    ]
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
    app = create_app()
    logger.info("Starting Flask application...")
    app.run(host='127.0.0.1', port=5002, debug=True) 
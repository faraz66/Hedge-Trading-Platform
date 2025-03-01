from flask import Blueprint, request, jsonify, send_file, make_response
from ..core.backtester import Backtester
from ..core.strategy import StrategyRegistry, BaseStrategy
from ..data.fetcher import load_historical_data
from ..visualization.charts import create_enhanced_charts
import logging
import pandas as pd
import io
from datetime import datetime
import os
import importlib
import inspect

# Configure logging
logger = logging.getLogger(__name__)
api = Blueprint('api', __name__)

@api.route('/run_backtest', methods=['POST', 'OPTIONS'])
def run_backtest():
    """Run backtest with selected strategy"""
    logger.debug('Received request for /run_backtest')
    logger.debug('Request headers: %s', dict(request.headers))
    
    # Handle preflight request
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No data provided'
            }), 400
            
        logger.debug('Request data: %s', data)
        
        # Extract parameters
        symbol = data.get('tradingPair')
        start_date = data.get('startDate')
        end_date = data.get('endDate')
        optimize = data.get('optimizeStrategy', False)
        strategy_name = data.get('strategyName')
        strategy_params = data.get('strategyParams', {})
        
        logger.debug('Parameters: symbol=%s, start_date=%s, end_date=%s, optimize=%s, strategy=%s',
                    symbol, start_date, end_date, optimize, strategy_name)
        
        # Validate required parameters
        if not all([symbol, start_date, strategy_name]):
            missing = []
            if not symbol: missing.append('tradingPair')
            if not start_date: missing.append('startDate')
            if not strategy_name: missing.append('strategyName')
            
            return jsonify({
                'status': 'error',
                'message': f'Missing required parameters: {", ".join(missing)}'
            }), 400
        
        # Load historical data
        historical_data = load_historical_data(symbol, start_date, end_date)
        
        # Initialize backtester with strategy
        backtester = Backtester(
            symbol=symbol,
            initial_capital=100000.0,
            strategy_name=strategy_name,
            strategy_params=strategy_params
        )
        
        # Run backtest
        results = backtester.run_backtest(historical_data, optimize=optimize)
        
        # Create visualization data
        charts_data = create_enhanced_charts(historical_data, results)
        
        response_data = {
            'status': 'success',
            'results': {
                'metrics': results['metrics'],
                'trades': results['trades'],
                'historical_data': charts_data['historical_data'],
                'indicators': charts_data['indicators'],
                'equity_curve': charts_data['equity_curve']
            }
        }
        
        logger.debug('Sending response')
        return jsonify(response_data)
        
    except Exception as e:
        logger.exception('Error in backtest: %s', str(e))
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@api.route('/strategies', methods=['GET', 'OPTIONS'])
def list_strategies():
    """Get list of available strategies"""
    try:
        registered_strategies = StrategyRegistry.list_strategies()
        logger.info(f"Listed {len(registered_strategies)} registered strategies: {registered_strategies}")
        
        strategies = []
        for strategy_name in registered_strategies:
            try:
                logger.debug(f"Processing strategy: {strategy_name}")
                
                # Get the strategy class
                strategy_class = StrategyRegistry.get_strategy(strategy_name)
                logger.debug(f"Retrieved strategy class: {strategy_class}")
                
                # Create an instance with default parameters
                default_params = {}
                if hasattr(strategy_class, 'default_parameters'):
                    default_params = strategy_class.default_parameters
                
                strategy_instance = strategy_class(symbol='BTCUSDT', params=default_params)
                logger.debug(f"Created strategy instance for {strategy_name}")
                
                # Get default parameters and parameter ranges
                param_ranges = strategy_instance.get_parameter_ranges()
                
                logger.debug(f"Got parameters for {strategy_name}: {default_params}")
                logger.debug(f"Got parameter ranges for {strategy_name}: {param_ranges}")
                
                strategy_info = {
                    'name': strategy_name,
                    'description': strategy_class.__doc__ or "No description available",
                    'parameters': {
                        name: {
                            'type': 'float' if isinstance(value, float) else 'int',
                            'default': value,
                            'description': f"{name} parameter",
                            'range': param_ranges.get(name, {})
                        }
                        for name, value in default_params.items()
                    }
                }
                
                strategies.append(strategy_info)
                
            except Exception as e:
                logger.error(f"Error processing strategy {strategy_name}: {str(e)}")
                continue
        
        return jsonify({
            'status': 'success',
            'strategies': strategies
        })
        
    except Exception as e:
        logger.error(f"Error listing strategies: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@api.route('/strategy_params/<strategy_name>', methods=['GET', 'OPTIONS'])
def get_strategy_params(strategy_name):
    """Get parameters for a specific strategy."""
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        strategy = StrategyRegistry.get_strategy(strategy_name)
        return jsonify({
            'status': 'success',
            'parameters': strategy.get_parameters()
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400

@api.route('/export_results', methods=['POST', 'OPTIONS'])
def export_results():
    """Export backtest results to Excel"""
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        data = request.json
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No data provided for export'
            }), 400
        
        # Create Excel writer
        output = io.BytesIO()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f'backtest_results_{timestamp}.xlsx'
        
        with pd.ExcelWriter(output, engine='xlsxwriter', mode='binary') as writer:
            # Write metrics
            if 'metrics' in data:
                pd.DataFrame([data['metrics']]).to_excel(
                    writer, sheet_name='Metrics', index=False
                )
            
            # Write trades
            if 'trades' in data and data['trades']:
                trades_df = pd.DataFrame(data['trades'])
                trades_df.to_excel(writer, sheet_name='Trades', index=False)
            
            # Write strategy parameters
            if 'strategy_params' in data and data['strategy_params']:
                pd.DataFrame([data['strategy_params']]).to_excel(
                    writer, sheet_name='Strategy Parameters', index=False
                )
        
        # Reset buffer position
        output.seek(0)
        
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        logger.error('Error exporting results: %s', str(e))
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500 
"""Flask application entry point."""
from flask import Flask
from flask_cors import CORS
from trading_bot.api.routes import api
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Import strategies to ensure they are registered
from trading_bot.strategies import GridStrategy, BollingerBreakoutStrategy
from trading_bot.core.strategy import StrategyRegistry

# Log registered strategies
logger.info("Registered strategies: %s", StrategyRegistry.list_strategies())

# Register blueprints
app.register_blueprint(api, url_prefix='/api')

if __name__ == '__main__':
    app.run(port=5002, debug=True) 
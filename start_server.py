#!/usr/bin/env python
"""
Start the HedgeBot server
"""
import os
import sys

# Ensure the current directory is in the Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from trading_bot.app import create_app

if __name__ == "__main__":
    app = create_app()
    app.run(host='127.0.0.1', port=5002, debug=True) 
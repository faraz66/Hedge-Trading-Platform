import os
import json
from pathlib import Path

CONFIG_FILE = Path(__file__).parent / 'settings.json'

def load_config():
    """Load configuration from the settings file."""
    if not CONFIG_FILE.exists():
        default_config = {
            'activeStrategy': None,
            'apiKey': '',
            'apiSecret': '',
            'defaultTradingAmount': 100
        }
        save_config(default_config)
        return default_config
    
    try:
        with open(CONFIG_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading config: {e}")
        return {}

def save_config(config):
    """Save configuration to the settings file."""
    try:
        # Ensure the directory exists
        CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
        
        # Write the config
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=2)
    except Exception as e:
        print(f"Error saving config: {e}")
        raise 
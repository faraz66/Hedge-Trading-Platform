from setuptools import setup, find_packages

# Base requirements
install_requires = [
    "pandas>=1.3.0",
    "numpy>=1.20.0",
    "pytz",
    "MetaTrader5",  # Using official MetaTrader5 package instead of pymt5
    "python-dateutil>=2.8.2",
    "ccxt>=3.0.0",  # Using ccxt for crypto exchange integration
    "flask>=2.0.0",
    "flask-cors>=3.0.0",  # CORS support for Flask
    "plotly>=5.0.0",
    "dash>=2.0.0",
    "ta>=0.10.0",  # Technical analysis indicators
    "xlsxwriter>=3.0.0",  # Excel export
    "openpyxl>=3.0.0",  # Excel support
    "scikit-learn>=1.0.0",  # For optimization
    "nest-asyncio>=1.5.6",  # For handling nested event loops
]

setup(
    name="trading_bot",
    version="0.1.0",
    packages=find_packages(),
    install_requires=install_requires,
    extras_require={
        "dev": [
            "pytest>=6.0",
            "black>=21.0",
            "flake8>=3.9.0",
        ],
    },
    author="Faraz Shaikh",
    author_email="farazshaikh66@gmail.com",
    description="A trading bot with MT5 integration",
    keywords="trading, mt5, algorithmic trading",
    python_requires=">=3.7",
) 
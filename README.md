# HedgeBot

A cryptocurrency trading bot with customizable strategies and backtesting capabilities.

## Features

- Multiple trading strategies (Grid Trading, Bollinger Bands)
- Real-time market data integration
- Strategy backtesting
- Web-based dashboard
- Parameter optimization
- Paper trading support

## Directory Structure

```
hedgebot/
├── docs/                    # Documentation
│   └── strategies/         # Trading strategy documentation
├── scripts/                # Utility scripts
├── src/                    # Frontend React application
│   ├── components/        # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── layouts/          # Page layouts
│   ├── pages/           # Page components
│   ├── services/        # API services
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── trading_bot/           # Backend Python application
│   ├── api/             # API endpoints
│   ├── core/            # Core trading logic
│   ├── strategies/      # Trading strategies
│   ├── backtesting/    # Backtesting engine
│   └── exchange/       # Exchange integrations
└── config/              # Environment configurations
```

## Prerequisites

- Python 3.8+
- Node.js 16+
- npm 7+

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/hedgebot.git
   cd hedgebot
   ```

2. Install Python dependencies:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Install Node.js dependencies:
   ```bash
   npm install
   ```

4. Create a `.env` file:
   ```
   EXCHANGE_API_KEY=your_api_key
   EXCHANGE_SECRET_KEY=your_secret_key
   ```

## Running the Application

Start both backend and frontend:
```bash
npm run start
```

Or start them separately:
```bash
# Backend
npm run start:backend

# Frontend
npm run start:frontend
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5002

## Development

- Run tests: `npm test`
- Format code: `npm run format`
- Lint code: `npm run lint`
- Clean build files: `npm run clean`

## Configuration

- Development configuration: `config/development/config.json`
- Production configuration: `config/production/config.json`

## Trading Strategies

See the `docs/strategies` directory for detailed documentation on each trading strategy:
- Grid Trading Strategy
- Bollinger Bands Strategy

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

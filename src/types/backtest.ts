export interface StrategyParameter {
  type: 'float' | 'int';
  description: string;
  default: number;
  min: number;
  max: number;
}

export interface Strategy {
  name: string;
  description: string;
  parameters: Record<string, StrategyParameter>;
}

export interface BacktestFormData {
  strategyName: string;
  tradingPair: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  optimize: boolean;
  strategyParams: Record<string, number>;
  assetSymbol?: string;
}

export interface Trade {
  timestamp: string;
  type: 'BUY' | 'SELL';
  price: number;
  size: number;
  profit?: number;
  commission?: number;
  exit_timestamp?: string;
  runup?: number;  // Maximum potential profit during the trade
  drawdown?: number;  // Maximum drawdown experienced during the trade
}

export interface Price {
  timestamp: string;
  close: number;
}

export interface BacktestMetrics {
  // Returns & Performance
  total_return: number;          // Total percentage return of the strategy
  annualized_return: number;     // Return annualized to yearly basis
  daily_return: number;          // Average daily return
  best_day: number;              // Best single day return
  worst_day: number;            // Worst single day return
  monthly_returns: number[];    // Array of monthly returns
  benchmark_return: number;     // Benchmark total return for comparison
  excess_return: number;        // Return above benchmark
  
  // Risk Metrics
  sharpe_ratio: number;         // Risk-adjusted return relative to risk-free rate
  sortino_ratio: number;        // Risk-adjusted return focusing on downside volatility
  max_drawdown: number;         // Maximum peak to trough decline
  volatility: number;           // Annual price volatility
  beta: number;                 // Market correlation coefficient
  alpha: number;                // Excess return compared to benchmark
  var_95: number;               // 95% Value at Risk
  expected_shortfall: number;   // Expected loss beyond VaR
  treynor_ratio: number;        // Return per unit of systematic risk
  
  // Trade Statistics
  total_trades: number;         // Total number of trades executed
  win_rate: number;             // Percentage of profitable trades
  profit_factor: number;        // Gross profits divided by gross losses
  avg_trade: number;            // Average profit/loss per trade
  largest_win: number;          // Largest profitable trade
  largest_loss: number;         // Largest losing trade
  avg_win: number;              // Average winning trade
  avg_loss: number;             // Average losing trade
  win_loss_ratio: number;       // Ratio of average win to average loss
  
  // Market Analysis
  trading_days: number;         // Number of days in backtest period
  avg_hold_time: number;        // Average position holding time in hours
  time_in_market: number;       // Percentage of time with open positions
  recovery_factor: number;      // Net profit divided by max drawdown
  calmar_ratio: number;         // Annual return divided by max drawdown
  
  // Hedging Specific
  hedge_effectiveness: number;   // Correlation between portfolio and hedge
  hedge_ratio: number;          // Optimal hedge ratio
  tracking_error: number;       // Standard deviation of return differences
  information_ratio: number;    // Risk-adjusted excess returns vs benchmark
  pair_correlation: number;     // Correlation between trading pairs
  spread_volatility: number;    // Volatility of the price spread
  mean_reversion_speed: number; // Speed of price convergence
  basis_risk: number;          // Risk from imperfect hedging correlation
  
  // Advanced Hedging Metrics
  cross_hedge_ratio: number;    // Hedge ratio for cross-hedging
  hedge_slippage: number;       // Average slippage in hedge execution
  correlation_stability: number; // Stability of hedge correlation over time
  margin_utilization: number;   // Percentage of margin used for hedging
  delta_exposure: number;       // Net delta exposure after hedging
  gamma_exposure: number;       // Net gamma exposure
  vega_exposure: number;        // Net vega exposure
  theta_decay: number;          // Time decay effect on hedge
  roll_yield: number;          // Yield from rolling futures contracts
  hedge_cost_ratio: number;    // Cost of hedging as percentage of returns
  
  // Benchmark Comparison
  benchmark_volatility: number; // Volatility of benchmark returns
  benchmark_beta: number;       // Beta relative to broader market
  benchmark_correlation: number; // Correlation with benchmark
  tracking_difference: number;  // Average return difference vs benchmark
  active_return: number;       // Return from active management
  active_risk: number;         // Risk from active management
  up_capture: number;          // Upside capture ratio
  down_capture: number;        // Downside capture ratio
  
  // Risk-Adjusted Metrics
  omega_ratio: number;         // Probability weighted ratio of gains vs losses
  kappa_three: number;         // Modification of omega with focus on tail risk
  gain_to_pain_ratio: number;  // Sum of returns over sum of losses
  ulcer_index: number;         // Measure of downside risk
  sterling_ratio: number;      // Risk-adjusted return using average drawdown
  burke_ratio: number;         // Risk-adjusted return using drawdowns squared
}

export interface BacktestResults {
  prices: Price[];
  trades: Trade[];
  metrics: BacktestMetrics;
  timeframe?: string;
}

export interface ChartPoint {
  x: Date;
  y: number;
  type?: 'BUY' | 'SELL';
} 
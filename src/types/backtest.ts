export interface StrategyParameter {
  type: 'float' | 'int';
  default: number;
  description: string;
  range: {
    min: number;
    max: number;
    step: number;
    description?: string;
  };
}

export interface Strategy {
  name: string;
  description: string;
  parameters: Record<string, StrategyParameter>;
}

export interface BacktestFormData {
  strategyName: string;
  tradingPair: string;
  startDate: string;
  endDate: string;
  optimize: boolean;
  strategyParams: Record<string, number>;
}

export interface Trade {
  timestamp: string;
  type: 'BUY' | 'SELL';
  price: number;
  size: number;
  profit?: number;
}

export interface Price {
  timestamp: string;
  close: number;
}

export interface BacktestResults {
  prices: Price[];
  trades: Trade[];
  metrics: {
    total_return: number;
    sharpe_ratio: number;
    max_drawdown: number;
    win_rate: number;
    total_trades: number;
  };
}

export interface ChartPoint {
  x: Date;
  y: number;
  type?: 'BUY' | 'SELL';
} 
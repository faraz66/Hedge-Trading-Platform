export interface Strategy {
  name: string;
  description: string;
  parameters: {
    [key: string]: {
      type: string;
      description: string;
      default: number;
      min?: number;
      max?: number;
    };
  };
}

export interface StrategyParameters {
  [key: string]: number;
}

export interface BacktestResult {
  returns: number;
  trades: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
} 
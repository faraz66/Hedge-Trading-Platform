export const tradingPairs = [
  'BTC/USDT',
  'ETH/USDT',
  'BNB/USDT',
  'ADA/USDT',
  'DOGE/USDT',
  'XRP/USDT',
  'SOL/USDT',
  'DOT/USDT',
] as const;

export type TradingPair = typeof tradingPairs[number]; 
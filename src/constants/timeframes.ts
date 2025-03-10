/**
 * Available timeframes for backtesting in Binance format
 * 
 * Time units:
 * - m: minutes (1m, 3m, 5m, 15m, 30m)
 * - h: hours (1h, 2h, 4h, 6h, 8h, 12h)
 * - d: days (1d, 3d)
 * - w: weeks (1w)
 * - M: months (1M)
 */

export interface Timeframe {
  value: string;
  label: string;
  description: string;
  milliseconds: number;
}

export const timeframes: Timeframe[] = [
  { value: '1m', label: '1 Minute', description: 'One-minute candles', milliseconds: 60 * 1000 },
  { value: '3m', label: '3 Minutes', description: 'Three-minute candles', milliseconds: 3 * 60 * 1000 },
  { value: '5m', label: '5 Minutes', description: 'Five-minute candles', milliseconds: 5 * 60 * 1000 },
  { value: '15m', label: '15 Minutes', description: 'Fifteen-minute candles', milliseconds: 15 * 60 * 1000 },
  { value: '30m', label: '30 Minutes', description: 'Thirty-minute candles', milliseconds: 30 * 60 * 1000 },
  { value: '1h', label: '1 Hour', description: 'One-hour candles', milliseconds: 60 * 60 * 1000 },
  { value: '2h', label: '2 Hours', description: 'Two-hour candles', milliseconds: 2 * 60 * 60 * 1000 },
  { value: '4h', label: '4 Hours', description: 'Four-hour candles', milliseconds: 4 * 60 * 60 * 1000 },
  { value: '6h', label: '6 Hours', description: 'Six-hour candles', milliseconds: 6 * 60 * 60 * 1000 },
  { value: '8h', label: '8 Hours', description: 'Eight-hour candles', milliseconds: 8 * 60 * 60 * 1000 },
  { value: '12h', label: '12 Hours', description: 'Twelve-hour candles', milliseconds: 12 * 60 * 60 * 1000 },
  { value: '1d', label: '1 Day', description: 'Daily candles', milliseconds: 24 * 60 * 60 * 1000 },
  { value: '3d', label: '3 Days', description: 'Three-day candles', milliseconds: 3 * 24 * 60 * 60 * 1000 },
  { value: '1w', label: '1 Week', description: 'Weekly candles', milliseconds: 7 * 24 * 60 * 60 * 1000 },
  { value: '1M', label: '1 Month', description: 'Monthly candles', milliseconds: 30 * 24 * 60 * 60 * 1000 },
];

/**
 * Get a timeframe object by its value
 * @param value The timeframe value (e.g., '1m', '1h', '1d')
 * @returns The timeframe object or undefined if not found
 */
export function getTimeframeByValue(value: string): Timeframe | undefined {
  return timeframes.find(tf => tf.value === value);
}

/**
 * Get the milliseconds for a timeframe value
 * @param value The timeframe value (e.g., '1m', '1h', '1d')
 * @returns The milliseconds for the timeframe or 60000 (1 minute) if not found
 */
export function getTimeframeMilliseconds(value: string): number {
  const timeframe = getTimeframeByValue(value);
  return timeframe ? timeframe.milliseconds : 60000; // Default to 1 minute
}

export default timeframes; 
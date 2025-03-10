import { useState, useCallback } from 'react';
import type { Strategy, StrategyParameters, BacktestResult } from '../types';
import { strategyService } from '../services/api';

export function useStrategy() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);

  const fetchStrategies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await strategyService.getStrategies();
      if (response.success && response.data) {
        setStrategies(response.data);
      } else {
        setError(response.error || 'Failed to fetch strategies');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateParameters = useCallback(async (
    strategyName: string,
    parameters: StrategyParameters
  ) => {
    setLoading(true);
    setError(null);
    try {
      const response = await strategyService.updateStrategyParameters(strategyName, parameters);
      if (!response.success) {
        setError(response.error || 'Failed to update parameters');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const runBacktest = useCallback(async (
    strategyName: string,
    parameters: StrategyParameters
  ) => {
    setLoading(true);
    setError(null);
    try {
      const response = await strategyService.runBacktest(strategyName, parameters);
      if (response.success && response.data) {
        setBacktestResult(response.data);
      } else {
        setError(response.error || 'Failed to run backtest');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    strategies,
    selectedStrategy,
    loading,
    error,
    backtestResult,
    setSelectedStrategy,
    fetchStrategies,
    updateParameters,
    runBacktest
  };
} 
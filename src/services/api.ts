import axios from 'axios';
import type { Strategy, StrategyParameters, BacktestResult, ApiResponse } from '../types';

const API_BASE_URL = '/api';

export const strategyService = {
  async getStrategies(): Promise<ApiResponse<Strategy[]>> {
    try {
      const response = await axios.get(`${API_BASE_URL}/strategies`);
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch strategies'
      };
    }
  },

  async updateStrategyParameters(
    strategyName: string, 
    parameters: StrategyParameters
  ): Promise<ApiResponse<void>> {
    try {
      const response = await axios.post(`${API_BASE_URL}/strategies/${strategyName}/parameters`, {
        parameters
      });
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update parameters'
      };
    }
  },

  async runBacktest(
    strategyName: string,
    parameters: StrategyParameters
  ): Promise<ApiResponse<BacktestResult>> {
    try {
      const response = await axios.post(`${API_BASE_URL}/backtest/${strategyName}`, {
        parameters
      });
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to run backtest'
      };
    }
  }
}; 
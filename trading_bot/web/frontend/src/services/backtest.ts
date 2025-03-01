import api from '../config/api'
import { AxiosError } from 'axios'

interface BacktestParams {
  tradingPair: string
  startDate: string
  endDate: string
  optimizeStrategy: boolean
  strategyName: string
  strategyParams?: Record<string, any>
}

export async function runBacktest(params: BacktestParams) {
  try {
    console.log('Starting backtest with params:', params)
    
    // First try a preflight request
    try {
      await api.options('/run_backtest')
      console.log('Preflight request successful')
    } catch (error) {
      console.error('Preflight request failed:', error)
      throw error
    }
    
    // Make the actual request
    const response = await api.post('/run_backtest', params)
    console.log('Backtest API response:', response.data)
    
    if (response.data.status === 'error') {
      throw new Error(response.data.message || response.data.error)
    }
    
    return response.data.results
  } catch (error) {
    console.error('Backtest error:', error)
    
    if (error instanceof AxiosError) {
      if (error.response) {
        // Server responded with error
        const errorMessage = error.response.data?.message || error.response.data?.error || 'Server error'
        console.error('Server error details:', errorMessage)
        throw new Error(errorMessage)
      } else if (error.request) {
        // No response received
        throw new Error('No response from server. Please check if the server is running.')
      }
    }
    
    // Other errors
    throw error
  }
}

export async function getStrategyParams(strategyName: string) {
  try {
    const response = await api.get(`/strategy_params/${strategyName}`)
    if (response.data.status === 'error') {
      throw new Error(response.data.message)
    }
    return response.data
  } catch (error) {
    console.error('Strategy params error:', error)
    throw error
  }
}

export async function exportResults(data: any) {
  try {
    const response = await api.post('/export_results', data, {
      responseType: 'blob'
    })
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'backtest_results.xlsx')
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Export error:', error)
    throw error
  }
} 
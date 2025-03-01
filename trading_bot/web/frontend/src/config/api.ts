import axios, { AxiosError } from 'axios'

// Create a base axios instance with common configuration
const api = axios.create({
  baseURL: 'http://127.0.0.1:5002/',  // Updated to match Flask server port
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Log request details
    console.log('%c API Request:', 'color: #0066cc; font-weight: bold', {
      method: config.method?.toUpperCase(),
      url: config.url,
      headers: config.headers,
      data: config.data
    })
    return config
  },
  (error) => {
    console.error('%c Request Error:', 'color: #cc0000; font-weight: bold', error.message)
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log successful response
    console.log('%c API Response:', 'color: #00cc00; font-weight: bold', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data
    })
    return response
  },
  (error: AxiosError) => {
    if (error.response) {
      // Server responded with an error status
      console.error('%c Server Error:', 'color: #cc0000; font-weight: bold', {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data
      })
      
      if (error.response.status === 403) {
        console.error('%c CORS Error:', 'color: #cc0000; font-weight: bold', 'Check CORS configuration')
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('%c Network Error:', 'color: #cc0000; font-weight: bold', {
        request: error.request,
        message: error.message,
        config: error.config
      })
    } else {
      // Error in request setup
      console.error('%c Setup Error:', 'color: #cc0000; font-weight: bold', error.message)
    }
    
    return Promise.reject(error)
  }
)

// API endpoints
export const endpoints = {
  backtest: '/api/run_backtest',
  strategies: '/api/strategies',
  strategyParams: (name: string) => `/api/strategy_params/${name}`,
  exportResults: '/api/export_results'
}

export default api 
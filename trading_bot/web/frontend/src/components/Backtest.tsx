import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  Switch,
  Text,
  Select,
} from '@chakra-ui/react'
import { useThemeColors } from '../hooks/useThemeColors'
import { runBacktest } from '../services/backtest'
import api, { endpoints } from '../config/api'

interface StrategyParameter {
  type: string
  default: number
  description: string
}

interface Strategy {
  name: string
  description: string
  parameters: Record<string, StrategyParameter>
}

interface BacktestFormData {
  tradingPair: string
  startDate: string
  endDate: string
  optimizeStrategy: boolean
  strategyName: string
  strategyParams?: Record<string, any>
}

export const Backtest = () => {
  const colors = useThemeColors()
  const toast = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingStrategies, setIsLoadingStrategies] = useState(true)
  const [strategies, setStrategies] = useState<Strategy[]>([])
  
  const [formData, setFormData] = useState<BacktestFormData>({
    tradingPair: 'BTCUSDT',
    startDate: '2024-01-01',
    endDate: '2024-02-01',
    optimizeStrategy: false,
    strategyName: '',
    strategyParams: {}
  })

  useEffect(() => {
    // Load available strategies
    const loadStrategies = async () => {
      console.log('%c Starting to load strategies...', 'color: #0066cc; font-weight: bold')
      setIsLoadingStrategies(true)
      
      try {
        console.log('%c Making request to strategies endpoint...', 'color: #0066cc; font-weight: bold')
        console.log('%c Using API URL:', 'color: #0066cc; font-weight: bold', api.defaults.baseURL + endpoints.strategies)
        
        const response = await api.get(endpoints.strategies)
        console.log('%c Received response:', 'color: #00cc00; font-weight: bold', response)
        
        if (response.data.status === 'success' && Array.isArray(response.data.strategies)) {
          console.log('%c Successfully loaded strategies:', 'color: #00cc00; font-weight: bold', response.data.strategies)
          setStrategies(response.data.strategies)
          
          // Set first strategy as default if available
          if (response.data.strategies.length > 0) {
            const defaultStrategy = response.data.strategies[0]
            console.log('%c Setting default strategy:', 'color: #0066cc; font-weight: bold', defaultStrategy)
            
            const defaultParams = Object.entries(defaultStrategy.parameters).reduce<Record<string, number>>(
              (acc, [key, param]) => {
                acc[key] = (param as StrategyParameter).default
                return acc
              },
              {}
            )
            console.log('%c Calculated default parameters:', 'color: #0066cc; font-weight: bold', defaultParams)
            
            setFormData(prev => {
              const newData = {
                ...prev,
                strategyName: defaultStrategy.name,
                strategyParams: defaultParams
              }
              console.log('%c Updating form data:', 'color: #0066cc; font-weight: bold', newData)
              return newData
            })
          } else {
            console.warn('%c No strategies available in the response', 'color: #cc9900; font-weight: bold')
            toast({
              title: 'Warning',
              description: 'No trading strategies available',
              status: 'warning',
              duration: 5000,
              isClosable: true,
            })
          }
        } else {
          console.warn('%c Invalid response format:', 'color: #cc9900; font-weight: bold', response.data)
          toast({
            title: 'Warning',
            description: 'Invalid response format from server',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          })
        }
      } catch (error) {
        console.error('%c Failed to load strategies:', 'color: #cc0000; font-weight: bold', error)
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load available strategies',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      } finally {
        console.log('%c Finished loading strategies', 'color: #0066cc; font-weight: bold')
        setIsLoadingStrategies(false)
      }
    }
    
    loadStrategies()
  }, [toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Format trading pair (remove '/' if present)
      const formattedData = {
        ...formData,
        tradingPair: formData.tradingPair.replace('/', '')
      }
      
      console.log('Submitting backtest with data:', formattedData)
      const response = await runBacktest(formattedData)
      console.log('Backtest results:', response)
      
      toast({
        title: 'Backtest completed',
        description: 'Results have been loaded successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Backtest error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to run backtest',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleStrategyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedStrategy = strategies.find(s => s.name === e.target.value)
    if (selectedStrategy) {
      setFormData(prev => ({
        ...prev,
        strategyName: selectedStrategy.name,
        strategyParams: Object.entries(selectedStrategy.parameters).reduce<Record<string, number>>(
          (acc, [key, param]) => ({
            ...acc,
            [key]: (param as StrategyParameter).default
          }),
          {}
        )
      }))
    }
  }

  const handleParamChange = (paramName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      strategyParams: {
        ...prev.strategyParams,
        [paramName]: Number(value)
      }
    }))
  }

  const selectedStrategy = strategies.find(s => s.name === formData.strategyName)

  return (
    <Box
      p={6}
      bg={colors.cardBg}
      borderRadius="lg"
      boxShadow="sm"
      maxWidth="800px"
      mx="auto"
    >
      <form onSubmit={handleSubmit}>
        <VStack spacing={6} align="stretch">
          <Box p={4} borderWidth={1} borderRadius="md" bg={colors.cardBg}>
            <Text fontSize="lg" fontWeight="bold" mb={4}>Settings</Text>
            <VStack spacing={4} align="stretch">
              {/* Trading Pair */}
              <FormControl isRequired>
                <FormLabel>Trading Pair</FormLabel>
                <Input
                  name="tradingPair"
                  value={formData.tradingPair}
                  onChange={handleInputChange}
                  placeholder="BTCUSDT"
                  size="lg"
                />
              </FormControl>

              {/* Strategy Selection */}
              <FormControl isRequired>
                <FormLabel>Trading Strategy</FormLabel>
                <Select
                  name="strategyName"
                  value={formData.strategyName}
                  onChange={handleStrategyChange}
                  placeholder="Select trading strategy"
                  isDisabled={isLoadingStrategies}
                  size="lg"
                >
                  {strategies.map(strategy => (
                    <option key={strategy.name} value={strategy.name}>
                      {strategy.name}
                    </option>
                  ))}
                </Select>
                {isLoadingStrategies ? (
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Loading available strategies...
                  </Text>
                ) : selectedStrategy && (
                  <Text fontSize="sm" color="gray.600" mt={2}>
                    {selectedStrategy.description}
                  </Text>
                )}
              </FormControl>

              {/* Start Date */}
              <FormControl isRequired>
                <FormLabel>Start Date</FormLabel>
                <Input
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  size="lg"
                />
              </FormControl>

              {/* End Date */}
              <FormControl>
                <FormLabel>End Date</FormLabel>
                <Input
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  size="lg"
                />
              </FormControl>

              {/* Optimize Strategy Parameters */}
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">
                  Optimize Strategy Parameters
                </FormLabel>
                <Switch
                  name="optimizeStrategy"
                  isChecked={formData.optimizeStrategy}
                  onChange={handleInputChange}
                  size="lg"
                />
              </FormControl>
            </VStack>
          </Box>

          {/* Strategy Parameters Section */}
          {selectedStrategy && (
            <Box p={4} borderWidth={1} borderRadius="md" bg={colors.cardBg}>
              <Text fontSize="lg" fontWeight="bold" mb={4}>Strategy Parameters</Text>
              <VStack spacing={4} align="stretch">
                {Object.entries(selectedStrategy.parameters).map(([paramName, param]) => (
                  <FormControl key={paramName}>
                    <FormLabel>
                      {paramName}
                      <Text as="span" fontSize="sm" color="gray.500" ml={2}>
                        ({param.type})
                      </Text>
                    </FormLabel>
                    <Input
                      type="number"
                      value={formData.strategyParams?.[paramName] ?? param.default}
                      onChange={(e) => handleParamChange(paramName, e.target.value)}
                      step={param.type === 'int' ? 1 : 0.1}
                    />
                    <Text fontSize="sm" color="gray.500" mt={1}>
                      {param.description}
                    </Text>
                  </FormControl>
                ))}
              </VStack>
            </Box>
          )}

          <Button
            type="submit"
            colorScheme="blue"
            size="lg"
            width="full"
            isLoading={isLoading}
            loadingText="Running backtest..."
            disabled={!formData.strategyName || isLoadingStrategies}
          >
            Run Backtest
          </Button>

          <Button
            variant="outline"
            colorScheme="blue"
            size="lg"
            width="full"
            isDisabled={!formData.strategyName}
            leftIcon={<Text>↓</Text>}
          >
            Export Results
          </Button>
        </VStack>
      </form>
    </Box>
  )
} 
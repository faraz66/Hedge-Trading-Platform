import React, { useState, useEffect } from 'react'
import {
  Box,
  Heading,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Switch,
  Button,
  Divider,
  useColorMode,
  HStack,
  Text,
  Select,
  useToast
} from '@chakra-ui/react'
import api from '../config/api'

interface Strategy {
  name: string
  description: string
  parameters: Record<string, any>
}

export default function Settings() {
  const { colorMode, toggleColorMode } = useColorMode()
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [selectedStrategy, setSelectedStrategy] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        console.log('Fetching strategies...')
        const response = await api.get('/api/strategies')
        console.log('Strategies response:', response.data)
        
        if (response.data.status === 'success' && Array.isArray(response.data.strategies)) {
          console.log('Setting strategies:', response.data.strategies)
          setStrategies(response.data.strategies)
          if (response.data.strategies.length > 0) {
            console.log('Setting default strategy:', response.data.strategies[0].name)
            setSelectedStrategy(response.data.strategies[0].name)
          }
        } else {
          console.error('Invalid response format:', response.data)
          throw new Error('Invalid response format from server')
        }
      } catch (error) {
        console.error('Error fetching strategies:', error)
        toast({
          title: 'Error',
          description: 'Failed to load trading strategies',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchStrategies()
  }, [toast])

  // Debug logging for render
  console.log('Current strategies:', strategies)
  console.log('Selected strategy:', selectedStrategy)
  console.log('Loading state:', isLoading)

  return (
    <Box p={4}>
      <Heading mb={6}>Settings</Heading>
      <VStack spacing={6} align="stretch" maxW="xl">
        <Box>
          <Heading size="md" mb={4}>Trading Strategy</Heading>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel>Select Strategy</FormLabel>
              <Select
                value={selectedStrategy}
                onChange={(e) => {
                  console.log('Strategy selected:', e.target.value)
                  setSelectedStrategy(e.target.value)
                }}
                isDisabled={isLoading}
                placeholder={isLoading ? 'Loading strategies...' : 'Select a strategy'}
              >
                {strategies.map((strategy) => (
                  <option key={strategy.name} value={strategy.name}>
                    {strategy.name}
                  </option>
                ))}
              </Select>
              {selectedStrategy && (
                <Text fontSize="sm" color="gray.500" mt={2}>
                  {strategies.find(s => s.name === selectedStrategy)?.description}
                </Text>
              )}
            </FormControl>
          </VStack>
        </Box>

        <Divider />

        <Box>
          <Heading size="md" mb={4}>API Configuration</Heading>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel>API Key</FormLabel>
              <Input type="password" placeholder="Enter your API key" />
            </FormControl>
            <FormControl>
              <FormLabel>API Secret</FormLabel>
              <Input type="password" placeholder="Enter your API secret" />
            </FormControl>
          </VStack>
        </Box>

        <Divider />

        <Box>
          <Heading size="md" mb={4}>Trading Settings</Heading>
          <VStack spacing={4}>
            <FormControl display="flex" alignItems="center">
              <FormLabel mb="0">Enable Paper Trading</FormLabel>
              <Switch />
            </FormControl>
            <FormControl>
              <FormLabel>Default Trading Amount</FormLabel>
              <Input type="number" placeholder="Enter amount" />
            </FormControl>
          </VStack>
        </Box>

        <Divider />

        <Box>
          <Heading size="md" mb={4}>Interface Settings</Heading>
          <VStack spacing={4}>
            <FormControl display="flex" alignItems="center">
              <FormLabel mb="0">Dark Mode</FormLabel>
              <Switch
                isChecked={colorMode === 'dark'}
                onChange={toggleColorMode}
              />
            </FormControl>
          </VStack>
        </Box>

        <HStack spacing={4}>
          <Button colorScheme="blue" size="lg">
            Save Settings
          </Button>
          <Button variant="outline" size="lg">
            Reset
          </Button>
        </HStack>
      </VStack>
    </Box>
  )
} 
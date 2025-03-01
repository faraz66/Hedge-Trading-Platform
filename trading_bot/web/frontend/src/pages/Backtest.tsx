import React, { useState } from 'react'
import {
  Box,
  Flex, /* <-- new for layout */
  Grid,
  GridItem,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Select,
  Input,
  Checkbox,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useColorModeValue,
  Card,
  CardBody,
  Heading,
  useToast,
  Text,
  Icon,
  useColorMode,
} from '@chakra-ui/react'
import Plot from 'react-plotly.js'
import { FiDownload, FiPlay, FiTrendingUp, FiActivity, FiDollarSign, FiGrid } from 'react-icons/fi'
import { runBacktest, exportResults } from '../services/backtest'
import { PlotType, Data } from 'plotly.js'
import { BsMoonStarsFill, BsSunFill } from 'react-icons/bs'

export default function Backtest() {
  const toast = useToast()
  const { colorMode, toggleColorMode } = useColorMode()

  // Use colorModeValue for backgrounds, borders, etc.
  const headerBg = useColorModeValue('gray.100', 'gray.800')
  const panelBg = useColorModeValue('white', 'gray.700')
  const panelBorder = useColorModeValue('gray.200', 'gray.600')
  const tabListBg = useColorModeValue('gray.100', 'gray.800')
  const tabColor = useColorModeValue('gray.600', 'white')
  const tabSelectedColor = useColorModeValue('blue.500', 'blue.200')
  const tabSelectedBg = useColorModeValue('white', 'gray.900')

  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    tradingPair: 'BTC/USDT',
    startDate: '2013-01-01',
    endDate: '2025-02-27',
    optimizeStrategy: false
  })

  const [results, setResults] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const results = await runBacktest(formData)
      setResults(results)
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
        title: 'Backtest failed',
        description:
          error instanceof Error
            ? error.message
            : 'An error occurred while running the backtest',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    if (!results) {
      toast({
        title: 'No results to export',
        description: 'Please run a backtest first',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    try {
      await exportResults(results)
      toast({
        title: 'Export successful',
        description: 'Results have been downloaded',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to export results',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  return (
    // Use Flex with minH instead of forcing height=100vh and overflow=hidden
    <Flex direction="column" minH="100vh">
      {/* Header */}
      <Box 
        bg={headerBg} 
        width="100%" 
        position="sticky" 
        top={0} 
        zIndex={2} 
        height="64px"
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        px={6}
        boxShadow="sm"
      >
        <HStack spacing={2} color="white">
          <Icon as={FiTrendingUp} />
          <Text fontWeight="medium">Advanced Grid Strategy Backtester</Text>
        </HStack>
      </Box>

      {/* Main Content Area */}
      {/* Use flex="1" and overflow="auto" to allow scrolling without resizing */}
      <Box flex="1" overflow="auto" px={6} py={4}>
        <Grid templateColumns="280px minmax(0, 1fr)" gap={6} width="100%">
          {/* Settings Panel */}
          <GridItem width="280px" minW="280px">
            <Box
              position="sticky"
              top="20px"
              bg={panelBg}
              borderRadius="md"
              p={4}
              boxShadow="sm"
              borderWidth="1px"
              borderColor={panelBorder}
            >
              <HStack mb={4} spacing={2}>
                <Icon as={FiGrid} />
                <Text fontWeight="medium">Settings</Text>
              </HStack>

              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel>Trading Pair</FormLabel>
                  <Select
                    value={formData.tradingPair}
                    onChange={(e) =>
                      setFormData({ ...formData, tradingPair: e.target.value })
                    }
                  >
                    <option value="BTC/USDT">BTC/USDT</option>
                    <option value="ETH/USDT">ETH/USDT</option>
                    <option value="BNB/USDT">BNB/USDT</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Start Date</FormLabel>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>End Date</FormLabel>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                  />
                </FormControl>

                <Checkbox
                  isChecked={formData.optimizeStrategy}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      optimizeStrategy: e.target.checked,
                    })
                  }
                >
                  Optimize Strategy Parameters
                </Checkbox>

                <Button
                  colorScheme="blue"
                  onClick={handleSubmit}
                  leftIcon={<FiPlay />}
                  isLoading={isLoading}
                  loadingText="Running..."
                  width="100%"
                >
                  Run Backtest
                </Button>

                <Button
                  variant="outline"
                  leftIcon={<FiDownload />}
                  onClick={handleExport}
                  isDisabled={!results || isLoading}
                  width="100%"
                >
                  Export Results
                </Button>
              </VStack>
            </Box>
          </GridItem>

          {/* Results Panel */}
          <GridItem minW={0}>
            <VStack spacing={4} align="stretch" width="100%">
              {/* Charts */}
              <Box
                bg={useColorModeValue('white', '#1A1E23')}
                borderRadius="md"
                boxShadow="sm"
                borderWidth="1px"
                borderColor={useColorModeValue('gray.200', '#2D3748')}
                overflow="hidden"
                width="100%"
              >
                <Tabs width="100%" variant="unstyled">
                  <Box 
                    bg={useColorModeValue('gray.50', '#1A1E23')} 
                    borderBottom="1px" 
                    borderColor={useColorModeValue('gray.200', '#2D3748')}
                  >
                    <TabList 
                      px={4} 
                      py={2} 
                      gap={2}
                      bg="transparent"
                    >
                      <Tab
                        display="flex"
                        alignItems="center"
                        px={4}
                        py={2}
                        borderRadius="md"
                        color={useColorModeValue('gray.600', 'gray.400')}
                        _selected={{
                          color: useColorModeValue('blue.600', 'white'),
                          bg: useColorModeValue('white', '#262B33'),
                          boxShadow: 'sm'
                        }}
                        _hover={{
                          color: useColorModeValue('blue.600', 'white'),
                          bg: useColorModeValue('gray.50', '#262B33')
                        }}
                      >
                        <HStack spacing={2}>
                          <Icon as={FiTrendingUp} />
                          <Text fontSize="sm" fontWeight="medium">Price & Trades</Text>
                        </HStack>
                      </Tab>
                      <Tab
                        display="flex"
                        alignItems="center"
                        px={4}
                        py={2}
                        borderRadius="md"
                        color={useColorModeValue('gray.600', 'gray.400')}
                        _selected={{
                          color: useColorModeValue('blue.600', 'white'),
                          bg: useColorModeValue('white', '#262B33'),
                          boxShadow: 'sm'
                        }}
                        _hover={{
                          color: useColorModeValue('blue.600', 'white'),
                          bg: useColorModeValue('gray.50', '#262B33')
                        }}
                      >
                        <HStack spacing={2}>
                          <Icon as={FiActivity} />
                          <Text fontSize="sm" fontWeight="medium">Indicators</Text>
                        </HStack>
                      </Tab>
                      <Tab
                        display="flex"
                        alignItems="center"
                        px={4}
                        py={2}
                        borderRadius="md"
                        color={useColorModeValue('gray.600', 'gray.400')}
                        _selected={{
                          color: useColorModeValue('blue.600', 'white'),
                          bg: useColorModeValue('white', '#262B33'),
                          boxShadow: 'sm'
                        }}
                        _hover={{
                          color: useColorModeValue('blue.600', 'white'),
                          bg: useColorModeValue('gray.50', '#262B33')
                        }}
                      >
                        <HStack spacing={2}>
                          <Icon as={FiDollarSign} />
                          <Text fontSize="sm" fontWeight="medium">Equity</Text>
                        </HStack>
                      </Tab>
                      <Tab
                        display="flex"
                        alignItems="center"
                        px={4}
                        py={2}
                        borderRadius="md"
                        color={useColorModeValue('gray.600', 'gray.400')}
                        _selected={{
                          color: useColorModeValue('blue.600', 'white'),
                          bg: useColorModeValue('white', '#262B33'),
                          boxShadow: 'sm'
                        }}
                        _hover={{
                          color: useColorModeValue('blue.600', 'white'),
                          bg: useColorModeValue('gray.50', '#262B33')
                        }}
                      >
                        <HStack spacing={2}>
                          <Icon as={FiGrid} />
                          <Text fontSize="sm" fontWeight="medium">Heatmaps</Text>
                        </HStack>
                      </Tab>
                    </TabList>
                  </Box>

                  <TabPanels bg={useColorModeValue('white', '#1A1E23')}>
                    <TabPanel p={4}>
                      <Box 
                        height="400px" 
                        width="100%"
                        bg={useColorModeValue('white', '#1A1E23')}
                      >
                        {results?.historical_data ? (
                          <Plot
                            data={[
                              {
                                type: 'candlestick' as PlotType,
                                x: results.historical_data.dates,
                                open: results.historical_data.open,
                                high: results.historical_data.high,
                                low: results.historical_data.low,
                                close: results.historical_data.close,
                                increasing: { line: { color: '#26a69a' } },
                                decreasing: { line: { color: '#ef5350' } },
                                name: 'Price'
                              },
                              ...(results.trades ? [
                                {
                                  type: 'scatter' as PlotType,
                                  mode: 'markers',
                                  x: results.trades.filter((t: any) => t.type === 'buy').map((t: any) => t.timestamp),
                                  y: results.trades.filter((t: any) => t.type === 'buy').map((t: any) => t.price),
                                  marker: {
                                    color: '#26a69a',
                                    symbol: 'triangle-up',
                                    size: 10,
                                    line: {
                                      width: 1,
                                      color: '#1B5E56'
                                    }
                                  },
                                  name: 'Buy',
                                  hovertemplate: 'Buy at %{y:$.2f}<br>Time: %{x}<extra></extra>'
                                } as Data,
                                {
                                  type: 'scatter' as PlotType,
                                  mode: 'markers',
                                  x: results.trades.filter((t: any) => t.type === 'sell').map((t: any) => t.timestamp),
                                  y: results.trades.filter((t: any) => t.type === 'sell').map((t: any) => t.price),
                                  marker: {
                                    color: '#ef5350',
                                    symbol: 'triangle-down',
                                    size: 10,
                                    line: {
                                      width: 1,
                                      color: '#AB3B38'
                                    }
                                  },
                                  name: 'Sell',
                                  hovertemplate: 'Sell at %{y:$.2f}<br>Time: %{x}<extra></extra>'
                                } as Data
                              ] : [])
                            ]}
                            layout={{
                              dragmode: 'zoom',
                              margin: { l: 40, r: 20, t: 20, b: 40 },
                              showlegend: true,
                              xaxis: { 
                                rangeslider: { visible: false },
                                gridcolor: useColorModeValue('#E2E8F0', '#2D3748'),
                                zerolinecolor: useColorModeValue('#E2E8F0', '#2D3748')
                              },
                              yaxis: {
                                gridcolor: useColorModeValue('#E2E8F0', '#2D3748'),
                                zerolinecolor: useColorModeValue('#E2E8F0', '#2D3748'),
                                tickprefix: '$'
                              },
                              plot_bgcolor: useColorModeValue('#fff', '#1A202C'),
                              paper_bgcolor: useColorModeValue('#fff', '#1A202C'),
                              font: {
                                color: useColorModeValue('#000', '#fff'),
                              },
                              hovermode: 'closest'
                            }}
                            config={{
                              responsive: true,
                              displayModeBar: true,
                              displaylogo: false,
                              modeBarButtonsToRemove: ['lasso2d', 'select2d']
                            }}
                            style={{ width: '100%', height: '100%' }}
                            useResizeHandler={true}
                          />
                        ) : (
                          <Box
                            height="100%"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Text color="gray.500">
                              Run a backtest to see price data and trades
                            </Text>
                          </Box>
                        )}
                      </Box>
                    </TabPanel>

                    <TabPanel p={4}>
                      <Box h="400px" w="100%">
                        {results?.indicators ? (
                          <Plot
                            data={[
                              {
                                type: 'scatter',
                                mode: 'lines',
                                x: results.historical_data.dates,
                                y: results.indicators.sma,
                                name: 'SMA',
                                line: { color: '#2196f3' },
                              },
                            ]}
                            layout={{
                              dragmode: 'zoom',
                              showlegend: true,
                              yaxis: { title: 'Value' },
                              plot_bgcolor: useColorModeValue('#fff', '#1A202C'),
                              paper_bgcolor: useColorModeValue('#fff', '#1A202C'),
                              font: {
                                color: useColorModeValue('#000', '#fff'),
                              },
                            }}
                            config={{
                              responsive: true,
                              displayModeBar: true,
                              displaylogo: false,
                            }}
                            style={{ width: '100%', height: '100%' }}
                          />
                        ) : (
                          <Box
                            h="full"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Text color="gray.500">
                              Run a backtest to see indicators
                            </Text>
                          </Box>
                        )}
                      </Box>
                    </TabPanel>

                    <TabPanel p={4}>
                      <Box h="400px" w="100%">
                        {results?.equity_curve ? (
                          <Plot
                            data={[
                              {
                                type: 'scatter',
                                mode: 'lines',
                                x: results.equity_curve.dates,
                                y: results.equity_curve.values,
                                name: 'Equity',
                                line: { color: '#4caf50' },
                              },
                            ]}
                            layout={{
                              dragmode: 'zoom',
                              showlegend: true,
                              yaxis: { title: 'Equity ($)' },
                              plot_bgcolor: useColorModeValue('#fff', '#1A202C'),
                              paper_bgcolor: useColorModeValue('#fff', '#1A202C'),
                              font: {
                                color: useColorModeValue('#000', '#fff'),
                              },
                            }}
                            config={{
                              responsive: true,
                              displayModeBar: true,
                              displaylogo: false,
                            }}
                            style={{ width: '100%', height: '100%' }}
                          />
                        ) : (
                          <Box
                            h="full"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Text color="gray.500">
                              Run a backtest to see equity curve
                            </Text>
                          </Box>
                        )}
                      </Box>
                    </TabPanel>

                    <TabPanel p={4}>
                      <Box h="400px" w="100%">
                        {results?.heatmap ? (
                          <Plot
                            data={[
                              {
                                type: 'heatmap',
                                z: results.heatmap.values,
                                x: results.heatmap.x_labels,
                                y: results.heatmap.y_labels,
                                colorscale: 'Viridis',
                              },
                            ]}
                            layout={{
                              title: 'Parameter Optimization Heatmap',
                              xaxis: { title: 'Parameter 1' },
                              yaxis: { title: 'Parameter 2' },
                              plot_bgcolor: useColorModeValue('#fff', '#1A202C'),
                              paper_bgcolor: useColorModeValue('#fff', '#1A202C'),
                              font: {
                                color: useColorModeValue('#000', '#fff'),
                              },
                            }}
                            config={{
                              responsive: true,
                              displayModeBar: true,
                              displaylogo: false,
                            }}
                            style={{ width: '100%', height: '100%' }}
                          />
                        ) : (
                          <Box
                            h="full"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Text color="gray.500">
                              Enable optimization to see parameter heatmaps
                            </Text>
                          </Box>
                        )}
                      </Box>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </Box>

              {/* Trade History */}
              <Box
                bg={panelBg}
                borderRadius="md"
                boxShadow="sm"
                borderWidth="1px"
                borderColor={panelBorder}
                p={4}
                width="100%"
              >
                <HStack mb={4} spacing={2}>
                  <Icon as={FiActivity} />
                  <Text fontWeight="medium">Trade History</Text>
                </HStack>

                <Box width="100%" overflowX="auto">
                  <Table size="sm" width="100%">
                    <Thead>
                      <Tr>
                        <Th width="180px">DATE</Th>
                        <Th width="100px">TYPE</Th>
                        <Th isNumeric width="120px">
                          PRICE
                        </Th>
                        <Th isNumeric width="120px">
                          SIZE
                        </Th>
                        <Th isNumeric width="120px">
                          VALUE
                        </Th>
                        <Th isNumeric width="120px">
                          COMMISSION
                        </Th>
                        <Th isNumeric width="120px">
                          PROFIT/LOSS
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {!results?.trades && (
                        <Tr>
                          <Td colSpan={7} textAlign="center">
                            <Text color="gray.500">
                              Run a backtest to see trade history
                            </Text>
                          </Td>
                        </Tr>
                      )}
                      {results?.trades?.map((trade: any, index: number) => (
                        <Tr key={index}>
                          <Td whiteSpace="nowrap">
                            {new Date(trade.timestamp).toLocaleString()}
                          </Td>
                          <Td color={trade.type === 'buy' ? 'green.500' : 'red.500'}>
                            {trade.type.toUpperCase()}
                          </Td>
                          <Td isNumeric>{trade.price.toFixed(2)}</Td>
                          <Td isNumeric>{trade.size.toFixed(8)}</Td>
                          <Td isNumeric>{trade.value.toFixed(2)}</Td>
                          <Td isNumeric>{trade.commission.toFixed(2)}</Td>
                          <Td
                            isNumeric
                            color={trade.profit >= 0 ? 'green.500' : 'red.500'}
                          >
                            {trade.profit.toFixed(2)}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </Box>
            </VStack>
          </GridItem>
        </Grid>
      </Box>
    </Flex>
  )
}
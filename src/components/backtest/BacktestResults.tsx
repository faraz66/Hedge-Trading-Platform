import React from 'react';
import {
  Stack,
  SimpleGrid,
  Box,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Spinner,
  List,
  ListItem,
  Heading,
  Icon,
  Flex,
  useColorModeValue,
  Divider,
} from '@chakra-ui/react';
import { 
  FiTrendingUp, 
  FiPercent, 
  FiActivity, 
  FiArrowDown, 
  FiBarChart2, 
  FiList, 
  FiCode 
} from 'react-icons/fi';
import Plot from 'react-plotly.js';
import { BacktestResults as BacktestResultsType, Trade, Price, Strategy } from '@/types/backtest';

interface BacktestResultsProps {
  results: BacktestResultsType | null;
  isRunning: boolean;
  strategies: Strategy[];
}

export const BacktestResults: React.FC<BacktestResultsProps> = ({ results, isRunning, strategies }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
  const plotBgColor = useColorModeValue('rgba(255,255,255,1)', 'rgba(32,34,38,1)');
  const plotGridColor = useColorModeValue('rgba(0,0,0,0.1)', 'rgba(255,255,255,0.1)');
  const plotFontColor = useColorModeValue('#1A202C', '#FFFFFF');
  const tabHoverBg = useColorModeValue('gray.100', 'gray.700');
  const strategyItemBg = useColorModeValue('gray.50', 'gray.700');

  if (isRunning) {
    return (
      <Box 
        textAlign="center" 
        py={10} 
        bg={bgColor} 
        borderRadius="lg" 
        boxShadow="md" 
        borderWidth="1px" 
        borderColor={borderColor}
        p={8}
      >
        <Spinner size="xl" color="blue.500" thickness="3px" speed="0.8s" />
        <Text mt={4} fontSize="lg" fontWeight="medium" color={textColor}>
          Running backtest...
        </Text>
      </Box>
    );
  }

  if (!results) {
    return (
      <Box
        bg={bgColor}
        p={10}
        borderRadius="lg"
        boxShadow="md"
        borderWidth="1px"
        borderColor={borderColor}
        textAlign="center"
      >
        <Icon as={FiBarChart2} boxSize={12} color="blue.400" mb={4} />
        <Text color={secondaryTextColor} fontSize="lg">
          Run a backtest to see results
        </Text>
      </Box>
    );
  }

  const renderPriceChart = () => {
    return (
      <Box w="100%" h="400px">
        <Plot
          data={[
            {
              x: results.prices.map((p: Price) => p.timestamp),
              y: results.prices.map((p: Price) => p.close),
              type: 'scatter',
              mode: 'lines',
              name: 'Price',
              line: { color: useColorModeValue('#3182CE', '#63B3ED'), width: 2 }
            },
            {
              x: results.trades.filter((t: Trade) => t.type === 'BUY').map((t: Trade) => t.timestamp),
              y: results.trades.filter((t: Trade) => t.type === 'BUY').map((t: Trade) => t.price),
              type: 'scatter',
              mode: 'markers',
              name: 'Buy',
              marker: { color: useColorModeValue('#38A169', '#48BB78'), size: 10 },
            },
            {
              x: results.trades.filter((t: Trade) => t.type === 'SELL').map((t: Trade) => t.timestamp),
              y: results.trades.filter((t: Trade) => t.type === 'SELL').map((t: Trade) => t.price),
              type: 'scatter',
              mode: 'markers',
              name: 'Sell',
              marker: { color: useColorModeValue('#E53E3E', '#FC8181'), size: 10 },
            },
          ]}
          layout={{
            title: 'Price Chart with Trades',
            plot_bgcolor: plotBgColor,
            paper_bgcolor: plotBgColor,
            font: { color: plotFontColor },
            xaxis: { 
              gridcolor: plotGridColor,
              title: 'Date',
              titlefont: { size: 12 }
            },
            yaxis: { 
              gridcolor: plotGridColor,
              title: 'Price',
              titlefont: { size: 12 }
            },
            showlegend: true,
            legend: { x: 0, y: 1 },
            margin: { l: 50, r: 50, t: 50, b: 50 },
            hovermode: 'closest',
          }}
          style={{ width: '100%', height: '100%' }}
          config={{ responsive: true }}
        />
      </Box>
    );
  };

  return (
    <Stack spacing={6} direction="column">
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
        <Stat
          bg={bgColor}
          p={5}
          borderRadius="lg"
          boxShadow="md"
          borderWidth="1px"
          borderColor={borderColor}
          position="relative"
          overflow="hidden"
        >
          <Box position="absolute" top={3} right={3} opacity={0.3}>
            <Icon as={FiTrendingUp} boxSize={6} color="blue.400" />
          </Box>
          <StatLabel color={secondaryTextColor} fontSize="sm" fontWeight="medium">Total Return</StatLabel>
          <StatNumber fontSize="2xl" fontWeight="bold" color={results.metrics.total_return >= 0 ? 'green.500' : 'red.500'}>
            {results.metrics.total_return.toFixed(2)}%
          </StatNumber>
          <StatHelpText fontSize="xs" mt={1}>
            <StatArrow type={results.metrics.total_return >= 0 ? 'increase' : 'decrease'} />
            Overall Performance
          </StatHelpText>
        </Stat>
        <Stat
          bg={bgColor}
          p={5}
          borderRadius="lg"
          boxShadow="md"
          borderWidth="1px"
          borderColor={borderColor}
          position="relative"
          overflow="hidden"
        >
          <Box position="absolute" top={3} right={3} opacity={0.3}>
            <Icon as={FiPercent} boxSize={6} color="green.400" />
          </Box>
          <StatLabel color={secondaryTextColor} fontSize="sm" fontWeight="medium">Win Rate</StatLabel>
          <StatNumber fontSize="2xl" fontWeight="bold" color={textColor}>
            {(results.metrics.win_rate * 100).toFixed(2)}%
          </StatNumber>
          <StatHelpText fontSize="xs" mt={1}>
            {results.metrics.total_trades} Total Trades
          </StatHelpText>
        </Stat>
        <Stat
          bg={bgColor}
          p={5}
          borderRadius="lg"
          boxShadow="md"
          borderWidth="1px"
          borderColor={borderColor}
          position="relative"
          overflow="hidden"
        >
          <Box position="absolute" top={3} right={3} opacity={0.3}>
            <Icon as={FiActivity} boxSize={6} color="purple.400" />
          </Box>
          <StatLabel color={secondaryTextColor} fontSize="sm" fontWeight="medium">Sharpe Ratio</StatLabel>
          <StatNumber fontSize="2xl" fontWeight="bold" color={textColor}>
            {results.metrics.sharpe_ratio.toFixed(2)}
          </StatNumber>
          <StatHelpText fontSize="xs" mt={1}>
            Risk-Adjusted Return
          </StatHelpText>
        </Stat>
        <Stat
          bg={bgColor}
          p={5}
          borderRadius="lg"
          boxShadow="md"
          borderWidth="1px"
          borderColor={borderColor}
          position="relative"
          overflow="hidden"
        >
          <Box position="absolute" top={3} right={3} opacity={0.3}>
            <Icon as={FiArrowDown} boxSize={6} color="orange.400" />
          </Box>
          <StatLabel color={secondaryTextColor} fontSize="sm" fontWeight="medium">Max Drawdown</StatLabel>
          <StatNumber fontSize="2xl" fontWeight="bold" color="red.500">
            {(results.metrics.max_drawdown * 100).toFixed(2)}%
          </StatNumber>
          <StatHelpText fontSize="xs" mt={1}>
            Maximum Loss
          </StatHelpText>
        </Stat>
      </SimpleGrid>

      <Box
        bg={bgColor}
        p={0}
        borderRadius="lg"
        boxShadow="md"
        borderWidth="1px"
        borderColor={borderColor}
        overflow="hidden"
      >
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList bg={useColorModeValue('gray.50', 'gray.900')} px={4} pt={4}>
            <Tab 
              _selected={{ 
                color: 'blue.500', 
                bg: bgColor, 
                borderColor: borderColor,
                borderBottomColor: bgColor,
                fontWeight: 'semibold'
              }}
              _hover={{ bg: tabHoverBg }}
              borderTopRadius="md"
              px={5}
              py={3}
            >
              <Flex align="center">
                <Icon as={FiBarChart2} mr={2} />
                <Text>Chart</Text>
              </Flex>
            </Tab>
            <Tab 
              _selected={{ 
                color: 'blue.500', 
                bg: bgColor, 
                borderColor: borderColor,
                borderBottomColor: bgColor,
                fontWeight: 'semibold'
              }}
              _hover={{ bg: tabHoverBg }}
              borderTopRadius="md"
              px={5}
              py={3}
            >
              <Flex align="center">
                <Icon as={FiList} mr={2} />
                <Text>Trades</Text>
              </Flex>
            </Tab>
            <Tab 
              _selected={{ 
                color: 'blue.500', 
                bg: bgColor, 
                borderColor: borderColor,
                borderBottomColor: bgColor,
                fontWeight: 'semibold'
              }}
              _hover={{ bg: tabHoverBg }}
              borderTopRadius="md"
              px={5}
              py={3}
            >
              <Flex align="center">
                <Icon as={FiCode} mr={2} />
                <Text>Strategies</Text>
              </Flex>
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel p={6}>
              {renderPriceChart()}
            </TabPanel>
            <TabPanel p={6}>
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Date</Th>
                      <Th>Type</Th>
                      <Th isNumeric>Price</Th>
                      <Th isNumeric>Size</Th>
                      <Th isNumeric>Profit/Loss</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {results.trades.map((trade: Trade, index: number) => (
                      <Tr key={index}>
                        <Td>{new Date(trade.timestamp).toLocaleString()}</Td>
                        <Td>
                          <Badge
                            colorScheme={trade.type === 'BUY' ? 'green' : 'red'}
                            px={2}
                            py={1}
                            borderRadius="md"
                          >
                            {trade.type}
                          </Badge>
                        </Td>
                        <Td isNumeric>${trade.price.toFixed(2)}</Td>
                        <Td isNumeric>{trade.size.toFixed(4)}</Td>
                        <Td isNumeric>
                          {trade.profit ? (
                            <Text
                              color={trade.profit >= 0 ? 'green.500' : 'red.500'}
                              fontWeight="medium"
                            >
                              ${trade.profit.toFixed(2)}
                            </Text>
                          ) : '-'}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </TabPanel>
            <TabPanel p={6}>
              <Box>
                <Heading size="md" mb={4} color={textColor}>Available Strategies</Heading>
                <List spacing={4}>
                  {strategies.map((strategy) => (
                    <ListItem 
                      key={strategy.name} 
                      p={5} 
                      bg={strategyItemBg} 
                      borderRadius="lg"
                      borderWidth="1px"
                      borderColor={borderColor}
                      boxShadow="sm"
                    >
                      <Flex align="center" mb={2}>
                        <Icon as={FiCode} mr={2} color="blue.500" />
                        <Text fontWeight="bold" color={textColor}>{strategy.name}</Text>
                      </Flex>
                      <Text color={secondaryTextColor} fontSize="sm" mb={3}>{strategy.description}</Text>
                      <Divider mb={3} />
                      <Box>
                        <Text fontSize="sm" fontWeight="medium" color={textColor} mb={2}>Parameters:</Text>
                        <Table size="sm" variant="simple">
                          <Thead>
                            <Tr>
                              <Th>Name</Th>
                              <Th>Default</Th>
                              <Th>Range</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {Object.entries(strategy.parameters).map(([name, param]) => (
                              <Tr key={name}>
                                <Td fontWeight="medium">{name}</Td>
                                <Td>{param.default}</Td>
                                <Td>{param.range.min} - {param.range.max}</Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Stack>
  );
};

export default BacktestResults; 
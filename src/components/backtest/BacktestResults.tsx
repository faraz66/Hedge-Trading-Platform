import React, { useEffect } from 'react';
import {
  Stack,
  Box,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Icon,
  Flex,
  Text,
  Button,
  useBreakpointValue,
  Badge,
  Tooltip,
  Heading,
  HStack,
  useColorModeValue,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Divider,
  Card,
  CardBody,
  CardHeader,
} from '@chakra-ui/react';
import { 
  FiBarChart2, 
  FiList, 
  FiCode,
  FiTrendingUp,
  FiGrid,
  FiClock,
  FiArrowDown,
  FiPercent,
  FiActivity,
  FiDollarSign,
  FiTarget,
  FiShield,
  FiCheckCircle,
  FiAlertTriangle,
  FiInfo,
} from 'react-icons/fi';
import { BacktestResults as BacktestResultsType, Strategy } from '@/types/backtest';

// Import modular components
import PriceChart from './charts/PriceChart';
import CorrelationMatrix from './charts/CorrelationMatrix';
import TimeSeriesCharts from './charts/TimeSeriesCharts';
import TradesTable from './tables/TradesTable';
import DetailedStats from './stats/DetailedStats';
import LoadingState from './LoadingState';
import useBacktestTheme from '@/hooks/useBacktestTheme';
import ErrorBoundary from '../ErrorBoundary';
import { getTimeframeByValue } from '@/constants/timeframes';

interface BacktestResultsProps {
  results: BacktestResultsType | null;
  isRunning: boolean;
  strategies: Strategy[];
}

export const BacktestResults: React.FC<BacktestResultsProps> = ({ results, isRunning, strategies }) => {
  const {
    bgColor,
    borderColor,
    textColor,
    secondaryTextColor,
    tabsBg,
    tabHoverBg,
    headerBgColor,
    strategyItemBg,
    plotBgColor,
    plotGridColor,
    plotFontColor,
    priceLineColor,
    buyMarkerColor,
    sellMarkerColor,
  } = useBacktestTheme();

  // Responsive adjustments for tabs
  const showTabText = useBreakpointValue({ base: false, md: true });
  const tabPadding = useBreakpointValue({ base: 3, md: 5 });
  const cardBg = useColorModeValue('white', 'gray.800');

  // Get timeframe info
  const timeframeInfo = results?.timeframe ? getTimeframeByValue(results.timeframe) : null;

  useEffect(() => {
    if (results) {
      console.log("Results received:", results);
      console.log("Timeframe:", results.timeframe);
      console.log('Results has prices:', !!results.prices, 'length:', results.prices?.length);
      console.log('Results has trades:', !!results.trades, 'length:', results.trades?.length);
      console.log('Results has metrics:', !!results.metrics);
    }
  }, [results]);

  if (isRunning) {
    return <LoadingState isLoading={true} />;
  }
  
  if (!results) {
    return <LoadingState isLoading={false} />;
  }

  // Calculate risk score (0-100) based on metrics
  const calculateRiskScore = () => {
    if (!results.metrics) return 50;
    
    const { max_drawdown, volatility, sharpe_ratio, win_rate } = results.metrics;
    
    // Convert metrics to a 0-100 scale
    const drawdownScore = Math.max(0, 100 - (max_drawdown * 100 * 2)); // Higher drawdown = lower score
    const volatilityScore = Math.max(0, 100 - (volatility * 100)); // Higher volatility = lower score
    const sharpeScore = Math.min(100, sharpe_ratio * 25); // Higher sharpe = higher score
    const winRateScore = Math.min(100, win_rate * 100); // Higher win rate = higher score
    
    // Weighted average
    return Math.round((drawdownScore * 0.3) + (volatilityScore * 0.3) + (sharpeScore * 0.2) + (winRateScore * 0.2));
  };
  
  const riskScore = calculateRiskScore();
  const riskColor = riskScore > 70 ? "green" : riskScore > 40 ? "yellow" : "red";

  return (
    <Stack spacing={6} direction="column" w="100%" maxW="100%" overflowX="hidden">
      {/* Key Performance Metrics */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} width="100%">
        <Card bg={cardBg} boxShadow="md" borderRadius="lg" overflow="hidden">
          <CardBody p={4}>
            <Flex align="center" mb={2}>
              <Icon as={FiTrendingUp} color="green.500" boxSize={5} mr={2} />
              <Text fontWeight="bold" fontSize="sm">Total Return</Text>
              <Tooltip 
                label="The overall percentage gain or loss from the strategy over the entire backtest period." 
                placement="top" 
                hasArrow
              >
                <Box as="span" ml={1} cursor="help">
                  <Icon as={FiInfo} color="gray.400" boxSize={4} />
                </Box>
              </Tooltip>
            </Flex>
            <Text fontSize="xl" fontWeight="bold" color={(results?.metrics?.total_return || 0) >= 0 ? "green.500" : "red.500"}>
              {((results?.metrics?.total_return || 0) * 100).toFixed(2)}%
            </Text>
            <Text fontSize="xs" color={secondaryTextColor} mt={1}>
              {results?.metrics?.annualized_return ? `${(results.metrics.annualized_return * 100).toFixed(2)}% Annualized` : ''}
            </Text>
          </CardBody>
        </Card>
        
        <Card bg={cardBg} boxShadow="md" borderRadius="lg" overflow="hidden">
          <CardBody p={4}>
            <Flex align="center" mb={2}>
              <Icon as={FiArrowDown} color="red.500" boxSize={5} mr={2} />
              <Text fontWeight="bold" fontSize="sm">Max Drawdown</Text>
              <Tooltip 
                label="The largest percentage drop from peak to trough in the portfolio value. Lower values are better." 
                placement="top" 
                hasArrow
              >
                <Box as="span" ml={1} cursor="help">
                  <Icon as={FiInfo} color="gray.400" boxSize={4} />
                </Box>
              </Tooltip>
            </Flex>
            <Text fontSize="xl" fontWeight="bold" color="red.500">
              {((results?.metrics?.max_drawdown || 0) * 100).toFixed(2)}%
            </Text>
            <Text fontSize="xs" color={secondaryTextColor} mt={1}>
              Recovery Factor: {(results?.metrics?.recovery_factor || 0).toFixed(2)}
            </Text>
          </CardBody>
        </Card>
        
        <Card bg={cardBg} boxShadow="md" borderRadius="lg" overflow="hidden">
          <CardBody p={4}>
            <Flex align="center" mb={2}>
              <Icon as={FiBarChart2} color="blue.500" boxSize={5} mr={2} />
              <Text fontWeight="bold" fontSize="sm">Total Trades</Text>
              <Tooltip 
                label="The total number of trades executed during the backtest period." 
                placement="top" 
                hasArrow
              >
                <Box as="span" ml={1} cursor="help">
                  <Icon as={FiInfo} color="gray.400" boxSize={4} />
                </Box>
              </Tooltip>
            </Flex>
            <Text fontSize="xl" fontWeight="bold">
              {results?.trades?.length || 0}
            </Text>
            <Text fontSize="xs" color={secondaryTextColor} mt={1}>
              Win Rate: {((results?.metrics?.win_rate || 0) * 100).toFixed(1)}%
            </Text>
          </CardBody>
        </Card>
        
        <Card bg={cardBg} boxShadow="md" borderRadius="lg" overflow="hidden">
          <CardBody p={4}>
            <Flex align="center" mb={2}>
              <Icon as={FiActivity} color="purple.500" boxSize={5} mr={2} />
              <Text fontWeight="bold" fontSize="sm">Sharpe Ratio</Text>
              <Tooltip 
                label="Measures risk-adjusted return. Values above 1 are good, above 2 are very good, and above 3 are excellent." 
                placement="top" 
                hasArrow
              >
                <Box as="span" ml={1} cursor="help">
                  <Icon as={FiInfo} color="gray.400" boxSize={4} />
                </Box>
              </Tooltip>
            </Flex>
            <Text fontSize="xl" fontWeight="bold" color={(results?.metrics?.sharpe_ratio || 0) >= 1 ? "green.500" : "orange.500"}>
              {(results?.metrics?.sharpe_ratio || 0).toFixed(2)}
            </Text>
            <Text fontSize="xs" color={secondaryTextColor} mt={1}>
              Sortino: {(results?.metrics?.sortino_ratio || 0).toFixed(2)}
            </Text>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Advanced Metrics Row */}
      <SimpleGrid columns={{ base: 3, md: 6 }} spacing={4} width="100%">
        <Box p={3} borderRadius="md" bg={headerBgColor} borderWidth="1px" borderColor={borderColor}>
          <Flex align="center" mb={1}>
            <Text fontSize="xs" color={secondaryTextColor}>Profit Factor</Text>
            <Tooltip 
              label="Gross profit divided by gross loss. Values above 1.5 indicate a potentially profitable strategy." 
              placement="top" 
              hasArrow
            >
              <Box as="span" ml={1} cursor="help">
                <Icon as={FiInfo} color="gray.400" boxSize={3} />
              </Box>
            </Tooltip>
          </Flex>
          <Text fontSize="md" fontWeight="bold" color={(results?.metrics?.profit_factor || 0) >= 1.5 ? "green.500" : "gray.500"}>
            {(results?.metrics?.profit_factor || 0).toFixed(2)}
          </Text>
        </Box>
        
        <Box p={3} borderRadius="md" bg={headerBgColor} borderWidth="1px" borderColor={borderColor}>
          <Flex align="center" mb={1}>
            <Text fontSize="xs" color={secondaryTextColor}>Win/Loss Ratio</Text>
            <Tooltip 
              label="Average winning trade divided by average losing trade. Higher values are better." 
              placement="top" 
              hasArrow
            >
              <Box as="span" ml={1} cursor="help">
                <Icon as={FiInfo} color="gray.400" boxSize={3} />
              </Box>
            </Tooltip>
          </Flex>
          <Text fontSize="md" fontWeight="bold" color={(results?.metrics?.win_loss_ratio || 0) >= 1.5 ? "green.500" : "gray.500"}>
            {(results?.metrics?.win_loss_ratio || 0).toFixed(2)}
          </Text>
        </Box>
        
        <Box p={3} borderRadius="md" bg={headerBgColor} borderWidth="1px" borderColor={borderColor}>
          <Flex align="center" mb={1}>
            <Text fontSize="xs" color={secondaryTextColor}>Avg Trade</Text>
            <Tooltip 
              label="Average percentage gain or loss per trade. Positive values indicate profitable trades on average." 
              placement="top" 
              hasArrow
            >
              <Box as="span" ml={1} cursor="help">
                <Icon as={FiInfo} color="gray.400" boxSize={3} />
              </Box>
            </Tooltip>
          </Flex>
          <Text fontSize="md" fontWeight="bold" color={(results?.metrics?.avg_trade || 0) > 0 ? "green.500" : "red.500"}>
            {((results?.metrics?.avg_trade || 0) * 100).toFixed(2)}%
          </Text>
        </Box>
        
        <Box p={3} borderRadius="md" bg={headerBgColor} borderWidth="1px" borderColor={borderColor}>
          <Flex align="center" mb={1}>
            <Text fontSize="xs" color={secondaryTextColor}>Volatility</Text>
            <Tooltip 
              label="Measures the variation in returns. Lower volatility generally indicates more stable returns." 
              placement="top" 
              hasArrow
            >
              <Box as="span" ml={1} cursor="help">
                <Icon as={FiInfo} color="gray.400" boxSize={3} />
              </Box>
            </Tooltip>
          </Flex>
          <Text fontSize="md" fontWeight="bold">
            {((results?.metrics?.volatility || 0) * 100).toFixed(2)}%
          </Text>
        </Box>
        
        <Box p={3} borderRadius="md" bg={headerBgColor} borderWidth="1px" borderColor={borderColor}>
          <Flex align="center" mb={1}>
            <Text fontSize="xs" color={secondaryTextColor}>Alpha</Text>
            <Tooltip 
              label="Excess return compared to the benchmark. Positive values indicate outperformance." 
              placement="top" 
              hasArrow
            >
              <Box as="span" ml={1} cursor="help">
                <Icon as={FiInfo} color="gray.400" boxSize={3} />
              </Box>
            </Tooltip>
          </Flex>
          <Text fontSize="md" fontWeight="bold" color={(results?.metrics?.alpha || 0) > 0 ? "green.500" : "red.500"}>
            {((results?.metrics?.alpha || 0) * 100).toFixed(2)}%
          </Text>
        </Box>
        
        <Box p={3} borderRadius="md" bg={headerBgColor} borderWidth="1px" borderColor={borderColor}>
          <Flex align="center" mb={1}>
            <Text fontSize="xs" color={secondaryTextColor}>Beta</Text>
            <Tooltip 
              label="Measures correlation with the market. Values below 1 indicate lower volatility than the market." 
              placement="top" 
              hasArrow
            >
              <Box as="span" ml={1} cursor="help">
                <Icon as={FiInfo} color="gray.400" boxSize={3} />
              </Box>
            </Tooltip>
          </Flex>
          <Text fontSize="md" fontWeight="bold">
            {(results?.metrics?.beta || 0).toFixed(2)}
          </Text>
        </Box>
      </SimpleGrid>

      {/* Risk Assessment */}
      <Box 
        borderRadius="lg" 
        bg={cardBg} 
        boxShadow="md" 
        borderWidth="1px" 
        borderColor={borderColor}
        p={4}
      >
        <Flex justify="space-between" align="center" mb={3}>
          <Flex align="center">
            <Icon as={FiShield} color="blue.500" mr={2} />
            <Text fontWeight="bold">Risk Assessment</Text>
            <Tooltip 
              label="Risk score is calculated based on drawdown, volatility, Sharpe ratio, and win rate. Higher scores indicate lower risk." 
              placement="top" 
              hasArrow
            >
              <Box as="span" ml={1} cursor="help">
                <Icon as={FiInfo} color="gray.400" boxSize={4} />
              </Box>
            </Tooltip>
          </Flex>
          <Badge colorScheme={riskColor} px={2} py={1} borderRadius="full">
            {riskScore}/100
          </Badge>
        </Flex>
        
        <Box bg="gray.100" borderRadius="full" h="8px" w="100%" overflow="hidden">
          <Box 
            bg={`${riskColor}.500`} 
            h="100%" 
            w={`${riskScore}%`} 
            transition="width 0.5s ease-in-out"
          />
        </Box>
        
        <Flex justify="space-between" mt={1}>
          <Text fontSize="xs" color="red.500">High Risk</Text>
          <Text fontSize="xs" color="yellow.500">Moderate</Text>
          <Text fontSize="xs" color="green.500">Low Risk</Text>
        </Flex>
      </Box>

      {/* Main Results Box */}
      <Box 
        borderRadius="lg" 
        bg={bgColor} 
        boxShadow="lg" 
        borderWidth="1px" 
        borderColor={borderColor}
        overflow="hidden"
        width="100%"
        maxW="100%"
      >
        <Box p={4} borderBottomWidth="1px" borderColor={borderColor} bg={headerBgColor}>
          <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "flex-start", md: "center" }}>
            <Flex align="center">
              <Icon as={FiBarChart2} boxSize={5} mr={2} color="blue.500" />
              <Heading size="md" fontWeight="600">Backtest Results</Heading>
            </Flex>
            
            <HStack spacing={3} mt={{ base: 2, md: 0 }}>
              {timeframeInfo && (
                <Tooltip label={`${timeframeInfo.description} - ${timeframeInfo.milliseconds / (60 * 1000)} minutes per candle`}>
                  <Badge colorScheme="blue" display="flex" alignItems="center" px={2} py={1} borderRadius="md">
                    <Icon as={FiClock} mr={1} />
                    <Text>{timeframeInfo.label}</Text>
                  </Badge>
                </Tooltip>
              )}
              
              <Badge colorScheme="green" px={2} py={1} borderRadius="md">
                {results?.trades?.length || 0} Trades
              </Badge>
              
              <Badge 
                colorScheme={results?.metrics?.total_return > 0 ? "green" : "red"} 
                px={2} 
                py={1} 
                borderRadius="md"
              >
                {(results?.metrics?.total_return * 100).toFixed(2)}% Return
              </Badge>
            </HStack>
          </Flex>
        </Box>

        <Tabs variant="enclosed" colorScheme="blue" isLazy w="100%">
          <TabList bg={tabsBg} px={2} pt={4} overflowX="auto" flexWrap="nowrap" w="100%">
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
              px={tabPadding}
              py={3}
              flexShrink={0}
            >
              <Flex align="center">
                <Icon as={FiBarChart2} mr={showTabText ? 2 : 0} />
                {showTabText && <Text>Chart</Text>}
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
              px={tabPadding}
              py={3}
              flexShrink={0}
            >
              <Flex align="center">
                <Icon as={FiList} mr={showTabText ? 2 : 0} />
                {showTabText && <Text>Trades</Text>}
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
              px={tabPadding}
              py={3}
              flexShrink={0}
            >
              <Flex align="center">
                <Icon as={FiTrendingUp} mr={showTabText ? 2 : 0} />
                {showTabText && <Text>Stats & Ratios</Text>}
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
              px={tabPadding}
              py={3}
              flexShrink={0}
            >
              <Flex align="center">
                <Icon as={FiGrid} mr={showTabText ? 2 : 0} />
                {showTabText && <Text>Correlation Matrix</Text>}
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
              px={tabPadding}
              py={3}
              flexShrink={0}
            >
              <Flex align="center">
                <Icon as={FiClock} mr={showTabText ? 2 : 0} />
                {showTabText && <Text>Time Series</Text>}
              </Flex>
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel p={4} overflowX="hidden">
              <Box w="100%" maxW="100%" overflowX="hidden">
                <ErrorBoundary fallback={<Text>Error rendering price chart</Text>}>
                  <PriceChart prices={results.prices} trades={results.trades} timeframe={results.timeframe} />
                </ErrorBoundary>
              </Box>
            </TabPanel>
            <TabPanel p={4} overflowX="hidden">
              <Box w="100%" maxW="100%" overflowX="auto">
                <ErrorBoundary>
                  <TradesTable trades={results.trades} />
                </ErrorBoundary>
              </Box>
            </TabPanel>
            <TabPanel p={4} overflowX="hidden">
              <Box w="100%" maxW="100%" overflowX="hidden">
                <ErrorBoundary>
                  <DetailedStats metrics={results.metrics} timeframe={results.timeframe} />
                </ErrorBoundary>
              </Box>
            </TabPanel>
            <TabPanel p={4} overflowX="hidden">
              <Box w="100%" maxW="100%" overflowX="hidden">
                <ErrorBoundary>
                  <CorrelationMatrix metrics={results.metrics} />
                </ErrorBoundary>
              </Box>
            </TabPanel>
            <TabPanel p={4} overflowX="hidden">
              <Box w="100%" maxW="100%" overflowX="hidden">
                <ErrorBoundary fallback={<Text>Error rendering time series charts</Text>}>
                  {results && (
                    <TimeSeriesCharts 
                      prices={results.prices} 
                      trades={results.trades} 
                    />
                  )}
                </ErrorBoundary>
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Stack>
  );
};

export default BacktestResults; 
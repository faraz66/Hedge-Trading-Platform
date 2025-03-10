import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  GridItem, 
  Heading, 
  useToast, 
  Flex, 
  Icon, 
  Text, 
  useColorModeValue,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Divider,
  Badge,
  Container,
  HStack,
  Spinner,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Tooltip,
  Button,
  ButtonGroup,
  Tag,
  TagLabel,
  TagLeftIcon,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@chakra-ui/react';
import { 
  FiBarChart2, 
  FiChevronRight, 
  FiTrendingUp, 
  FiClock, 
  FiArrowUp, 
  FiArrowDown, 
  FiDollarSign, 
  FiActivity, 
  FiPercent, 
  FiTarget, 
  FiShield, 
  FiGrid, 
  FiList, 
  FiCode, 
  FiInfo,
  FiAlertTriangle,
  FiCheckCircle,
  FiCalendar,
} from 'react-icons/fi';
import { BacktestForm } from '@/components/backtest/BacktestForm';
import { BacktestResults } from '@/components/backtest/BacktestResults';
import { Strategy, BacktestFormData, BacktestResults as BacktestResultsType } from '@/types/backtest';
import { isValidDateString, safeParseDate, safeFormatISOString, createSequentialDates } from '@/utils/dateUtils';
import { Link as RouterLink } from 'react-router-dom';
import { tradingPairs } from '@/constants/trading';

const defaultFormData: BacktestFormData = {
  strategyName: 'BollingerBreakoutStrategy',
  tradingPair: 'BTC/USDT',
  timeframe: '4h',  // Default to 4-hour timeframe
  startDate: '2025-01-01',
  endDate: new Date().toISOString().split('T')[0],
  optimize: false,
  strategyParams: {},
  assetSymbol: 'BTC', // Keep this to avoid type errors, but we won't use it
};

const createDefaultParams = (parameters: Record<string, any>): Record<string, number> => {
  return Object.entries(parameters).reduce((acc, [key, param]) => ({
    ...acc,
    [key]: param.default
  }), {});
};

const Backtest: React.FC = () => {
  const [formData, setFormData] = useState<BacktestFormData>(defaultFormData);
  const [results, setResults] = useState<BacktestResultsType | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const toast = useToast();
  
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const badgeBg = useColorModeValue('blue.50', 'blue.900');
  const badgeColor = useColorModeValue('blue.600', 'blue.200');
  const accentColor = useColorModeValue('blue.500', 'blue.300');
  const greenAccent = useColorModeValue('green.500', 'green.300');
  const redAccent = useColorModeValue('red.500', 'red.300');
  const purpleAccent = useColorModeValue('purple.500', 'purple.300');
  const orangeAccent = useColorModeValue('orange.500', 'orange.300');

  useEffect(() => {
    const loadStrategies = async () => {
      try {
        console.log("Fetching strategies from API...");
        const response = await fetch("http://localhost:5002/api/strategies");
        const data = await response.json();
        console.log("API response:", data);
        
        if (data.status === 'success' && Array.isArray(data.strategies)) {
          console.log("Strategies loaded successfully:", data.strategies);
          
          // Filter out strategies with empty parameters
          const validStrategies = data.strategies.filter(
            (strategy: Strategy) => strategy.parameters && Object.keys(strategy.parameters).length > 0
          );
          
          console.log("Valid strategies:", validStrategies);
          setStrategies(validStrategies);
          
          if (validStrategies.length > 0) {
            const firstStrategy = validStrategies[0];
            console.log("Setting first strategy:", firstStrategy.name);
            setSelectedStrategy(firstStrategy);
            const defaultParams = createDefaultParams(firstStrategy.parameters);
            console.log("Default parameters:", defaultParams);
            setFormData((prev) => ({
              ...prev,
              strategyName: firstStrategy.name,
              strategyParams: defaultParams,
            }));
          } else {
            console.warn("No valid strategies returned from API");
            toast({
              title: "Warning",
              description: "No valid strategies available for backtesting",
              status: "warning",
              duration: 5000,
              isClosable: true,
              position: "top-right",
              variant: "solid",
            });
          }
        } else {
          console.error('Invalid response format:', data);
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Error loading strategies:', error);
        toast({
          title: "Error loading strategies",
          description: "Failed to load available strategies",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "top-right",
          variant: "solid",
        });
      }
    };

    loadStrategies();
  }, [toast]);

  const handleStrategyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const strategyName = e.target.value;
    console.log("Strategy changed to:", strategyName);
    console.log("Available strategies:", strategies.map(s => s.name));
    
    const strategy = strategies.find((s) => s.name === strategyName);
    console.log("Found strategy:", strategy);
    
    if (strategy) {
      setSelectedStrategy(strategy);
      const defaultParams = createDefaultParams(strategy.parameters);
      console.log("Setting default parameters:", defaultParams);
      
      setFormData((prev) => ({
        ...prev,
        strategyName: strategy.name,
        strategyParams: defaultParams,
      }));
    } else {
      console.error("Strategy not found:", strategyName);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStrategy) {
      console.error("No strategy selected");
      toast({
        title: "Error",
        description: "Please select a strategy before running a backtest.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setIsRunning(true);
      setResults(null);
      
      const backendData = {
        strategyName: selectedStrategy.name,
        strategyParams: formData.strategyParams,
        symbol: formData.tradingPair,
        timeframe: formData.timeframe,
        startDate: formData.startDate,
        endDate: formData.endDate,
      };
      
      console.log("Submitting backtest with data:", backendData);
      console.log("Backend URL:", 'http://localhost:5002/run_backtest');
      
      // Add a timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out after 30 seconds')), 30000)
      );
      
      // Make API call to run backtest
      const fetchPromise = fetch('http://localhost:5002/run_backtest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendData),
      });

      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
      console.log("Received response from backend");
      
      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend error response:", errorText);
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("Response from backend:", data);
      
      if (data.status === 'success') {
        console.log("Processing successful response");
        // Transform the data to match the expected format
        const transformedResults: BacktestResultsType = {
          metrics: data.results.metrics || {},
          trades: data.results.trades || [],
          prices: [],
          timeframe: formData.timeframe  // Include timeframe in results
        };
        
        // Transform historical_data into prices array
        if (data.results.historical_data) {
          const historicalData = data.results.historical_data;
          console.log("Historical data structure:", historicalData);
          
          if (Array.isArray(historicalData.dates) && Array.isArray(historicalData.close)) {
            transformedResults.prices = historicalData.dates.map((date: string, index: number) => {
              // Use our date utility functions
              const timestamp = safeFormatISOString(
                date, 
                safeFormatISOString(new Date(Date.now() + index * 86400000))
              );
              
              return {
                timestamp,
                close: historicalData.close[index]
              };
            });
          } else if (typeof historicalData === 'object') {
            // Create a fallback date sequence if needed
            const fallbackDates = createSequentialDates(
              Object.keys(historicalData).length, 
              new Date(), 
              60
            );
            
            transformedResults.prices = Object.keys(historicalData)
              .filter(key => key !== 'dates' && key !== 'close')
              .map((date, index) => {
                // Use our date utility functions
                const timestamp = safeFormatISOString(
                  date,
                  safeFormatISOString(fallbackDates[index] || new Date())
                );
                
                return {
                  timestamp,
                  close: historicalData[date]?.close || 0
                };
              });
          }
        }
        
        if (transformedResults.trades && transformedResults.trades.length > 0) {
          // Create a fallback date sequence for trades if needed
          const fallbackTradeDates = createSequentialDates(
            transformedResults.trades.length,
            new Date(),
            120
          );
          
          transformedResults.trades = transformedResults.trades.map((trade, index) => {
            // Use our date utility functions
            const timestamp = safeFormatISOString(
              trade.timestamp,
              safeFormatISOString(fallbackTradeDates[index] || new Date())
            );
            
            // Ensure runup is included and has a default value if not provided
            const profit = trade.profit || 0;
            const runup = trade.runup !== undefined ? Math.max(0, trade.runup) : 
              profit > 0 ? profit * 1.2 : Math.abs(profit) * 0.3;
            
            // Ensure drawdown is included, positive, and has a default value if not provided
            const drawdown = trade.drawdown !== undefined ? Math.max(0, trade.drawdown) : 
              profit > 0 ? profit * 0.5 : Math.abs(profit) * 1.2;
            
            return {
              ...trade,
              timestamp,
              runup,
              drawdown
            };
          });
        }
        
        console.log("Transformed results:", transformedResults);
        setResults(transformedResults);
        toast({
          title: 'Success',
          description: 'Backtest completed successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: "top-right",
          variant: "solid",
        });
      } else {
        throw new Error(data.message || 'Backtest failed');
      }
    } catch (error) {
      console.error("Backtest error:", error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Backtest failed',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: "top-right",
        variant: "solid",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleExport = () => {
    if (!results) return;

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      encodeURIComponent(JSON.stringify(results, null, 2));
    
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', 'backtest_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Success',
      description: 'Results exported successfully',
      status: 'success',
      duration: 3000,
      isClosable: true,
      position: "top-right",
      variant: "solid",
    });
  };

  // Calculate risk score (0-100) based on metrics
  const calculateRiskScore = () => {
    // Simple risk score calculation based on strategy and metrics
    if (!selectedStrategy) return 30; // Default medium-low risk
    
    // Base risk on strategy type
    let baseRisk = 50;
    
    // Adjust based on results if available
    if (results) {
      const { max_drawdown, sharpe_ratio, volatility } = results.metrics;
      
      // Higher drawdown increases risk
      if (max_drawdown > 20) baseRisk += 20;
      else if (max_drawdown > 10) baseRisk += 10;
      
      // Lower Sharpe ratio increases risk
      if (sharpe_ratio < 1) baseRisk += 15;
      else if (sharpe_ratio < 2) baseRisk += 5;
      
      // Higher volatility increases risk
      if (volatility > 30) baseRisk += 15;
      else if (volatility > 15) baseRisk += 10;
    }
    
    return Math.min(100, Math.max(0, baseRisk));
  };
  
  const riskScore = calculateRiskScore();
  const riskColor = riskScore > 70 ? "green" : riskScore > 40 ? "yellow" : "red";

  return (
    <Box maxW="100vw" overflow="hidden">
      {/* Page Header */}
      <Box 
        bg={cardBg} 
        borderRadius="lg" 
        boxShadow="sm" 
        p={6} 
        mb={6}
        borderWidth="1px"
        borderColor={borderColor}
      >
        <Breadcrumb mb={4} fontSize="sm" separator={<Icon as={FiChevronRight} color="gray.500" />}>
          <BreadcrumbItem>
            <BreadcrumbLink as={RouterLink} to="/" color={secondaryTextColor}>Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink color={accentColor} fontWeight="medium">Backtest</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>

        <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'flex-start', md: 'center' }} mb={4}>
          <Box>
            <Heading size="lg" mb={1} color={textColor} fontWeight="bold">
              Strategy Backtesting
            </Heading>
            <Text color={secondaryTextColor} fontSize="md">
              Test your trading strategies against historical market data
            </Text>
          </Box>
          
          <HStack spacing={3} mt={{ base: 3, md: 0 }}>
            <Tag size="md" colorScheme="blue" borderRadius="full" px={3} py={2}>
              <TagLeftIcon as={FiCode} />
              <TagLabel fontWeight="medium">{strategies.length} Strategies Available</TagLabel>
            </Tag>
            <Tag size="md" colorScheme="green" borderRadius="full" px={3} py={2}>
              <TagLeftIcon as={FiDollarSign} />
              <TagLabel fontWeight="medium">{tradingPairs.length} Trading Pairs</TagLabel>
            </Tag>
          </HStack>
        </Flex>

        <Text color={secondaryTextColor} fontSize="sm">
          Configure your backtest parameters below, then click "Run Backtest" to analyze how your strategy would have performed historically.
        </Text>
      </Box>

      {/* Main Content */}
      <Grid 
        templateColumns={{ base: '1fr', lg: '350px 1fr' }} 
        gap={{ base: 6, lg: 8 }}
        alignItems="flex-start"
      >
        {/* Backtest Form */}
        <GridItem>
          <BacktestForm
            formData={formData}
            strategies={strategies}
            selectedStrategy={selectedStrategy}
            onStrategyChange={handleStrategyChange}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            isRunning={isRunning}
            onExport={handleExport}
            hasResults={!!results}
          />
        </GridItem>

        {/* Results Section */}
        <GridItem>
          {isRunning ? (
            <Card 
              p={8} 
              borderRadius="lg" 
              bg={cardBg} 
              boxShadow="lg" 
              borderWidth="1px" 
              borderColor={borderColor}
              textAlign="center"
              height="400px"
              display="flex"
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
            >
              <Spinner size="xl" color={accentColor} thickness="4px" mb={4} />
              <Heading size="md" mb={2}>Running Backtest</Heading>
              <Text color={secondaryTextColor}>
                Analyzing {formData.strategyName} on {formData.tradingPair} from {formData.startDate} to {formData.endDate}
              </Text>
            </Card>
          ) : results ? (
            <Box>
              {/* Backtest Results */}
              <BacktestResults
                results={results}
                isRunning={isRunning}
                strategies={strategies}
              />
            </Box>
          ) : (
            <Card 
              p={8} 
              borderRadius="lg" 
              bg={cardBg} 
              boxShadow="lg" 
              borderWidth="1px" 
              borderColor={borderColor}
              textAlign="center"
              height="400px"
              display="flex"
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
            >
              <Icon as={FiBarChart2} boxSize={12} color="blue.400" mb={4} />
              <Heading size="md" mb={2}>No Backtest Results Yet</Heading>
              <Text color={secondaryTextColor} maxW="md" mx="auto">
                Configure your strategy parameters on the left and click "Run Backtest" to see performance metrics and charts.
              </Text>
            </Card>
          )}
        </GridItem>
      </Grid>
    </Box>
  );
};

export default Backtest; 
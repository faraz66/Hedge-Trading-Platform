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
} from '@chakra-ui/react';
import { FiBarChart2, FiChevronRight, FiTrendingUp, FiClock } from 'react-icons/fi';
import { BacktestForm } from '@/components/backtest/BacktestForm';
import { BacktestResults } from '@/components/backtest/BacktestResults';
import { Strategy, BacktestFormData, BacktestResults as BacktestResultsType } from '@/types/backtest';

const defaultFormData: BacktestFormData = {
  strategyName: 'BollingerBreakoutStrategy',
  tradingPair: 'BTC/USDT',
  startDate: '2013-01-01',
  endDate: new Date().toISOString().split('T')[0],
  optimize: false,
  strategyParams: {},
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
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const badgeBg = useColorModeValue('blue.50', 'blue.900');
  const badgeColor = useColorModeValue('blue.600', 'blue.200');

  useEffect(() => {
    const loadStrategies = async () => {
      try {
        console.log("Fetching strategies from API...");
        const response = await fetch("http://localhost:5002/api/strategies");
        const data = await response.json();
        console.log("API response:", data);
        
        if (data.status === 'success' && Array.isArray(data.strategies)) {
          console.log("Strategies loaded successfully:", data.strategies);
          setStrategies(data.strategies);
          if (data.strategies.length > 0) {
            const firstStrategy = data.strategies[0];
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
            console.warn("No strategies returned from API");
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
    if (!formData.strategyName) {
      toast({
        title: 'Error',
        description: 'Please select a strategy',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: "top-right",
        variant: "solid",
      });
      return;
    }

    try {
      setIsRunning(true);
      console.log("Selected strategy:", formData.strategyName);
      console.log("Available strategies:", strategies.map(s => s.name));
      
      const backendData = {
        strategyName: formData.strategyName,
        symbol: formData.tradingPair,
        startDate: formData.startDate,
        endDate: formData.endDate,
        optimize: false,
        strategyParams: formData.strategyParams,
        strategies: strategies.map(s => s.name)
      };

      console.log("Sending data to backend:", backendData);

      const response = await fetch('http://localhost:5002/run_backtest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendData),
      });

      const data = await response.json();
      console.log("Response from backend:", data);
      
      if (data.status === 'success') {
        setResults(data.results);
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

  return (
    <Box px={4} py={5} maxWidth="100%">
      <Box mb={6} pb={4} borderBottomWidth="1px" borderColor={borderColor}>
        <Breadcrumb separator={<Icon as={FiChevronRight} color="gray.500" />} fontSize="sm" color={secondaryTextColor} mb={4}>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink href="/backtest">Backtest</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        
        <Flex 
          direction={{ base: "column", md: "row" }} 
          align={{ base: "flex-start", md: "center" }} 
          justify="space-between" 
          mb={4}
        >
          <Flex align="center">
            <Icon as={FiBarChart2} boxSize={6} mr={3} color="blue.500" />
            <Box>
              <Heading size="lg" color={textColor} fontWeight="bold">Advanced Grid Strategy Backtester</Heading>
              <Flex align="center" mt={2}>
                <Badge bg={badgeBg} color={badgeColor} px={2} py={1} borderRadius="md" display="flex" alignItems="center">
                  <Icon as={FiTrendingUp} mr={1} />
                  <Text>Algorithmic Trading</Text>
                </Badge>
                <Badge bg={badgeBg} color={badgeColor} px={2} py={1} borderRadius="md" ml={2} display="flex" alignItems="center">
                  <Icon as={FiClock} mr={1} />
                  <Text>Historical Analysis</Text>
                </Badge>
              </Flex>
            </Box>
          </Flex>
        </Flex>
        
        <Text color={secondaryTextColor} fontSize="md" maxW="800px" mt={3}>
          Test your trading strategies against historical data to evaluate performance before deploying with real assets.
          Configure your strategies in the Strategies section, then select them here to run backtests with different timeframes and trading pairs.
        </Text>
      </Box>
      
      <Grid 
        templateColumns={{ base: '1fr', lg: '320px 1fr' }} 
        gap={{ base: 6, lg: 8 }}
        alignItems="start"
      >
        <GridItem width="100%">
          <BacktestForm
            formData={formData}
            strategies={strategies}
            selectedStrategy={selectedStrategy}
            isRunning={isRunning}
            onStrategyChange={handleStrategyChange}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            onExport={handleExport}
            hasResults={!!results}
          />
        </GridItem>

        <GridItem>
          <BacktestResults
            results={results}
            isRunning={isRunning}
            strategies={strategies}
          />
        </GridItem>
      </Grid>
    </Box>
  );
};

export default Backtest; 
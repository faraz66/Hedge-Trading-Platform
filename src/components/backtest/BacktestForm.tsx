import React, { ChangeEvent } from 'react';
import {
  Stack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  Heading,
  Box,
  Icon,
  useColorModeValue,
  Divider,
  Select,
  InputGroup,
  InputLeftElement,
  Flex,
  Link,
  Grid,
  GridItem,
  Tooltip,
  Badge,
  HStack,
  VStack,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
} from '@chakra-ui/react';
import { 
  FiPlay, 
  FiDownload, 
  FiCalendar, 
  FiSliders,
  FiInfo,
  FiEdit,
  FiBarChart2,
  FiAlertTriangle,
  FiChevronDown,
} from 'react-icons/fi';
import { Strategy, BacktestFormData } from '@/types/backtest';
import { tradingPairs } from '@/constants/trading';
import { Link as RouterLink } from 'react-router-dom';
import { timeframes, Timeframe } from '@/constants/timeframes';
import { useColorMode } from '@chakra-ui/react';

interface BacktestFormProps {
  formData: BacktestFormData;
  strategies: Strategy[];
  selectedStrategy: Strategy | null;
  isRunning: boolean;
  onStrategyChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  onInputChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onExport: () => void;
  hasResults: boolean;
}

const DateInput = ({ 
  name, 
  value, 
  onChange, 
  min, 
  label, 
  ...props 
}: { 
  name: string; 
  value: string; 
  onChange: (e: ChangeEvent<HTMLInputElement>) => void; 
  min?: string; 
  label: string; 
  [key: string]: any; 
}) => {
  const inputBgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const accentColor = useColorModeValue('blue.500', 'blue.300');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <FormControl>
      <FormLabel fontSize="sm" fontWeight="medium" mb={2}>{label}</FormLabel>
      <Box position="relative" width="100%">
        <InputGroup size="md">
          <InputLeftElement pointerEvents="none">
            <Icon as={FiCalendar} color="gray.400" />
          </InputLeftElement>
          <Input
            type="date"
            name={name}
            value={value}
            onChange={onChange}
            min={min}
            bg={inputBgColor}
            borderColor={borderColor}
            _hover={{ borderColor: accentColor }}
            _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
            pl="2.5rem"
            height="45px"
            width="100%"
            {...props}
          />
        </InputGroup>
        {value && (
          <Text fontSize="xs" color={secondaryTextColor} mt={1} ml={1}>
            {new Date(value).toLocaleDateString()}
          </Text>
        )}
      </Box>
    </FormControl>
  );
};

export const BacktestForm: React.FC<BacktestFormProps> = ({
  formData,
  strategies,
  selectedStrategy,
  isRunning,
  onStrategyChange,
  onInputChange,
  onSubmit,
  onExport,
  hasResults,
}) => {
  const { colorMode } = useColorMode();
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBgColor = useColorModeValue('white', 'gray.800');
  const inputBgColor = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
  const accentColor = useColorModeValue('blue.500', 'blue.300');
  const linkColor = useColorModeValue('blue.600', 'blue.300');
  const sectionHeaderBg = useColorModeValue('blue.50', 'gray.700');
  const hoverShadow = useColorModeValue('0px 4px 12px rgba(0, 0, 0, 0.05)', '0px 4px 12px rgba(0, 0, 0, 0.2)');

  return (
    <Box width="100%">
      <Box 
        borderWidth="1px" 
        borderRadius="lg" 
        borderColor={borderColor}
        overflow="hidden"
        bg={headerBgColor}
        mb={6}
        boxShadow="sm"
        transition="all 0.3s"
        _hover={{ boxShadow: hoverShadow }}
      >
        <Flex 
          p={5} 
          bg={sectionHeaderBg} 
          borderBottomWidth="1px" 
          borderColor={borderColor}
          align="center"
          justify="space-between"
        >
          <Heading size="md" fontWeight="600">Backtest Configuration</Heading>
        </Flex>

        <form onSubmit={onSubmit}>
          <VStack spacing={6} p={6} align="stretch" width="100%">
            {/* Strategy Selection Section */}
            <Box 
              borderRadius="md" 
              borderWidth="1px" 
              borderColor={borderColor}
              bg={headerBgColor}
              transition="all 0.2s"
              _hover={{ borderColor: accentColor, boxShadow: "sm" }}
              overflow="hidden"
            >
              <Flex 
                align="center" 
                bg={sectionHeaderBg} 
                p={4} 
                borderBottomWidth="1px" 
                borderColor={borderColor}
              >
                <Icon as={FiSliders} color={accentColor} mr={2} boxSize="18px" />
                <Heading size="sm" fontWeight="600">Strategy Selection</Heading>
              </Flex>
              
              <Box p={5}>
                <Grid templateColumns={{ base: "1fr", md: "3fr 1fr" }} gap={4} width="100%">
                  <GridItem>
                    <FormLabel fontSize="sm" fontWeight="medium" mb={2}>Select Strategy</FormLabel>
                    {strategies.length > 0 ? (
                      <Select
                        value={formData.strategyName}
                        onChange={onStrategyChange}
                        bg={inputBgColor}
                        borderColor={borderColor}
                        _hover={{ borderColor: accentColor }}
                        _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
                        size="md"
                        height="45px"
                        width="100%"
                        icon={<FiChevronDown />}
                        fontWeight="500"
                      >
                        {strategies.map(strategy => (
                          <option key={strategy.name} value={strategy.name}>
                            {strategy.name}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <Box 
                        p={4} 
                        borderWidth="1px" 
                        borderRadius="md" 
                        borderColor="orange.300" 
                        bg="orange.50" 
                        color="orange.800"
                        textAlign="center"
                      >
                        <Icon as={FiAlertTriangle} mr={2} />
                        No strategies available for backtesting
                      </Box>
                    )}
                  </GridItem>
                  <GridItem alignSelf="end">
                    {selectedStrategy && (
                      <Link 
                        as={RouterLink} 
                        to={`/strategies?edit=${selectedStrategy?.name}&from=backtest`}
                        display="inline-flex"
                        alignItems="center"
                        justifyContent="center"
                        bg={inputBgColor}
                        color={linkColor}
                        px={4}
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor={borderColor}
                        _hover={{ bg: 'blue.50', color: 'blue.600', borderColor: 'blue.300', transform: 'translateY(-1px)' }}
                        height="45px"
                        width="100%"
                        fontWeight="500"
                        transition="all 0.2s"
                      >
                        <Icon as={FiEdit} mr={2} />
                        Edit
                      </Link>
                    )}
                  </GridItem>
                </Grid>
              </Box>
            </Box>

            {/* Market Data Section */}
            <Box 
              borderRadius="md" 
              borderWidth="1px" 
              borderColor={borderColor}
              bg={headerBgColor}
              transition="all 0.2s"
              _hover={{ borderColor: accentColor, boxShadow: "sm" }}
              overflow="hidden"
            >
              <Flex 
                align="center" 
                bg={sectionHeaderBg} 
                p={4} 
                borderBottomWidth="1px" 
                borderColor={borderColor}
              >
                <Icon as={FiBarChart2} color={accentColor} mr={2} boxSize="18px" />
                <Heading size="sm" fontWeight="600">Market Data</Heading>
              </Flex>
              
              <Box p={5}>
                <VStack spacing={4} width="100%" align="stretch">
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="medium" mb={2}>Trading Pair</FormLabel>
                    <Select
                      name="tradingPair"
                      value={formData.tradingPair}
                      onChange={onInputChange}
                      bg={inputBgColor}
                      borderColor={borderColor}
                      _hover={{ borderColor: accentColor }}
                      _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
                      height="45px"
                      width="100%"
                      icon={<FiChevronDown />}
                      fontWeight="500"
                    >
                      {tradingPairs.map(pair => (
                        <option key={pair} value={pair}>
                          {pair}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="medium" mb={2}>Timeframe</FormLabel>
                    <Select
                      name="timeframe"
                      value={formData.timeframe}
                      onChange={onInputChange}
                      bg={inputBgColor}
                      borderColor={borderColor}
                      _hover={{ borderColor: accentColor }}
                      _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
                      height="45px"
                      width="100%"
                      icon={<FiChevronDown />}
                      fontWeight="500"
                    >
                      {timeframes.map(tf => (
                        <option key={tf.value} value={tf.value}>
                          {tf.label}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </VStack>
              </Box>
            </Box>

            {/* Date Range Section */}
            <Box 
              borderRadius="md" 
              borderWidth="1px" 
              borderColor={borderColor}
              bg={headerBgColor}
              transition="all 0.2s"
              _hover={{ borderColor: accentColor, boxShadow: "sm" }}
              overflow="visible"
            >
              <Flex 
                align="center" 
                bg={sectionHeaderBg} 
                p={4} 
                borderBottomWidth="1px" 
                borderColor={borderColor}
              >
                <Icon as={FiCalendar} color={accentColor} mr={2} boxSize="18px" />
                <Heading size="sm" fontWeight="600">Date Range</Heading>
              </Flex>
              
              <Box p={5}>
                <VStack spacing={4} width="100%" align="stretch">
                  <DateInput
                    name="startDate"
                    value={formData.startDate}
                    onChange={onInputChange}
                    label="Start Date"
                  />
                  
                  <DateInput
                    name="endDate"
                    value={formData.endDate}
                    onChange={onInputChange}
                    min={formData.startDate}
                    label="End Date"
                  />
                </VStack>
              </Box>
            </Box>

            {/* Submit Button Section */}
            <Box 
              borderRadius="md" 
              borderWidth="1px" 
              borderColor={borderColor}
              bg={headerBgColor}
              transition="all 0.2s"
              _hover={{ borderColor: accentColor, boxShadow: "sm" }}
              overflow="hidden"
            >
              <Box p={5}>
                <VStack spacing={4} width="100%">
                  <Button
                    type="submit"
                    colorScheme="blue"
                    size="md"
                    leftIcon={<Icon as={FiPlay} boxSize="16px" />}
                    isLoading={isRunning}
                    loadingText="Running..."
                    width="100%"
                    height="48px"
                    px={6}
                    fontWeight="600"
                    _hover={{ transform: 'translateY(-1px)', boxShadow: 'md' }}
                    transition="all 0.2s"
                  >
                    Run Backtest
                  </Button>
                  
                  {hasResults && (
                    <Button
                      onClick={onExport}
                      colorScheme="blue"
                      variant="outline"
                      size="md"
                      leftIcon={<Icon as={FiDownload} boxSize="16px" />}
                      width="100%"
                      height="48px"
                      px={6}
                      fontWeight="600"
                      _hover={{ transform: 'translateY(-1px)', boxShadow: 'sm' }}
                      transition="all 0.2s"
                    >
                      Export Results
                    </Button>
                  )}
                  
                  <Text fontSize="sm" color={secondaryTextColor} textAlign="center">
                    Running a backtest will simulate your strategy on historical data. 
                    This may take a few moments depending on the date range and strategy complexity.
                  </Text>
                </VStack>
              </Box>
            </Box>
          </VStack>
        </form>
      </Box>
    </Box>
  );
};

export default BacktestForm; 
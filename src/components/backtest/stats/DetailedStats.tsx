import React from 'react';
import {
  SimpleGrid,
  Box,
  Heading,
  Stack,
  Flex,
  Text,
  Badge,
  Icon,
  Tooltip,
  Progress,
  useColorModeValue,
  Divider
} from '@chakra-ui/react';
import { 
  FiTarget, 
  FiShield, 
  FiZap, 
  FiDollarSign, 
  FiArrowUp, 
  FiArrowDown,
  FiClock,
  FiTrendingUp,
  FiBarChart2,
  FiActivity
} from 'react-icons/fi';
import { BacktestMetrics } from '@/types/backtest';
import { getTimeframeByValue } from '@/constants/timeframes';

interface DetailedStatsProps {
  metrics: BacktestMetrics | undefined;
  timeframe?: string;
}

export const DetailedStats: React.FC<DetailedStatsProps> = ({ metrics, timeframe }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
  
  // Get timeframe info for display
  const timeframeInfo = timeframe ? getTimeframeByValue(timeframe) : null;

  if (!metrics) {
    return (
      <Box p={6} textAlign="center">
        <Text color={secondaryTextColor}>No metrics available</Text>
      </Box>
    );
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
      {/* Benchmark Comparison Section */}
      <Box
        bg={bgColor}
        p={6}
        borderRadius="lg"
        boxShadow="md"
        borderWidth="1px"
        borderColor={borderColor}
      >
        <Heading size="sm" mb={4} color={textColor} display="flex" alignItems="center">
          <Icon as={FiTarget} mr={2} />
          Benchmark Comparison
        </Heading>
        <Stack spacing={4}>
          <Box>
            <Flex justify="space-between" align="center" mb={2}>
              <Tooltip label="Strategy performance relative to benchmark" hasArrow>
                <Text color={secondaryTextColor}>Performance vs Benchmark</Text>
              </Tooltip>
              <Flex align="center">
                <Icon 
                  as={metrics?.excess_return >= 0 ? FiArrowUp : FiArrowDown}
                  color={metrics?.excess_return >= 0 ? 'green.500' : 'red.500'}
                  mr={2}
                />
                <Text fontWeight="medium" color={metrics?.excess_return >= 0 ? 'green.500' : 'red.500'}>
                  {(metrics?.excess_return ?? 0).toFixed(2)}%
                </Text>
              </Flex>
            </Flex>
            <Progress 
              value={50 + ((metrics?.excess_return ?? 0) / 2)} 
              colorScheme={metrics?.excess_return >= 0 ? 'green' : 'red'}
              size="sm"
              borderRadius="full"
            />
          </Box>
          <Flex justify="space-between" align="center">
            <Tooltip label="Correlation with benchmark returns" hasArrow>
              <Text color={secondaryTextColor}>Benchmark Correlation</Text>
            </Tooltip>
            <Badge colorScheme={metrics?.benchmark_correlation >= 0.7 ? 'green' : 'orange'}>
              {(metrics?.benchmark_correlation ?? 0).toFixed(2)}
            </Badge>
          </Flex>
          <Flex justify="space-between" align="center">
            <Tooltip label="Percentage of upside captured vs benchmark" hasArrow>
              <Text color={secondaryTextColor}>Upside Capture</Text>
            </Tooltip>
            <Text fontWeight="medium" color="green.500">
              {(metrics?.up_capture ?? 0).toFixed(2)}%
            </Text>
          </Flex>
          <Flex justify="space-between" align="center">
            <Tooltip label="Percentage of downside captured vs benchmark" hasArrow>
              <Text color={secondaryTextColor}>Downside Capture</Text>
            </Tooltip>
            <Text fontWeight="medium" color="red.500">
              {(metrics?.down_capture ?? 0).toFixed(2)}%
            </Text>
          </Flex>
          <Flex justify="space-between" align="center">
            <Tooltip label="Average return difference vs benchmark" hasArrow>
              <Text color={secondaryTextColor}>Tracking Difference</Text>
            </Tooltip>
            <Text fontWeight="medium" color={Math.abs(metrics?.tracking_difference ?? 0) < 1 ? 'green.500' : 'orange.500'}>
              {(metrics?.tracking_difference ?? 0).toFixed(2)}%
            </Text>
          </Flex>
          <Flex justify="space-between" align="center">
            <Tooltip label="Return from active management decisions" hasArrow>
              <Text color={secondaryTextColor}>Active Return</Text>
            </Tooltip>
            <Text fontWeight="medium" color={(metrics?.active_return ?? 0) > 0 ? 'green.500' : 'red.500'}>
              {(metrics?.active_return ?? 0).toFixed(2)}%
            </Text>
          </Flex>
        </Stack>
      </Box>

      {/* Advanced Hedging Metrics Section */}
      <Box
        bg={bgColor}
        p={6}
        borderRadius="lg"
        boxShadow="md"
        borderWidth="1px"
        borderColor={borderColor}
      >
        <Heading size="sm" mb={4} color={textColor} display="flex" alignItems="center">
          <Icon as={FiShield} mr={2} />
          Advanced Hedging
        </Heading>
        <Stack spacing={4}>
          <Box>
            <Flex justify="space-between" align="center" mb={2}>
              <Tooltip label="Overall effectiveness of hedging strategy" hasArrow>
                <Text color={secondaryTextColor}>Hedge Effectiveness</Text>
              </Tooltip>
              <Badge colorScheme={metrics?.hedge_effectiveness >= 0.8 ? 'green' : 
                               metrics?.hedge_effectiveness >= 0.6 ? 'yellow' : 'red'}>
                {((metrics?.hedge_effectiveness ?? 0) * 100).toFixed(1)}%
              </Badge>
            </Flex>
            <Progress 
              value={(metrics?.hedge_effectiveness ?? 0) * 100}
              colorScheme={metrics?.hedge_effectiveness >= 0.8 ? 'green' : 
                         metrics?.hedge_effectiveness >= 0.6 ? 'yellow' : 'red'}
              size="sm"
              borderRadius="full"
            />
          </Box>
          <Flex justify="space-between" align="center">
            <Tooltip label="Net exposure after hedging (Delta)" hasArrow>
              <Text color={secondaryTextColor}>Net Delta Exposure</Text>
            </Tooltip>
            <Text fontWeight="medium" color={Math.abs(metrics?.delta_exposure ?? 0) <= 0.2 ? 'green.500' : 'orange.500'}>
              {(metrics?.delta_exposure ?? 0).toFixed(2)}
            </Text>
          </Flex>
          <Flex justify="space-between" align="center">
            <Tooltip label="Cost of hedging relative to returns" hasArrow>
              <Text color={secondaryTextColor}>Hedge Cost Ratio</Text>
            </Tooltip>
            <Text fontWeight="medium" color={(metrics?.hedge_cost_ratio ?? 0) <= 0.1 ? 'green.500' : 'red.500'}>
              {((metrics?.hedge_cost_ratio ?? 0) * 100).toFixed(2)}%
            </Text>
          </Flex>
          <Flex justify="space-between" align="center">
            <Tooltip label="Margin utilized for hedging positions" hasArrow>
              <Text color={secondaryTextColor}>Margin Utilization</Text>
            </Tooltip>
            <Text fontWeight="medium" color={(metrics?.margin_utilization ?? 0) <= 0.7 ? 'green.500' : 'orange.500'}>
              {((metrics?.margin_utilization ?? 0) * 100).toFixed(1)}%
            </Text>
          </Flex>
          <Flex justify="space-between" align="center">
            <Tooltip label="Stability of hedge correlation over time" hasArrow>
              <Text color={secondaryTextColor}>Correlation Stability</Text>
            </Tooltip>
            <Text fontWeight="medium" color={(metrics?.correlation_stability ?? 0) >= 0.8 ? 'green.500' : 'orange.500'}>
              {((metrics?.correlation_stability ?? 0) * 100).toFixed(1)}%
            </Text>
          </Flex>
        </Stack>
      </Box>

      {/* Risk Exposure Section */}
      <Box
        bg={bgColor}
        p={6}
        borderRadius="lg"
        boxShadow="md"
        borderWidth="1px"
        borderColor={borderColor}
      >
        <Heading size="sm" mb={4} color={textColor} display="flex" alignItems="center">
          <Icon as={FiZap} mr={2} />
          Risk Exposure
        </Heading>
        <Stack spacing={4}>
          <SimpleGrid columns={2} spacing={4}>
            <Box>
              <Tooltip label="Exposure to price changes" hasArrow>
                <Text color={secondaryTextColor} mb={1}>Delta</Text>
              </Tooltip>
              <Text fontSize="lg" fontWeight="bold" color={textColor}>
                {(metrics?.delta_exposure ?? 0).toFixed(3)}
              </Text>
            </Box>
            <Box>
              <Tooltip label="Exposure to volatility changes" hasArrow>
                <Text color={secondaryTextColor} mb={1}>Vega</Text>
              </Tooltip>
              <Text fontSize="lg" fontWeight="bold" color={textColor}>
                {(metrics?.vega_exposure ?? 0).toFixed(3)}
              </Text>
            </Box>
            <Box>
              <Tooltip label="Exposure to time decay" hasArrow>
                <Text color={secondaryTextColor} mb={1}>Theta</Text>
              </Tooltip>
              <Text fontSize="lg" fontWeight="bold" color={textColor}>
                {(metrics?.theta_decay ?? 0).toFixed(3)}
              </Text>
            </Box>
            <Box>
              <Tooltip label="Exposure to delta changes" hasArrow>
                <Text color={secondaryTextColor} mb={1}>Gamma</Text>
              </Tooltip>
              <Text fontSize="lg" fontWeight="bold" color={textColor}>
                {(metrics?.gamma_exposure ?? 0).toFixed(3)}
              </Text>
            </Box>
          </SimpleGrid>
          <Divider my={2} />
          <Flex justify="space-between" align="center">
            <Tooltip label="95% Value at Risk - maximum expected loss" hasArrow>
              <Text color={secondaryTextColor}>VaR (95%)</Text>
            </Tooltip>
            <Text fontWeight="medium" color={(metrics?.var_95 ?? 0) <= 0.05 ? 'green.500' : 'red.500'}>
              {((metrics?.var_95 ?? 0) * 100).toFixed(2)}%
            </Text>
          </Flex>
          <Flex justify="space-between" align="center">
            <Tooltip label="Expected loss beyond VaR threshold" hasArrow>
              <Text color={secondaryTextColor}>Expected Shortfall</Text>
            </Tooltip>
            <Text fontWeight="medium" color={(metrics?.expected_shortfall ?? 0) <= 0.08 ? 'green.500' : 'red.500'}>
              {((metrics?.expected_shortfall ?? 0) * 100).toFixed(2)}%
            </Text>
          </Flex>
        </Stack>
      </Box>

      {/* Advanced Risk Metrics Section */}
      <Box
        bg={bgColor}
        p={6}
        borderRadius="lg"
        boxShadow="md"
        borderWidth="1px"
        borderColor={borderColor}
      >
        <Heading size="sm" mb={4} color={textColor} display="flex" alignItems="center">
          <Icon as={FiDollarSign} mr={2} />
          Advanced Risk Metrics
        </Heading>
        <Stack spacing={4}>
          <Flex justify="space-between" align="center">
            <Tooltip label="Probability-weighted ratio of gains vs losses" hasArrow>
              <Text color={secondaryTextColor}>Omega Ratio</Text>
            </Tooltip>
            <Badge colorScheme={metrics?.omega_ratio >= 1.5 ? 'green' : 
                             metrics?.omega_ratio >= 1 ? 'yellow' : 'red'}>
              {(metrics?.omega_ratio ?? 0).toFixed(2)}
            </Badge>
          </Flex>
          <Flex justify="space-between" align="center">
            <Tooltip label="Risk-adjusted return using drawdowns" hasArrow>
              <Text color={secondaryTextColor}>Sterling Ratio</Text>
            </Tooltip>
            <Text fontWeight="medium" color={textColor}>
              {(metrics?.sterling_ratio ?? 0).toFixed(2)}
            </Text>
          </Flex>
          <Flex justify="space-between" align="center">
            <Tooltip label="Measure of downside risk over time" hasArrow>
              <Text color={secondaryTextColor}>Ulcer Index</Text>
            </Tooltip>
            <Text fontWeight="medium" color={(metrics?.ulcer_index ?? 0) <= 0.5 ? 'green.500' : 'red.500'}>
              {(metrics?.ulcer_index ?? 0).toFixed(2)}
            </Text>
          </Flex>
          <Flex justify="space-between" align="center">
            <Tooltip label="Sum of gains divided by sum of losses" hasArrow>
              <Text color={secondaryTextColor}>Gain/Pain Ratio</Text>
            </Tooltip>
            <Text fontWeight="medium" color={(metrics?.gain_to_pain_ratio ?? 0) >= 1.5 ? 'green.500' : 'red.500'}>
              {(metrics?.gain_to_pain_ratio ?? 0).toFixed(2)}
            </Text>
          </Flex>
          <Flex justify="space-between" align="center">
            <Tooltip label="Modification of omega with focus on tail risk" hasArrow>
              <Text color={secondaryTextColor}>Kappa Three</Text>
            </Tooltip>
            <Text fontWeight="medium" color={(metrics?.kappa_three ?? 0) >= 1 ? 'green.500' : 'orange.500'}>
              {(metrics?.kappa_three ?? 0).toFixed(2)}
            </Text>
          </Flex>
          <Flex justify="space-between" align="center">
            <Tooltip label="Risk-adjusted return using drawdowns squared" hasArrow>
              <Text color={secondaryTextColor}>Burke Ratio</Text>
            </Tooltip>
            <Text fontWeight="medium" color={(metrics?.burke_ratio ?? 0) >= 0.2 ? 'green.500' : 'orange.500'}>
              {(metrics?.burke_ratio ?? 0).toFixed(2)}
            </Text>
          </Flex>
        </Stack>
      </Box>

      {/* Trade Performance Section - NEW */}
      <Box
        bg={bgColor}
        p={6}
        borderRadius="lg"
        boxShadow="md"
        borderWidth="1px"
        borderColor={borderColor}
      >
        <Heading size="sm" mb={4} color={textColor} display="flex" alignItems="center">
          <Icon as={FiBarChart2} mr={2} />
          Trade Performance
        </Heading>
        <Stack spacing={4}>
          <SimpleGrid columns={2} spacing={4}>
            <Box>
              <Tooltip label="Percentage of profitable trades" hasArrow>
                <Text color={secondaryTextColor} mb={1}>Win Rate</Text>
              </Tooltip>
              <Text fontSize="lg" fontWeight="bold" color={(metrics?.win_rate ?? 0) >= 0.5 ? 'green.500' : 'red.500'}>
                {((metrics?.win_rate ?? 0) * 100).toFixed(1)}%
              </Text>
            </Box>
            <Box>
              <Tooltip label="Gross profits divided by gross losses" hasArrow>
                <Text color={secondaryTextColor} mb={1}>Profit Factor</Text>
              </Tooltip>
              <Text fontSize="lg" fontWeight="bold" color={(metrics?.profit_factor ?? 0) >= 1.5 ? 'green.500' : 'red.500'}>
                {(metrics?.profit_factor ?? 0).toFixed(2)}
              </Text>
            </Box>
          </SimpleGrid>
          <Divider my={2} />
          <Flex justify="space-between" align="center">
            <Tooltip label="Average profit/loss per trade" hasArrow>
              <Text color={secondaryTextColor}>Avg Trade P&L</Text>
            </Tooltip>
            <Text fontWeight="medium" color={(metrics?.avg_trade ?? 0) > 0 ? 'green.500' : 'red.500'}>
              {(metrics?.avg_trade ?? 0).toFixed(2)}%
            </Text>
          </Flex>
          <Flex justify="space-between" align="center">
            <Tooltip label="Ratio of average win to average loss" hasArrow>
              <Text color={secondaryTextColor}>Win/Loss Ratio</Text>
            </Tooltip>
            <Text fontWeight="medium" color={(metrics?.win_loss_ratio ?? 0) >= 1.5 ? 'green.500' : 'orange.500'}>
              {(metrics?.win_loss_ratio ?? 0).toFixed(2)}
            </Text>
          </Flex>
          <Flex justify="space-between" align="center">
            <Tooltip label="Net profit divided by max drawdown" hasArrow>
              <Text color={secondaryTextColor}>Recovery Factor</Text>
            </Tooltip>
            <Text fontWeight="medium" color={(metrics?.recovery_factor ?? 0) >= 3 ? 'green.500' : 'orange.500'}>
              {(metrics?.recovery_factor ?? 0).toFixed(2)}
            </Text>
          </Flex>
        </Stack>
      </Box>

      {/* Market Timing Section - NEW */}
      <Box
        bg={bgColor}
        p={6}
        borderRadius="lg"
        boxShadow="md"
        borderWidth="1px"
        borderColor={borderColor}
      >
        <Heading size="sm" mb={4} color={textColor} display="flex" alignItems="center">
          <Icon as={FiClock} mr={2} />
          Market Timing
        </Heading>
        <Stack spacing={4}>
          <Flex justify="space-between" align="center">
            <Tooltip label="Average position holding time in hours" hasArrow>
              <Text color={secondaryTextColor}>Avg Hold Time</Text>
            </Tooltip>
            <Text fontWeight="medium" color={textColor}>
              {(metrics?.avg_hold_time ?? 0).toFixed(1)} hrs
            </Text>
          </Flex>
          <Flex justify="space-between" align="center">
            <Tooltip label="Percentage of time with open positions" hasArrow>
              <Text color={secondaryTextColor}>Time in Market</Text>
            </Tooltip>
            <Text fontWeight="medium" color={textColor}>
              {((metrics?.time_in_market ?? 0) * 100).toFixed(1)}%
            </Text>
          </Flex>
          <Flex justify="space-between" align="center">
            <Tooltip label="Speed of price convergence in mean-reversion strategies" hasArrow>
              <Text color={secondaryTextColor}>Mean Reversion Speed</Text>
            </Tooltip>
            <Badge colorScheme={(metrics?.mean_reversion_speed ?? 0) >= 0.5 ? 'green' : 'yellow'}>
              {(metrics?.mean_reversion_speed ?? 0).toFixed(2)}
            </Badge>
          </Flex>
          <Flex justify="space-between" align="center">
            <Tooltip label="Yield from rolling futures contracts" hasArrow>
              <Text color={secondaryTextColor}>Roll Yield</Text>
            </Tooltip>
            <Text fontWeight="medium" color={(metrics?.roll_yield ?? 0) > 0 ? 'green.500' : 'red.500'}>
              {((metrics?.roll_yield ?? 0) * 100).toFixed(2)}%
            </Text>
          </Flex>
        </Stack>
      </Box>

      {/* Alpha & Beta Analysis - NEW */}
      <Box
        bg={bgColor}
        p={6}
        borderRadius="lg"
        boxShadow="md"
        borderWidth="1px"
        borderColor={borderColor}
      >
        <Heading size="sm" mb={4} color={textColor} display="flex" alignItems="center">
          <Icon as={FiTrendingUp} mr={2} />
          Alpha & Beta Analysis
        </Heading>
        <Stack spacing={4}>
          <SimpleGrid columns={2} spacing={4}>
            <Box>
              <Tooltip label="Excess return compared to benchmark" hasArrow>
                <Text color={secondaryTextColor} mb={1}>Alpha</Text>
              </Tooltip>
              <Text fontSize="lg" fontWeight="bold" color={(metrics?.alpha ?? 0) > 0 ? 'green.500' : 'red.500'}>
                {(metrics?.alpha ?? 0).toFixed(2)}%
              </Text>
            </Box>
            <Box>
              <Tooltip label="Market correlation coefficient" hasArrow>
                <Text color={secondaryTextColor} mb={1}>Beta</Text>
              </Tooltip>
              <Text fontSize="lg" fontWeight="bold" color={Math.abs(metrics?.beta ?? 0) < 0.8 ? 'green.500' : 'orange.500'}>
                {(metrics?.beta ?? 0).toFixed(2)}
              </Text>
            </Box>
          </SimpleGrid>
          <Divider my={2} />
          <Flex justify="space-between" align="center">
            <Tooltip label="Return per unit of systematic risk" hasArrow>
              <Text color={secondaryTextColor}>Treynor Ratio</Text>
            </Tooltip>
            <Text fontWeight="medium" color={(metrics?.treynor_ratio ?? 0) > 0 ? 'green.500' : 'red.500'}>
              {(metrics?.treynor_ratio ?? 0).toFixed(2)}
            </Text>
          </Flex>
          <Flex justify="space-between" align="center">
            <Tooltip label="Risk-adjusted excess returns vs benchmark" hasArrow>
              <Text color={secondaryTextColor}>Information Ratio</Text>
            </Tooltip>
            <Text fontWeight="medium" color={(metrics?.information_ratio ?? 0) > 0.5 ? 'green.500' : 'orange.500'}>
              {(metrics?.information_ratio ?? 0).toFixed(2)}
            </Text>
          </Flex>
          <Flex justify="space-between" align="center">
            <Tooltip label="Risk from active management" hasArrow>
              <Text color={secondaryTextColor}>Active Risk</Text>
            </Tooltip>
            <Text fontWeight="medium" color={(metrics?.active_risk ?? 0) < 0.1 ? 'green.500' : 'orange.500'}>
              {((metrics?.active_risk ?? 0) * 100).toFixed(2)}%
            </Text>
          </Flex>
        </Stack>
      </Box>

      {/* Volatility Analysis - NEW */}
      <Box
        bg={bgColor}
        p={6}
        borderRadius="lg"
        boxShadow="md"
        borderWidth="1px"
        borderColor={borderColor}
      >
        <Heading size="sm" mb={4} color={textColor} display="flex" alignItems="center">
          <Icon as={FiActivity} mr={2} />
          Volatility Analysis
        </Heading>
        <Stack spacing={4}>
          <SimpleGrid columns={2} spacing={4}>
            <Box>
              <Tooltip label="Annual price volatility" hasArrow>
                <Text color={secondaryTextColor} mb={1}>Strategy Volatility</Text>
              </Tooltip>
              <Text fontSize="lg" fontWeight="bold" color={(metrics?.volatility ?? 0) < 0.2 ? 'green.500' : 'orange.500'}>
                {((metrics?.volatility ?? 0) * 100).toFixed(1)}%
              </Text>
            </Box>
            <Box>
              <Tooltip label="Volatility of benchmark returns" hasArrow>
                <Text color={secondaryTextColor} mb={1}>Benchmark Volatility</Text>
              </Tooltip>
              <Text fontSize="lg" fontWeight="bold" color={textColor}>
                {((metrics?.benchmark_volatility ?? 0) * 100).toFixed(1)}%
              </Text>
            </Box>
          </SimpleGrid>
          <Divider my={2} />
          <Flex justify="space-between" align="center">
            <Tooltip label="Standard deviation of return differences" hasArrow>
              <Text color={secondaryTextColor}>Tracking Error</Text>
            </Tooltip>
            <Text fontWeight="medium" color={(metrics?.tracking_error ?? 0) < 0.05 ? 'green.500' : 'orange.500'}>
              {((metrics?.tracking_error ?? 0) * 100).toFixed(2)}%
            </Text>
          </Flex>
          <Flex justify="space-between" align="center">
            <Tooltip label="Volatility of the price spread" hasArrow>
              <Text color={secondaryTextColor}>Spread Volatility</Text>
            </Tooltip>
            <Text fontWeight="medium" color={(metrics?.spread_volatility ?? 0) < 0.1 ? 'green.500' : 'orange.500'}>
              {((metrics?.spread_volatility ?? 0) * 100).toFixed(2)}%
            </Text>
          </Flex>
          <Flex justify="space-between" align="center">
            <Tooltip label="Risk from imperfect hedging correlation" hasArrow>
              <Text color={secondaryTextColor}>Basis Risk</Text>
            </Tooltip>
            <Text fontWeight="medium" color={(metrics?.basis_risk ?? 0) < 0.05 ? 'green.500' : 'red.500'}>
              {((metrics?.basis_risk ?? 0) * 100).toFixed(2)}%
            </Text>
          </Flex>
        </Stack>
      </Box>
    </SimpleGrid>
  );
};

export default DetailedStats; 
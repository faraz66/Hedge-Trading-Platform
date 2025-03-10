import React from 'react';
import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Icon,
  useColorModeValue
} from '@chakra-ui/react';
import { FiTrendingUp, FiPercent, FiActivity, FiArrowDown } from 'react-icons/fi';
import { BacktestMetrics } from '@/types/backtest';

interface PerformanceMetricsProps {
  metrics: BacktestMetrics | undefined;
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ metrics }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');

  return (
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
        <StatNumber fontSize="2xl" fontWeight="bold" color={(metrics?.total_return || 0) >= 0 ? 'green.500' : 'red.500'}>
          {(metrics?.total_return ?? 0).toFixed(2)}%
        </StatNumber>
        <StatHelpText fontSize="xs" mt={1}>
          <StatArrow type={(metrics?.total_return || 0) >= 0 ? 'increase' : 'decrease'} />
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
          {((metrics?.win_rate ?? 0) * 100).toFixed(2)}%
        </StatNumber>
        <StatHelpText fontSize="xs" mt={1}>
          {metrics?.total_trades ?? 0} Total Trades
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
          {(metrics?.sharpe_ratio ?? 0).toFixed(2)}
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
          {((metrics?.max_drawdown ?? 0) * 100).toFixed(2)}%
        </StatNumber>
        <StatHelpText fontSize="xs" mt={1}>
          Maximum Loss
        </StatHelpText>
      </Stat>
    </SimpleGrid>
  );
};

export default PerformanceMetrics; 
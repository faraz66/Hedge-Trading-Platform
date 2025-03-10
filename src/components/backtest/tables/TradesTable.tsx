import React from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Text,
  useColorModeValue,
  Tooltip
} from '@chakra-ui/react';
import { Trade } from '@/types/backtest';
import { FiArrowUpRight, FiArrowDownRight } from 'react-icons/fi';

interface TradesTableProps {
  trades: Trade[] | undefined;
}

export const TradesTable: React.FC<TradesTableProps> = ({ trades }) => {
  if (!trades || trades.length === 0) {
    return (
      <Box p={6} textAlign="center">
        <Text color={useColorModeValue('gray.600', 'gray.400')}>No trades available</Text>
      </Box>
    );
  }

  return (
    <Box overflowX="auto">
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th>Date & Time</Th>
            <Th>Type</Th>
            <Th isNumeric>Entry Price</Th>
            <Th isNumeric>Size</Th>
            <Th isNumeric>Value</Th>
            <Th isNumeric>Commission</Th>
            <Th isNumeric>Profit/Loss</Th>
            <Th isNumeric>
              <Tooltip label="Maximum unrealized profit reached during the trade">
                RUNUP
              </Tooltip>
            </Th>
            <Th isNumeric>
              <Tooltip label="Maximum unrealized loss experienced during the trade">
                MAX DRAWDOWN
              </Tooltip>
            </Th>
            <Th>Duration</Th>
            <Th isNumeric>Cumulative P/L</Th>
            <Th isNumeric>Return %</Th>
          </Tr>
        </Thead>
        <Tbody>
          {trades.map((trade: Trade, index: number) => {
            // Compare with previous trade to determine type
            const prevTrade = index > 0 ? trades[index - 1] : null;
            const tradeType = prevTrade && trade.price > prevTrade.price ? 'SELL' : 'BUY';
            
            // Calculate size based on value and price
            const tradeSize = 1.0; // Default size for each trade
            const positionValue = trade.price * tradeSize;
            
            const commission = (trade?.commission ?? 0);
            const returnPercentage = trade?.profit ? ((trade.profit - commission) / positionValue) * 100 : 0;
            const cumulativePL = trades
              .slice(0, index + 1)
              .reduce((sum, t) => sum + ((t.profit ?? 0) - (t.commission ?? 0)), 0);
            
            // Calculate duration between trades
            const duration = index < trades.length - 1
              ? Math.floor((new Date(trades[index + 1].timestamp).getTime() - new Date(trade.timestamp).getTime()) / (1000 * 60))
              : null;

            const formatDuration = (mins: number) => {
              if (mins < 60) return `${mins}m`;
              const hours = Math.floor(mins / 60);
              const remainingMins = mins % 60;
              if (hours < 24) return `${hours}h ${remainingMins}m`;
              const days = Math.floor(hours / 24);
              const remainingHours = hours % 24;
              return `${days}d ${remainingHours}h`;
            };

            // Calculate runup efficiency (how much of the potential profit was captured)
            const runupEfficiency = trade?.runup && trade?.profit && trade.runup > 0
              ? ((trade.profit - commission) / trade.runup) * 100 
              : 100; // Default to 100% if no runup data or runup is zero
              
            // Calculate drawdown as percentage of position value
            const drawdownPercentage = trade?.drawdown && positionValue > 0
              ? (trade.drawdown / positionValue) * 100 
              : 0;

            return (
              <Tr key={index}>
                <Td whiteSpace="nowrap">
                  {trade?.timestamp ? new Date(trade.timestamp).toLocaleString(undefined, {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                  }) : '-'}
                </Td>
                <Td>
                  <Badge
                    colorScheme={tradeType === 'BUY' ? 'green' : 'red'}
                    px={2}
                    py={1}
                    borderRadius="md"
                    fontSize="sm"
                    textTransform="uppercase"
                  >
                    {tradeType}
                  </Badge>
                </Td>
                <Td isNumeric>
                  <Text fontSize="sm" fontFamily="mono">
                    ${trade?.price?.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </Text>
                </Td>
                <Td isNumeric>
                  <Text fontSize="sm" fontFamily="mono">
                    {tradeSize.toLocaleString(undefined, {
                      minimumFractionDigits: 4,
                      maximumFractionDigits: 4
                    })}
                  </Text>
                </Td>
                <Td isNumeric>
                  <Text fontSize="sm" fontFamily="mono">
                    ${positionValue.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </Text>
                </Td>
                <Td isNumeric>
                  <Text fontSize="sm" fontFamily="mono" color="orange.500">
                    ${commission.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </Text>
                </Td>
                <Td isNumeric>
                  {trade?.profit !== undefined ? (
                    <Text
                      fontSize="sm"
                      fontFamily="mono"
                      color={(trade.profit - commission) >= 0 ? 'green.500' : 'red.500'}
                      fontWeight="medium"
                    >
                      ${(trade.profit - commission).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                        signDisplay: 'always'
                      })}
                    </Text>
                  ) : '-'}
                </Td>
                <Td isNumeric>
                  {trade?.runup !== undefined ? (
                    <Tooltip 
                      label={`Maximum unrealized profit: $${trade.runup.toFixed(2)} (Captured ${runupEfficiency.toFixed(0)}%)`}
                      placement="top"
                    >
                      <Text
                        fontSize="sm"
                        fontFamily="mono"
                        color="blue.500"
                        fontWeight="medium"
                        display="flex"
                        alignItems="center"
                        justifyContent="flex-end"
                      >
                        ${trade.runup.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </Text>
                    </Tooltip>
                  ) : (
                    <Text fontSize="sm" fontFamily="mono" color="gray.500">-</Text>
                  )}
                </Td>
                <Td isNumeric>
                  {trade?.drawdown !== undefined ? (
                    <Tooltip 
                      label={`Maximum unrealized loss: $${trade.drawdown.toFixed(2)} (${drawdownPercentage.toFixed(1)}% of position)`}
                      placement="top"
                    >
                      <Text
                        fontSize="sm"
                        fontFamily="mono"
                        color="red.500"
                        fontWeight="medium"
                        display="flex"
                        alignItems="center"
                        justifyContent="flex-end"
                      >
                        ${trade.drawdown.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </Text>
                    </Tooltip>
                  ) : (
                    <Text fontSize="sm" fontFamily="mono" color="gray.500">-</Text>
                  )}
                </Td>
                <Td>
                  <Text fontSize="sm" fontFamily="mono">
                    {duration ? formatDuration(duration) : '-'}
                  </Text>
                </Td>
                <Td isNumeric>
                  <Text
                    fontSize="sm"
                    fontFamily="mono"
                    color={cumulativePL >= 0 ? 'green.500' : 'red.500'}
                    fontWeight="medium"
                  >
                    ${cumulativePL.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                      signDisplay: 'always'
                    })}
                  </Text>
                </Td>
                <Td isNumeric>
                  <Text
                    fontSize="sm"
                    fontFamily="mono"
                    color={returnPercentage >= 0 ? 'green.500' : 'red.500'}
                  >
                    {returnPercentage.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                      signDisplay: 'always'
                    })}%
                  </Text>
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </Box>
  );
};

export default TradesTable; 
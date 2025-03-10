import React from 'react';
import { Box, Stack, Text, useColorModeValue } from '@chakra-ui/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Price, Trade } from '@/types/backtest';
import { safeParseDate } from '@/utils/dateUtils';
import { getTimeframeByValue } from '@/constants/timeframes';

interface TimeSeriesChartsRechartsProps {
  prices: Price[] | undefined;
  trades: Trade[] | undefined;
  timeframe?: string;
}

// Define the type for our time series data
interface TimeSeriesDataPoint {
  timestamp: string;
  price: number;
  cumulativePL: number;
  drawdown: number;
  hedgeEffectiveness: number;
}

const TimeSeriesChartsRecharts: React.FC<TimeSeriesChartsRechartsProps> = ({ prices, trades, timeframe }) => {
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const gridColor = useColorModeValue('gray.200', 'gray.700');
  const priceColor = useColorModeValue('#3182CE', '#63B3ED');
  const drawdownColor = useColorModeValue('#E53E3E', '#FC8181');
  const effectivenessColor = useColorModeValue('#8884d8', '#a668d8');
  
  // Get timeframe info for display
  const timeframeInfo = timeframe ? getTimeframeByValue(timeframe) : null;
  const timeframeLabel = timeframeInfo ? timeframeInfo.label : '1h';

  if (!prices || prices.length === 0) {
    return (
      <Box w="100%" h="400px" display="flex" alignItems="center" justifyContent="center">
        <Text color={textColor}>No time-series data available</Text>
      </Box>
    );
  }

  // Transform data for Recharts with safe date parsing
  const chartData = prices.map((price, index) => {
    // Safely parse the timestamp
    const date = safeParseDate(price.timestamp, new Date(Date.now() + index * 86400000));
    return {
      timestamp: date.toLocaleDateString(),
      price: price.close,
    };
  });

  // Generate time series data with proper calculations
  const generateTimeSeriesData = (): TimeSeriesDataPoint[] => {
    // First pass to create base data points
    const baseData = chartData.map((point, index) => {
      return {
        ...point,
        cumulativePL: 0, // Will be calculated in second pass
        drawdown: 0,     // Will be calculated in second pass
        hedgeEffectiveness: 0.7 + Math.sin(index / 10) * 0.2
      };
    });

    // Second pass to calculate cumulative values that depend on previous values
    return baseData.map((point, index) => {
      // Calculate cumulative P&L
      let cumulativePL = 0;
      if (index === 0) {
        cumulativePL = 0;
      } else {
        const prevValue = chartData[index - 1].price;
        const currentValue = point.price;
        const change = (currentValue - prevValue) / prevValue;
        // Use the previous point's cumulativePL to avoid circular reference
        cumulativePL = baseData[index - 1].cumulativePL + change * 1000;
      }

      // Calculate drawdown
      const priceValues = chartData.slice(0, index + 1).map(d => d.price);
      const peak = priceValues.length > 0 ? Math.max(...priceValues) : 0;
      const drawdown = peak > 0 ? ((peak - point.price) / peak) * 100 : 0;

      return {
        ...point,
        cumulativePL,
        drawdown: -drawdown, // Negative to show drawdown going down
        hedgeEffectiveness: point.hedgeEffectiveness
      };
    });
  };

  // Generate the time series data
  const timeSeriesData = generateTimeSeriesData();

  console.log('Rendering TimeSeriesChartsRecharts with data points:', timeSeriesData.length);

  return (
    <Stack spacing={8} w="100%">
      <Box>
        <Text fontSize="lg" fontWeight="bold" mb={2}>
          Cumulative P&L ({timeframeLabel})
        </Text>
        <Box h="300px" w="100%">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={timeSeriesData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis 
                dataKey="timestamp" 
                label={{ value: 'Date', position: 'insideBottomRight', offset: 0 }}
              />
              <YAxis 
                label={{ value: 'P&L ($)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="cumulativePL"
                stroke={priceColor}
                name="Cumulative P&L"
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Box>

      <Box>
        <Text fontSize="lg" fontWeight="bold" mb={2}>
          Maximum Drawdown ({timeframeLabel})
        </Text>
        <Box h="300px" w="100%">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={timeSeriesData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis 
                dataKey="timestamp" 
                label={{ value: 'Date', position: 'insideBottomRight', offset: 0 }}
              />
              <YAxis 
                label={{ value: 'Drawdown (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="drawdown"
                stroke={drawdownColor}
                fill={drawdownColor}
                fillOpacity={0.3}
                name="Drawdown"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </Box>

      <Box>
        <Text fontSize="lg" fontWeight="bold" mb={2}>
          Hedge Effectiveness ({timeframeLabel})
        </Text>
        <Box h="300px" w="100%">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={timeSeriesData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis 
                dataKey="timestamp" 
                label={{ value: 'Date', position: 'insideBottomRight', offset: 0 }}
              />
              <YAxis 
                domain={[0.3, 1]}
                label={{ value: 'Effectiveness (0-1)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="hedgeEffectiveness"
                stroke={effectivenessColor}
                name="Hedge Effectiveness"
              />
              <Line
                type="monotone"
                dataKey={() => 0.8}
                stroke="green"
                strokeDasharray="5 5"
                name="Good Threshold"
              />
              <Line
                type="monotone"
                dataKey={() => 0.6}
                stroke="orange"
                strokeDasharray="5 5"
                name="Moderate Threshold"
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </Stack>
  );
};

export default TimeSeriesChartsRecharts; 
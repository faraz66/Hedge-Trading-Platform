import React from 'react';
import { Box, Text, useColorModeValue } from '@chakra-ui/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  ComposedChart
} from 'recharts';
import { Price, Trade } from '@/types/backtest';
import { safeParseDate } from '@/utils/dateUtils';

interface PriceChartRechartsProps {
  prices: Price[] | undefined;
  trades: Trade[] | undefined;
}

const PriceChartRecharts: React.FC<PriceChartRechartsProps> = ({ prices, trades }) => {
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const gridColor = useColorModeValue('gray.200', 'gray.700');
  const buyColor = useColorModeValue('#38A169', '#48BB78');
  const sellColor = useColorModeValue('#E53E3E', '#FC8181');
  const priceColor = useColorModeValue('#3182CE', '#63B3ED');

  if (!prices || prices.length === 0) {
    return (
      <Box w="100%" h="400px" display="flex" alignItems="center" justifyContent="center">
        <Text color={textColor}>No price data available</Text>
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

  // Extract buy and sell trades with safe date parsing
  const buyTrades = trades
    ? trades
        .filter(trade => trade.type === 'BUY')
        .map((trade, index) => {
          // Safely parse the timestamp
          const date = safeParseDate(
            trade.timestamp, 
            new Date(Date.now() + (index + prices.length) * 86400000)
          );
          return {
            timestamp: date.toLocaleDateString(),
            price: trade.price,
            type: 'BUY'
          };
        })
    : [];

  const sellTrades = trades
    ? trades
        .filter(trade => trade.type === 'SELL')
        .map((trade, index) => {
          // Safely parse the timestamp
          const date = safeParseDate(
            trade.timestamp, 
            new Date(Date.now() + (index + prices.length + buyTrades.length) * 86400000)
          );
          return {
            timestamp: date.toLocaleDateString(),
            price: trade.price,
            type: 'SELL'
          };
        })
    : [];

  console.log('Rendering PriceChartRecharts with data:', {
    pricePoints: chartData.length,
    buyTrades: buyTrades.length,
    sellTrades: sellTrades.length
  });

  return (
    <Box w="100%" h="400px">
      <Text fontSize="lg" fontWeight="bold" mb={4}>Price Chart with Trades (Recharts)</Text>
      <ResponsiveContainer width="100%" height="90%">
        <ComposedChart
          data={chartData}
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
            label={{ value: 'Price', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="price"
            stroke={priceColor}
            dot={false}
            name="Price"
          />
          {buyTrades.map((trade, index) => (
            <Scatter
              key={`buy-${index}`}
              name={index === 0 ? 'Buy Trades' : ''}
              data={[{ timestamp: trade.timestamp, price: trade.price }]}
              fill={buyColor}
            />
          ))}
          {sellTrades.map((trade, index) => (
            <Scatter
              key={`sell-${index}`}
              name={index === 0 ? 'Sell Trades' : ''}
              data={[{ timestamp: trade.timestamp, price: trade.price }]}
              fill={sellColor}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default PriceChartRecharts; 
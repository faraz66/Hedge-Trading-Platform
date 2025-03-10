import React, { useEffect, useState } from 'react';
import { Box, Text, useColorModeValue, Alert, AlertIcon, AlertTitle, AlertDescription } from '@chakra-ui/react';
import Plot from 'react-plotly.js';
import { Price, Trade } from '@/types/backtest';
import { getTimeframeByValue } from '@/constants/timeframes';

interface PriceChartProps {
  prices: Price[] | undefined;
  trades: Trade[] | undefined;
  timeframe?: string;
}

export const PriceChart: React.FC<PriceChartProps> = ({ prices, trades, timeframe }) => {
  const [error, setError] = useState<string | null>(null);
  const plotBgColor = useColorModeValue('rgba(255,255,255,1)', 'rgba(32,34,38,1)');
  const plotGridColor = useColorModeValue('rgba(0,0,0,0.1)', 'rgba(255,255,255,0.1)');
  const plotFontColor = useColorModeValue('#1A202C', '#FFFFFF');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
  const priceLineColor = useColorModeValue('#3182CE', '#63B3ED');
  const buyMarkerColor = useColorModeValue('#38A169', '#48BB78');
  const sellMarkerColor = useColorModeValue('#E53E3E', '#FC8181');
  
  // Get timeframe info for display
  const timeframeInfo = timeframe ? getTimeframeByValue(timeframe) : null;
  const timeframeLabel = timeframeInfo ? timeframeInfo.label : '1h';

  useEffect(() => {
    console.log('PriceChart received prices:', prices);
    console.log('PriceChart received trades:', trades);
    console.log('PriceChart received timeframe:', timeframe);
    
    // Check if prices have the expected structure
    if (prices && prices.length > 0) {
      const firstPrice = prices[0];
      console.log('First price item:', firstPrice);
      if (!firstPrice.timestamp || firstPrice.close === undefined) {
        console.error('Price data has incorrect structure:', firstPrice);
        setError('Price data has incorrect structure');
      }
    }
    
    // Check if trades have the expected structure
    if (trades && trades.length > 0) {
      const firstTrade = trades[0];
      console.log('First trade item:', firstTrade);
      if (!firstTrade.timestamp || firstTrade.price === undefined) {
        console.error('Trade data has incorrect structure:', firstTrade);
        setError('Trade data has incorrect structure');
      }
    }
  }, [prices, trades, timeframe]);

  if (error) {
    return (
      <Alert status="error" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" height="400px">
        <AlertIcon boxSize="40px" mr={0} />
        <AlertTitle mt={4} mb={1} fontSize="lg">Chart Error</AlertTitle>
        <AlertDescription maxWidth="sm">{error}</AlertDescription>
      </Alert>
    );
  }

  if (!prices || !trades) {
    console.warn('PriceChart missing data - prices:', !!prices, 'trades:', !!trades);
    return (
      <Box w="100%" h="400px" display="flex" alignItems="center" justifyContent="center">
        <Text color={secondaryTextColor}>No price data available</Text>
      </Box>
    );
  }

  if (prices.length === 0) {
    console.warn('PriceChart has empty prices array');
    return (
      <Box w="100%" h="400px" display="flex" alignItems="center" justifyContent="center">
        <Text color={secondaryTextColor}>No price data available for chart</Text>
      </Box>
    );
  }

  try {
    // Prepare data for the chart
    const priceData = {
      x: prices.map((p: Price) => p.timestamp),
      y: prices.map((p: Price) => p.close),
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: 'Price',
      line: { color: priceLineColor, width: 2 }
    };

    // Prepare buy trades data if available
    const buyTradesData = trades && trades.length > 0 ? {
      x: trades.filter((t: Trade) => t.type === 'BUY').map((t: Trade) => t.timestamp),
      y: trades.filter((t: Trade) => t.type === 'BUY').map((t: Trade) => t.price),
      type: 'scatter' as const,
      mode: 'markers' as const,
      name: 'Buy',
      marker: { color: buyMarkerColor, size: 10 },
    } : null;

    // Prepare sell trades data if available
    const sellTradesData = trades && trades.length > 0 ? {
      x: trades.filter((t: Trade) => t.type === 'SELL').map((t: Trade) => t.timestamp),
      y: trades.filter((t: Trade) => t.type === 'SELL').map((t: Trade) => t.price),
      type: 'scatter' as const,
      mode: 'markers' as const,
      name: 'Sell',
      marker: { color: sellMarkerColor, size: 10 },
    } : null;

    // Combine all available data
    const chartData = [
      priceData,
      ...(buyTradesData ? [buyTradesData] : []),
      ...(sellTradesData ? [sellTradesData] : [])
    ];

    console.log('Rendering PriceChart with data:', chartData);

    return (
      <Box w="100%" h="400px">
        <Plot
          data={chartData}
          layout={{
            title: `Price Chart with Trades (${timeframeLabel})`,
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
  } catch (err) {
    console.error('Error rendering PriceChart:', err);
    setError(`Error rendering chart: ${err instanceof Error ? err.message : String(err)}`);
    
    return (
      <Alert status="error" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" height="400px">
        <AlertIcon boxSize="40px" mr={0} />
        <AlertTitle mt={4} mb={1} fontSize="lg">Chart Rendering Error</AlertTitle>
        <AlertDescription maxWidth="sm">{error || 'Unknown error rendering chart'}</AlertDescription>
      </Alert>
    );
  }
};

export default PriceChart; 
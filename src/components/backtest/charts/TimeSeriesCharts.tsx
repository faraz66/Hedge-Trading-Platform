import React, { useEffect } from 'react';
import { Box, Stack, Text, useColorModeValue } from '@chakra-ui/react';
import Plot from 'react-plotly.js';
import { Price, Trade } from '@/types/backtest';

interface TimeSeriesChartsProps {
  prices: Price[] | undefined;
  trades: Trade[] | undefined;
}

export const TimeSeriesCharts: React.FC<TimeSeriesChartsProps> = ({ prices, trades }) => {
  const plotBgColor = useColorModeValue('rgba(255,255,255,1)', 'rgba(32,34,38,1)');
  const plotGridColor = useColorModeValue('rgba(0,0,0,0.1)', 'rgba(255,255,255,0.1)');
  const plotFontColor = useColorModeValue('#1A202C', '#FFFFFF');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
  const priceLineColor = useColorModeValue('#3182CE', '#63B3ED');
  const sellMarkerColor = useColorModeValue('#E53E3E', '#FC8181');

  useEffect(() => {
    console.log('TimeSeriesCharts received prices:', prices);
    console.log('TimeSeriesCharts received trades:', trades);
  }, [prices, trades]);

  if (!prices || !trades) {
    console.warn('TimeSeriesCharts missing data - prices:', !!prices, 'trades:', !!trades);
    return (
      <Box w="100%" h="400px" display="flex" alignItems="center" justifyContent="center">
        <Text color={secondaryTextColor}>No time-series data available</Text>
      </Box>
    );
  }

  if (prices.length === 0) {
    console.warn('TimeSeriesCharts has empty prices array');
    return (
      <Box w="100%" h="400px" display="flex" alignItems="center" justifyContent="center">
        <Text color={secondaryTextColor}>No price data available for time series charts</Text>
      </Box>
    );
  }
  
  // Generate timestamps from prices
  const timestamps = prices.map((p: Price) => p.timestamp);
  
  // Generate mock data only if we have timestamps
  let cumulativePL: number[] = [];
  let drawdown: number[] = [];
  let hedgeEffectiveness: number[] = [];
  
  if (timestamps.length > 0) {
    // Mock data for cumulative P&L (in a real app, this would be calculated from trades)
    let runningPL = 0;
    cumulativePL = timestamps.map((_, i) => {
      // Add some randomness to simulate P&L changes
      if (i > 0) {
        const change = (Math.random() - 0.45) * 100;
        runningPL += change;
      }
      return runningPL;
    });
    
    // Mock data for drawdown
    let peak = 0;
    drawdown = cumulativePL.map(pl => {
      peak = Math.max(peak, pl);
      const currentDrawdown = peak > 0 ? ((peak - pl) / peak) * 100 : 0;
      return -currentDrawdown; // Negative to show drawdown going down
    });
    
    // Mock data for hedge effectiveness
    let baseEffectiveness = 0.8;
    hedgeEffectiveness = timestamps.map((_, i) => {
      // Add some randomness to simulate changes in hedge effectiveness
      if (i > 0) {
        const change = (Math.random() - 0.5) * 0.05;
        baseEffectiveness += change;
        baseEffectiveness = Math.max(0.4, Math.min(0.95, baseEffectiveness));
      }
      return baseEffectiveness;
    });
  }
  
  return (
    <Stack spacing={6}>
      {/* Cumulative P&L Chart */}
      <Box w="100%" h="300px">
        <Plot
          data={[
            {
              x: timestamps,
              y: cumulativePL,
              type: 'scatter',
              mode: 'lines',
              name: 'Cumulative P&L',
              line: { color: priceLineColor, width: 2 }
            }
          ]}
          layout={{
            title: 'Cumulative Profit & Loss',
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
              title: 'P&L ($)',
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
      
      {/* Drawdown Chart */}
      <Box w="100%" h="300px">
        <Plot
          data={[
            {
              x: timestamps,
              y: drawdown,
              type: 'scatter',
              mode: 'lines',
              name: 'Drawdown',
              line: { color: sellMarkerColor, width: 2 },
              fill: 'tozeroy'
            }
          ]}
          layout={{
            title: 'Drawdown Over Time',
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
              title: 'Drawdown (%)',
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
      
      {/* Hedge Effectiveness Chart */}
      <Box w="100%" h="300px">
        <Plot
          data={[
            {
              x: timestamps,
              y: hedgeEffectiveness,
              type: 'scatter',
              mode: 'lines',
              name: 'Hedge Effectiveness',
              line: { color: 'purple', width: 2 }
            },
            {
              x: [timestamps[0], timestamps[timestamps.length - 1]],
              y: [0.8, 0.8],
              type: 'scatter',
              mode: 'lines',
              name: 'Good Effectiveness Threshold',
              line: { color: 'green', width: 1, dash: 'dash' }
            },
            {
              x: [timestamps[0], timestamps[timestamps.length - 1]],
              y: [0.6, 0.6],
              type: 'scatter',
              mode: 'lines',
              name: 'Moderate Effectiveness Threshold',
              line: { color: 'orange', width: 1, dash: 'dash' }
            }
          ]}
          layout={{
            title: 'Hedge Effectiveness Over Time',
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
              title: 'Effectiveness (0-1)',
              titlefont: { size: 12 },
              range: [0.3, 1]
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
    </Stack>
  );
};

export default TimeSeriesCharts; 
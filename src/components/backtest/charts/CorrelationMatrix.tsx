import React from 'react';
import { Box, Text, useColorModeValue } from '@chakra-ui/react';
import Plot from 'react-plotly.js';
import { BacktestMetrics } from '@/types/backtest';

interface CorrelationMatrixProps {
  metrics: BacktestMetrics | undefined;
}

export const CorrelationMatrix: React.FC<CorrelationMatrixProps> = ({ metrics }) => {
  const plotBgColor = useColorModeValue('rgba(255,255,255,1)', 'rgba(32,34,38,1)');
  const plotFontColor = useColorModeValue('#1A202C', '#FFFFFF');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');

  if (!metrics) {
    return (
      <Box w="100%" h="400px" display="flex" alignItems="center" justifyContent="center">
        <Text color={secondaryTextColor}>No correlation data available</Text>
      </Box>
    );
  }
  
  // Define the metrics to include in the correlation matrix
  const metricKeys = [
    'hedge_effectiveness',
    'pair_correlation',
    'correlation_stability',
    'benchmark_correlation',
    'delta_exposure'
  ];
  
  // Create labels for the metrics
  const labels = [
    'Hedge Effectiveness',
    'Pair Correlation',
    'Correlation Stability',
    'Benchmark Correlation',
    'Delta Exposure'
  ];
  
  // Create a mock correlation matrix (in a real app, this would come from the backend)
  // Values between -1 and 1
  const correlationValues = [
    [1.0, 0.7, 0.6, 0.3, -0.2],
    [0.7, 1.0, 0.5, 0.4, -0.3],
    [0.6, 0.5, 1.0, 0.2, -0.1],
    [0.3, 0.4, 0.2, 1.0, -0.4],
    [-0.2, -0.3, -0.1, -0.4, 1.0]
  ];
  
  // Create annotations with the correct types for xref and yref
  const annotations = correlationValues.map((row, i) => 
    row.map((val, j) => ({
      xref: 'x' as const,
      yref: 'y' as const,
      x: labels[j],
      y: labels[i],
      text: val.toFixed(2),
      font: {
        color: Math.abs(val) > 0.5 ? 'white' : 'black',
        size: 10,
      },
      showarrow: false,
    }))
  ).flat();
  
  return (
    <Box w="100%" h="400px">
      <Plot
        data={[
          {
            z: correlationValues,
            x: labels,
            y: labels,
            type: 'heatmap',
            colorscale: 'RdBu',
            zmin: -1,
            zmax: 1,
            showscale: true,
            hoverongaps: false,
          }
        ]}
        layout={{
          title: 'Correlation Matrix',
          plot_bgcolor: plotBgColor,
          paper_bgcolor: plotBgColor,
          font: { color: plotFontColor },
          margin: { l: 120, r: 50, t: 50, b: 120 },
          xaxis: {
            tickangle: -45,
          },
          yaxis: {
            automargin: true,
          },
          annotations: annotations,
        }}
        style={{ width: '100%', height: '100%' }}
        config={{ responsive: true }}
      />
    </Box>
  );
};

export default CorrelationMatrix; 
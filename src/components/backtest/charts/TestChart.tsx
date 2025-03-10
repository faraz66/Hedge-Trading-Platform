import React, { useEffect, useState } from 'react';
import { Box, Text, useColorModeValue, Alert, AlertIcon, AlertTitle, AlertDescription } from '@chakra-ui/react';
import Plot from 'react-plotly.js';

const TestChart: React.FC = () => {
  const [plotlyError, setPlotlyError] = useState<string | null>(null);
  const plotBgColor = useColorModeValue('rgba(255,255,255,1)', 'rgba(32,34,38,1)');
  const plotGridColor = useColorModeValue('rgba(0,0,0,0.1)', 'rgba(255,255,255,0.1)');
  const plotFontColor = useColorModeValue('#1A202C', '#FFFFFF');

  useEffect(() => {
    // Check if Plotly is available
    try {
      console.log('Plotly component:', Plot);
      console.log('Plotly library:', (window as any).Plotly);
      
      if (!(window as any).Plotly) {
        console.error('Plotly is not available on window object');
        setPlotlyError('Plotly library is not loaded properly');
      }
    } catch (err) {
      console.error('Error checking Plotly:', err);
      setPlotlyError(`Error checking Plotly: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, []);

  // Simple static data for testing
  const x = [1, 2, 3, 4, 5];
  const y = [1, 2, 4, 8, 16];

  console.log('Rendering TestChart with simple data');

  if (plotlyError) {
    return (
      <Alert status="error" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" height="400px">
        <AlertIcon boxSize="40px" mr={0} />
        <AlertTitle mt={4} mb={1} fontSize="lg">Plotly Error</AlertTitle>
        <AlertDescription maxWidth="sm">{plotlyError}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Box w="100%" h="400px" border="1px solid red">
      <Text mb={4}>Test Chart (Static Data)</Text>
      <Plot
        data={[
          {
            x,
            y,
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Test Data',
          },
        ]}
        layout={{
          title: 'Simple Test Chart',
          plot_bgcolor: plotBgColor,
          paper_bgcolor: plotBgColor,
          font: { color: plotFontColor },
          xaxis: { 
            gridcolor: plotGridColor,
            title: 'X Axis',
          },
          yaxis: { 
            gridcolor: plotGridColor,
            title: 'Y Axis',
          },
        }}
        style={{ width: '100%', height: '100%' }}
        config={{ responsive: true }}
      />
    </Box>
  );
};

export default TestChart; 
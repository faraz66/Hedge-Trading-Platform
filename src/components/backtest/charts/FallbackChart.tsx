import React, { useEffect, useRef } from 'react';
import { Box, Text, useColorModeValue } from '@chakra-ui/react';
import { Price, Trade } from '@/types/backtest';

interface FallbackChartProps {
  prices: Price[] | undefined;
  trades: Trade[] | undefined;
  title?: string;
}

const FallbackChart: React.FC<FallbackChartProps> = ({ prices, trades, title = 'Price Chart' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const bgColor = useColorModeValue('white', '#1A1E23');
  const lineColor = useColorModeValue('#3182CE', '#63B3ED');
  const buyColor = useColorModeValue('#38A169', '#48BB78');
  const sellColor = useColorModeValue('#E53E3E', '#FC8181');

  useEffect(() => {
    if (!prices || prices.length === 0 || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Extract price values
    const priceValues = prices.map(p => p.close);
    const minPrice = Math.min(...priceValues);
    const maxPrice = Math.max(...priceValues);
    const priceRange = maxPrice - minPrice;

    // Draw price line
    ctx.beginPath();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;

    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;

    prices.forEach((price, index) => {
      const x = padding + (index / (prices.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((price.close - minPrice) / priceRange) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();

    // Draw trades if available
    if (trades && trades.length > 0) {
      trades.forEach(trade => {
        // Find the closest price point
        const tradeDate = new Date(trade.timestamp);
        const closestPriceIndex = prices.findIndex(p => 
          Math.abs(new Date(p.timestamp).getTime() - tradeDate.getTime()) < 86400000
        );
        
        if (closestPriceIndex >= 0) {
          const x = padding + (closestPriceIndex / (prices.length - 1)) * chartWidth;
          const y = padding + chartHeight - ((trade.price - minPrice) / priceRange) * chartHeight;
          
          ctx.beginPath();
          ctx.fillStyle = trade.type === 'BUY' ? buyColor : sellColor;
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 1;
    
    // X-axis
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    
    // Y-axis
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    
    ctx.stroke();

    // Draw labels
    ctx.fillStyle = textColor;
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    // X-axis labels (dates)
    const numXLabels = 5;
    for (let i = 0; i < numXLabels; i++) {
      const index = Math.floor((i / (numXLabels - 1)) * (prices.length - 1));
      const x = padding + (index / (prices.length - 1)) * chartWidth;
      const date = new Date(prices[index].timestamp);
      const dateStr = date.toLocaleDateString();
      
      ctx.fillText(dateStr, x, canvas.height - padding + 20);
    }
    
    // Y-axis labels (prices)
    const numYLabels = 5;
    ctx.textAlign = 'right';
    for (let i = 0; i < numYLabels; i++) {
      const price = minPrice + (i / (numYLabels - 1)) * priceRange;
      const y = padding + chartHeight - (i / (numYLabels - 1)) * chartHeight;
      
      ctx.fillText(price.toFixed(2), padding - 10, y + 5);
    }
    
    // Draw title
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, canvas.width / 2, 20);
    
  }, [prices, trades, bgColor, lineColor, buyColor, sellColor, textColor, title]);

  if (!prices || prices.length === 0) {
    return (
      <Box w="100%" h="400px" display="flex" alignItems="center" justifyContent="center">
        <Text color={textColor}>No price data available</Text>
      </Box>
    );
  }

  return (
    <Box w="100%" h="400px">
      <Text fontSize="lg" fontWeight="bold" mb={4}>{title} (HTML Canvas)</Text>
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={350} 
        style={{ width: '100%', height: '350px' }}
      />
    </Box>
  );
};

export default FallbackChart; 
import { useColorModeValue } from '@chakra-ui/react';

export const useBacktestTheme = () => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
  const tabsBg = useColorModeValue('gray.50', 'gray.900');
  const tabHoverBg = useColorModeValue('gray.100', 'gray.700');
  const strategyItemBg = useColorModeValue('gray.50', 'gray.700');
  const headerBgColor = useColorModeValue('gray.50', 'gray.900');
  
  // Chart colors
  const plotBgColor = useColorModeValue('rgba(255,255,255,1)', 'rgba(32,34,38,1)');
  const plotGridColor = useColorModeValue('rgba(0,0,0,0.1)', 'rgba(255,255,255,0.1)');
  const plotFontColor = useColorModeValue('#1A202C', '#FFFFFF');
  const priceLineColor = useColorModeValue('#3182CE', '#63B3ED');
  const buyMarkerColor = useColorModeValue('#38A169', '#48BB78');
  const sellMarkerColor = useColorModeValue('#E53E3E', '#FC8181');

  return {
    bgColor,
    borderColor,
    textColor,
    secondaryTextColor,
    tabsBg,
    tabHoverBg,
    strategyItemBg,
    headerBgColor,
    plotBgColor,
    plotGridColor,
    plotFontColor,
    priceLineColor,
    buyMarkerColor,
    sellMarkerColor
  };
};

export default useBacktestTheme; 
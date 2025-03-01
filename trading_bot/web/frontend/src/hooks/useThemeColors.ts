import { useColorModeValue } from '@chakra-ui/react'

export const useThemeColors = () => {
  return {
    // Base colors
    bgColor: useColorModeValue('white', '#1A1B1E'),
    borderColor: useColorModeValue('gray.200', '#2D3748'),
    hoverBg: useColorModeValue('gray.50', '#2D3748'),
    activeBg: useColorModeValue('blue.50', '#2C3A5C'),
    activeColor: useColorModeValue('blue.600', '#63B3ED'),
    textColor: useColorModeValue('gray.800', '#FFFFFF'),
    mutedTextColor: useColorModeValue('gray.600', '#E2E8F0'),
    
    // Content area colors
    mainBg: useColorModeValue('#F7FAFC', '#141517'),
    cardBg: useColorModeValue('white', '#1E1F23'),
    cardHoverBg: useColorModeValue('gray.50', '#25262B'),
    primaryTextColor: useColorModeValue('gray.900', '#FFFFFF'),
    secondaryTextColor: useColorModeValue('gray.600', '#E2E8F0'),
    borderColorContent: useColorModeValue('gray.200', '#2D3748'),
    accentColor: useColorModeValue('blue.500', '#63B3ED'),
    
    // Component specific colors
    tableBg: useColorModeValue('white', '#22242A'),
    tableHeaderBg: useColorModeValue('gray.50', '#2D3748'),
    tableHeaderColor: useColorModeValue('gray.700', '#FFFFFF'),
    tableBorderColor: useColorModeValue('gray.200', '#2D3748'),
    inputBg: useColorModeValue('white', '#2D3748'),
    inputColor: useColorModeValue('gray.800', '#FFFFFF'),
    labelColor: useColorModeValue('gray.700', '#FFFFFF'),
    placeholderColor: useColorModeValue('gray.400', '#A0AEC0'),
    
    // Shadows
    shadowColor: useColorModeValue('rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.4)')
  }
} 
import React, { useEffect, useState } from 'react'
import { Flex, Text, Box, useColorModeValue } from '@chakra-ui/react'
import { useThemeColors } from '../../hooks/useThemeColors'

interface PriceData {
  symbol: string
  price: number
  change: number
}

export const PriceMarquee = () => {
  const colors = useThemeColors()
  const [prices, setPrices] = useState<PriceData[]>([])

  // Simulated WebSocket connection - Replace with your actual WebSocket implementation
  useEffect(() => {
    const mockPrices: PriceData[] = [
      { symbol: 'BTCUSDT', price: 65000.98, change: +2.45 },
      { symbol: 'ETHUSDT', price: 3200.50, change: -1.20 },
      { symbol: 'BNBUSDT', price: 320.75, change: +0.85 },
      { symbol: 'ADAUSDT', price: 0.6148, change: -8.36 },
      { symbol: 'LTCUSDT', price: 120.67, change: -7.16 },
      { symbol: 'DOGEUSDT', price: 0.12, change: +5.23 },
    ]

    setPrices(mockPrices)

    // Simulate price updates
    const interval = setInterval(() => {
      setPrices(prevPrices => 
        prevPrices.map(price => ({
          ...price,
          price: price.price * (1 + (Math.random() * 0.002 - 0.001)),
          change: price.change + (Math.random() * 0.4 - 0.2)
        }))
      )
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Box
      width="100%"
      bg={colors.cardBg}
      borderBottom="1px solid"
      borderColor={colors.borderColor}
      overflow="hidden"
      position="relative"
    >
      <Flex
        py={2}
        css={{
          '@keyframes scroll': {
            '0%': { transform: 'translateX(0)' },
            '100%': { transform: 'translateX(-50%)' }
          },
          animation: 'scroll 30s linear infinite'
        }}
        style={{ whiteSpace: 'nowrap' }}
        width="fit-content"
      >
        {/* Duplicate the items for seamless scrolling */}
        {[...prices, ...prices].map((price, index) => (
          <Flex
            key={`${price.symbol}-${index}`}
            alignItems="center"
            mr={8}
            borderRadius="md"
            px={3}
            py={1}
          >
            <Text
              fontSize="sm"
              fontWeight="bold"
              color={colors.textColor}
              mr={2}
            >
              {price.symbol}
            </Text>
            <Text
              fontSize="sm"
              fontWeight="medium"
              color={colors.textColor}
              mr={2}
            >
              {price.price.toFixed(price.price >= 1 ? 2 : 4)}
            </Text>
            <Text
              fontSize="sm"
              fontWeight="medium"
              color={price.change >= 0 ? 'green.400' : 'red.400'}
            >
              {price.change >= 0 ? '+' : ''}{price.change.toFixed(2)}%
            </Text>
          </Flex>
        ))}
      </Flex>
    </Box>
  )
} 
import React from 'react'
import { IconButton, useColorMode } from '@chakra-ui/react'
import { BsSunFill, BsMoonStarsFill } from 'react-icons/bs'
import { useThemeColors } from '../../hooks/useThemeColors'

export const ThemeToggle = () => {
  const { colorMode, toggleColorMode } = useColorMode()
  const colors = useThemeColors()

  return (
    <IconButton
      className="modern-toggle-button"
      aria-label="Toggle color mode"
      icon={colorMode === 'light' ? <BsMoonStarsFill size={18} /> : <BsSunFill size={18} />}
      onClick={toggleColorMode}
      variant="ghost"
      borderRadius="12px"
      size="md"
      color={colorMode === 'light' ? 'gray.600' : 'yellow.300'}
      bg={colorMode === 'light' ? 'gray.100' : 'whiteAlpha.100'}
      _hover={{
        bg: colorMode === 'light' ? 'gray.200' : 'whiteAlpha.200',
        transform: 'translateY(-1px)'
      }}
      _active={{
        bg: colorMode === 'light' ? 'gray.300' : 'whiteAlpha.300',
        transform: 'translateY(0)'
      }}
      transition="all 0.2s ease-in-out"
    />
  )
} 
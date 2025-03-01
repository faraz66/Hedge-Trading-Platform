import React, { ReactNode } from 'react'
import { Flex, Text } from '@chakra-ui/react'
import { useThemeColors } from '@/hooks/useThemeColors'

interface NavbarProps {
  children?: ReactNode
}

export const Navbar = ({ children }: NavbarProps) => {
  const colors = useThemeColors()

  return (
    <Flex
      as="nav"
      className="modern-navbar"
      bg={colors.cardBg}
      borderBottom="1px solid"
      borderColor={colors.borderColorContent}
      px={8}
      py={4}
      h="64px"
      alignItems="center"
      justifyContent="space-between"
      position="sticky"
      top={0}
      zIndex={10}
      backdropFilter="blur(10px)"
      backgroundColor={colors.colorMode === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(26, 27, 30, 0.8)'}
    >
      <Text fontSize="lg" fontWeight="bold" color={colors.primaryTextColor}>
        HedgeBot
      </Text>
      {children}
    </Flex>
  )
} 
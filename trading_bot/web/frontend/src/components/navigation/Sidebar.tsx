import React from 'react'
import {
  Box,
  Flex,
  Icon,
  Text,
  IconButton,
  VStack,
  Tooltip,
  Divider,
} from '@chakra-ui/react'
import {
  FiHome,
  FiTrendingUp,
  FiGrid,
  FiSettings,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi'
import { Link as RouterLink, Location } from 'react-router-dom'
import { useThemeColors } from '../../hooks/useThemeColors'

interface SidebarProps {
  isExpanded: boolean
  setIsExpanded: (value: boolean) => void
  location: Location
}

const navItems = [
  { name: 'Dashboard', icon: FiHome, path: '/' },
  { name: 'Backtest', icon: FiTrendingUp, path: '/backtest' },
  { name: 'Strategies', icon: FiGrid, path: '/strategies' },
  { name: 'Settings', icon: FiSettings, path: '/settings' },
]

export const Sidebar = ({ isExpanded, setIsExpanded, location }: SidebarProps) => {
  const colors = useThemeColors()

  return (
    <Box
      className="modern-sidebar"
      w={isExpanded ? "240px" : "80px"}
      bg={colors.bgColor}
      borderRight="1px"
      borderColor={colors.borderColor}
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      position="relative"
      py={8}
      boxShadow={`0 4px 20px ${colors.shadowColor}`}
      zIndex={2}
    >
      {/* Logo/Title Area */}
      <Flex
        mb={10}
        alignItems="center"
        justifyContent="flex-start"
        px={isExpanded ? 8 : 4}
        position="relative"
      >
        <Text
          fontSize="2xl"
          fontWeight="bold"
          bgGradient="linear(to-r, blue.400, teal.400)"
          bgClip="text"
          letterSpacing="tight"
        >
          {isExpanded ? 'HedgeBot' : 'H'}
        </Text>
      </Flex>

      {/* Navigation Items */}
      <VStack spacing={2} align="stretch" px={3}>
        {navItems.map((item) => (
          <Tooltip
            key={item.path}
            label={!isExpanded ? item.name : ""}
            placement="right"
            hasArrow
          >
            <RouterLink to={item.path}>
              <Flex
                align="center"
                px={4}
                py={3.5}
                mx={2}
                borderRadius="xl"
                role="group"
                cursor="pointer"
                bg={location.pathname === item.path ? colors.activeBg : 'transparent'}
                color={location.pathname === item.path ? colors.activeColor : colors.textColor}
                _hover={{
                  bg: colors.hoverBg,
                  transform: 'translateX(3px)',
                  transition: 'all 0.2s ease',
                  color: colors.activeColor
                }}
                transition="all 0.2s ease"
                boxShadow={location.pathname === item.path ? 'sm' : 'none'}
              >
                <Icon 
                  as={item.icon} 
                  boxSize={5}
                  transition="all 0.2s ease"
                  _groupHover={{ color: colors.activeColor }}
                />
                {isExpanded && (
                  <Text 
                    ml={4} 
                    fontSize="sm" 
                    fontWeight={location.pathname === item.path ? "semibold" : "medium"}
                  >
                    {item.name}
                  </Text>
                )}
              </Flex>
            </RouterLink>
          </Tooltip>
        ))}
      </VStack>

      {/* Collapse Button */}
      <Box
        position="absolute"
        right="-16px"
        top="50%"
        transform="translateY(-50%)"
      >
        <IconButton
          aria-label="Toggle sidebar"
          icon={isExpanded ? <FiChevronLeft /> : <FiChevronRight />}
          size="md"
          color={colors.textColor}
          bg={colors.bgColor}
          boxShadow={`0 2px 12px ${colors.shadowColor}`}
          borderRadius="full"
          _hover={{
            bg: colors.hoverBg,
            transform: 'scale(1.1)',
            color: colors.activeColor
          }}
          onClick={() => setIsExpanded(!isExpanded)}
          transition="all 0.2s ease"
        />
      </Box>
    </Box>
  )
} 
import React, { useState } from 'react'
import { ReactNode } from 'react'
import {
  Box,
  Flex,
  Icon,
  useColorModeValue,
  Link,
  Drawer,
  DrawerContent,
  Text,
  useDisclosure,
  BoxProps,
  FlexProps,
  CloseButton,
  IconButton,
  useColorMode,
  Container,
  Image,
  VStack,
  Tooltip,
  Divider,
  useToast,
} from '@chakra-ui/react'
import {
  FiHome,
  FiTrendingUp,
  FiGrid,
  FiSettings,
  FiMenu,
  FiChevronLeft,
  FiChevronRight,
  FiMoon,
  FiSun,
} from 'react-icons/fi'
import { BsSunFill, BsMoonStarsFill } from 'react-icons/bs'
import { IconType } from 'react-icons'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import axios from 'axios'
import api from '../config/api'

// Import components from new structure
import { Sidebar } from './navigation/Sidebar'
import { Navbar } from './navigation/Navbar'
import { ThemeToggle } from './common/ThemeToggle'
import { useThemeColors } from '../hooks/useThemeColors'
import { LayoutStyles } from '../styles/LayoutStyles'
import { PriceMarquee } from './common/PriceMarquee'

interface NavItem {
  name: string
  icon: IconType
  path: string
}

const navItems: Array<NavItem> = [
  { name: 'Dashboard', icon: FiHome, path: '/' },
  { name: 'Backtest', icon: FiTrendingUp, path: '/backtest' },
  { name: 'Strategies', icon: FiGrid, path: '/strategies' },
  { name: 'Settings', icon: FiSettings, path: '/settings' },
]

interface BacktestParams {
  tradingPair: string
  startDate: string
  endDate: string
  optimizeStrategy: boolean
}

const runBacktest = async (params: BacktestParams) => {
  console.log('Running backtest with params:', params)
  try {
    const response = await api.post('/run_backtest', params)
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Backtest error:', error)
      throw new Error(error.response?.data?.message || 'Network error occurred')
    }
    throw error
  }
}

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { colorMode } = useColorMode()
  const location = useLocation()
  const [isExpanded, setIsExpanded] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToast()
  
  const handleBacktest = async (params: BacktestParams) => {
    setIsLoading(true)
    try {
      const result = await runBacktest(params)
      toast({
        title: 'Backtest completed',
        description: 'Results have been loaded successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
      // Handle the result data here
    } catch (error) {
      toast({
        title: 'Backtest failed',
        description: error instanceof Error ? error.message : 'Network error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Use custom hook for theme colors
  const colors = useThemeColors()

  return (
    <Flex h="100vh" overflow="hidden" bg={colors.mainBg}>
      {/* Sidebar Component */}
      <Sidebar 
        isExpanded={isExpanded} 
        setIsExpanded={setIsExpanded}
        location={location}
      />

      {/* Main Content Area */}
      <Box flex={1} overflow="auto" bg={colors.mainBg}>
        {/* Navbar Component */}
        <Navbar>
          <ThemeToggle />
        </Navbar>

        {/* Price Marquee */}
        <PriceMarquee />

        {/* Content Area */}
        <Box p={8} className="content-area">
          <LayoutStyles colorMode={colorMode} colors={colors} />
          {React.cloneElement(children as React.ReactElement, {
            onBacktest: handleBacktest,
            isLoading
          })}
        </Box>
      </Box>
    </Flex>
  )
}

interface SidebarProps extends BoxProps {
  onClose: () => void
}

const SidebarContent = ({ onClose, ...rest }: SidebarProps) => {
  const location = useLocation()
  const { colorMode, toggleColorMode } = useColorMode()
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  
  return (
    <Box
      transition="0.3s ease"
      bg={bgColor}
      borderRight="1px"
      borderRightColor={borderColor}
      w={{ base: 'full', md: 60 }}
      pos="fixed"
      h="full"
      {...rest}>
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <Flex alignItems="center">
          {/* You can add your logo here */}
          <Text
            fontSize="2xl"
            fontFamily="monospace"
            fontWeight="bold"
            bgGradient="linear(to-r, cyan.400, blue.500)"
            bgClip="text">
            HedgeBot
          </Text>
        </Flex>
        <CloseButton display={{ base: 'flex', md: 'none' }} onClick={onClose} />
      </Flex>
      <Flex
        direction="column"
        flex="1"
        overflow="auto"
        px="4"
        py="4"
        justify="space-between"
        h="calc(100vh - 5rem)">
        <Box>
          {navItems.map((item) => (
            <NavItem 
              key={item.name} 
              icon={item.icon} 
              path={item.path}
              isActive={location.pathname === item.path}>
              {item.name}
            </NavItem>
          ))}
        </Box>
        <Box pb="4">
          <Flex
            p="4"
            mx="4"
            borderRadius="lg"
            role="group"
            cursor="pointer"
            onClick={toggleColorMode}
            _hover={{
              bg: 'cyan.400',
              color: 'white',
            }}>
            <Icon
              mr="4"
              fontSize="16"
              as={colorMode === 'light' ? FiMoon : FiSun}
            />
            <Text>{colorMode === 'light' ? 'Dark Mode' : 'Light Mode'}</Text>
          </Flex>
        </Box>
      </Flex>
    </Box>
  )
}

interface NavItemProps extends FlexProps {
  icon: IconType
  path: string
  isActive?: boolean
  children: ReactNode
}

const NavItem = ({ icon, path, isActive, children, ...rest }: NavItemProps) => {
  const activeBg = useColorModeValue('blue.50', 'blue.900')
  const activeColor = useColorModeValue('blue.600', 'blue.300')
  const hoverBg = useColorModeValue('gray.100', 'gray.700')
  const textColor = useColorModeValue('gray.800', 'gray.100')
  
  return (
    <Link
      as={RouterLink}
      to={path}
      style={{ textDecoration: 'none' }}
      _focus={{ boxShadow: 'none' }}>
      <Flex
        align="center"
        p="4"
        mx="4"
        my="2"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        bg={isActive ? activeBg : 'transparent'}
        color={isActive ? activeColor : textColor}
        _hover={{
          bg: hoverBg,
          color: activeColor,
        }}
        fontWeight={isActive ? "semibold" : "medium"}
        fontSize="md"
        transition="all 0.2s"
        {...rest}>
        <Icon
          mr="4"
          fontSize="18"
          as={icon}
          color={isActive ? activeColor : 'inherit'}
          _groupHover={{
            color: activeColor,
          }}
        />
        {children}
      </Flex>
    </Link>
  )
}

interface MobileProps extends FlexProps {
  onOpen: () => void
}

const MobileNav = ({ onOpen, ...rest }: MobileProps) => {
  const bgColor = useColorModeValue('white', 'gray.900')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const textColor = useColorModeValue('gray.800', 'gray.100')

  return (
    <Flex
      ml={{ base: 0, md: 60 }}
      px={{ base: 4, md: 4 }}
      height="20"
      alignItems="center"
      bg={bgColor}
      borderBottomWidth="1px"
      borderBottomColor={borderColor}
      justifyContent={{ base: 'space-between', md: 'flex-end' }}
      color={textColor}
      {...rest}
    >
      <IconButton
        display={{ base: 'flex', md: 'none' }}
        onClick={onOpen}
        variant="outline"
        aria-label="open menu"
        icon={<FiMenu />}
      />

      <Text
        display={{ base: 'flex', md: 'none' }}
        fontSize="2xl"
        fontFamily="monospace"
        fontWeight="bold"
        bgGradient={useColorModeValue(
          "linear(to-r, blue.500, teal.500)",
          "linear(to-r, blue.300, teal.300)"
        )}
        bgClip="text"
      >
        HedgeBot
      </Text>
    </Flex>
  )
} 
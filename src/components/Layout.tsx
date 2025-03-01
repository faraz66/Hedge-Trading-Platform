import React, { useState } from 'react';
import {
  Box,
  Flex,
  IconButton,
  useColorMode,
  useColorModeValue,
  Link as ChakraLink,
  VStack,
  Text,
  Icon,
  Tooltip,
  Divider,
  useDisclosure,
  Collapse,
  Button,
  HStack,
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { 
  FiMoon, 
  FiSun, 
  FiHome, 
  FiBarChart2, 
  FiSettings, 
  FiTrendingUp, 
  FiMenu, 
  FiChevronLeft, 
  FiChevronRight,
  FiGithub,
  FiInfo
} from 'react-icons/fi';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const bg = useColorModeValue('white', 'gray.800');
  const color = useColorModeValue('gray.800', 'white');
  const sideNavBg = useColorModeValue('gray.50', 'gray.900');
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(true);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: FiHome },
    { name: 'Backtest', path: '/backtest', icon: FiBarChart2 },
    { name: 'Strategies', path: '/strategies', icon: FiTrendingUp },
    { name: 'Settings', path: '/settings', icon: FiSettings },
  ];

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  const navWidth = isExpanded ? "220px" : "70px";
  const headerBg = useColorModeValue('white', 'gray.900');
  const headerBorderColor = useColorModeValue('gray.200', 'gray.700');
  const logoColor = useColorModeValue('blue.600', 'blue.400');

  return (
    <Box minH="100vh" bg={bg} color={color}>
      {/* Top Header */}
      <Flex
        as="header"
        align="center"
        justify="space-between"
        wrap="wrap"
        padding="1rem"
        bg={headerBg}
        color={useColorModeValue('gray.600', 'white')}
        borderBottom="1px"
        borderColor={headerBorderColor}
        boxShadow="sm"
        h="64px"
        position="fixed"
        w="full"
        zIndex="20"
      >
        <Flex align="center" ml={isExpanded ? "220px" : "70px"} transition="margin-left 0.3s ease">
          <ChakraLink as={RouterLink} to="/" fontSize="xl" fontWeight="bold" color={logoColor}>
            HedgeBot
          </ChakraLink>
        </Flex>

        <HStack spacing={2}>
          <IconButton
            aria-label="GitHub"
            icon={<FiGithub />}
            variant="ghost"
            size="md"
            borderRadius="md"
          />
          <IconButton
            aria-label="Toggle dark mode"
            icon={colorMode === 'dark' ? <FiSun /> : <FiMoon />}
            onClick={toggleColorMode}
            variant="ghost"
            size="md"
            borderRadius="md"
          />
        </HStack>
      </Flex>

      {/* Main Content with Side Nav */}
      <Flex pt="64px">
        {/* Side Navigation */}
        <Box
          as="nav"
          w={navWidth}
          h="calc(100vh - 64px)"
          bg={sideNavBg}
          borderRight="1px"
          borderColor={useColorModeValue('gray.200', 'gray.700')}
          position="fixed"
          left={0}
          top="64px"
          transition="width 0.3s ease"
          boxShadow="sm"
          zIndex="10"
          overflowX="hidden"
        >
          <Flex 
            direction="column" 
            h="full" 
            justify="space-between"
          >
            <Box>
              <Box p={4} mb={2}>
                <Text 
                  fontSize="xs" 
                  fontWeight="bold" 
                  textTransform="uppercase" 
                  letterSpacing="wider"
                  color={useColorModeValue('gray.500', 'gray.400')}
                  opacity={isExpanded ? 1 : 0}
                  transition="opacity 0.3s ease"
                >
                  Main Navigation
                </Text>
              </Box>
              
              <VStack spacing={1} align="start">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Tooltip 
                      key={item.path} 
                      label={item.name} 
                      placement="right" 
                      isDisabled={isExpanded}
                      hasArrow
                    >
                      <ChakraLink
                        as={RouterLink}
                        to={item.path}
                        w="full"
                        _hover={{ textDecoration: 'none' }}
                        px={3}
                      >
                        <Flex
                          align="center"
                          p={3}
                          mx={1}
                          borderRadius="lg"
                          bg={isActive ? useColorModeValue('blue.50', 'blue.900') : 'transparent'}
                          color={isActive ? 'blue.500' : useColorModeValue('gray.600', 'gray.400')}
                          _hover={{ 
                            bg: useColorModeValue('gray.100', 'gray.700'),
                            color: isActive ? 'blue.500' : useColorModeValue('gray.800', 'white')
                          }}
                          transition="all 0.2s"
                          fontWeight={isActive ? "semibold" : "medium"}
                        >
                          <Icon as={item.icon} boxSize={5} />
                          {isExpanded && (
                            <Text ml={4} fontSize="md" opacity={isExpanded ? 1 : 0} transition="opacity 0.2s">
                              {item.name}
                            </Text>
                          )}
                        </Flex>
                      </ChakraLink>
                    </Tooltip>
                  );
                })}
              </VStack>
            </Box>
            
            <Box p={4}>
              <Divider mb={4} />
              <Flex 
                direction="column" 
                align="center" 
                justify="center"
                mb={2}
              >
                {isExpanded ? (
                  <Text fontSize="xs" color="gray.500" mb={3} textAlign="center">
                    HedgeBot v1.0.0
                  </Text>
                ) : (
                  <Text fontSize="xs" color="gray.500" mb={3} textAlign="center">
                    v1.0
                  </Text>
                )}
                
                <IconButton
                  aria-label="Toggle sidebar"
                  icon={isExpanded ? <FiChevronLeft /> : <FiChevronRight />}
                  onClick={toggleSidebar}
                  variant="outline"
                  size="sm"
                  borderRadius="md"
                  colorScheme="blue"
                  w={isExpanded ? "100%" : "40px"}
                  h="36px"
                />
              </Flex>
            </Box>
          </Flex>
        </Box>

        {/* Main Content */}
        <Box 
          as="main" 
          ml={navWidth} 
          p={6} 
          w={`calc(100% - ${navWidth})`}
          transition="margin-left 0.3s ease, width 0.3s ease"
        >
          {children}
        </Box>
      </Flex>
    </Box>
  );
};

export default Layout; 
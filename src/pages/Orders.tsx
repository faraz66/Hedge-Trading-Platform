import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Box,
  Flex,
  Text,
  Select,
  Input,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  HStack,
  Icon,
  useColorModeValue,
  InputGroup,
  InputLeftElement,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Heading,
  Divider,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  ButtonGroup,
  Radio,
  RadioGroup,
  Stack,
  Tooltip,
  useToast,
  IconButton,
  Checkbox,
  Circle,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  SimpleGrid,
  Grid,
  GridItem,
  VStack,
  Container,
  Tag,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  StatGroup,
  useColorMode,
  useDisclosure,
  Spacer,
  Progress,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import { 
  FiSearch, 
  FiDownload, 
  FiCalendar, 
  FiChevronDown, 
  FiChevronLeft, 
  FiChevronRight,
  FiInfo,
  FiCopy,
  FiFilter,
  FiArrowUp,
  FiArrowDown,
  FiEdit,
  FiTrash2,
  FiX,
  FiRefreshCw,
  FiDollarSign,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiPrinter,
  FiEye,
  FiList,
  FiGrid,
  FiChevronUp,
  FiTrendingUp,
  FiTrendingDown,
  FiActivity,
  FiBarChart2,
  FiPieChart,
  FiZap,
  FiTarget,
  FiMaximize,
  FiMinimize,
  FiPercent,
} from 'react-icons/fi';
import { useSearchParams } from 'react-router-dom';
import Plot from 'react-plotly.js';

interface Order {
  symbol: string;
  type: 'Buy' | 'Sell';
  volume: number;
  openPrice: number;
  currentPrice: number;
  takeProfit: string;
  stopLoss: string;
  orderId: string;
  openTime: string;
  swap: number;
  profitLoss: number;
  isApproximate?: boolean;
}

interface SortConfig {
  key: keyof Order | '';
  direction: 'asc' | 'desc';
}

interface PendingOrder {
  symbol: string;
  type: 'Buy' | 'Sell';
  volume: number;
  price: number;
  currentPrice: number;
  takeProfit: string;
  stopLoss: string;
  orderId: string;
  creationTime: string;
  expirationTime: string;
  comment: string;
}

// Add interface for closed orders
interface ClosedOrder {
  symbol: string;
  type: 'Buy' | 'Sell';
  volume: number;
  openPrice: number;
  closePrice: number;
  takeProfit: string;
  stopLoss: string;
  orderId: string;
  openTime: string;
  closeTime: string;
  swap: number;
  commission: number;
  reason: string;
  profitLoss: number;
}

// Add new interfaces for analytics

interface PerformanceMetric {
  label: string;
  value: number;
  change: number;
  icon: React.ReactElement;
  color: string;
}

interface TradeMetrics {
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  largestWin: number;
  largestLoss: number;
  avgHoldTime: number;
  totalTrades: number;
}

const ITEMS_PER_PAGE = 10;

const Orders: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTab, setSelectedTab] = useState(() => {
    const status = searchParams.get('status');
    if (status === 'pending') return 1;
    if (status === 'closed') return 2;
    return 0;
  });
  const [dateRange, setDateRange] = useState('2024-04-01 ~ 2025-03-02');
  const [symbol, setSymbol] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [timeFilter, setTimeFilter] = useState('1D');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: 'asc' });
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [pendingCurrentPage, setPendingCurrentPage] = useState(1);
  const [closedCurrentPage, setClosedCurrentPage] = useState(1);
  
  const toast = useToast();
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('white', 'gray.800');
  const tableBg = useColorModeValue('white', 'gray.800');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.800');
  const tableHeaderColor = useColorModeValue('gray.600', 'gray.400');
  const cardBg = useColorModeValue('white', 'gray.800');
  const positiveColor = useColorModeValue('green.500', 'green.400');
  const negativeColor = useColorModeValue('red.500', 'red.400');
  const tabBorderColor = useColorModeValue('blue.500', 'blue.400');
  const tabBg = useColorModeValue('blue.50', 'gray.600');
  const tabCountBg = useColorModeValue('gray.200', 'gray.600');

  const { colorMode } = useColorMode();
  const { isOpen } = useDisclosure();
  
  // View State - Added for table/card view toggle
  const [viewType, setViewType] = useState<'table' | 'card'>('table');

  // New state variables for analytics
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<string>('1M');
  const [showAnalytics, setShowAnalytics] = useState<boolean>(true);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['winRate', 'profitFactor', 'avgHoldTime']);

  // Sample data based on the new tradebook image
  const sampleOrders: Order[] = [
    {
      symbol: 'BTC',
      type: 'Buy',
      volume: 0.84,
      openPrice: 88561.91,
      currentPrice: 86030.95,
      takeProfit: '--',
      stopLoss: '--',
      orderId: '',
      openTime: 'Feb 25, 8:23:18 PM',
      swap: 0,
      profitLoss: -197198.11,
      isApproximate: true
    },
    {
      symbol: 'XAU/USD',
      type: 'Buy',
      volume: 0.01,
      openPrice: 2941.307,
      currentPrice: 2858.322,
      takeProfit: '--',
      stopLoss: '--',
      orderId: '',
      openTime: 'Feb 24, 4:37:06 PM',
      swap: 0,
      profitLoss: -7722.31,
      isApproximate: true
    },
    {
      symbol: 'BTC',
      type: 'Sell',
      volume: 0.01,
      openPrice: 86015.13,
      currentPrice: 86030.95,
      takeProfit: 'Add',
      stopLoss: 'Add',
      orderId: '477905806',
      openTime: 'Mar 2, 9:40:11 AM',
      swap: 0,
      profitLoss: 25.50
    },
    {
      symbol: 'BTC',
      type: 'Buy',
      volume: 0.01,
      openPrice: 85983.78,
      currentPrice: 86030.95,
      takeProfit: 'Add',
      stopLoss: 'Add',
      orderId: '477903970',
      openTime: 'Mar 2, 9:37:16 AM',
      swap: 0,
      profitLoss: 1.93
    },
    {
      symbol: 'BTC',
      type: 'Sell',
      volume: 0.01,
      openPrice: 85879.34,
      currentPrice: 86030.95,
      takeProfit: 'Add',
      stopLoss: 'Add',
      orderId: '477856887',
      openTime: 'Mar 2, 8:23:19 AM',
      swap: 0,
      profitLoss: -98.74
    },
    {
      symbol: 'BTC',
      type: 'Sell',
      volume: 0.01,
      openPrice: 85844.48,
      currentPrice: 86030.95,
      takeProfit: 'Add',
      stopLoss: 'Add',
      orderId: '477856421',
      openTime: 'Mar 2, 8:22:23 AM',
      swap: 0,
      profitLoss: -130.63
    },
    {
      symbol: 'BTC',
      type: 'Sell',
      volume: 0.01,
      openPrice: 85815.52,
      currentPrice: 86030.95,
      takeProfit: 'Add',
      stopLoss: 'Add',
      orderId: '477856259',
      openTime: 'Mar 2, 8:22:05 AM',
      swap: 0,
      profitLoss: -157.13
    },
    {
      symbol: 'BTC',
      type: 'Buy',
      volume: 0.01,
      openPrice: 85779.17,
      currentPrice: 86030.95,
      takeProfit: 'Add',
      stopLoss: 'Add',
      orderId: '477850667',
      openTime: 'Mar 2, 8:15:06 AM',
      swap: 0,
      profitLoss: 191.72
    },
    {
      symbol: 'BTC',
      type: 'Sell',
      volume: 0.01,
      openPrice: 85783.29,
      currentPrice: 86030.95,
      takeProfit: 'Add',
      stopLoss: 'Add',
      orderId: '477849452',
      openTime: 'Mar 2, 8:13:56 AM',
      swap: 0,
      profitLoss: -186.62
    },
    {
      symbol: 'BTC',
      type: 'Buy',
      volume: 0.01,
      openPrice: 85775.30,
      currentPrice: 86030.95,
      takeProfit: 'Add',
      stopLoss: 'Add',
      orderId: '477848525',
      openTime: 'Mar 2, 8:13:17 AM',
      swap: 0,
      profitLoss: 195.31
    },
    {
      symbol: 'BTC',
      type: 'Buy',
      volume: 0.86,
      openPrice: 88500.00,
      currentPrice: 86030.95,
      takeProfit: '87600.00',
      stopLoss: 'Add',
      orderId: '470283436',
      openTime: 'Feb 25, 8:23:18 PM',
      swap: 0,
      profitLoss: -200555.51
    },
    {
      symbol: 'XAU/USD',
      type: 'Buy',
      volume: 0.01,
      openPrice: 2878.000,
      currentPrice: 2858.322,
      takeProfit: '-',
      stopLoss: '-',
      orderId: '467550070',
      openTime: 'Feb 27, 9:08:44 AM',
      swap: 0,
      profitLoss: 0
    },
    {
      symbol: 'XAU/USD',
      type: 'Sell',
      volume: 0.01,
      openPrice: 2878.000,
      currentPrice: 2858.322,
      takeProfit: '2790.000',
      stopLoss: '-',
      orderId: '467551307',
      openTime: 'Feb 27, 9:08:44 AM',
      swap: 0,
      profitLoss: 1800.40
    },
    {
      symbol: 'XAU/USD',
      type: 'Buy',
      volume: 0.01,
      openPrice: 2941.307,
      currentPrice: 2858.322,
      takeProfit: '-',
      stopLoss: '-',
      orderId: '467544917',
      openTime: 'Feb 24, 4:37:06 PM',
      swap: 0,
      profitLoss: -7697.44
    }
  ];

  // Sample data for pending orders
  const samplePendingOrders: PendingOrder[] = [
    {
      symbol: 'BTC',
      type: 'Buy',
      volume: 0.01,
      price: 85000.00,
      currentPrice: 86030.95,
      takeProfit: '86000.00',
      stopLoss: '84000.00',
      orderId: '477910123',
      creationTime: 'Mar 2, 10:15:30 AM',
      expirationTime: 'GTC',
      comment: 'Buy the dip'
    },
    {
      symbol: 'ETH',
      type: 'Sell',
      volume: 0.5,
      price: 3200.00,
      currentPrice: 3180.50,
      takeProfit: '3100.00',
      stopLoss: '3300.00',
      orderId: '477910124',
      creationTime: 'Mar 2, 10:20:45 AM',
      expirationTime: 'Mar 3, 10:20:45 AM',
      comment: 'Take profit'
    },
    {
      symbol: 'XAU/USD',
      type: 'Buy',
      volume: 0.02,
      price: 2850.000,
      currentPrice: 2858.322,
      takeProfit: '2900.000',
      stopLoss: '2800.000',
      orderId: '477910125',
      creationTime: 'Mar 2, 11:05:22 AM',
      expirationTime: 'GTC',
      comment: ''
    }
  ];

  // Add sample data for closed orders
  const sampleClosedOrders: ClosedOrder[] = [
    {
      symbol: 'BTC',
      type: 'Sell',
      volume: 0.01,
      openPrice: 85822.14,
      closePrice: 85988.99,
      takeProfit: '-',
      stopLoss: '-',
      orderId: '477852553',
      openTime: 'Mar 2, 8:17:07 AM',
      closeTime: 'Mar 2, 11:04:52 AM',
      swap: 0,
      commission: -14.74,
      reason: '',
      profitLoss: -154.90
    },
    {
      symbol: 'BTC',
      type: 'Buy',
      volume: 0.01,
      openPrice: 85793.88,
      closePrice: 85992.09,
      takeProfit: '-',
      stopLoss: '-',
      orderId: '477854474',
      openTime: 'Mar 2, 8:18:19 AM',
      closeTime: 'Mar 2, 11:04:52 AM',
      swap: 0,
      commission: -14.74,
      reason: '',
      profitLoss: 181.16
    },
    {
      symbol: 'BTC',
      type: 'Sell',
      volume: 0.01,
      openPrice: 85864.00,
      closePrice: 85994.80,
      takeProfit: '-',
      stopLoss: '-',
      orderId: '477856823',
      openTime: 'Mar 2, 8:23:10 AM',
      closeTime: 'Mar 2, 11:04:50 AM',
      swap: 0,
      commission: -14.74,
      reason: '',
      profitLoss: -121.51
    },
    {
      symbol: 'BTC',
      type: 'Buy',
      volume: 0.01,
      openPrice: 85840.30,
      closePrice: 85987.33,
      takeProfit: '-',
      stopLoss: '-',
      orderId: '477856231',
      openTime: 'Mar 2, 8:21:55 AM',
      closeTime: 'Mar 2, 11:04:48 AM',
      swap: 0,
      commission: -14.74,
      reason: '',
      profitLoss: 134.49
    },
    {
      symbol: 'BTC',
      type: 'Buy',
      volume: 0.01,
      openPrice: 85842.62,
      closePrice: 85981.62,
      takeProfit: '-',
      stopLoss: '-',
      orderId: '477856134',
      openTime: 'Mar 2, 8:21:42 AM',
      closeTime: 'Mar 2, 11:04:46 AM',
      swap: 0,
      commission: -14.74,
      reason: '',
      profitLoss: 127.18
    },
    {
      symbol: 'BTC',
      type: 'Buy',
      volume: 0.86,
      openPrice: 89000.00,
      closePrice: 84409.80,
      takeProfit: '87,600.00',
      stopLoss: '-',
      orderId: '470297076',
      openTime: 'Feb 25, 10:03:49 PM',
      closeTime: 'Feb 27, 5:45:49 PM',
      swap: 0,
      commission: -1270.14,
      reason: '',
      profitLoss: -369365.72
    },
    {
      symbol: 'BTC',
      type: 'Buy',
      volume: 1,
      openPrice: 87000.00,
      closePrice: 84418.10,
      takeProfit: '87,600.00',
      stopLoss: '-',
      orderId: '470320203',
      openTime: 'Feb 26, 1:58:37 PM',
      closeTime: 'Feb 27, 5:45:44 PM',
      swap: 0,
      commission: -1467.62,
      reason: '',
      profitLoss: -235107.81
    },
    {
      symbol: 'BTC',
      type: 'Sell',
      volume: 1,
      openPrice: 86000.00,
      closePrice: 85000.00,
      takeProfit: '85,000.00',
      stopLoss: '87,600.00',
      orderId: '470271087',
      openTime: 'Feb 26, 2:21:38 PM',
      closeTime: 'Feb 27, 2:58:03 PM',
      swap: 0,
      commission: -1466.79,
      reason: 'Take Profit',
      profitLoss: 91813.00
    },
    {
      symbol: 'XAU/USD',
      type: 'Sell',
      volume: 0.01,
      openPrice: 2941.007,
      closePrice: 2878.000,
      takeProfit: '2,878.000',
      stopLoss: '-',
      orderId: '467545091',
      openTime: 'Feb 24, 4:37:10 PM',
      closeTime: 'Feb 27, 9:08:44 AM',
      swap: 0,
      commission: -10.03,
      reason: 'Take Profit',
      profitLoss: 5793.33
    }
  ];

  // Group orders by symbol for better organization
  const groupedOrders = React.useMemo(() => {
    const grouped: Record<string, Order[]> = {};
    sampleOrders.forEach(order => {
      if (!grouped[order.symbol]) {
        grouped[order.symbol] = [];
      }
      grouped[order.symbol].push(order);
    });
    return grouped;
  }, [sampleOrders]);

  // Sorting function
  const sortedOrders = React.useMemo(() => {
    let sortableOrders = [...sampleOrders];
    
    // First sort by symbol to group them together
    sortableOrders.sort((a, b) => {
      // First sort by symbol
      if (a.symbol < b.symbol) return -1;
      if (a.symbol > b.symbol) return 1;
      
      // Then by date (newest first)
      return new Date(b.openTime).getTime() - new Date(a.openTime).getTime();
    });
    
    // Then apply user-selected sorting if any
    if (sortConfig.key !== '') {
      sortableOrders.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof Order];
        const bValue = b[sortConfig.key as keyof Order];
        
        // Handle null values in comparison
        if (aValue === null && bValue === null) return 0;
        if (aValue === null) return sortConfig.direction === 'asc' ? -1 : 1;
        if (bValue === null) return sortConfig.direction === 'asc' ? 1 : -1;
        
        // Safe comparison with type checking
        if (typeof aValue === 'undefined' || typeof bValue === 'undefined') {
          return 0;
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableOrders;
  }, [sampleOrders, sortConfig]);

  // Request sort function
  const requestSort = (key: keyof Order) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Copy to clipboard function
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Copied!",
          description: `${label} copied to clipboard`,
          status: "success",
          duration: 2000,
          isClosable: true,
          position: "top",
        });
      },
      (err) => {
        toast({
          title: "Failed to copy",
          description: "Could not copy text to clipboard",
          status: "error",
          duration: 2000,
          isClosable: true,
          position: "top",
        });
      }
    );
  };

  const filteredOrders = sortedOrders.filter(order => {
    // Symbol filter
    const symbolFilter = symbol ? order.symbol.toLowerCase().includes(symbol.toLowerCase()) : true;
    
    // Type filter
    const typeFilterMatch = typeFilter ? order.type.includes(typeFilter) : true;
    
    return symbolFilter && typeFilterMatch;
  });

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Pagination for pending orders
  const paginatedPendingOrders = samplePendingOrders.slice(
    (pendingCurrentPage - 1) * ITEMS_PER_PAGE,
    pendingCurrentPage * ITEMS_PER_PAGE
  );

  // Pagination for closed orders
  const paginatedClosedOrders = sampleClosedOrders.slice(
    (closedCurrentPage - 1) * ITEMS_PER_PAGE,
    closedCurrentPage * ITEMS_PER_PAGE
  );

  const handleTabChange = (index: number) => {
    setSelectedTab(index);
    setCurrentPage(1);
    const status = index === 0 ? 'open' : index === 1 ? 'pending' : 'closed';
    setSearchParams({ status });
  };

  // Calculate summary data for the dashboard
  const totalOpenOrders = sampleOrders.length;
  const totalPendingOrders = samplePendingOrders.length;
  const totalClosedOrders = sampleClosedOrders.length;
  
  // Calculate profit/loss data
  const totalProfitLoss = sampleOrders.reduce((sum, order) => sum + order.profitLoss, 0);
  const profitableOrders = sampleOrders.filter(order => order.profitLoss > 0).length;
  const unprofitableOrders = sampleOrders.filter(order => order.profitLoss < 0).length;

  // Calculate trading metrics
  const calculateTradeMetrics = (): TradeMetrics => {
    const closedTradesOnly = sampleClosedOrders;
    const winningTrades = closedTradesOnly.filter(order => order.profitLoss > 0);
    const losingTrades = closedTradesOnly.filter(order => order.profitLoss < 0);
    
    const winRate = (winningTrades.length / closedTradesOnly.length) * 100;
    
    const totalWinAmount = winningTrades.reduce((sum, trade) => sum + trade.profitLoss, 0);
    const totalLossAmount = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.profitLoss, 0));
    
    const avgWin = winningTrades.length > 0 ? totalWinAmount / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? totalLossAmount / losingTrades.length : 0;
    
    const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : totalWinAmount > 0 ? 999 : 0;
    
    const largestWin = winningTrades.length > 0 ? 
      Math.max(...winningTrades.map(trade => trade.profitLoss)) : 0;
      
    const largestLoss = losingTrades.length > 0 ? 
      Math.abs(Math.min(...losingTrades.map(trade => trade.profitLoss))) : 0;
    
    // Calculate average hold time
    let totalHoldTimeHours = 0;
    closedTradesOnly.forEach(trade => {
      const openTime = new Date(trade.openTime);
      const closeTime = new Date(trade.closeTime);
      const diffHours = (closeTime.getTime() - openTime.getTime()) / (1000 * 60 * 60);
      totalHoldTimeHours += diffHours;
    });
    
    const avgHoldTime = closedTradesOnly.length > 0 ? totalHoldTimeHours / closedTradesOnly.length : 0;
    
    return {
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      largestWin,
      largestLoss,
      avgHoldTime,
      totalTrades: closedTradesOnly.length
    };
  };
  
  const tradeMetrics = useMemo(() => calculateTradeMetrics(), [sampleClosedOrders]);
  
  // Generate performance metrics for display
  const performanceMetrics: PerformanceMetric[] = [
    { 
      label: 'Win Rate', 
      value: tradeMetrics.winRate, 
      change: 2.5, 
      icon: <Icon as={FiPercent} />,
      color: 'blue.500'
    },
    { 
      label: 'Profit Factor', 
      value: tradeMetrics.profitFactor, 
      change: 0.3, 
      icon: <Icon as={FiTarget} />,
      color: 'green.500'
    },
    { 
      label: 'Avg Hold Time', 
      value: tradeMetrics.avgHoldTime, 
      change: -1.2, 
      icon: <Icon as={FiClock} />,
      color: 'purple.500'
    },
    { 
      label: 'Avg Win', 
      value: tradeMetrics.avgWin, 
      change: 500, 
      icon: <Icon as={FiTrendingUp} />,
      color: 'teal.500'
    },
    { 
      label: 'Avg Loss', 
      value: tradeMetrics.avgLoss, 
      change: 200, 
      icon: <Icon as={FiTrendingDown} />,
      color: 'orange.500'
    },
    { 
      label: 'Largest Win', 
      value: tradeMetrics.largestWin, 
      change: 0, 
      icon: <Icon as={FiMaximize} />,
      color: 'green.500'
    },
    { 
      label: 'Largest Loss', 
      value: tradeMetrics.largestLoss, 
      change: 0, 
      icon: <Icon as={FiMinimize} />,
      color: 'red.500'
    },
    { 
      label: 'Total Trades', 
      value: tradeMetrics.totalTrades, 
      change: 5, 
      icon: <Icon as={FiActivity} />,
      color: 'blue.500'
    },
  ];
  
  // Prepare data for Profit/Loss chart
  const prepareProfitLossChartData = () => {
    // Sort by date
    const sortedOrders = [...sampleClosedOrders].sort((a, b) => 
      new Date(a.closeTime).getTime() - new Date(b.closeTime).getTime()
    );
    
    // Create cumulative P/L
    let cumulativePL = 0;
    const dates: string[] = [];
    const cumPLValues: number[] = [];
    const plValues: number[] = [];
    
    sortedOrders.forEach(order => {
      cumulativePL += order.profitLoss;
      dates.push(order.closeTime);
      cumPLValues.push(cumulativePL);
      plValues.push(order.profitLoss);
    });
    
    return { dates, cumPLValues, plValues };
  };
  
  const plChartData = useMemo(() => prepareProfitLossChartData(), [sampleClosedOrders]);
  
  // Prepare data for distribution chart
  const prepareDistributionData = () => {
    // Count orders by symbol
    const symbolCounts: Record<string, number> = {};
    sampleOrders.forEach(order => {
      symbolCounts[order.symbol] = (symbolCounts[order.symbol] || 0) + 1;
    });
    
    // Count by type
    const typeCounts = {
      Buy: sampleOrders.filter(o => o.type === 'Buy').length,
      Sell: sampleOrders.filter(o => o.type === 'Sell').length
    };
    
    // Profit/Loss distribution
    const profitLossValues = sampleClosedOrders.map(o => o.profitLoss);
    
    return { symbolCounts, typeCounts, profitLossValues };
  };
  
  const distributionData = useMemo(() => prepareDistributionData(), [sampleOrders, sampleClosedOrders]);

  return (
    <Box w="full" h="full" px={4} py={6}>
      {/* Page Header */}
      <Flex 
        mb={6} 
        direction={{ base: 'column', md: 'row' }}
        align={{ base: 'flex-start', md: 'center' }}
        gap={4}
      >
        <Box>
          <Heading size="lg" fontWeight="bold">Orders</Heading>
          <Text color={textColor} opacity={0.8}>Manage and track all your trading orders</Text>
        </Box>
        <Spacer />
        
        {/* View Toggle */}
        <ButtonGroup size="sm" isAttached variant="outline">
          <Button 
            leftIcon={<FiList />} 
            onClick={() => setViewType('table')}
            colorScheme={viewType === 'table' ? 'blue' : 'gray'}
            fontWeight={viewType === 'table' ? 'bold' : 'normal'}
          >
            Table
          </Button>
          <Button 
            leftIcon={<FiGrid />} 
            onClick={() => setViewType('card')}
            colorScheme={viewType === 'card' ? 'blue' : 'gray'}
            fontWeight={viewType === 'card' ? 'bold' : 'normal'}
          >
            Cards
          </Button>
        </ButtonGroup>
        
        <ButtonGroup size="sm">
          <Button 
            leftIcon={<FiBarChart2 />} 
            colorScheme="purple" 
            variant={showAnalytics ? "solid" : "outline"}
            onClick={() => setShowAnalytics(!showAnalytics)}
          >
            Analytics
          </Button>
          <Button 
            leftIcon={<FiDownload />} 
            colorScheme="blue" 
            variant="outline"
          >
            Export
          </Button>
          <Button 
            leftIcon={<FiRefreshCw />} 
            colorScheme="blue" 
          >
            Refresh
          </Button>
        </ButtonGroup>
      </Flex>

      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={6} width="100%">
        <Card borderRadius="lg" overflow="hidden" boxShadow="sm" bg={cardBg}>
          <CardBody p={4}>
            <Stat>
              <StatLabel color="gray.500" fontSize="sm">Open Orders</StatLabel>
              <Flex mt={1} align="center" justify="space-between">
                <StatNumber fontSize="2xl" fontWeight="bold">{totalOpenOrders}</StatNumber>
                <Box
                  p={2}
                  bg="blue.50"
                  color="blue.500"
                  borderRadius="full"
                  _dark={{ bg: 'blue.900', color: 'blue.300' }}
                >
                  <Icon as={FiEye} />
                </Box>
              </Flex>
            </Stat>
          </CardBody>
        </Card>
        
        <Card borderRadius="lg" overflow="hidden" boxShadow="sm" bg={cardBg}>
          <CardBody p={4}>
            <Stat>
              <StatLabel color="gray.500" fontSize="sm">Pending Orders</StatLabel>
              <Flex mt={1} align="center" justify="space-between">
                <StatNumber fontSize="2xl" fontWeight="bold">{totalPendingOrders}</StatNumber>
                <Box
                  p={2}
                  bg="orange.50"
                  color="orange.500"
                  borderRadius="full"
                  _dark={{ bg: 'orange.900', color: 'orange.300' }}
                >
                  <Icon as={FiClock} />
                </Box>
              </Flex>
            </Stat>
          </CardBody>
        </Card>
        
        <Card borderRadius="lg" overflow="hidden" boxShadow="sm" bg={cardBg}>
          <CardBody p={4}>
            <Stat>
              <StatLabel color="gray.500" fontSize="sm">Total P/L</StatLabel>
              <Flex mt={1} align="center" justify="space-between">
                <StatNumber fontSize="2xl" fontWeight="bold" color={totalProfitLoss >= 0 ? positiveColor : negativeColor}>
                  {totalProfitLoss >= 0 ? '+' : ''}{totalProfitLoss.toFixed(2)} INR
                </StatNumber>
                <Box
                  p={2}
                  bg={totalProfitLoss >= 0 ? "green.50" : "red.50"}
                  color={totalProfitLoss >= 0 ? "green.500" : "red.500"}
                  borderRadius="full"
                  _dark={{ 
                    bg: totalProfitLoss >= 0 ? "green.900" : "red.900", 
                    color: totalProfitLoss >= 0 ? "green.300" : "red.300" 
                  }}
                >
                  <Icon as={totalProfitLoss >= 0 ? FiArrowUp : FiArrowDown} />
                </Box>
              </Flex>
              <StatHelpText fontSize="xs">
                <StatArrow type={totalProfitLoss >= 0 ? 'increase' : 'decrease'} />
                {profitableOrders} profitable / {unprofitableOrders} unprofitable
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card borderRadius="lg" overflow="hidden" boxShadow="sm" bg={cardBg}>
          <CardBody p={4}>
            <Stat>
              <StatLabel color="gray.500" fontSize="sm">Closed Orders</StatLabel>
              <Flex mt={1} align="center" justify="space-between">
                <StatNumber fontSize="2xl" fontWeight="bold">{totalClosedOrders}</StatNumber>
                <Box
                  p={2}
                  bg="purple.50"
                  color="purple.500"
                  borderRadius="full"
                  _dark={{ bg: 'purple.900', color: 'purple.300' }}
                >
                  <Icon as={FiCheckCircle} />
                </Box>
              </Flex>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Filter Section */}
      <Card mb={6} borderRadius="lg" boxShadow="sm" overflow="hidden" bg={cardBg} width="100%">
        <CardBody p={0}>
          <Box>
            {/* Filter header */}
            <Flex 
              justifyContent="space-between" 
              alignItems="center" 
              p={4}
              bg={useColorModeValue('gray.50', 'gray.800')}
              borderBottomWidth="1px"
              borderColor={borderColor}
            >
              <Flex align="center">
                <Icon as={FiFilter} mr={2} color="blue.500" />
                <Text fontWeight="semibold" fontSize="md">Search & Filters</Text>
              </Flex>
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<Icon as={showAdvancedFilters ? FiChevronDown : FiChevronRight} />}
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                _hover={{ bg: useColorModeValue('blue.50', 'blue.900') }}
              >
                {showAdvancedFilters ? "Basic Filters" : "Advanced Filters"}
              </Button>
            </Flex>
            
            {/* Main filters */}
            <Box p={5} bg={useColorModeValue('white', 'gray.800')}>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5}>
                <Box>
                  <Flex align="center" mb={2}>
                    <Icon as={FiInfo} color="blue.400" mr={1} fontSize="xs" />
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" _dark={{ color: "gray.300" }}>Market</Text>
                  </Flex>
                  <Select 
                    size="md" 
                    defaultValue="Crypto" 
                    borderRadius="md"
                    bg={useColorModeValue('gray.50', 'gray.700')}
                  >
                    <option value="Crypto">Cryptocurrency</option>
                    <option value="Forex">Forex</option>
                    <option value="Commodities">Commodities</option>
                    <option value="Indices">Indices</option>
                    <option value="Stocks">Stocks</option>
                  </Select>
                </Box>

                <Box>
                  <Flex align="center" mb={2}>
                    <Icon as={FiSearch} color="blue.400" mr={1} fontSize="xs" />
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" _dark={{ color: "gray.300" }}>Symbol</Text>
                  </Flex>
                  <InputGroup size="md">
                    <InputLeftElement pointerEvents="none">
                      <Icon as={FiSearch} color="gray.400" />
                    </InputLeftElement>
                    <Input 
                      placeholder="Search symbols (e.g. BTC, ETH)" 
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value)}
                      borderRadius="md"
                      bg={useColorModeValue('gray.50', 'gray.700')}
                    />
                  </InputGroup>
                </Box>

                <Box>
                  <Flex align="center" mb={2}>
                    <Icon as={FiCalendar} color="blue.400" mr={1} fontSize="xs" />
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" _dark={{ color: "gray.300" }}>Date Range</Text>
                  </Flex>
                  <InputGroup size="md">
                    <InputLeftElement pointerEvents="none">
                      <Icon as={FiCalendar} color="gray.400" />
                    </InputLeftElement>
                    <Input 
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      borderRadius="md"
                      bg={useColorModeValue('gray.50', 'gray.700')}
                    />
                  </InputGroup>
                </Box>

                <Box>
                  <Flex align="center" mb={2}>
                    <Icon as={FiClock} color="blue.400" mr={1} fontSize="xs" />
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" _dark={{ color: "gray.300" }}>Time Filter</Text>
                  </Flex>
                  <Flex>
                    {['1D', '1W', '1M', '3M', 'ALL'].map((filter) => (
                      <Button
                        key={filter}
                        onClick={() => setTimeFilter(filter)}
                        colorScheme={timeFilter === filter ? 'blue' : 'gray'}
                        variant={timeFilter === filter ? 'solid' : 'ghost'}
                        size="md"
                        flex={1}
                        fontWeight={timeFilter === filter ? 'bold' : 'medium'}
                        borderRadius="md"
                        mr={filter !== 'ALL' ? 1 : 0}
                      >
                        {filter}
                      </Button>
                    ))}
                  </Flex>
                </Box>
              </SimpleGrid>

              {/* Advanced Filters - Only show Order Type */}
              {showAdvancedFilters && (
                <Box mt={6} pt={5} borderTopWidth="1px" borderStyle="dashed" borderColor={borderColor}>
                  <Box>
                    <Flex align="center" mb={2}>
                      <Icon as={FiArrowUp} color="blue.400" mr={1} fontSize="xs" transform="rotate(45deg)" />
                      <Text fontSize="sm" fontWeight="medium" color="gray.700" _dark={{ color: "gray.300" }}>Order Type</Text>
                    </Flex>
                    <RadioGroup value={typeFilter} onChange={setTypeFilter} colorScheme="blue">
                      <HStack spacing={6}>
                        <Radio value="">All Types</Radio>
                        <Radio value="Buy">Buy Orders</Radio>
                        <Radio value="Sell">Sell Orders</Radio>
                      </HStack>
                    </RadioGroup>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
          
          {/* Filter actions */}
          <Flex 
            justify="flex-end" 
            borderTopWidth="1px" 
            borderColor={borderColor} 
            p={4} 
            bg={useColorModeValue('gray.50', 'gray.700')}
          >
            <Button 
              colorScheme="blue" 
              leftIcon={<Icon as={FiSearch} />}
              size="md"
              mr={3}
              borderRadius="md"
              boxShadow="sm"
            >
              Search
            </Button>
            <Button
              variant="outline"
              leftIcon={<Icon as={FiRefreshCw} />}
              size="md"
              borderRadius="md"
            >
              Reset
            </Button>
          </Flex>
        </CardBody>
      </Card>

      {/* Tabs and Table Section */}
      <Card borderRadius="lg" boxShadow="sm" overflow="hidden" bg={cardBg} width="100%" mb={6}>
        <Tabs 
          onChange={handleTabChange}
          colorScheme="blue"
          size="md"
          index={selectedTab}
          variant="enclosed"
          width="100%"
        >
          <TabList px={4} bg={headerBg} borderBottomWidth="1px" borderBottomColor={borderColor}>
            <Tab 
              color={textColor} 
              _selected={{ 
                color: 'blue.500', 
                borderColor: 'transparent', 
                borderBottomColor: 'blue.500',
                borderBottomWidth: '3px',
                fontWeight: 'semibold'
              }}
              fontWeight="medium"
              py={3}
              px={6}
            >
              <Flex align="center">
                <Text>OPEN</Text>
                <Tag ml={2} size="sm" colorScheme="blue" borderRadius="full">{totalOpenOrders}</Tag>
              </Flex>
            </Tab>
            <Tab 
              color={textColor} 
              _selected={{ 
                color: 'blue.500', 
                borderColor: 'transparent', 
                borderBottomColor: 'blue.500',
                borderBottomWidth: '3px',
                fontWeight: 'semibold'
              }}
              fontWeight="medium"
              py={3}
              px={6}
            >
              <Flex align="center">
                <Text>PENDING</Text>
                <Tag ml={2} size="sm" colorScheme="orange" borderRadius="full">{totalPendingOrders}</Tag>
              </Flex>
            </Tab>
            <Tab 
              color={textColor} 
              _selected={{ 
                color: 'blue.500', 
                borderColor: 'transparent', 
                borderBottomColor: 'blue.500',
                borderBottomWidth: '3px',
                fontWeight: 'semibold'
              }}
              fontWeight="medium"
              py={3}
              px={6}
            >
              <Text>CLOSED</Text>
            </Tab>
          </TabList>

          <TabPanels width="100%">
            {/* OPEN ORDERS TAB */}
            <TabPanel p={0} width="100%">
              {viewType === 'table' ? (
                <Box overflowX="auto" width="100%">
                  <Table variant="simple" size="md" color={textColor}>
                    <Thead bg={tableHeaderBg}>
                      <Tr>
                        <Th py={4} color={tableHeaderColor} borderColor={borderColor} textTransform="uppercase" fontSize="xs">Symbol</Th>
                        <Th py={4} color={tableHeaderColor} borderColor={borderColor} textTransform="uppercase" fontSize="xs">Type</Th>
                        <Th py={4} color={tableHeaderColor} borderColor={borderColor} textTransform="uppercase" fontSize="xs" isNumeric>Volume, lot</Th>
                        <Th py={4} color={tableHeaderColor} borderColor={borderColor} textTransform="uppercase" fontSize="xs" isNumeric>Open price</Th>
                        <Th py={4} color={tableHeaderColor} borderColor={borderColor} textTransform="uppercase" fontSize="xs" isNumeric>Current price</Th>
                        <Th py={4} color={tableHeaderColor} borderColor={borderColor} textTransform="uppercase" fontSize="xs" isNumeric>T/P</Th>
                        <Th py={4} color={tableHeaderColor} borderColor={borderColor} textTransform="uppercase" fontSize="xs" isNumeric>S/L</Th>
                        <Th py={4} color={tableHeaderColor} borderColor={borderColor} textTransform="uppercase" fontSize="xs">Order</Th>
                        <Th py={4} color={tableHeaderColor} borderColor={borderColor} textTransform="uppercase" fontSize="xs">Open time</Th>
                        <Th py={4} color={tableHeaderColor} borderColor={borderColor} textTransform="uppercase" fontSize="xs" isNumeric>Swap, INR</Th>
                        <Th py={4} color={tableHeaderColor} borderColor={borderColor} textTransform="uppercase" fontSize="xs" isNumeric>P/L, INR</Th>
                        <Th py={4} color={tableHeaderColor} borderColor={borderColor}></Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {paginatedOrders.map((order, index) => {
                        // Check if this is the first row of a new symbol group
                        const isFirstOfSymbol = index === 0 || paginatedOrders[index - 1].symbol !== order.symbol;
                        
                        return (
                        <Tr 
                          key={order.orderId || order.openTime}
                          _hover={{ bg: hoverBg }}
                          cursor="pointer"
                          borderBottomWidth="1px"
                          borderColor={borderColor}
                          bg={isFirstOfSymbol ? useColorModeValue('gray.50', 'gray.700') : undefined}
                        >
                          <Td py={3} borderColor={borderColor}>
                            <HStack spacing={1}>
                              <Circle size="28px" bg="orange.400" color="white" fontSize="xs" fontWeight="bold">
                                {order.symbol === 'BTC' ? 'B' : 'X'}
                              </Circle>
                              <Text fontWeight="medium">{order.symbol}</Text>
                              {order.symbol === 'BTC' && (
                                <Circle size="18px" bg="gray.200" color="gray.600" fontSize="xs" ml={1}>
                                  9
                                </Circle>
                              )}
                              {order.symbol === 'XAU/USD' && (
                                <Circle size="18px" bg="gray.200" color="gray.600" fontSize="xs" ml={1}>
                                  3
                                </Circle>
                              )}
                            </HStack>
                          </Td>
                          <Td py={3} borderColor={borderColor}>
                            <Tag 
                              size="md" 
                              variant="subtle" 
                              colorScheme={order.type === 'Buy' ? 'blue' : 'red'} 
                              borderRadius="full"
                            >
                              {order.type}
                            </Tag>
                          </Td>
                          <Td py={3} isNumeric borderColor={borderColor} fontWeight="medium">{order.volume}</Td>
                          <Td py={3} isNumeric borderColor={borderColor}>
                            {order.isApproximate && '≈ '}
                            {order.symbol === 'XAU/USD' 
                              ? order.openPrice.toFixed(3) 
                              : order.openPrice.toFixed(2)}
                          </Td>
                          <Td py={3} isNumeric borderColor={borderColor}>
                            {order.symbol === 'XAU/USD' 
                              ? order.currentPrice.toFixed(3) 
                              : order.currentPrice.toFixed(2)}
                          </Td>
                          <Td py={3} isNumeric borderColor={borderColor}>
                            {order.takeProfit === 'Add' ? (
                              <Button size="xs" variant="outline" colorScheme="blue" borderRadius="full">
                                Add
                              </Button>
                            ) : order.takeProfit}
                          </Td>
                          <Td py={3} isNumeric borderColor={borderColor}>
                            {order.stopLoss === 'Add' ? (
                              <Button size="xs" variant="outline" colorScheme="blue" borderRadius="full">
                                Add
                              </Button>
                            ) : order.stopLoss}
                          </Td>
                          <Td py={3} borderColor={borderColor}>
                            {order.orderId ? (
                              <Flex align="center">
                                <Text mr={1} fontFamily="mono">{order.orderId}</Text>
                                <IconButton
                                  aria-label="Copy order ID"
                                  icon={<FiCopy />}
                                  size="xs"
                                  variant="ghost"
                                  color="blue.500"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(order.orderId, "Order ID");
                                  }}
                                />
                              </Flex>
                            ) : ''}
                          </Td>
                          <Td py={3} borderColor={borderColor} fontSize="sm">{order.openTime}</Td>
                          <Td py={3} isNumeric borderColor={borderColor}>{order.swap}</Td>
                          <Td py={3} isNumeric borderColor={borderColor} fontWeight="bold" color={order.profitLoss > 0 ? positiveColor : negativeColor}>
                            {order.profitLoss > 0 ? '+' : ''}
                            {order.profitLoss.toFixed(2)}
                          </Td>
                          <Td py={3} borderColor={borderColor}>
                            <HStack spacing={1}>
                              {order.profitLoss < 0 ? (
                                <IconButton
                                  aria-label="Edit order"
                                  icon={<FiEdit />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="blue"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Edit functionality would go here
                                  }}
                                />
                              ) : null}
                              <IconButton
                                aria-label="Close order"
                                icon={<FiX />}
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Close functionality would go here
                                }}
                              />
                            </HStack>
                          </Td>
                        </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Box>
              ) : (
                <Box p={4} width="100%">
                  <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4, xl: 5 }} spacing={4}>
                    {paginatedOrders.map((order) => (
                      <Card 
                        key={order.orderId} 
                        boxShadow="md" 
                        _hover={{ boxShadow: "lg", transform: "translateY(-2px)" }}
                        transition="all 0.2s"
                        cursor="pointer"
                        borderLeft="4px solid"
                        borderLeftColor={order.type === 'Buy' ? 'blue.500' : 'red.500'}
                      >
                        <CardBody>
                          <Flex mb={3} align="center" justify="space-between">
                            <HStack>
                              <Circle size="32px" bg="orange.400" color="white" fontSize="sm" fontWeight="bold">
                                {order.symbol === 'BTC' ? 'B' : 'X'}
                              </Circle>
                              <VStack align="start" spacing={0}>
                                <Text fontWeight="bold">{order.symbol}</Text>
                                <Tag 
                                  size="sm" 
                                  variant="subtle" 
                                  colorScheme={order.type === 'Buy' ? 'blue' : 'red'} 
                                  borderRadius="full"
                                >
                                  {order.type}
                                </Tag>
                              </VStack>
                            </HStack>
                            <Text 
                              fontWeight="bold" 
                              color={order.profitLoss > 0 ? positiveColor : negativeColor}
                            >
                              {order.profitLoss > 0 ? '+' : ''}
                              {order.profitLoss.toFixed(2)} INR
                            </Text>
                          </Flex>
                          
                          <Divider mb={3} />
                          
                          <SimpleGrid columns={2} spacing={2} mb={3}>
                            <Box>
                              <Text fontSize="xs" color={textColor}>Volume</Text>
                              <Text fontWeight="medium">{order.volume}</Text>
                            </Box>
                            <Box>
                              <Text fontSize="xs" color={textColor}>Open Price</Text>
                              <Text>
                                {order.symbol === 'XAU/USD' 
                                  ? order.openPrice.toFixed(3) 
                                  : order.openPrice.toFixed(2)}
                              </Text>
                            </Box>
                            <Box>
                              <Text fontSize="xs" color={textColor}>Current Price</Text>
                              <Text>
                                {order.symbol === 'XAU/USD' 
                                  ? order.currentPrice.toFixed(3) 
                                  : order.currentPrice.toFixed(2)}
                              </Text>
                            </Box>
                            <Box>
                              <Text fontSize="xs" color={textColor}>Open Time</Text>
                              <Text fontSize="sm">{order.openTime}</Text>
                            </Box>
                          </SimpleGrid>
                          
                          <Divider mb={3} />
                          
                          <HStack justify="space-between">
                            <HStack>
                              <Tooltip label="View Details">
                                <IconButton
                                  aria-label="View order details"
                                  icon={<FiEye />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="blue"
                                />
                              </Tooltip>
                              <Tooltip label="Edit Order">
                                <IconButton
                                  aria-label="Edit order"
                                  icon={<FiEdit />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="blue"
                                />
                              </Tooltip>
                              <Tooltip label="Close Order">
                                <IconButton
                                  aria-label="Close order"
                                  icon={<FiX />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="red"
                                />
                              </Tooltip>
                            </HStack>
                            <Text fontSize="xs" fontFamily="mono" color={textColor}>
                              #{order.orderId.substring(0, 8)}
                            </Text>
                          </HStack>
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>
                </Box>
              )}
            </TabPanel>

            {/* PENDING ORDERS TAB */}
            <TabPanel p={0} width="100%">
              {viewType === 'table' ? (
                <Box overflowX="auto" width="100%">
                  <Table variant="simple" size="md" color={textColor}>
                    <Thead bg={tableHeaderBg}>
                      <Tr>
                        <Th py={4} color={tableHeaderColor} borderColor={borderColor} textTransform="uppercase" fontSize="xs">Symbol</Th>
                        <Th py={4} color={tableHeaderColor} borderColor={borderColor} textTransform="uppercase" fontSize="xs">Type</Th>
                        <Th py={4} color={tableHeaderColor} borderColor={borderColor} textTransform="uppercase" fontSize="xs" isNumeric>Volume, lot</Th>
                        <Th py={4} color={tableHeaderColor} borderColor={borderColor} textTransform="uppercase" fontSize="xs" isNumeric>Price</Th>
                        <Th py={4} color={tableHeaderColor} borderColor={borderColor} textTransform="uppercase" fontSize="xs" isNumeric>Current price</Th>
                        <Th py={4} color={tableHeaderColor} borderColor={borderColor} textTransform="uppercase" fontSize="xs" isNumeric>T/P</Th>
                        <Th py={4} color={tableHeaderColor} borderColor={borderColor} textTransform="uppercase" fontSize="xs" isNumeric>S/L</Th>
                        <Th py={4} color={tableHeaderColor} borderColor={borderColor} textTransform="uppercase" fontSize="xs">Order</Th>
                        <Th py={4} color={tableHeaderColor} borderColor={borderColor} textTransform="uppercase" fontSize="xs">Creation time</Th>
                        <Th py={4} color={tableHeaderColor} borderColor={borderColor} textTransform="uppercase" fontSize="xs">Expiration</Th>
                        <Th py={4} color={tableHeaderColor} borderColor={borderColor} textTransform="uppercase" fontSize="xs">Comment</Th>
                        <Th py={4} color={tableHeaderColor} borderColor={borderColor}></Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {paginatedPendingOrders.map((order, index) => {
                        // Check if this is the first row of a new symbol group
                        const isFirstOfSymbol = index === 0 || paginatedPendingOrders[index - 1].symbol !== order.symbol;
                        
                        return (
                        <Tr 
                          key={order.orderId}
                          _hover={{ bg: hoverBg }}
                          cursor="pointer"
                          borderBottomWidth="1px"
                          borderColor={borderColor}
                          bg={isFirstOfSymbol ? useColorModeValue('gray.50', 'gray.700') : undefined}
                        >
                          <Td py={3} borderColor={borderColor}>
                            <HStack spacing={1}>
                              <Circle size="28px" bg="orange.400" color="white" fontSize="xs" fontWeight="bold">
                                {order.symbol === 'BTC' ? 'B' : order.symbol === 'ETH' ? 'E' : 'X'}
                              </Circle>
                              <Text fontWeight="medium">{order.symbol}</Text>
                            </HStack>
                          </Td>
                          <Td py={3} borderColor={borderColor}>
                            <Tag 
                              size="md" 
                              variant="subtle" 
                              colorScheme={order.type === 'Buy' ? 'blue' : 'red'} 
                              borderRadius="full"
                            >
                              {order.type}
                            </Tag>
                          </Td>
                          <Td py={3} isNumeric borderColor={borderColor} fontWeight="medium">{order.volume}</Td>
                          <Td py={3} isNumeric borderColor={borderColor}>
                            {order.symbol === 'XAU/USD' 
                              ? order.price.toFixed(3) 
                              : order.price.toFixed(2)}
                          </Td>
                          <Td py={3} isNumeric borderColor={borderColor}>
                            {order.symbol === 'XAU/USD' 
                              ? order.currentPrice.toFixed(3) 
                              : order.currentPrice.toFixed(2)}
                          </Td>
                          <Td py={3} isNumeric borderColor={borderColor}>{order.takeProfit}</Td>
                          <Td py={3} isNumeric borderColor={borderColor}>{order.stopLoss}</Td>
                          <Td py={3} borderColor={borderColor}>
                            <Flex align="center">
                              <Text mr={1} fontFamily="mono">{order.orderId}</Text>
                              <IconButton
                                aria-label="Copy order ID"
                                icon={<FiCopy />}
                                size="xs"
                                variant="ghost"
                                color="blue.500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(order.orderId, "Order ID");
                                }}
                              />
                            </Flex>
                          </Td>
                          <Td py={3} borderColor={borderColor} fontSize="sm">{order.creationTime}</Td>
                          <Td py={3} borderColor={borderColor} fontSize="sm">{order.expirationTime}</Td>
                          <Td py={3} borderColor={borderColor} fontSize="sm">{order.comment}</Td>
                          <Td py={3} borderColor={borderColor}>
                            <HStack spacing={1}>
                              <IconButton
                                aria-label="Edit order"
                                icon={<FiEdit />}
                                size="sm"
                                variant="ghost"
                                colorScheme="blue"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Edit functionality would go here
                                }}
                              />
                              <IconButton
                                aria-label="Cancel order"
                                icon={<FiX />}
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Cancel functionality would go here
                                }}
                              />
                            </HStack>
                          </Td>
                        </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Box>
              ) : (
                <Box p={4} width="100%">
                  <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4, xl: 5 }} spacing={4}>
                    {paginatedPendingOrders.map((order) => (
                      <Card 
                        key={order.orderId} 
                        boxShadow="md" 
                        _hover={{ boxShadow: "lg", transform: "translateY(-2px)" }}
                        transition="all 0.2s"
                        cursor="pointer"
                        borderLeft="4px solid"
                        borderLeftColor="orange.500"
                      >
                        <CardBody>
                          <Flex mb={3} align="center" justify="space-between">
                            <HStack>
                              <Circle size="32px" bg="orange.400" color="white" fontSize="sm" fontWeight="bold">
                                {order.symbol === 'BTC' ? 'B' : order.symbol === 'ETH' ? 'E' : 'X'}
                              </Circle>
                              <VStack align="start" spacing={0}>
                                <Text fontWeight="bold">{order.symbol}</Text>
                                <Tag 
                                  size="sm" 
                                  variant="subtle" 
                                  colorScheme={order.type === 'Buy' ? 'blue' : 'red'} 
                                  borderRadius="full"
                                >
                                  {order.type}
                                </Tag>
                              </VStack>
                            </HStack>
                            <Tag size="sm" colorScheme="orange">Pending</Tag>
                          </Flex>
                          
                          <Divider mb={3} />
                          
                          <SimpleGrid columns={2} spacing={2} mb={3}>
                            <Box>
                              <Text fontSize="xs" color={textColor}>Volume</Text>
                              <Text fontWeight="medium">{order.volume}</Text>
                            </Box>
                            <Box>
                              <Text fontSize="xs" color={textColor}>Price</Text>
                              <Text>
                                {order.symbol === 'XAU/USD' 
                                  ? order.price.toFixed(3) 
                                  : order.price.toFixed(2)}
                              </Text>
                            </Box>
                            <Box>
                              <Text fontSize="xs" color={textColor}>Current Price</Text>
                              <Text>
                                {order.symbol === 'XAU/USD' 
                                  ? order.currentPrice.toFixed(3) 
                                  : order.currentPrice.toFixed(2)}
                              </Text>
                            </Box>
                            <Box>
                              <Text fontSize="xs" color={textColor}>Created</Text>
                              <Text fontSize="sm">{order.creationTime}</Text>
                            </Box>
                          </SimpleGrid>
                          
                          <Divider mb={3} />
                          
                          <HStack justify="space-between">
                            <HStack>
                              <Tooltip label="View Details">
                                <IconButton
                                  aria-label="View order details"
                                  icon={<FiEye />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="blue"
                                />
                              </Tooltip>
                              <Tooltip label="Edit Order">
                                <IconButton
                                  aria-label="Edit order"
                                  icon={<FiEdit />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="blue"
                                />
                              </Tooltip>
                              <Tooltip label="Cancel Order">
                                <IconButton
                                  aria-label="Cancel order"
                                  icon={<FiX />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="red"
                                />
                              </Tooltip>
                            </HStack>
                            <Text fontSize="xs" fontFamily="mono" color={textColor}>
                              #{order.orderId.substring(0, 8)}
                            </Text>
                          </HStack>
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>
                </Box>
              )}
            </TabPanel>

            {/* CLOSED ORDERS TAB */}
            <TabPanel p={0} width="100%">
              {viewType === 'table' ? (
                <Box overflowX="auto" width="100%">
                  <Table variant="simple" size="md" color={textColor}>
                    <Thead bg={tableHeaderBg}>
                      <Tr>
                        <Th py={4} color={tableHeaderColor} borderColor={borderColor} textTransform="uppercase" fontSize="xs">Symbol</Th>
                        <Th py={4} color={tableHeaderColor} borderColor={borderColor} textTransform="uppercase" fontSize="xs">Type</Th>
                        <Th py={4} color={tableHeaderColor} borderColor={borderColor} textTransform="uppercase" fontSize="xs" isNumeric>Volume, lot</Th>
                        <Th py={4} color={tableHeaderColor} borderColor={borderColor} textTransform="uppercase" fontSize="xs" isNumeric>Open price</Th>
                        <Th py={4} color={tableHeaderColor} borderColor={borderColor} textTransform="uppercase" fontSize="xs" isNumeric>Close price</Th>
                        <Th py={4} color={tableHeaderColor} borderColor={borderColor} textTransform="uppercase" fontSize="xs" isNumeric>T/P</Th>
                        <Th py={4} color={tableHeaderColor} borderColor={borderColor} textTransform="uppercase" fontSize="xs" isNumeric>S/L</Th>
                        <Th py={4} color={tableHeaderColor} borderColor={borderColor} textTransform="uppercase" fontSize="xs">Order</Th>
                        <Th py={4} color={tableHeaderColor} borderColor={borderColor} textTransform="uppercase" fontSize="xs">Open time</Th>
                        <Th py={4} color={tableHeaderColor} borderColor={borderColor} textTransform="uppercase" fontSize="xs">Close time</Th>
                        <Th py={4} color={tableHeaderColor} borderColor={borderColor} textTransform="uppercase" fontSize="xs" isNumeric>Swap, INR</Th>
                        <Th py={4} color={tableHeaderColor} borderColor={borderColor} textTransform="uppercase" fontSize="xs" isNumeric>Commission, INR</Th>
                        <Th py={4} color={tableHeaderColor} borderColor={borderColor} textTransform="uppercase" fontSize="xs">Reason</Th>
                        <Th py={4} color={tableHeaderColor} borderColor={borderColor} textTransform="uppercase" fontSize="xs" isNumeric>P/L, INR</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {paginatedClosedOrders.map((order, index) => {
                        const isFirstOfSymbol = index === 0 || paginatedClosedOrders[index - 1].symbol !== order.symbol;
                        
                        return (
                        <Tr 
                          key={order.orderId}
                          _hover={{ bg: hoverBg }}
                          cursor="pointer"
                          borderBottomWidth="1px"
                          borderColor={borderColor}
                          bg={isFirstOfSymbol ? useColorModeValue('gray.50', 'gray.700') : undefined}
                        >
                          <Td py={3} borderColor={borderColor}>
                            <HStack spacing={1}>
                              <Circle size="28px" bg="orange.400" color="white" fontSize="xs" fontWeight="bold">
                                {order.symbol === 'BTC' ? 'B' : 'X'}
                              </Circle>
                              <Text fontWeight="medium">{order.symbol}</Text>
                            </HStack>
                          </Td>
                          <Td py={3} borderColor={borderColor}>
                            <Tag 
                              size="md" 
                              variant="subtle" 
                              colorScheme={order.type === 'Buy' ? 'blue' : 'red'} 
                              borderRadius="full"
                            >
                              {order.type}
                            </Tag>
                          </Td>
                          <Td py={3} isNumeric borderColor={borderColor} fontWeight="medium">{order.volume}</Td>
                          <Td py={3} isNumeric borderColor={borderColor}>
                            {order.symbol === 'XAU/USD' 
                              ? order.openPrice.toFixed(3) 
                              : order.openPrice.toFixed(2)}
                          </Td>
                          <Td py={3} isNumeric borderColor={borderColor}>
                            {order.symbol === 'XAU/USD' 
                              ? order.closePrice.toFixed(3) 
                              : order.closePrice.toFixed(2)}
                          </Td>
                          <Td py={3} isNumeric borderColor={borderColor}>{order.takeProfit}</Td>
                          <Td py={3} isNumeric borderColor={borderColor}>{order.stopLoss}</Td>
                          <Td py={3} borderColor={borderColor}>
                            <Flex align="center">
                              <Text mr={1} fontFamily="mono">{order.orderId}</Text>
                              <IconButton
                                aria-label="Copy order ID"
                                icon={<FiCopy />}
                                size="xs"
                                variant="ghost"
                                color="blue.500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(order.orderId, "Order ID");
                                }}
                              />
                            </Flex>
                          </Td>
                          <Td py={3} borderColor={borderColor} fontSize="sm">{order.openTime}</Td>
                          <Td py={3} borderColor={borderColor} fontSize="sm">{order.closeTime}</Td>
                          <Td py={3} isNumeric borderColor={borderColor}>{order.swap}</Td>
                          <Td py={3} isNumeric borderColor={borderColor}>{order.commission}</Td>
                          <Td py={3} borderColor={borderColor} fontSize="sm">
                            {order.reason && (
                              <Tag size="sm" colorScheme={order.reason === 'Take Profit' ? 'green' : 'gray'}>
                                {order.reason}
                              </Tag>
                            )}
                          </Td>
                          <Td py={3} isNumeric borderColor={borderColor} fontWeight="bold" color={order.profitLoss > 0 ? positiveColor : negativeColor}>
                            {order.profitLoss > 0 ? '+' : ''}
                            {order.profitLoss.toFixed(2)}
                          </Td>
                        </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Box>
              ) : (
                <Box p={4} width="100%">
                  <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4, xl: 5 }} spacing={4}>
                    {paginatedClosedOrders.map((order) => (
                      <Card 
                        key={order.orderId} 
                        boxShadow="md" 
                        _hover={{ boxShadow: "lg", transform: "translateY(-2px)" }}
                        transition="all 0.2s"
                        cursor="pointer"
                        borderLeft="4px solid"
                        borderLeftColor={order.profitLoss > 0 ? 'green.500' : 'red.500'}
                      >
                        <CardBody>
                          <Flex mb={3} align="center" justify="space-between">
                            <HStack>
                              <Circle size="32px" bg="orange.400" color="white" fontSize="sm" fontWeight="bold">
                                {order.symbol === 'BTC' ? 'B' : 'X'}
                              </Circle>
                              <VStack align="start" spacing={0}>
                                <Text fontWeight="bold">{order.symbol}</Text>
                                <Tag 
                                  size="sm" 
                                  variant="subtle" 
                                  colorScheme={order.type === 'Buy' ? 'blue' : 'red'} 
                                  borderRadius="full"
                                >
                                  {order.type}
                                </Tag>
                              </VStack>
                            </HStack>
                            <Text 
                              fontWeight="bold" 
                              color={order.profitLoss > 0 ? positiveColor : negativeColor}
                            >
                              {order.profitLoss > 0 ? '+' : ''}
                              {order.profitLoss.toFixed(2)} INR
                            </Text>
                          </Flex>
                          
                          <Divider mb={3} />
                          
                          <SimpleGrid columns={2} spacing={2} mb={3}>
                            <Box>
                              <Text fontSize="xs" color={textColor}>Volume</Text>
                              <Text fontWeight="medium">{order.volume}</Text>
                            </Box>
                            <Box>
                              <Text fontSize="xs" color={textColor}>Open Price</Text>
                              <Text>
                                {order.symbol === 'XAU/USD' 
                                  ? order.openPrice.toFixed(3) 
                                  : order.openPrice.toFixed(2)}
                              </Text>
                            </Box>
                            <Box>
                              <Text fontSize="xs" color={textColor}>Close Price</Text>
                              <Text>
                                {order.symbol === 'XAU/USD' 
                                  ? order.closePrice.toFixed(3) 
                                  : order.closePrice.toFixed(2)}
                              </Text>
                            </Box>
                            <Box>
                              <Text fontSize="xs" color={textColor}>Close Time</Text>
                              <Text fontSize="sm">{order.closeTime}</Text>
                            </Box>
                          </SimpleGrid>
                          
                          <Divider mb={3} />
                          
                          <HStack justify="space-between">
                            <HStack>
                              <Tooltip label="View Details">
                                <IconButton
                                  aria-label="View order details"
                                  icon={<FiEye />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="blue"
                                />
                              </Tooltip>
                              <Tooltip label="Edit Order">
                                <IconButton
                                  aria-label="Edit order"
                                  icon={<FiEdit />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="blue"
                                />
                              </Tooltip>
                              <Tooltip label="Close Order">
                                <IconButton
                                  aria-label="Close order"
                                  icon={<FiX />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="red"
                                />
                              </Tooltip>
                            </HStack>
                            <Text fontSize="xs" fontFamily="mono" color={textColor}>
                              #{order.orderId.substring(0, 8)}
                            </Text>
                          </HStack>
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>
                </Box>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Card>

      {/* MOVE ANALYTICS SECTION HERE - Below Tables */}
      {showAnalytics && (
        <Box mt={8} mb={6}>
          <Card 
            borderRadius="lg" 
            boxShadow="xl" 
            overflow="hidden" 
            bg={useColorModeValue('white', 'gray.800')} 
            width="100%" 
            mb={6} 
            borderWidth="1px" 
            borderColor={useColorModeValue('purple.200', 'purple.700')}
          >
            <CardHeader 
              bg={useColorModeValue('purple.50', 'purple.900')} 
              py={4} 
              px={5} 
              borderBottomWidth="1px" 
              borderColor={borderColor}
            >
              <Flex align="center" justify="space-between">
                <Flex align="center">
                  <Icon as={FiBarChart2} mr={2} color={useColorModeValue('purple.600', 'purple.200')} boxSize={5} />
                  <Heading size="md" color={useColorModeValue('purple.700', 'white')}>Trading Performance Analytics</Heading>
                </Flex>
                <ButtonGroup size="sm" isAttached variant="outline">
                  {['1W', '1M', '3M', '6M', '1Y', 'ALL'].map((period) => (
                    <Button
                      key={period}
                      onClick={() => setAnalyticsTimeframe(period)}
                      colorScheme="purple"
                      bg={analyticsTimeframe === period ? useColorModeValue('purple.100', 'purple.700') : 'transparent'}
                      color={analyticsTimeframe === period ? useColorModeValue('purple.800', 'white') : useColorModeValue('gray.700', 'gray.200')}
                      borderColor={useColorModeValue('purple.200', 'purple.600')}
                      _hover={analyticsTimeframe !== period ? { bg: useColorModeValue('purple.50', 'purple.800') } : {}}
                      fontWeight={analyticsTimeframe === period ? 'bold' : 'medium'}
                    >
                      {period}
                    </Button>
                  ))}
                </ButtonGroup>
              </Flex>
            </CardHeader>
            <CardBody p={0}>
              <Box p={6} bg={useColorModeValue('white', 'gray.900')}>
                {/* Performance Metrics in Horizontal Layout */}
                <Box 
                  mb={8} 
                  p={4} 
                  borderRadius="lg" 
                  bg={useColorModeValue('gray.50', 'gray.800')}
                  boxShadow="sm"
                  borderWidth="1px"
                  borderColor={useColorModeValue('gray.200', 'gray.700')}
                >
                  <Flex align="center" mb={3}>
                    <Icon as={FiTarget} mr={2} color={useColorModeValue('blue.600', 'blue.300')} />
                    <Text fontWeight="semibold" fontSize="md" color={useColorModeValue('gray.800', 'white')}>Key Performance Metrics</Text>
                  </Flex>
                  <SimpleGrid columns={{ base: 2, md: 4, lg: 8 }} spacing={4}>
                    {performanceMetrics.map((metric) => (
                      <Card 
                        key={metric.label} 
                        borderRadius="md" 
                        boxShadow="sm" 
                        overflow="hidden" 
                        borderLeftWidth="4px" 
                        borderLeftColor={metric.color}
                        bg={useColorModeValue('white', 'gray.700')}
                      >
                        <CardBody p={3}>
                          <Flex align="center" mb={2}>
                            <Box
                              p={1.5}
                              color="white"
                              bg={useColorModeValue(metric.color, metric.color)}
                              borderRadius="md"
                              mr={2}
                            >
                              {metric.icon}
                            </Box>
                            <Text fontSize="sm" fontWeight="medium" color={useColorModeValue('gray.800', 'white')}>
                              {metric.label}
                            </Text>
                          </Flex>
                          <Text fontSize="xl" fontWeight="bold" mb={1} color={useColorModeValue('gray.800', 'white')}>
                            {metric.label.includes('Win Rate') 
                              ? `${metric.value.toFixed(1)}%` 
                              : metric.label.includes('Time')
                                ? `${metric.value.toFixed(1)}h`
                                : metric.value.toLocaleString(undefined, {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 2
                                  })}
                          </Text>
                          {metric.change !== 0 && (
                            <HStack fontSize="xs" color={metric.change > 0 ? useColorModeValue("green.600", "green.300") : useColorModeValue("red.600", "red.300")}>
                              <Icon as={metric.change > 0 ? FiArrowUp : FiArrowDown} />
                              <Text>
                                {Math.abs(metric.change).toLocaleString(undefined, {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 1
                                })}
                                {metric.label.includes('Profit Factor') || metric.label.includes('Win Rate') 
                                  ? '%' : metric.label.includes('Time') ? 'h' : ''}
                              </Text>
                              <Text>vs. previous</Text>
                            </HStack>
                          )}
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>
                </Box>
                
                {/* P/L Line Chart */}
                <Card 
                  mb={6} 
                  borderRadius="lg" 
                  overflow="hidden" 
                  boxShadow="md" 
                  bg={useColorModeValue('white', 'gray.700')} 
                  borderWidth="1px"
                  borderColor={useColorModeValue('blue.100', 'blue.700')}
                >
                  <CardHeader 
                    bg={useColorModeValue('blue.50', 'blue.800')} 
                    py={3} 
                    px={4} 
                    borderBottomWidth="1px" 
                    borderColor={borderColor}
                  >
                    <Flex align="center">
                      <Icon as={FiTrendingUp} mr={2} color={useColorModeValue('blue.600', 'blue.300')} boxSize={5} />
                      <Text fontWeight="bold" fontSize="md" color={useColorModeValue('blue.700', 'white')}>Cumulative Profit/Loss Analysis</Text>
                    </Flex>
                  </CardHeader>
                  <CardBody p={4} height="350px" bg={useColorModeValue('white', 'gray.800')}>
                    <Plot
                      data={[
                        {
                          x: plChartData.dates,
                          y: plChartData.cumPLValues,
                          type: 'scatter',
                          mode: 'lines+markers',
                          name: 'Cumulative P/L',
                          line: { color: totalProfitLoss >= 0 ? '#38A169' : '#E53E3E', width: 3 },
                          marker: { size: 6 }
                        },
                        {
                          x: plChartData.dates,
                          y: plChartData.plValues,
                          type: 'bar',
                          name: 'P/L per Trade',
                          marker: {
                            color: plChartData.plValues.map(v => v >= 0 ? '#4FD1C5' : '#FC8181')
                          },
                          opacity: 0.7
                        }
                      ]}
                      layout={{
                        autosize: true,
                        margin: { l: 60, r: 50, t: 30, b: 50 },
                        paper_bgcolor: 'rgba(0,0,0,0)',
                        plot_bgcolor: 'rgba(0,0,0,0)',
                        xaxis: {
                          title: 'Date',
                          showgrid: false,
                          showline: true,
                          linecolor: useColorModeValue('rgba(0,0,0,0.2)', 'rgba(255,255,255,0.2)'),
                          tickfont: {
                            color: useColorModeValue('#1A202C', '#FFFFFF'),
                            size: 11,
                            family: 'Arial, sans-serif'
                          },
                          titlefont: {
                            color: useColorModeValue('#1A202C', '#FFFFFF'),
                            size: 12,
                            family: 'Arial, sans-serif'
                          }
                        },
                        yaxis: {
                          title: 'P/L (INR)',
                          showgrid: true,
                          gridcolor: useColorModeValue('rgba(0,0,0,0.1)', 'rgba(255,255,255,0.1)'),
                          zerolinecolor: useColorModeValue('rgba(0,0,0,0.3)', 'rgba(255,255,255,0.3)'),
                          tickfont: {
                            color: useColorModeValue('#1A202C', '#FFFFFF'),
                            size: 11,
                            family: 'Arial, sans-serif'
                          },
                          titlefont: {
                            color: useColorModeValue('#1A202C', '#FFFFFF'),
                            size: 12,
                            family: 'Arial, sans-serif'
                          }
                        },
                        legend: {
                          x: 0,
                          y: 1,
                          orientation: 'h',
                          bgcolor: useColorModeValue('rgba(255,255,255,0.8)', 'rgba(48,48,60,0.8)'),
                          bordercolor: useColorModeValue('rgba(0,0,0,0.1)', 'rgba(255,255,255,0.1)'),
                          borderwidth: 1,
                          font: {
                            family: 'Arial, sans-serif',
                            size: 11,
                            color: useColorModeValue('#1A202C', '#FFFFFF')
                          }
                        },
                        barmode: 'group',
                        hovermode: 'closest',
                        showlegend: true,
                        font: {
                          family: 'Arial, sans-serif',
                          color: useColorModeValue('#1A202C', '#FFFFFF')
                        }
                      }}
                      useResizeHandler={true}
                      style={{ width: '100%', height: '100%' }}
                      config={{ responsive: true, displayModeBar: false }}
                    />
                  </CardBody>
                </Card>
                
                {/* Distribution Analysis Grid */}
                <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={5} mb={6}>
                  {/* Symbol Distribution */}
                  <Card 
                    borderRadius="lg" 
                    overflow="hidden" 
                    boxShadow="md" 
                    bg={useColorModeValue('white', 'gray.700')}
                    borderWidth="1px"
                    borderColor={useColorModeValue('green.100', 'green.700')}
                  >
                    <CardHeader 
                      bg={useColorModeValue('green.50', 'green.800')} 
                      py={3} 
                      px={4} 
                      borderBottomWidth="1px" 
                      borderColor={borderColor}
                    >
                      <Flex align="center">
                        <Icon as={FiPieChart} mr={2} color={useColorModeValue('green.600', 'green.300')} boxSize={5} />
                        <Text fontWeight="bold" fontSize="md" color={useColorModeValue('green.700', 'white')}>Symbol Distribution</Text>
                      </Flex>
                    </CardHeader>
                    <CardBody p={4} height="300px" bg={useColorModeValue('white', 'gray.800')}>
                      <Plot
                        data={[
                          {
                            values: Object.values(distributionData.symbolCounts),
                            labels: Object.keys(distributionData.symbolCounts),
                            type: 'pie',
                            name: 'By Symbol',
                            hole: 0.4,
                            textinfo: 'label+percent',
                            marker: {
                              colors: ['#4299E1', '#F6AD55', '#9F7AEA', '#4FD1C5', '#68D391', '#FC8181', '#B794F4']
                            },
                            textfont: {
                              color: useColorModeValue('#1A202C', '#FFFFFF'),
                              family: 'Arial, sans-serif',
                              size: 12
                            },
                            hoverinfo: 'label+percent+name',
                            outsidetextfont: {
                              color: useColorModeValue('#1A202C', '#FFFFFF'),
                              family: 'Arial, sans-serif',
                              size: 12
                            }
                          }
                        ]}
                        layout={{
                          autosize: true,
                          margin: { l: 20, r: 20, t: 30, b: 20 },
                          paper_bgcolor: 'rgba(0,0,0,0)',
                          plot_bgcolor: 'rgba(0,0,0,0)',
                          annotations: [
                            {
                              text: 'Assets',
                              showarrow: false,
                              x: 0.5,
                              y: 0.5,
                              font: { 
                                size: 14,
                                color: useColorModeValue('#1A202C', '#FFFFFF'),
                                family: 'Arial, sans-serif'
                              }
                            }
                          ],
                          showlegend: true,
                          legend: { 
                            orientation: 'h', 
                            y: -0.15,
                            bgcolor: useColorModeValue('rgba(255,255,255,0.8)', 'rgba(48,48,60,0.8)'),
                            bordercolor: useColorModeValue('rgba(0,0,0,0.1)', 'rgba(255,255,255,0.1)'),
                            borderwidth: 1,
                            font: {
                              family: 'Arial, sans-serif',
                              size: 11,
                              color: useColorModeValue('#1A202C', '#FFFFFF')
                            }
                          },
                          font: {
                            family: 'Arial, sans-serif',
                            color: useColorModeValue('#1A202C', '#FFFFFF')
                          },
                          showlegend: true
                        }}
                        useResizeHandler={true}
                        style={{ width: '100%', height: '100%' }}
                        config={{ responsive: true, displayModeBar: false }}
                      />
                    </CardBody>
                  </Card>
                  
                  {/* Order Type Distribution */}
                  <Card 
                    borderRadius="lg" 
                    overflow="hidden" 
                    boxShadow="md" 
                    bg={useColorModeValue('white', 'gray.700')}
                    borderWidth="1px"
                    borderColor={useColorModeValue('teal.100', 'teal.700')}
                  >
                    <CardHeader 
                      bg={useColorModeValue('teal.50', 'teal.800')} 
                      py={3} 
                      px={4} 
                      borderBottomWidth="1px" 
                      borderColor={borderColor}
                    >
                      <Flex align="center">
                        <Icon as={FiActivity} mr={2} color={useColorModeValue('teal.600', 'teal.300')} boxSize={5} />
                        <Text fontWeight="bold" fontSize="md" color={useColorModeValue('teal.700', 'white')}>Buy/Sell Distribution</Text>
                      </Flex>
                    </CardHeader>
                    <CardBody p={4} height="300px" bg={useColorModeValue('white', 'gray.800')}>
                      <Plot
                        data={[
                          {
                            values: [distributionData.typeCounts.Buy, distributionData.typeCounts.Sell],
                            labels: ['Buy', 'Sell'],
                            type: 'pie',
                            name: 'Order Types',
                            hole: 0.6,
                            textinfo: 'label+percent',
                            marker: {
                              colors: ['#63B3ED', '#FC8181']
                            },
                            textfont: {
                              color: useColorModeValue('#1A202C', '#FFFFFF'),
                              family: 'Arial, sans-serif',
                              size: 12
                            },
                            hoverinfo: 'label+percent+name',
                            outsidetextfont: {
                              color: useColorModeValue('#1A202C', '#FFFFFF'),
                              family: 'Arial, sans-serif',
                              size: 12
                            }
                          }
                        ]}
                        layout={{
                          autosize: true,
                          margin: { l: 20, r: 20, t: 30, b: 20 },
                          paper_bgcolor: 'rgba(0,0,0,0)',
                          plot_bgcolor: 'rgba(0,0,0,0)',
                          annotations: [
                            {
                              text: 'Orders',
                              showarrow: false,
                              x: 0.5,
                              y: 0.5,
                              font: { 
                                size: 14,
                                color: useColorModeValue('#1A202C', '#FFFFFF'),
                                family: 'Arial, sans-serif'
                              }
                            }
                          ],
                          showlegend: true,
                          legend: { 
                            orientation: 'h', 
                            y: -0.15,
                            bgcolor: useColorModeValue('rgba(255,255,255,0.8)', 'rgba(48,48,60,0.8)'),
                            bordercolor: useColorModeValue('rgba(0,0,0,0.1)', 'rgba(255,255,255,0.1)'),
                            borderwidth: 1,
                            font: {
                              family: 'Arial, sans-serif',
                              size: 11,
                              color: useColorModeValue('#1A202C', '#FFFFFF')
                            }
                          },
                          font: {
                            family: 'Arial, sans-serif',
                            color: useColorModeValue('#1A202C', '#FFFFFF')
                          },
                          showlegend: true
                        }}
                        useResizeHandler={true}
                        style={{ width: '100%', height: '100%' }}
                        config={{ responsive: true, displayModeBar: false }}
                      />
                    </CardBody>
                  </Card>
                  
                  {/* P/L Distribution */}
                  <Card 
                    borderRadius="lg" 
                    overflow="hidden" 
                    boxShadow="md" 
                    bg={useColorModeValue('white', 'gray.700')}
                    borderWidth="1px"
                    borderColor={useColorModeValue('purple.100', 'purple.700')}
                  >
                    <CardHeader 
                      bg={useColorModeValue('purple.50', 'purple.800')} 
                      py={3} 
                      px={4} 
                      borderBottomWidth="1px" 
                      borderColor={borderColor}
                    >
                      <Flex align="center">
                        <Icon as={FiBarChart2} mr={2} color={useColorModeValue('purple.600', 'purple.300')} boxSize={5} />
                        <Text fontWeight="bold" fontSize="md" color={useColorModeValue('purple.700', 'white')}>P/L Distribution</Text>
                      </Flex>
                    </CardHeader>
                    <CardBody p={4} height="300px" bg={useColorModeValue('white', 'gray.800')}>
                      <Plot
                        data={[
                          {
                            x: distributionData.profitLossValues,
                            type: 'histogram',
                            marker: {
                              color: useColorModeValue('#B794F4', '#D6BCFA'),
                              line: {
                                color: useColorModeValue('#805AD5', '#B794F4'),
                                width: 1
                              }
                            },
                            opacity: 0.8,
                            histnorm: ''
                          }
                        ]}
                        layout={{
                          autosize: true,
                          margin: { l: 50, r: 30, t: 30, b: 40 },
                          paper_bgcolor: 'rgba(0,0,0,0)',
                          plot_bgcolor: 'rgba(0,0,0,0)',
                          xaxis: {
                            title: 'Profit/Loss (INR)',
                            titlefont: {
                              size: 12,
                              color: useColorModeValue('#1A202C', '#FFFFFF'),
                              family: 'Arial, sans-serif'
                            },
                            tickfont: {
                              color: useColorModeValue('#1A202C', '#FFFFFF'),
                              family: 'Arial, sans-serif',
                              size: 11
                            },
                            showgrid: false,
                            zeroline: true,
                            zerolinecolor: useColorModeValue('rgba(0,0,0,0.2)', 'rgba(255,255,255,0.3)')
                          },
                          yaxis: {
                            title: 'Frequency',
                            titlefont: {
                              size: 12,
                              color: useColorModeValue('#1A202C', '#FFFFFF'),
                              family: 'Arial, sans-serif'
                            },
                            tickfont: {
                              color: useColorModeValue('#1A202C', '#FFFFFF'),
                              family: 'Arial, sans-serif',
                              size: 11
                            },
                            showgrid: true,
                            gridcolor: useColorModeValue('rgba(0,0,0,0.1)', 'rgba(255,255,255,0.1)')
                          },
                          bargap: 0.1,
                          showlegend: false,
                          font: {
                            family: 'Arial, sans-serif',
                            color: useColorModeValue('#1A202C', '#FFFFFF')
                          }
                        }}
                        useResizeHandler={true}
                        style={{ width: '100%', height: '100%' }}
                        config={{ responsive: true, displayModeBar: false }}
                      />
                    </CardBody>
                  </Card>
                </SimpleGrid>
                
                {/* Time Analysis Section */}
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
                  {/* Time of Day Analysis */}
                  <Card 
                    borderRadius="lg" 
                    overflow="hidden" 
                    boxShadow="md" 
                    bg={useColorModeValue('white', 'gray.700')}
                    borderWidth="1px"
                    borderColor={useColorModeValue('orange.100', 'orange.700')}
                  >
                    <CardHeader 
                      bg={useColorModeValue('orange.50', 'orange.800')} 
                      py={3} 
                      px={4} 
                      borderBottomWidth="1px" 
                      borderColor={borderColor}
                    >
                      <Flex align="center">
                        <Icon as={FiClock} mr={2} color={useColorModeValue('orange.600', 'orange.300')} boxSize={5} />
                        <Text fontWeight="bold" fontSize="md" color={useColorModeValue('orange.700', 'white')}>Performance by Time of Day</Text>
                      </Flex>
                    </CardHeader>
                    <CardBody p={4} height="300px" bg={useColorModeValue('white', 'gray.800')}>
                      <Plot
                        data={[
                          {
                            x: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
                            y: [1200, -800, 5600, 2300, -1500, 3000],
                            type: 'bar',
                            marker: {
                              color: [
                                '#68D391', '#FC8181', '#68D391', '#68D391', '#FC8181', '#68D391'
                              ]
                            },
                            hovertemplate: 'Time: %{x}<br>P/L: %{y:,.2f} INR<extra></extra>'
                          }
                        ]}
                        layout={{
                          autosize: true,
                          margin: { l: 50, r: 30, t: 30, b: 40 },
                          paper_bgcolor: 'rgba(0,0,0,0)',
                          plot_bgcolor: 'rgba(0,0,0,0)',
                          xaxis: {
                            title: 'Time of Day',
                            titlefont: {
                              size: 12,
                              color: useColorModeValue('#1A202C', '#FFFFFF'),
                              family: 'Arial, sans-serif'
                            },
                            tickfont: {
                              color: useColorModeValue('#1A202C', '#FFFFFF'),
                              family: 'Arial, sans-serif',
                              size: 11
                            },
                            showgrid: false,
                            tickangle: -45
                          },
                          yaxis: {
                            title: 'P/L (INR)',
                            titlefont: {
                              size: 12,
                              color: useColorModeValue('#1A202C', '#FFFFFF'),
                              family: 'Arial, sans-serif'
                            },
                            tickfont: {
                              color: useColorModeValue('#1A202C', '#FFFFFF'),
                              family: 'Arial, sans-serif',
                              size: 11
                            },
                            showgrid: true,
                            gridcolor: useColorModeValue('rgba(0,0,0,0.1)', 'rgba(255,255,255,0.1)'),
                            zerolinecolor: useColorModeValue('rgba(0,0,0,0.2)', 'rgba(255,255,255,0.3)')
                          },
                          hovermode: 'closest',
                          showlegend: false,
                          font: {
                            family: 'Arial, sans-serif',
                            color: useColorModeValue('#1A202C', '#FFFFFF')
                          }
                        }}
                        useResizeHandler={true}
                        style={{ width: '100%', height: '100%' }}
                        config={{ responsive: true, displayModeBar: false }}
                      />
                    </CardBody>
                  </Card>
                  
                  {/* Day of Week Analysis */}
                  <Card 
                    borderRadius="lg" 
                    overflow="hidden" 
                    boxShadow="md" 
                    bg={useColorModeValue('white', 'gray.700')}
                    borderWidth="1px"
                    borderColor={useColorModeValue('blue.100', 'blue.700')}
                  >
                    <CardHeader 
                      bg={useColorModeValue('blue.50', 'blue.800')} 
                      py={3} 
                      px={4} 
                      borderBottomWidth="1px" 
                      borderColor={borderColor}
                    >
                      <Flex align="center">
                        <Icon as={FiCalendar} mr={2} color={useColorModeValue('blue.600', 'blue.300')} boxSize={5} />
                        <Text fontWeight="bold" fontSize="md" color={useColorModeValue('blue.700', 'white')}>Performance by Day of Week</Text>
                      </Flex>
                    </CardHeader>
                    <CardBody p={4} height="300px" bg={useColorModeValue('white', 'gray.800')}>
                      <Plot
                        data={[
                          {
                            x: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                            y: [4200, -800, 2300, 5600, 8900, 1200, -500],
                            type: 'bar',
                            marker: {
                              color: [
                                '#68D391', '#FC8181', '#68D391', '#68D391', '#68D391', '#68D391', '#FC8181'
                              ]
                            },
                            hovertemplate: 'Day: %{x}<br>P/L: %{y:,.2f} INR<extra></extra>'
                          }
                        ]}
                        layout={{
                          autosize: true,
                          margin: { l: 50, r: 30, t: 30, b: 40 },
                          paper_bgcolor: 'rgba(0,0,0,0)',
                          plot_bgcolor: 'rgba(0,0,0,0)',
                          xaxis: {
                            title: 'Day of Week',
                            titlefont: {
                              size: 12,
                              color: useColorModeValue('#1A202C', '#FFFFFF'),
                              family: 'Arial, sans-serif'
                            },
                            tickfont: {
                              color: useColorModeValue('#1A202C', '#FFFFFF'),
                              family: 'Arial, sans-serif',
                              size: 11
                            },
                            showgrid: false
                          },
                          yaxis: {
                            title: 'P/L (INR)',
                            titlefont: {
                              size: 12,
                              color: useColorModeValue('#1A202C', '#FFFFFF'),
                              family: 'Arial, sans-serif'
                            },
                            tickfont: {
                              color: useColorModeValue('#1A202C', '#FFFFFF'),
                              family: 'Arial, sans-serif',
                              size: 11
                            },
                            showgrid: true,
                            gridcolor: useColorModeValue('rgba(0,0,0,0.1)', 'rgba(255,255,255,0.1)'),
                            zerolinecolor: useColorModeValue('rgba(0,0,0,0.2)', 'rgba(255,255,255,0.3)')
                          },
                          hovermode: 'closest',
                          showlegend: false,
                          font: {
                            family: 'Arial, sans-serif',
                            color: useColorModeValue('#1A202C', '#FFFFFF')
                          }
                        }}
                        useResizeHandler={true}
                        style={{ width: '100%', height: '100%' }}
                        config={{ responsive: true, displayModeBar: false }}
                      />
                    </CardBody>
                  </Card>
                </SimpleGrid>
              </Box>
            </CardBody>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default Orders; 
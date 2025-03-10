import React, { useState, useEffect } from 'react';
import {
  Box,
  SimpleGrid,
  Text,
  Badge,
  VStack,
  Heading,
  useColorModeValue,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useToast,
  Divider,
  Icon,
  Tooltip,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Tag,
  HStack,
  Grid,
  GridItem,
  InputGroup,
  InputRightElement,
  InputLeftElement,
  Card,
  CardHeader,
  CardBody,
  Spinner,
} from '@chakra-ui/react';
import { FiEdit, FiSave, FiInfo, FiChevronRight, FiDollarSign, FiClock, FiPercent, FiSliders } from 'react-icons/fi';
import { useApp } from '../context/AppContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Strategy, StrategyParameter } from '@/types/backtest';
import axios from 'axios';

const Strategies: React.FC = () => {
  const { strategies, settings, refreshStrategies, isLoading } = useApp();
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('gray.50', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
  const modalBg = useColorModeValue('white', 'gray.800');
  const paramBg = useColorModeValue('gray.50', 'gray.700');
  const tagBg = useColorModeValue('blue.50', 'blue.900');
  const inputBg = useColorModeValue('white', 'gray.700');
  
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [editedParams, setEditedParams] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Custom close handler to ensure clean state
  const handleModalClose = () => {
    if (!isSaving) {
      setIsSaving(false);
      onClose();
      
      // Check if the user came from the backtest page
      const params = new URLSearchParams(location.search);
      const fromBacktest = params.get('from') === 'backtest';
      
      if (fromBacktest) {
        // Redirect back to the backtest page
        navigate('/backtest', { replace: true });
      } else {
        // Just clear the edit parameter
        navigate('/strategies', { replace: true });
      }
    }
  };

  // Force close the modal regardless of state
  const forceCloseModal = () => {
    setIsSaving(false);
    onClose();
    
    // Check if the user came from the backtest page
    const params = new URLSearchParams(location.search);
    const fromBacktest = params.get('from') === 'backtest';
    
    if (fromBacktest) {
      // Redirect back to the backtest page
      navigate('/backtest', { replace: true });
    } else {
      // Just clear the edit parameter
      navigate('/strategies', { replace: true });
    }
  };

  // Check for edit query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editStrategyName = params.get('edit');
    
    if (editStrategyName && strategies.length > 0) {
      const strategy = strategies.find(s => s.name === editStrategyName);
      if (strategy) {
        setSelectedStrategy(strategy);
        
        // Initialize edited params with default values
        const initialParams: Record<string, number> = {};
        Object.entries(strategy.parameters).forEach(([key, param]) => {
          initialParams[key] = param.default;
        });
        setEditedParams(initialParams);
        
        // Ensure isSaving is reset to false
        setIsSaving(false);
        
        // Open the modal
        onOpen();
      }
    } else if (!editStrategyName && isOpen) {
      // If no edit parameter but modal is open, close it
      onClose();
    }
  }, [location.search, strategies, onOpen, isOpen, onClose]);

  const handleEditStrategy = (strategy: Strategy) => {
    setSelectedStrategy(strategy);
    
    // Initialize edited params with default values
    const initialParams: Record<string, number> = {};
    Object.entries(strategy.parameters).forEach(([key, param]) => {
      initialParams[key] = param.default;
    });
    setEditedParams(initialParams);
    
    onOpen();
    
    // Update URL to include edit parameter
    navigate(`/strategies?edit=${strategy.name}`, { replace: true });
  };

  const handleParamChange = (paramName: string, value: number) => {
    setEditedParams(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  // Get appropriate icon for parameter type
  const getParamIcon = (paramName: string) => {
    if (paramName.includes('period') || paramName.includes('window')) {
      return FiClock;
    } else if (paramName.includes('profit') || paramName.includes('loss') || paramName.includes('amount')) {
      return FiDollarSign;
    } else if (paramName.includes('percent') || paramName.includes('ratio') || paramName.includes('std')) {
      return FiPercent;
    }
    return FiSliders;
  };

  const handleSaveParams = async () => {
    if (!selectedStrategy) return;
    
    try {
      setIsSaving(true);
      
      // Use the edited params directly without validation
      const updateData = {
        strategyName: selectedStrategy.name,
        parameters: editedParams
      };
      
      console.log("Saving parameters for strategy:", selectedStrategy.name);
      console.log("Parameters:", editedParams);
      
      // Make the actual API call to update strategy parameters using axios
      try {
        const response = await axios.post('http://localhost:5002/api/strategies/update', updateData);
        
        if (response.data.status === 'success') {
          // Refresh strategies to get updated data
          if (refreshStrategies) {
            await refreshStrategies();
          }
          
          toast({
            title: "Parameters saved",
            description: `Strategy ${selectedStrategy.name} parameters have been updated successfully.`,
            status: "success",
            duration: 3000,
            isClosable: true,
          });
          
          // Force close the modal
          forceCloseModal();
          
          // Return early to avoid the finally block
          return;
        } else {
          throw new Error(response.data.message || 'Failed to update strategy parameters');
        }
      } catch (error: any) {
        console.error("Error saving parameters:", error);
        
        // Display detailed error information
        let errorMessage = "Unknown error occurred";
        
        if (error.response) {
          console.log("Error response data:", error.response.data);
          errorMessage = `Server error (${error.response.status}): ${error.response.data.message || 'Unknown server error'}`;
        } else if (error.request) {
          errorMessage = "No response from server. Please check if the server is running.";
        } else {
          errorMessage = error.message || "Error preparing the request";
        }
        
        toast({
          title: "Error saving parameters",
          description: errorMessage,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        
        // Fall back to client-side update
        handleSaveParamsFallback();
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Fallback implementation if API is not available
  const handleSaveParamsFallback = async () => {
    if (!selectedStrategy) return;
    
    try {
      setIsSaving(true);
      
      // Log what would be sent to the API
      console.log("Using fallback to save parameters for strategy:", selectedStrategy.name);
      console.log("Parameters:", editedParams);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the strategy in the local state (this is a workaround)
      const updatedStrategy = { ...selectedStrategy };
      Object.entries(editedParams).forEach(([key, value]) => {
        if (updatedStrategy.parameters[key]) {
          updatedStrategy.parameters[key].default = value;
        }
      });
      
      toast({
        title: "Parameters saved (local only)",
        description: `Strategy ${selectedStrategy.name} parameters have been updated locally. Note: This is a client-side update only and will not persist.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      
      // Force close the modal
      forceCloseModal();
    } catch (error) {
      console.error("Error in fallback save:", error);
      toast({
        title: "Error saving parameters",
        description: "There was an error saving the strategy parameters locally.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setIsSaving(false);
    }
  };

  return (
    <Box p={5}>
      <Breadcrumb mb={4} separator={<Icon as={FiChevronRight} color="gray.500" />}>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>Strategies</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      
      <Box mb={6}>
        <Heading as="h1" size="xl" mb={2}>Available Strategies</Heading>
        <Text color={secondaryTextColor}>
          Configure and manage your trading strategies. Click on a strategy to edit its parameters.
        </Text>
      </Box>
      
      {isLoading ? (
        <Flex justify="center" align="center" p={10}>
          <Spinner size="xl" color="blue.500" />
          <Text ml={4} fontSize="lg">Loading strategies...</Text>
        </Flex>
      ) : strategies.length === 0 ? (
        <Box p={5} borderWidth={1} borderRadius="md" borderColor={borderColor} bg={cardBg}>
          <Text>No strategies found. The backend server may not be running properly.</Text>
          <Button 
            mt={4} 
            colorScheme="blue" 
            onClick={refreshStrategies}
          >
            Refresh Strategies
          </Button>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
          {strategies.map((strategy) => (
            <Box
              key={strategy.name}
              shadow="md"
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="lg"
              bg={cardBg}
              overflow="hidden"
              transition="transform 0.2s, box-shadow 0.2s"
              _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
            >
              <Box p={4} bg={headerBg} borderBottomWidth="1px" borderColor={borderColor}>
                <Flex justify="space-between" align="center">
                  <Heading size="md">
                    {strategy.name}
                    {settings.activeStrategy === strategy.name && (
                      <Badge ml={2} colorScheme="green">
                        Active
                      </Badge>
                    )}
                  </Heading>
                  <Button 
                    size="sm" 
                    leftIcon={<Icon as={FiEdit} />}
                    colorScheme="blue"
                    variant="ghost"
                    onClick={() => handleEditStrategy(strategy)}
                  >
                    Edit
                  </Button>
                </Flex>
              </Box>
              
              <VStack align="start" spacing={3} p={5}>
                <Text>{strategy.description}</Text>
                <Divider />
                <Box width="100%">
                  <Text fontWeight="bold" mb={2}>
                    Parameters:
                  </Text>
                  <VStack align="start" spacing={2} width="100%">
                    {Object.entries(strategy.parameters).map(([key, param]) => (
                      <Flex key={key} width="100%" justify="space-between" align="center">
                        <Flex align="center">
                          <Text fontSize="sm" fontWeight="medium">{key}:</Text>
                          <Tooltip label={param.description} placement="top">
                            <Icon as={getParamIcon(key)} ml={1} color="blue.400" boxSize={3} />
                          </Tooltip>
                        </Flex>
                        <Text fontSize="sm">{param.default}</Text>
                      </Flex>
                    ))}
                  </VStack>
                </Box>
              </VStack>
            </Box>
          ))}
        </SimpleGrid>
      )}
      
      {/* Strategy Edit Modal */}
      <Modal 
        isOpen={isOpen} 
        onClose={handleModalClose}
        size="full"
        motionPreset="slideInBottom"
      >
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(1px)" />
        <ModalContent
          bg={modalBg}
          maxW="1200px"
          w="85%"
          mx="auto"
          my="50px"
          borderRadius="2xl"
          boxShadow="2xl"
          overflow="hidden"
        >
          <ModalHeader 
            borderBottomWidth="1px" 
            borderColor={borderColor}
            py={4}
            px={6}
            bg={headerBg}
            borderTopRadius="2xl"
          >
            <Flex justify="space-between" align="center">
              <HStack spacing={3}>
                <Icon as={FiEdit} boxSize="20px" color="blue.500" />
                <Text fontSize="lg" fontWeight="600">Edit Strategy: {selectedStrategy?.name}</Text>
              </HStack>
              {settings.activeStrategy === selectedStrategy?.name && (
                <Badge colorScheme="green" fontSize="sm" px={3} py={1} borderRadius="full">
                  Active Strategy
                </Badge>
              )}
            </Flex>
          </ModalHeader>
          <ModalCloseButton size="lg" />
          
          <ModalBody py={8} px={6}>
            <VStack spacing={8} align="stretch">
              {/* Description Section */}
              <Box 
                bg={paramBg} 
                p={4} 
                borderRadius="lg" 
                borderWidth="1px" 
                borderColor={borderColor}
              >
                <HStack spacing={2} mb={2}>
                  <Icon as={FiInfo} color="blue.500" />
                  <Text fontWeight="600">Strategy Description</Text>
                </HStack>
                <Text fontSize="sm" color={secondaryTextColor}>
                  {selectedStrategy?.description}
                </Text>
              </Box>

              {/* Parameters Grid */}
              <SimpleGrid 
                columns={{ base: 1, md: 2, lg: 3, xl: 4 }} 
                spacing={6}
                px={2}
              >
                {selectedStrategy && Object.entries(selectedStrategy.parameters).map(([paramName, param]) => (
                  <Box
                    key={paramName}
                    p={4}
                    bg={paramBg}
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor={borderColor}
                    transition="all 0.2s"
                    position="relative"
                    role="group"
                    _hover={{
                      transform: 'translateY(-2px)',
                      boxShadow: 'lg',
                      borderColor: 'blue.400',
                      bg: useColorModeValue('white', 'gray.750'),
                    }}
                  >
                    <FormControl size="md">
                      <FormLabel mb={2}>
                        <HStack spacing={2} wrap="nowrap">
                          <Icon 
                            as={getParamIcon(paramName)} 
                            boxSize="16px" 
                            color="blue.400"
                            _groupHover={{ color: 'blue.500' }}
                          />
                          <Text 
                            fontSize="sm" 
                            fontWeight="600" 
                            noOfLines={1}
                            _groupHover={{ color: 'blue.500' }}
                          >
                            {paramName}
                          </Text>
                        </HStack>
                      </FormLabel>
                      
                      <NumberInput
                        value={editedParams[paramName]}
                        onChange={(_, value) => handleParamChange(paramName, value)}
                        min={param.min}
                        max={param.max}
                        step={0.001}
                        precision={4}
                        bg={inputBg}
                        size="sm"
                      >
                        <NumberInputField 
                          fontSize="sm"
                          borderRadius="md"
                          _hover={{ borderColor: 'blue.400' }}
                          _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)' }}
                        />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>

                      <HStack mt={2} justify="space-between" align="center">
                        <Tag 
                          size="sm" 
                          bg={tagBg} 
                          color={useColorModeValue('blue.600', 'blue.200')}
                          borderRadius="full" 
                          px={2}
                          fontSize="xs"
                        >
                          Range: {param.min} - {param.max}
                        </Tag>
                        <Tooltip 
                          label={param.description}
                          placement="top"
                          hasArrow
                          bg={useColorModeValue('gray.800', 'gray.700')}
                          color="white"
                          px={3}
                          py={2}
                          borderRadius="md"
                          openDelay={200}
                        >
                          <Icon 
                            as={FiInfo} 
                            color="blue.400" 
                            _groupHover={{ color: 'blue.500' }}
                            cursor="help"
                          />
                        </Tooltip>
                      </HStack>

                      <Text 
                        fontSize="xs" 
                        color={secondaryTextColor} 
                        mt={2} 
                        noOfLines={2}
                        opacity={0}
                        transition="all 0.2s"
                        _groupHover={{ opacity: 1 }}
                      >
                        {param.description}
                      </Text>
                    </FormControl>
                  </Box>
                ))}
              </SimpleGrid>
            </VStack>
          </ModalBody>

          <ModalFooter 
            borderTopWidth="1px" 
            borderColor={borderColor}
            bg={headerBg}
            borderBottomRadius="2xl"
            py={4}
            px={6}
          >
            <Button
              variant="ghost"
              mr={4}
              onClick={handleModalClose}
              isDisabled={isSaving}
              size="md"
              px={6}
            >
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSaveParams}
              isLoading={isSaving}
              leftIcon={<Icon as={FiSave} />}
              size="md"
              px={8}
              _hover={{
                transform: 'translateY(-1px)',
                boxShadow: 'md',
              }}
            >
              Save Parameters
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Strategies; 
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

const Strategies: React.FC = () => {
  const { strategies, settings, refreshStrategies } = useApp();
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
      navigate('/strategies', { replace: true });
    }
  };

  // Force close the modal regardless of state
  const forceCloseModal = () => {
    setIsSaving(false);
    onClose();
    navigate('/strategies', { replace: true });
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
      
      // Make the actual API call to update strategy parameters
      const response = await fetch('http://localhost:5002/api/strategies/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        // Refresh strategies to get updated data
        if (refreshStrategies) {
          await refreshStrategies();
        }
        
        toast({
          title: "Parameters saved",
          description: `Strategy ${selectedStrategy.name} parameters have been updated.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        
        // Force close the modal
        forceCloseModal();
        
        // Return early to avoid the finally block
        return;
      } else {
        throw new Error(data.message || 'Failed to update strategy parameters');
      }
    } catch (error) {
      console.error("Error saving parameters:", error);
      
      // If the API call fails, try the fallback
      handleSaveParamsFallback();
    } finally {
      // Only set isSaving to false if we reach this point
      // (we won't reach here if the success case returned early)
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
    <Box p={4}>
      <Box mb={6} pb={4} borderBottomWidth="1px" borderColor={borderColor}>
        <Breadcrumb separator={<Icon as={FiChevronRight} color="gray.500" />} fontSize="sm" color={secondaryTextColor} mb={4}>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink href="/strategies">Strategies</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        
        <Heading size="lg" color={textColor}>Available Strategies</Heading>
        <Text color={secondaryTextColor} mt={2}>
          Configure and manage your trading strategies. Click on a strategy to edit its parameters.
        </Text>
      </Box>
      
      {strategies.length === 0 ? (
        <Text>No strategies found.</Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
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
        size="xl"
        isCentered
        closeOnOverlayClick={!isSaving}
        closeOnEsc={!isSaving}
      >
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(5px)" />
        <ModalContent bg={modalBg} borderRadius="xl" shadow="xl">
          <ModalHeader borderBottomWidth="1px" borderColor={borderColor} py={4}>
            <Flex align="center">
              <Icon as={FiEdit} mr={2} color="blue.400" />
              <Text>Edit Strategy: {selectedStrategy?.name}</Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton mt={2} isDisabled={isSaving} />
          <ModalBody p={6}>
            {selectedStrategy && (
              <VStack spacing={6} align="stretch">
                <Box>
                  <Text fontSize="md" fontWeight="medium" mb={1}>Description</Text>
                  <Text color={secondaryTextColor}>{selectedStrategy.description}</Text>
                </Box>
                
                <Divider />
                
                <Box>
                  <Flex align="center" mb={4}>
                    <Icon as={FiSliders} color="blue.400" mr={2} />
                    <Heading size="sm">Strategy Parameters</Heading>
                  </Flex>
                  
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    {Object.entries(selectedStrategy.parameters).map(([key, param]: [string, StrategyParameter]) => {
                      const paramIcon = getParamIcon(key);
                      return (
                        <Card key={key} variant="outline" borderColor={borderColor} shadow="sm">
                          <CardHeader bg={headerBg} py={3} px={4} borderBottomWidth="1px" borderColor={borderColor}>
                            <Flex justify="space-between" align="center">
                              <HStack>
                                <Icon as={paramIcon} color="blue.400" />
                                <Text fontWeight="medium" fontSize="sm">{key}</Text>
                              </HStack>
                              <Tag size="sm" bg={tagBg} color="blue.500" borderRadius="full" px={2}>
                                {param.range.min} - {param.range.max}
                              </Tag>
                            </Flex>
                          </CardHeader>
                          <CardBody p={4}>
                            <FormControl>
                              <InputGroup size="md">
                                <InputLeftElement pointerEvents="none">
                                  <Icon as={paramIcon} color="gray.400" />
                                </InputLeftElement>
                                <NumberInput
                                  value={editedParams[key] || param.default}
                                  onChange={(valueString, value) => {
                                    // Allow any value to be entered without validation
                                    handleParamChange(key, value);
                                  }}
                                  // Remove min/max constraints
                                  step={param.range.step || (param.type === 'int' ? 1 : 0.001)}
                                  precision={param.type === 'int' ? 0 : 3}
                                  size="md"
                                  width="100%"
                                  isDisabled={isSaving}
                                  keepWithinRange={false}
                                  clampValueOnBlur={false}
                                >
                                  <NumberInputField 
                                    pl="2.5rem" 
                                    bg={inputBg} 
                                    borderColor={borderColor}
                                    _hover={{ borderColor: "blue.300" }}
                                    _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #4299E1" }}
                                  />
                                  <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                  </NumberInputStepper>
                                </NumberInput>
                              </InputGroup>
                              <Text fontSize="xs" mt={2} color={secondaryTextColor}>
                                {param.description}
                              </Text>
                            </FormControl>
                          </CardBody>
                        </Card>
                      );
                    })}
                  </SimpleGrid>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor={borderColor} py={4}>
            <Button 
              variant="outline" 
              mr={3} 
              onClick={handleModalClose}
              isDisabled={isSaving}
            >
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              leftIcon={isSaving ? <Spinner size="sm" /> : <Icon as={FiSave} />}
              onClick={() => {
                handleSaveParams();
                // Force close after a short delay if still open
                setTimeout(() => {
                  forceCloseModal();
                }, 500);
              }}
              px={6}
              shadow="md"
              _hover={{ transform: 'translateY(-1px)', shadow: 'lg' }}
              isLoading={isSaving}
              loadingText="Saving..."
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
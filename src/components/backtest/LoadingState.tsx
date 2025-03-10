import React from 'react';
import { Box, Text, Spinner, Icon, useColorModeValue } from '@chakra-ui/react';
import { FiBarChart2 } from 'react-icons/fi';

interface LoadingStateProps {
  isLoading: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ isLoading }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');

  if (isLoading) {
    return (
      <Box 
        textAlign="center" 
        py={10} 
        bg={bgColor} 
        borderRadius="lg" 
        boxShadow="md" 
        borderWidth="1px" 
        borderColor={borderColor}
        p={8}
      >
        <Spinner size="xl" color="blue.500" thickness="3px" speed="0.8s" />
        <Text mt={4} fontSize="lg" fontWeight="medium" color={textColor}>
          Running backtest...
        </Text>
      </Box>
    );
  }

  return (
    <Box
      bg={bgColor}
      p={10}
      borderRadius="lg"
      boxShadow="md"
      borderWidth="1px"
      borderColor={borderColor}
      textAlign="center"
    >
      <Icon as={FiBarChart2} boxSize={12} color="blue.400" mb={4} />
      <Text color={textColor} fontSize="lg">
        Run a backtest to see results
      </Text>
    </Box>
  );
};

export default LoadingState; 
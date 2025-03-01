import React from 'react';
import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Heading,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { useApp } from '../context/AppContext';

const Dashboard: React.FC = () => {
  const { settings, strategies } = useApp();
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const activeStrategy = strategies.find(
    (s) => s.name === settings.activeStrategy
  );

  return (
    <Box p={4}>
      <Heading mb={6}>Dashboard</Heading>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        <Box
          p={5}
          shadow="md"
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="lg"
          bg={cardBg}
        >
          <Stat>
            <StatLabel>Active Strategy</StatLabel>
            <StatNumber>
              {settings.activeStrategy || 'No strategy selected'}
            </StatNumber>
            {activeStrategy && (
              <StatHelpText>{activeStrategy.description}</StatHelpText>
            )}
          </Stat>
        </Box>

        <Box
          p={5}
          shadow="md"
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="lg"
          bg={cardBg}
        >
          <Stat>
            <StatLabel>Trading Amount</StatLabel>
            <StatNumber>${settings.defaultTradingAmount}</StatNumber>
            <StatHelpText>Default trading amount</StatHelpText>
          </Stat>
        </Box>

        <Box
          p={5}
          shadow="md"
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="lg"
          bg={cardBg}
        >
          <Stat>
            <StatLabel>API Connection</StatLabel>
            <StatNumber>
              {settings.apiKey ? 'Connected' : 'Not Connected'}
            </StatNumber>
            <StatHelpText>
              {settings.apiKey
                ? 'API key is configured'
                : 'Configure API key in settings'}
            </StatHelpText>
          </Stat>
        </Box>
      </SimpleGrid>

      {activeStrategy && (
        <Box
          mt={6}
          p={5}
          shadow="md"
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="lg"
          bg={cardBg}
        >
          <Heading size="md" mb={4}>
            Strategy Parameters
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            {Object.entries(activeStrategy.parameters).map(([key, value]) => (
              <Box key={key}>
                <Text fontWeight="bold">{key}</Text>
                <Text>{JSON.stringify(value)}</Text>
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      )}
    </Box>
  );
};

export default Dashboard; 
import React from 'react';
import {
  Box,
  List,
  ListItem,
  Heading,
  Icon,
  Flex,
  Text,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useColorModeValue
} from '@chakra-ui/react';
import { FiCode } from 'react-icons/fi';
import { Strategy } from '@/types/backtest';

interface StrategiesTableProps {
  strategies: Strategy[];
}

export const StrategiesTable: React.FC<StrategiesTableProps> = ({ strategies }) => {
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const strategyItemBg = useColorModeValue('gray.50', 'gray.700');

  if (!strategies || strategies.length === 0) {
    return (
      <Box p={6} textAlign="center">
        <Text color={secondaryTextColor}>No strategies available</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Heading size="md" mb={4} color={textColor}>Available Strategies</Heading>
      <List spacing={4}>
        {strategies.map((strategy) => (
          <ListItem 
            key={strategy.name} 
            p={5} 
            bg={strategyItemBg} 
            borderRadius="lg"
            borderWidth="1px"
            borderColor={borderColor}
            boxShadow="sm"
          >
            <Flex align="center" mb={2}>
              <Icon as={FiCode} mr={2} color="blue.500" />
              <Text fontWeight="bold" color={textColor}>{strategy.name}</Text>
            </Flex>
            <Text color={secondaryTextColor} fontSize="sm" mb={3}>{strategy.description}</Text>
            <Divider mb={3} />
            <Box>
              <Text fontSize="sm" fontWeight="medium" color={textColor} mb={2}>Parameters:</Text>
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Default</Th>
                    <Th>Range</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {Object.entries(strategy.parameters).map(([name, param]) => (
                    <Tr key={name}>
                      <Td fontWeight="medium">{name}</Td>
                      <Td>{param.default}</Td>
                      <Td>{param.min} - {param.max}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default StrategiesTable; 
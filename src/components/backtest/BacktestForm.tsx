import React, { ChangeEvent } from 'react';
import {
  Stack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  Heading,
  Box,
  Icon,
  useColorModeValue,
  Divider,
  Select,
  InputGroup,
  InputLeftElement,
  Flex,
  Link,
} from '@chakra-ui/react';
import { FiSettings, FiPlay, FiDownload, FiCalendar, FiDollarSign, FiSliders, FiEdit } from 'react-icons/fi';
import { Strategy, BacktestFormData } from '@/types/backtest';
import { tradingPairs } from '@/constants/trading';
import { Link as RouterLink } from 'react-router-dom';

interface BacktestFormProps {
  formData: BacktestFormData;
  strategies: Strategy[];
  selectedStrategy: Strategy | null;
  isRunning: boolean;
  onStrategyChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  onInputChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onExport: () => void;
  hasResults: boolean;
}

export const BacktestForm: React.FC<BacktestFormProps> = ({
  formData,
  strategies,
  selectedStrategy,
  isRunning,
  onStrategyChange,
  onInputChange,
  onSubmit,
  onExport,
  hasResults,
}) => {
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const bgColor = useColorModeValue('white', 'gray.800');
  const headerBgColor = useColorModeValue('gray.50', 'gray.900');
  const inputBgColor = useColorModeValue('gray.50', 'gray.700');
  const labelColor = useColorModeValue('gray.700', 'gray.300');
  const linkColor = useColorModeValue('blue.600', 'blue.300');

  return (
    <Box 
      borderRadius="lg" 
      bg={bgColor} 
      boxShadow="md" 
      borderWidth="1px" 
      borderColor={borderColor}
      overflow="hidden"
      width="100%"
    >
      <Box 
        display="flex" 
        alignItems="center" 
        p={4} 
        borderBottomWidth="1px" 
        borderColor={borderColor}
        bg={headerBgColor}
      >
        <Icon as={FiSettings} boxSize={5} mr={2} color="blue.400" />
        <Heading size="md">Backtest Settings</Heading>
      </Box>

      <Stack spacing={5} direction="column" p={5}>
        <FormControl>
          <FormLabel color={labelColor} fontWeight="medium">Strategy</FormLabel>
          <Flex>
            <Select
              value={formData.strategyName}
              onChange={onStrategyChange}
              bg={inputBgColor}
              borderColor={borderColor}
              _hover={{ borderColor: "blue.300" }}
              _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #4299E1" }}
              size="md"
              icon={<Icon as={FiSliders} color="gray.400" />}
              flex="1"
              mr={2}
            >
              {strategies.map(strategy => (
                <option key={strategy.name} value={strategy.name}>
                  {strategy.name}
                </option>
              ))}
            </Select>
            <Link 
              as={RouterLink} 
              to={`/strategies?edit=${selectedStrategy?.name}`}
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
              bg={inputBgColor}
              color={linkColor}
              px={3}
              borderRadius="md"
              borderWidth="1px"
              borderColor={borderColor}
              _hover={{ bg: 'blue.50', color: 'blue.600' }}
              height="40px"
            >
              <Icon as={FiEdit} mr={2} />
              Edit
            </Link>
          </Flex>
          {selectedStrategy && (
            <Text fontSize="sm" color="gray.500" mt={2}>
              {selectedStrategy.description}
            </Text>
          )}
        </FormControl>

        <FormControl>
          <FormLabel color={labelColor} fontWeight="medium">Trading Pair</FormLabel>
          <Select
            name="tradingPair"
            value={formData.tradingPair}
            onChange={onInputChange}
            bg={inputBgColor}
            borderColor={borderColor}
            _hover={{ borderColor: "blue.300" }}
            _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #4299E1" }}
            size="md"
            icon={<Icon as={FiDollarSign} color="gray.400" />}
          >
            {tradingPairs.map((pair) => (
              <option key={pair} value={pair}>{pair}</option>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel color={labelColor} fontWeight="medium">Start Date</FormLabel>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <Icon as={FiCalendar} color="gray.400" />
            </InputLeftElement>
            <Input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={onInputChange}
              bg={inputBgColor}
              borderColor={borderColor}
              _hover={{ borderColor: "blue.300" }}
              _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #4299E1" }}
              size="md"
              pl="2.5rem"
            />
          </InputGroup>
        </FormControl>

        <FormControl>
          <FormLabel color={labelColor} fontWeight="medium">End Date</FormLabel>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <Icon as={FiCalendar} color="gray.400" />
            </InputLeftElement>
            <Input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={onInputChange}
              bg={inputBgColor}
              borderColor={borderColor}
              _hover={{ borderColor: "blue.300" }}
              _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #4299E1" }}
              size="md"
              pl="2.5rem"
            />
          </InputGroup>
        </FormControl>

        {selectedStrategy && (
          <Box mt={2} p={4} bg={headerBgColor} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
            <Flex align="center" mb={2}>
              <Icon as={FiSliders} color="blue.400" mr={2} />
              <Heading size="sm" color={labelColor}>Strategy Configuration</Heading>
            </Flex>
            <Text fontSize="sm" color="gray.500">
              This strategy has {Object.keys(selectedStrategy.parameters).length} configurable parameters. 
              To modify these parameters, please visit the <Link as={RouterLink} to={`/strategies?edit=${selectedStrategy.name}`} color={linkColor}>Strategies</Link> section.
            </Text>
          </Box>
        )}

        <Divider my={2} />

        <Stack spacing={3}>
          <Button
            colorScheme="blue"
            onClick={onSubmit}
            isLoading={isRunning}
            leftIcon={<Icon as={FiPlay} />}
            width="100%"
            size="md"
            fontWeight="semibold"
            boxShadow="sm"
            _hover={{ transform: 'translateY(-1px)', boxShadow: 'md' }}
            _active={{ transform: 'translateY(0)', boxShadow: 'sm' }}
            transition="all 0.2s"
          >
            Run Backtest
          </Button>

          <Button
            variant="outline"
            isDisabled={!hasResults}
            leftIcon={<Icon as={FiDownload} />}
            onClick={onExport}
            width="100%"
            colorScheme="blue"
            size="md"
            fontWeight="semibold"
            _hover={{ bg: 'blue.50', transform: 'translateY(-1px)' }}
            _active={{ transform: 'translateY(0)' }}
            transition="all 0.2s"
          >
            Export Results
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default BacktestForm; 
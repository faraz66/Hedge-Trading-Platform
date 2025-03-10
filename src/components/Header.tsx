import { Box, Container, Heading, Flex, Button } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

export function Header() {
  return (
    <Box bg="blue.600" color="white" py={4}>
      <Container maxW="container.xl">
        <Flex justify="space-between" align="center">
          <Heading size="lg" as={RouterLink} to="/" _hover={{ textDecoration: 'none' }}>
            HedgeBot
          </Heading>
          <Flex gap={4}>
            <Button
              as={RouterLink}
              to="/strategies"
              variant="ghost"
              color="white"
              _hover={{ bg: 'blue.500' }}
            >
              Strategies
            </Button>
            <Button
              as={RouterLink}
              to="/backtest"
              variant="ghost"
              color="white"
              _hover={{ bg: 'blue.500' }}
            >
              Backtest
            </Button>
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
} 
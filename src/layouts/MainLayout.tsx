import { Box, Container, Flex, VStack } from '@chakra-ui/react';
import { ReactNode } from 'react';
import { Header } from '../components/Header';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <Flex direction="column" minH="100vh">
      <Header />
      <Box flex="1" bg="gray.50" py={8}>
        <Container maxW="container.xl">
          <VStack spacing={6} align="stretch">
            {children}
          </VStack>
        </Container>
      </Box>
    </Flex>
  );
} 
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Text, Alert, AlertIcon, AlertTitle, AlertDescription, Button } from '@chakra-ui/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // You can also log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box p={4} borderWidth="1px" borderRadius="md" bg="red.50">
          <Alert status="error" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" borderRadius="md">
            <AlertIcon boxSize="40px" mr={0} />
            <AlertTitle mt={4} mb={1} fontSize="lg">
              Component Error
            </AlertTitle>
            <AlertDescription maxWidth="sm">
              <Text>Something went wrong with this component.</Text>
              {this.state.error && (
                <Text fontSize="sm" mt={2} color="red.800">
                  {this.state.error.toString()}
                </Text>
              )}
              <Button 
                mt={4} 
                colorScheme="red" 
                size="sm"
                onClick={this.resetErrorBoundary}
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 
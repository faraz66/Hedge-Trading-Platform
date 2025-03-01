import React from 'react';
import { ChakraProvider, extendTheme, ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,
  fonts: {
    heading: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
  },
  colors: {
    gray: {
      50: '#F7FAFC',
      100: '#EDF2F7',
      200: '#E2E8F0',
      300: '#CBD5E0',
      400: '#A0AEC0',
      500: '#718096',
      600: '#4A5568',
      700: '#2D3748',
      800: '#1A202C',
      900: '#171923',
    },
    blue: {
      50: '#E6F6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A',
    },
  },
  styles: {
    global: (props: any) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.900' : 'white',
        color: props.colorMode === 'dark' ? 'white' : 'gray.800',
      },
      '*::placeholder': {
        color: props.colorMode === 'dark' ? 'gray.400' : 'gray.500',
      },
      '*, *::before, &::after': {
        borderColor: props.colorMode === 'dark' ? 'gray.700' : 'gray.200',
      },
    }),
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'blue',
      },
      baseStyle: {
        fontWeight: 'semibold',
        borderRadius: 'md',
      },
      variants: {
        solid: (props: any) => ({
          bg: props.colorMode === 'dark' ? 'blue.500' : 'blue.500',
          color: 'white',
          _hover: {
            bg: props.colorMode === 'dark' ? 'blue.400' : 'blue.600',
            transform: 'translateY(-1px)',
            boxShadow: 'md',
          },
          _active: {
            bg: props.colorMode === 'dark' ? 'blue.600' : 'blue.700',
            transform: 'translateY(0)',
            boxShadow: 'sm',
          },
          transition: 'all 0.2s',
        }),
        outline: (props: any) => ({
          borderColor: props.colorMode === 'dark' ? 'blue.500' : 'blue.500',
          color: props.colorMode === 'dark' ? 'blue.400' : 'blue.500',
          _hover: {
            bg: props.colorMode === 'dark' ? 'rgba(66, 153, 225, 0.12)' : 'blue.50',
            transform: 'translateY(-1px)',
          },
          _active: {
            bg: props.colorMode === 'dark' ? 'rgba(66, 153, 225, 0.24)' : 'blue.100',
            transform: 'translateY(0)',
          },
          transition: 'all 0.2s',
        }),
      },
    },
    FormLabel: {
      baseStyle: (props: any) => ({
        color: props.colorMode === 'dark' ? 'gray.300' : 'gray.700',
        fontWeight: 'medium',
        fontSize: 'sm',
      }),
    },
    Input: {
      defaultProps: {
        focusBorderColor: 'blue.400',
      },
      variants: {
        outline: (props: any) => ({
          field: {
            bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
            borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.300',
            _hover: {
              borderColor: props.colorMode === 'dark' ? 'gray.500' : 'gray.400',
            },
            _focus: {
              borderColor: 'blue.400',
              boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)',
            },
          },
        }),
        filled: (props: any) => ({
          field: {
            bg: props.colorMode === 'dark' ? 'gray.700' : 'gray.100',
            _hover: {
              bg: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
            },
            _focus: {
              bg: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
              borderColor: 'blue.400',
            },
          },
        }),
      },
    },
    Select: {
      defaultProps: {
        focusBorderColor: 'blue.400',
      },
      variants: {
        outline: (props: any) => ({
          field: {
            bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
            borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.300',
            _hover: {
              borderColor: props.colorMode === 'dark' ? 'gray.500' : 'gray.400',
            },
            _focus: {
              borderColor: 'blue.400',
              boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)',
            },
          },
        }),
        filled: (props: any) => ({
          field: {
            bg: props.colorMode === 'dark' ? 'gray.700' : 'gray.100',
            _hover: {
              bg: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
            },
            _focus: {
              bg: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
              borderColor: 'blue.400',
            },
          },
        }),
      },
    },
    Tabs: {
      variants: {
        enclosed: (props: any) => ({
          tab: {
            _selected: {
              color: props.colorMode === 'dark' ? 'blue.400' : 'blue.600',
              borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
              borderBottomColor: props.colorMode === 'dark' ? 'gray.800' : 'white',
            },
          },
          tablist: {
            borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
          },
        }),
      },
    },
    Table: {
      variants: {
        simple: (props: any) => ({
          th: {
            borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
            color: props.colorMode === 'dark' ? 'gray.300' : 'gray.600',
            fontWeight: 'semibold',
          },
          td: {
            borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
          },
        }),
      },
    },
    Badge: {
      baseStyle: {
        borderRadius: 'md',
        textTransform: 'normal',
        fontWeight: 'medium',
      },
    },
  },
});

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return (
    <ChakraProvider theme={theme}>
      {children}
    </ChakraProvider>
  );
};

export default ThemeProvider; 
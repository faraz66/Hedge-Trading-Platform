import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  Switch,
  Text,
  useColorMode,
  Heading,
  Select,
} from '@chakra-ui/react';
import { useApp } from '../context/AppContext';

interface SettingsFormData {
  apiKey: string;
  apiSecret: string;
  defaultTradingAmount: number;
  paperTrading: boolean;
  theme: string;
}

const Settings: React.FC = () => {
  const { settings, updateSettings, isLoading } = useApp();
  const { colorMode, toggleColorMode } = useColorMode();
  const toast = useToast();
  const [formData, setFormData] = useState<SettingsFormData>({
    apiKey: '',
    apiSecret: '',
    defaultTradingAmount: 100,
    paperTrading: true,
    theme: 'light',
  });

  useEffect(() => {
    // Load settings from different categories
    const loadSettings = async () => {
      try {
        const [exchangeResponse, tradingResponse] = await Promise.all([
          fetch('http://localhost:5002/api/settings/exchange'),
          fetch('http://localhost:5002/api/settings/trading')
        ]);

        const exchangeData = await exchangeResponse.json();
        const tradingData = await tradingResponse.json();

        if (exchangeData.status === 'success' && tradingData.status === 'success') {
          setFormData({
            apiKey: exchangeData.settings.api_key || '',
            apiSecret: exchangeData.settings.api_secret || '',
            defaultTradingAmount: tradingData.settings.default_amount || 100,
            paperTrading: exchangeData.settings.paper_trading || true,
            theme: exchangeData.settings.theme || 'light',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load settings',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };

    loadSettings();
  }, [toast]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Save settings to different categories
      const exchangeSettings = {
        api_key: formData.apiKey,
        api_secret: formData.apiSecret,
        paper_trading: formData.paperTrading,
        theme: formData.theme,
      };

      const tradingSettings = {
        default_amount: formData.defaultTradingAmount,
      };

      await Promise.all([
        fetch('http://localhost:5002/api/settings/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(exchangeSettings),
        }),
        fetch('http://localhost:5002/api/settings/trading', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tradingSettings),
        }),
      ]);

      toast({
        title: 'Success',
        description: 'Settings saved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save settings',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={4}>
      <Heading mb={6}>Settings</Heading>
      <VStack spacing={6} align="stretch">
        <Box>
          <Text fontSize="xl" fontWeight="bold" mb={4}>
            API Configuration
          </Text>
          <FormControl mb={4}>
            <FormLabel>API Key</FormLabel>
            <Input
              name="apiKey"
              type="password"
              value={formData.apiKey}
              onChange={handleInputChange}
              placeholder="Enter your API key"
            />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel>API Secret</FormLabel>
            <Input
              name="apiSecret"
              type="password"
              value={formData.apiSecret}
              onChange={handleInputChange}
              placeholder="Enter your API secret"
            />
          </FormControl>
        </Box>

        <Box>
          <Text fontSize="xl" fontWeight="bold" mb={4}>
            Trading Settings
          </Text>
          <FormControl display="flex" alignItems="center" mb={4}>
            <FormLabel mb="0">Paper Trading</FormLabel>
            <Switch
              name="paperTrading"
              isChecked={formData.paperTrading}
              onChange={handleInputChange}
            />
          </FormControl>
        </Box>

        <Box>
          <Text fontSize="xl" fontWeight="bold" mb={4}>
            Interface Settings
          </Text>
          <FormControl mb={4}>
            <FormLabel>Theme</FormLabel>
            <Select
              name="theme"
              value={formData.theme}
              onChange={handleInputChange}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </Select>
          </FormControl>
        </Box>

        <Button colorScheme="blue" onClick={handleSubmit}>
          Save Settings
        </Button>
      </VStack>
    </Box>
  );
};

export default Settings; 
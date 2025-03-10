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
  InputGroup,
  InputRightElement,
  Icon,
} from '@chakra-ui/react';
import { useApp } from '../context/AppContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

interface SettingsFormData {
  apiKey: string;
  apiSecret: string;
  exnessUsername: string;
  exnessPassword: string;
  defaultTradingAmount: number;
  paperTrading: boolean;
  theme: string;
}

const Settings: React.FC = () => {
  const { colorMode } = useColorMode();
  const toast = useToast();
  const [formData, setFormData] = useState<SettingsFormData>({
    apiKey: '',
    apiSecret: '',
    exnessUsername: '',
    exnessPassword: '',
    defaultTradingAmount: 100,
    paperTrading: false,
    theme: 'light',
  });
  
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [showExnessPassword, setShowExnessPassword] = useState(false);

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
            exnessUsername: exchangeData.settings.exness_username || '',
            exnessPassword: exchangeData.settings.exness_password || '',
            defaultTradingAmount: tradingData.settings.default_amount || 100,
            paperTrading: exchangeData.settings.paper_trading || false,
            theme: exchangeData.settings.theme || colorMode,
          });
        }
      } catch (error) {
        toast({
          title: 'Error loading settings',
          description: 'Failed to load settings. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    loadSettings();
  }, [toast, colorMode]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
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
        exness_username: formData.exnessUsername,
        exness_password: formData.exnessPassword,
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
          <Text fontSize="xl" fontWeight="bold" mb={4} display="flex" alignItems="center">
            <span style={{ marginRight: '8px' }}>⚙️</span> Binance Configuration
          </Text>
          <FormControl mb={4}>
            <FormLabel>API Key</FormLabel>
            <InputGroup>
              <Input
                name="apiKey"
                type={showApiKey ? "text" : "password"}
                value={formData.apiKey}
                onChange={handleInputChange}
                placeholder="Enter your Binance API key"
              />
              <InputRightElement>
                <Icon
                  as={showApiKey ? FaEyeSlash : FaEye}
                  cursor="pointer"
                  onClick={() => setShowApiKey(!showApiKey)}
                />
              </InputRightElement>
            </InputGroup>
          </FormControl>
          <FormControl mb={4}>
            <FormLabel>API Secret</FormLabel>
            <InputGroup>
              <Input
                name="apiSecret"
                type={showApiSecret ? "text" : "password"}
                value={formData.apiSecret}
                onChange={handleInputChange}
                placeholder="Enter your Binance API secret"
              />
              <InputRightElement>
                <Icon
                  as={showApiSecret ? FaEyeSlash : FaEye}
                  cursor="pointer"
                  onClick={() => setShowApiSecret(!showApiSecret)}
                />
              </InputRightElement>
            </InputGroup>
          </FormControl>
        </Box>

        <Box>
          <Text fontSize="xl" fontWeight="bold" mb={4} display="flex" alignItems="center">
            <span style={{ marginRight: '8px' }}>👤</span> Exness Configuration
          </Text>
          <FormControl mb={4}>
            <FormLabel>Username</FormLabel>
            <Input
              name="exnessUsername"
              value={formData.exnessUsername}
              onChange={handleInputChange}
              placeholder="Enter your Exness username"
            />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel>Password</FormLabel>
            <InputGroup>
              <Input
                name="exnessPassword"
                type={showExnessPassword ? "text" : "password"}
                value={formData.exnessPassword}
                onChange={handleInputChange}
                placeholder="Enter your Exness password"
              />
              <InputRightElement>
                <Icon
                  as={showExnessPassword ? FaEyeSlash : FaEye}
                  cursor="pointer"
                  onClick={() => setShowExnessPassword(!showExnessPassword)}
                />
              </InputRightElement>
            </InputGroup>
          </FormControl>
        </Box>

        <Box>
          <Text fontSize="xl" fontWeight="bold" mb={4} display="flex" alignItems="center">
            <span style={{ marginRight: '8px' }}>⚡</span> Trading Settings
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

        <Button colorScheme="blue" onClick={handleSubmit} width="100%">
          Save Settings
        </Button>
      </VStack>
    </Box>
  );
};

export default Settings; 
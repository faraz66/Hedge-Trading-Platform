import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface Strategy {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

interface Settings {
  activeStrategy: string | null;
  apiKey: string;
  apiSecret: string;
  defaultTradingAmount: number;
}

interface AppContextType {
  strategies: Strategy[];
  settings: Settings;
  isLoading: boolean;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  fetchStrategies: () => Promise<void>;
  refreshStrategies: () => Promise<void>;
}

const defaultSettings: Settings = {
  activeStrategy: null,
  apiKey: '',
  apiSecret: '',
  defaultTradingAmount: 100,
};

export const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);

  const api = axios.create({
    baseURL: 'http://localhost:5002/api',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const fetchStrategies = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/strategies');
      if (response.data.status === 'success') {
        setStrategies(response.data.strategies);
      }
    } catch (error) {
      console.error('Failed to fetch strategies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<Settings>) => {
    try {
      setIsLoading(true);
      const updatedSettings = { ...settings, ...newSettings };
      await api.post('/settings', updatedSettings);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategies();
  }, []);

  return (
    <AppContext.Provider
      value={{
        strategies,
        settings,
        isLoading,
        updateSettings,
        fetchStrategies,
        refreshStrategies: fetchStrategies,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}; 
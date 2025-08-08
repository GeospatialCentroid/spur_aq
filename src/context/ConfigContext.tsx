// src/context/ConfigContext.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import axios from 'axios';
import { Config } from '../Types/config';

interface TimeSeriesEntry {
  timestamp: string;
  value: number;
}

interface ConfigContextType {
  config: Config | null;
  timeSeriesData: Record<string, TimeSeriesEntry[]>;
}

export const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

interface ConfigProviderProps {
  config: Config | null;
  timeSeriesData: Record<string, TimeSeriesEntry[]>;
  children: ReactNode;
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ config, timeSeriesData, children }) => {
  return (
    <ConfigContext.Provider value={{ config, timeSeriesData }}>
      {children}
    </ConfigContext.Provider>
  );
};
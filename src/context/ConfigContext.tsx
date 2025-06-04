// src/context/ConfigContext.tsx

import React, { createContext, useContext } from 'react';
import { Config } from '../Types/config';

interface ConfigContextType {
  config: Config | null;
}

export const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) throw new Error('useConfig must be used within a ConfigProvider');
  return context;
};

interface ConfigProviderProps {
  config: Config | null;
  children: React.ReactNode;
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ config, children }) => (
  <ConfigContext.Provider value={{ config }}>
    {children}
  </ConfigContext.Provider>
);

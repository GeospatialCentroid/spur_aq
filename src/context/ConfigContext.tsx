// src/context/ConfigContext.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { Config } from '../Types/config';
import i18n from '../i18n/i18n-setup';
import { localizeWithI18n } from '../i18n/langSpans';

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

export const ConfigProvider: React.FC<ConfigProviderProps> = ({
  config: rawConfig,
  timeSeriesData,
  children,
}) => {
  // bump when language changes to recompute the localized view
  const [langTick, setLangTick] = useState(0);

  useEffect(() => {
    const onLang = () => setLangTick((t) => t + 1);
    i18n.on('languageChanged', onLang);
    return () => i18n.off('languageChanged', onLang);
  }, []);

  // keep HTML only for 'description'; all other <span lang> fields -> plain text
  const localizedConfig = useMemo(() => {
    if (!rawConfig) return null;
    return localizeWithI18n(rawConfig, i18n, ['description']);
  }, [rawConfig, langTick]);

  return (
    <ConfigContext.Provider value={{ config: localizedConfig, timeSeriesData }}>
      {children}
    </ConfigContext.Provider>
  );
};

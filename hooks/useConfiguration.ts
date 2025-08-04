/**
 * useConfiguration Hook
 *
 * React hook for accessing and managing application configuration
 */

import { useState, useEffect, useCallback } from 'react';
import { configManager, type AppConfiguration, type FeatureFlags, type Environment, type ValidationResult } from '../services/configurationManager';

export interface UseConfigurationReturn {
  config: AppConfiguration;
  environment: Environment;
  isFeatureEnabled: (feature: keyof FeatureFlags) => boolean;
  toggleFeature: (feature: keyof FeatureFlags) => void;
  get: <T>(keyPath: string, defaultValue?: T) => T;
  set: (keyPath: string, value: any) => void;
  validateConfig: () => ValidationResult;
  subscribe: (keyPath: string, callback: (value: any) => void) => () => void;
  hotReload: () => void;
  exportConfig: () => string;
  importConfig: (configJson: string) => ValidationResult;
}

/**
 * Hook for accessing application configuration
 */
export const useConfiguration = (): UseConfigurationReturn => {
  const [config, setConfig] = useState<AppConfiguration>(configManager.getConfig());
  const [environment] = useState<Environment>(configManager.getEnvironment());

  // Update local state when configuration changes
  useEffect(() => {
    const unsubscribe = configManager.subscribe('*', () => {
      setConfig(configManager.getConfig());
    });

    return unsubscribe;
  }, []);

  const isFeatureEnabled = useCallback((feature: keyof FeatureFlags): boolean => {
    return configManager.isFeatureEnabled(feature);
  }, []);

  const toggleFeature = useCallback((feature: keyof FeatureFlags): void => {
    configManager.toggleFeature(feature);
  }, []);

  const get = useCallback(<T>(keyPath: string, defaultValue?: T): T => {
    return configManager.get(keyPath, defaultValue);
  }, []);

  const set = useCallback((keyPath: string, value: any): void => {
    configManager.set(keyPath, value);
  }, []);

  const validateConfig = useCallback((): ValidationResult => {
    return configManager.validateConfig();
  }, []);

  const subscribe = useCallback((keyPath: string, callback: (value: any) => void): (() => void) => {
    return configManager.subscribe(keyPath, callback);
  }, []);

  const hotReload = useCallback((): void => {
    configManager.hotReload();
  }, []);

  const exportConfig = useCallback((): string => {
    return configManager.exportConfig();
  }, []);

  const importConfig = useCallback((configJson: string): ValidationResult => {
    return configManager.importConfig(configJson);
  }, []);

  return {
    config,
    environment,
    isFeatureEnabled,
    toggleFeature,
    get,
    set,
    validateConfig,
    subscribe,
    hotReload,
    exportConfig,
    importConfig,
  };
};

/**
 * Hook for accessing specific configuration section
 */
export const useConfigSection = <T>(sectionPath: string): T => {
  const { get } = useConfiguration();
  const [sectionConfig, setSectionConfig] = useState<T>(get(sectionPath));

  useEffect(() => {
    const unsubscribe = configManager.subscribe(sectionPath, (value: T) => {
      setSectionConfig(value);
    });

    return unsubscribe;
  }, [sectionPath]);

  return sectionConfig;
};

/**
 * Hook for accessing feature flags
 */
export const useFeatureFlags = () => {
  const { config, isFeatureEnabled, toggleFeature } = useConfiguration();

  return {
    features: config.features,
    isFeatureEnabled,
    toggleFeature,
  };
};

/**
 * Hook for environment-specific behavior
 */
export const useEnvironment = () => {
  const { environment, config } = useConfiguration();

  const isDevelopment = environment === 'development';
  const isStaging = environment === 'staging';
  const isProduction = environment === 'production';

  return {
    environment,
    isDevelopment,
    isStaging,
    isProduction,
    config,
  };
};

/**
 * Comprehensive Configuration System Test
 *
 * This test verifies that all requirements for Task 1 are met:
 * - Create centralized configuration system with environment support
 * - Implement feature flags and environment-specific settings
 * - Set up configuration validation and type safety
 * - Create configuration loading and management utilities
 * - Test configuration system with different environments
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigurationManager } from '../services/configurationManager';
import { ConfigurationLoader, ConfigurationValidator, EnvironmentDetector } from '../services/configurationUtils';
import { useConfiguration } from '../hooks/useConfiguration';
import { renderHook } from '@testing-library/react';

describe('Configuration System - Comprehensive Requirements Test', () => {
  let configManager: ConfigurationManager;

  beforeEach(() => {
    configManager = new ConfigurationManager();
  });

  describe('Requirement 8.1: Centralized Configuration System', () => {
    it('should provide a centralized configuration manager', () => {
      expect(configManager).toBeDefined();
      expect(typeof configManager.getConfig).toBe('function');
      expect(typeof configManager.get).toBe('function');
      expect(typeof configManager.set).toBe('function');
    });

    it('should manage all configuration aspects in one place', () => {
      const config = configManager.getConfig();

      // Verify all major configuration sections exist
      expect(config.api).toBeDefined();
      expect(config.cache).toBeDefined();
      expect(config.performance).toBeDefined();
      expect(config.security).toBeDefined();
      expect(config.logging).toBeDefined();
      expect(config.features).toBeDefined();
    });

    it('should provide unified access to configuration values', () => {
      // Test nested property access
      expect(configManager.get('api.timeout')).toBeDefined();
      expect(configManager.get('cache.duration')).toBeDefined();
      expect(configManager.get('features.debugMode')).toBeDefined();
      expect(configManager.get('performance.monitoring')).toBeDefined();
    });
  });

  describe('Requirement 8.2: Environment Support', () => {
    it('should detect and support different environments', () => {
      const environment = configManager.getEnvironment();
      expect(['development', 'staging', 'production']).toContain(environment);
    });

    it('should provide environment detection utilities', () => {
      expect(typeof EnvironmentDetector.detect).toBe('function');
      expect(typeof EnvironmentDetector.isDevelopment).toBe('function');
      expect(typeof EnvironmentDetector.isStaging).toBe('function');
      expect(typeof EnvironmentDetector.isProduction).toBe('function');
    });

    it('should load environment-specific configurations', () => {
      const config = configManager.getConfig();

      // Environment should be set
      expect(config.environment).toBeDefined();

      // Configuration should vary by environment
      expect(config.logging.level).toBeDefined();
      expect(['DEBUG', 'INFO', 'WARN', 'ERROR']).toContain(config.logging.level);
    });

    it('should support environment variable loading', () => {
      const envConfig = ConfigurationLoader.loadFromEnvironment();
      expect(typeof envConfig).toBe('object');
    });
  });

  describe('Requirement 8.3: Feature Flags and Environment-Specific Settings', () => {
    it('should implement comprehensive feature flag system', () => {
      const features = configManager.get('features');

      // Verify all required feature flags exist
      expect(typeof features.enhancedErrorHandling).toBe('boolean');
      expect(typeof features.advancedPerformanceMonitoring).toBe('boolean');
      expect(typeof features.offlineSupport).toBe('boolean');
      expect(typeof features.pushNotifications).toBe('boolean');
      expect(typeof features.analytics).toBe('boolean');
      expect(typeof features.experimentalFeatures).toBe('boolean');
      expect(typeof features.debugMode).toBe('boolean');
      expect(typeof features.betaFeatures).toBe('boolean');
    });

    it('should provide feature flag management methods', () => {
      expect(typeof configManager.isFeatureEnabled).toBe('function');
      expect(typeof configManager.toggleFeature).toBe('function');

      // Test feature flag operations
      const initialValue = configManager.isFeatureEnabled('analytics');
      configManager.toggleFeature('analytics');
      const toggledValue = configManager.isFeatureEnabled('analytics');

      expect(toggledValue).toBe(!initialValue);
    });

    it('should support environment-specific feature flag defaults', () => {
      const config = configManager.getConfig();
      const environment = config.environment;

      // Different environments should have different defaults
      if (environment === 'development') {
        expect(config.features.debugMode).toBe(true);
        expect(config.features.experimentalFeatures).toBe(true);
      } else if (environment === 'production') {
        expect(config.features.debugMode).toBe(false);
        expect(config.features.experimentalFeatures).toBe(false);
      }
    });
  });

  describe('Requirement 8.4: Configuration Validation and Type Safety', () => {
    it('should provide configuration validation', () => {
      expect(typeof configManager.validateConfig).toBe('function');

      const validation = configManager.validateConfig();
      expect(validation).toBeDefined();
      expect(typeof validation.isValid).toBe('boolean');
      expect(Array.isArray(validation.errors)).toBe(true);
      expect(Array.isArray(validation.warnings)).toBe(true);
    });

    it('should validate different configuration sections', () => {
      const apiConfig = configManager.get('api');
      const apiValidation = ConfigurationValidator.validateApiConfig(apiConfig);
      expect(apiValidation.isValid).toBe(true);

      const cacheConfig = configManager.get('cache');
      const cacheValidation = ConfigurationValidator.validateCacheConfig(cacheConfig);
      expect(cacheValidation.isValid).toBe(true);

      const performanceConfig = configManager.get('performance');
      const performanceValidation = ConfigurationValidator.validatePerformanceConfig(performanceConfig);
      expect(performanceValidation.isValid).toBe(true);

      const securityConfig = configManager.get('security');
      const securityValidation = ConfigurationValidator.validateSecurityConfig(securityConfig);
      expect(securityValidation.isValid).toBe(true);
    });

    it('should detect invalid configurations', () => {
      // Test with invalid API configuration
      const invalidApiConfig = {
        baseUrl: 'not-a-url',
        timeout: -1000,
      };

      const validation = ConfigurationValidator.validateApiConfig(invalidApiConfig);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should provide TypeScript type safety', () => {
      // This is verified at compile time, but we can test runtime behavior
      const config = configManager.getConfig();

      // These should all be properly typed
      expect(typeof config.environment).toBe('string');
      expect(typeof config.api.timeout).toBe('number');
      expect(typeof config.features.debugMode).toBe('boolean');
      expect(Array.isArray(config.security.urlValidation.allowedProtocols)).toBe(true);
    });
  });

  describe('Requirement 8.5: Configuration Loading and Management Utilities', () => {
    it('should provide configuration loading utilities', () => {
      expect(typeof ConfigurationLoader.loadFromEnvironment).toBe('function');
      expect(typeof ConfigurationLoader.loadFromLocalStorage).toBe('function');
      expect(typeof ConfigurationLoader.saveToLocalStorage).toBe('function');
      expect(typeof ConfigurationLoader.loadFromUrlParams).toBe('function');
    });

    it('should support configuration persistence', () => {
      const testConfig = { features: { debugMode: false } };

      // Test localStorage persistence
      ConfigurationLoader.saveToLocalStorage(testConfig);
      const loadedConfig = ConfigurationLoader.loadFromLocalStorage();
      expect(loadedConfig.features?.debugMode).toBe(false);
    });

    it('should support configuration export and import', () => {
      expect(typeof configManager.exportConfig).toBe('function');
      expect(typeof configManager.importConfig).toBe('function');

      // Test export
      const exported = configManager.exportConfig();
      expect(typeof exported).toBe('string');
      expect(() => JSON.parse(exported)).not.toThrow();

      // Test import
      const importResult = configManager.importConfig(exported);
      expect(importResult).toBeDefined();
      expect(typeof importResult.isValid).toBe('boolean');
    });

    it('should support configuration subscription and hot reload', () => {
      expect(typeof configManager.subscribe).toBe('function');
      expect(typeof configManager.hotReload).toBe('function');

      // Test subscription
      let callbackValue: any;
      const unsubscribe = configManager.subscribe('api.timeout', (value) => {
        callbackValue = value;
      });

      configManager.set('api.timeout', 99999);
      expect(callbackValue).toBe(99999);

      unsubscribe();
    });

    it('should provide React hooks for configuration access', () => {
      const { result } = renderHook(() => useConfiguration());

      expect(result.current.config).toBeDefined();
      expect(typeof result.current.get).toBe('function');
      expect(typeof result.current.set).toBe('function');
      expect(typeof result.current.isFeatureEnabled).toBe('function');
      expect(typeof result.current.toggleFeature).toBe('function');
      expect(typeof result.current.validateConfig).toBe('function');
    });
  });

  describe('Integration and Real-world Usage', () => {
    it('should support complete configuration workflow', () => {
      // 1. Load configuration
      const config = configManager.getConfig();
      expect(config).toBeDefined();

      // 2. Check environment
      const environment = configManager.getEnvironment();
      expect(environment).toBeDefined();

      // 3. Use feature flags
      const debugEnabled = configManager.isFeatureEnabled('debugMode');
      expect(typeof debugEnabled).toBe('boolean');

      // 4. Get specific configuration values
      const apiTimeout = configManager.get('api.timeout');
      expect(typeof apiTimeout).toBe('number');

      // 5. Update configuration
      configManager.set('api.timeout', apiTimeout + 1000);
      const newTimeout = configManager.get('api.timeout');
      expect(newTimeout).toBe(apiTimeout + 1000);

      // 6. Validate configuration
      const validation = configManager.validateConfig();
      expect(validation).toBeDefined();

      // 7. Export configuration
      const exported = configManager.exportConfig();
      expect(typeof exported).toBe('string');
    });

    it('should handle error cases gracefully', () => {
      // Test invalid key paths
      expect(configManager.get('nonexistent.key', 'default')).toBe('default');

      // Test invalid configuration import
      const invalidJson = '{"invalid": json}';
      const importResult = configManager.importConfig(invalidJson);
      expect(importResult.isValid).toBe(false);

      // Test localStorage errors (simulated)
      expect(() => ConfigurationLoader.loadFromLocalStorage()).not.toThrow();
    });
  });

  describe('Performance and Security Considerations', () => {
    it('should have performance-optimized configuration access', () => {
      const startTime = performance.now();

      // Perform multiple configuration operations
      for (let i = 0; i < 1000; i++) {
        configManager.get('api.timeout');
        configManager.isFeatureEnabled('debugMode');
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete quickly (less than 100ms for 1000 operations)
      expect(duration).toBeLessThan(100);
    });

    it('should have secure default configurations', () => {
      const securityConfig = configManager.get('security');

      // CSP should be enabled by default
      expect(securityConfig.csp.enabled).toBe(true);

      // Content sanitization should be enabled
      expect(securityConfig.sanitization.enabled).toBe(true);

      // Only safe protocols should be allowed
      const allowedProtocols = securityConfig.urlValidation.allowedProtocols;
      expect(allowedProtocols).toContain('https:');
      expect(allowedProtocols).not.toContain('ftp:');
    });
  });
});

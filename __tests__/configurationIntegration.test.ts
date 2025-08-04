/**
 * Configuration Integration Tests
 *
 * Integration tests to verify the configuration system works correctly
 * across different environments and scenarios.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigurationManager } from '../services/configurationManager';
import { ConfigurationLoader } from '../services/configurationUtils';

describe('Configuration Integration Tests', () => {
  let configManager: ConfigurationManager;

  beforeEach(() => {
    localStorage.clear();
    configManager = new ConfigurationManager();
  });

  describe('Environment-based Configuration', () => {
    it('should load different configurations for different environments', () => {
      const config = configManager.getConfig();

      // All environments should have these basic properties
      expect(config.environment).toBeDefined();
      expect(config.api).toBeDefined();
      expect(config.cache).toBeDefined();
      expect(config.features).toBeDefined();
      expect(config.logging).toBeDefined();
      expect(config.performance).toBeDefined();
      expect(config.security).toBeDefined();
    });

    it('should have appropriate default values', () => {
      const config = configManager.getConfig();

      // API configuration
      expect(config.api.baseUrl).toBe('https://api.rss2json.com/v1/api.json');
      expect(config.api.timeout).toBe(10000);
      expect(config.api.retryAttempts).toBe(3);

      // Cache configuration
      expect(config.cache.duration).toBe(15 * 60 * 1000); // 15 minutes
      expect(config.cache.strategy).toBe('lru');

      // Feature flags
      expect(config.features.enhancedErrorHandling).toBe(true);
      expect(config.features.advancedPerformanceMonitoring).toBe(true);
    });
  });

  describe('Feature Flag Management', () => {
    it('should manage feature flags correctly', () => {
      // Check initial state
      const initialDebugMode = configManager.isFeatureEnabled('debugMode');

      // Toggle feature
      configManager.toggleFeature('debugMode');
      const toggledDebugMode = configManager.isFeatureEnabled('debugMode');

      expect(toggledDebugMode).toBe(!initialDebugMode);

      // Toggle back
      configManager.toggleFeature('debugMode');
      const finalDebugMode = configManager.isFeatureEnabled('debugMode');

      expect(finalDebugMode).toBe(initialDebugMode);
    });

    it('should handle multiple feature flags', () => {
      const features = [
        'enhancedErrorHandling',
        'advancedPerformanceMonitoring',
        'offlineSupport',
        'pushNotifications',
        'analytics',
        'debugMode'
      ] as const;

      features.forEach(feature => {
        const isEnabled = configManager.isFeatureEnabled(feature);
        expect(typeof isEnabled).toBe('boolean');

        // Toggle and verify
        configManager.toggleFeature(feature);
        const newState = configManager.isFeatureEnabled(feature);
        expect(newState).toBe(!isEnabled);
      });
    });
  });

  describe('Configuration Persistence', () => {
    it('should handle localStorage integration', () => {
      // Save configuration to localStorage
      const testConfig = { features: { debugMode: false } };
      ConfigurationLoader.saveToLocalStorage(testConfig);

      // Load from localStorage
      const loadedConfig = ConfigurationLoader.loadFromLocalStorage();
      expect(loadedConfig.features?.debugMode).toBe(false);
    });

    it('should handle configuration export and import', () => {
      // Modify configuration
      configManager.set('api.timeout', 25000);
      configManager.toggleFeature('analytics');

      // Export configuration
      const exported = configManager.exportConfig();
      expect(typeof exported).toBe('string');

      // Create new manager and import
      const newManager = new ConfigurationManager();
      const importResult = newManager.importConfig(exported);

      // Verify import (basic check)
      expect(importResult).toBeDefined();
      expect(typeof importResult.isValid).toBe('boolean');
    });
  });

  describe('Configuration Subscription', () => {
    it('should notify subscribers of changes', () => {
      const mockCallback = vi.fn();

      // Subscribe to changes
      const unsubscribe = configManager.subscribe('api.timeout', mockCallback);

      // Make changes
      configManager.set('api.timeout', 30000);

      // Verify callback was called
      expect(mockCallback).toHaveBeenCalledWith(30000);

      // Clean up
      unsubscribe();

      // Make another change
      configManager.set('api.timeout', 35000);

      // Verify callback was not called after unsubscribe
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate configuration structure', () => {
      const validation = configManager.validateConfig();

      expect(validation).toBeDefined();
      expect(typeof validation.isValid).toBe('boolean');
      expect(Array.isArray(validation.errors)).toBe(true);
      expect(Array.isArray(validation.warnings)).toBe(true);
    });

    it('should handle invalid configuration gracefully', () => {
      // Set invalid timeout
      configManager.set('api.timeout', -1000);

      const validation = configManager.validateConfig();
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Security Configuration', () => {
    it('should have performance monitoring configuration', () => {
      const performanceConfig = configManager.get('performance');

      expect(performanceConfig).toBeDefined();
      expect(typeof performanceConfig.monitoring).toBe('boolean');
      expect(typeof performanceConfig.webVitals).toBe('boolean');
      expect(performanceConfig.thresholds).toBeDefined();
      expect(typeof performanceConfig.thresholds.fcp).toBe('number');
      expect(typeof performanceConfig.thresholds.lcp).toBe('number');
    });

    it('should have security configuration', () => {
      const securityConfig = configManager.get('security');

      expect(securityConfig).toBeDefined();
      expect(securityConfig.csp).toBeDefined();
      expect(typeof securityConfig.csp.enabled).toBe('boolean');
      expect(securityConfig.sanitization).toBeDefined();
      expect(typeof securityConfig.sanitization.enabled).toBe('boolean');
      expect(Array.isArray(securityConfig.urlValidation.allowedProtocols)).toBe(true);
    });
  });

  describe('Real-world Usage Scenarios', () => {
    it('should handle typical application configuration flow', () => {
      // 1. Check environment
      const environment = configManager.getEnvironment();
      expect(['development', 'staging', 'production']).toContain(environment);

      // 2. Check if feature is enabled before using it
      const analyticsEnabled = configManager.isFeatureEnabled('analytics');
      if (analyticsEnabled) {
        // Analytics would be initialized here
        expect(typeof analyticsEnabled).toBe('boolean');
      }

      // 3. Get API configuration for network requests
      const apiConfig = configManager.get('api');
      expect(apiConfig.baseUrl).toBeDefined();
      expect(apiConfig.timeout).toBeGreaterThan(0);

      // 4. Get cache configuration for caching strategy
      const cacheConfig = configManager.get('cache');
      expect(cacheConfig.duration).toBeGreaterThan(0);
      expect(['lru', 'fifo', 'ttl']).toContain(cacheConfig.strategy);

      // 5. Check performance monitoring settings
      const performanceMonitoring = configManager.get('performance.monitoring');
      expect(typeof performanceMonitoring).toBe('boolean');
    });

    it('should support dynamic configuration updates', () => {
      // Simulate user changing settings
      const originalTimeout = configManager.get('api.timeout');

      // User updates timeout in settings
      configManager.set('api.timeout', originalTimeout + 5000);

      // Verify change
      const newTimeout = configManager.get('api.timeout');
      expect(newTimeout).toBe(originalTimeout + 5000);

      // User toggles feature
      const originalAnalytics = configManager.isFeatureEnabled('analytics');
      configManager.toggleFeature('analytics');

      // Verify toggle
      const newAnalytics = configManager.isFeatureEnabled('analytics');
      expect(newAnalytics).toBe(!originalAnalytics);
    });
  });
});

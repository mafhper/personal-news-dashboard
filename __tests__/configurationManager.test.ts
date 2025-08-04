/**
 * Configuration Manager Tests
 *
 * Comprehensive tests for the configuration management system
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ConfigurationManager, type AppConfiguration, type FeatureFlags } from '../services/configurationManager';
import { ConfigurationLoader, ConfigurationValidator, EnvironmentDetector } from '../services/configurationUtils';

// Mock import.meta.env
const mockEnv = {
  MODE: 'development',
  NODE_ENV: 'development',
  PACKAGE_VERSION: '1.0.0',
  VITE_API_BASE_URL: 'https://test-api.example.com',
  VITE_CACHE_DURATION: '900000',
  VITE_FEATURE_DEBUG_MODE: 'true',
  VITE_LOG_LEVEL: 'DEBUG',
};

vi.stubGlobal('import.meta', { env: mockEnv });

describe('ConfigurationManager', () => {
  let configManager: ConfigurationManager;

  beforeEach(() => {
    // Reset environment
    mockEnv.MODE = 'development';
    configManager = new ConfigurationManager();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Environment Detection', () => {
    it('should detect development environment', () => {
      mockEnv.MODE = 'development';
      const manager = new ConfigurationManager();
      expect(manager.getEnvironment()).toBe('development');
    });

    it('should detect production environment', () => {
      mockEnv.MODE = 'production';
      const manager = new ConfigurationManager();
      expect(manager.getEnvironment()).toBe('production');
    });

    it('should detect staging environment', () => {
      mockEnv.MODE = 'staging';
      const manager = new ConfigurationManager();
      expect(manager.getEnvironment()).toBe('staging');
    });
  });

  describe('Configuration Loading', () => {
    it('should load base configuration', () => {
      const config = configManager.getConfig();

      expect(config).toHaveProperty('environment');
      expect(config).toHaveProperty('api');
      expect(config).toHaveProperty('cache');
      expect(config).toHaveProperty('performance');
      expect(config).toHaveProperty('security');
      expect(config).toHaveProperty('logging');
      expect(config).toHaveProperty('features');
    });

    it('should apply environment-specific overrides', () => {
      mockEnv.MODE = 'development';
      const devManager = new ConfigurationManager();
      const devConfig = devManager.getConfig();

      expect(devConfig.logging.level).toBe('DEBUG');
      expect(devConfig.features.debugMode).toBe(true);
      expect(devConfig.features.experimentalFeatures).toBe(true);

      mockEnv.MODE = 'production';
      const prodManager = new ConfigurationManager();
      const prodConfig = prodManager.getConfig();

      expect(prodConfig.logging.level).toBe('WARN');
      expect(prodConfig.features.debugMode).toBe(false);
      expect(prodConfig.features.experimentalFeatures).toBe(false);
    });
  });

  describe('Configuration Access', () => {
    it('should get configuration values by key path', () => {
      expect(configManager.get('environment')).toBe('development');
      expect(configManager.get('api.timeout')).toBe(10000);
      expect(configManager.get('features.debugMode')).toBe(true);
    });

    it('should return default value for non-existent keys', () => {
      expect(configManager.get('nonexistent.key', 'default')).toBe('default');
      expect(configManager.get('api.nonexistent', 42)).toBe(42);
    });

    it('should set configuration values by key path', () => {
      configManager.set('api.timeout', 15000);
      expect(configManager.get('api.timeout')).toBe(15000);

      configManager.set('features.newFeature', true);
      expect(configManager.get('features.newFeature')).toBe(true);
    });
  });

  describe('Feature Flags', () => {
    it('should check if feature is enabled', () => {
      expect(configManager.isFeatureEnabled('debugMode')).toBe(true);
      expect(configManager.isFeatureEnabled('enhancedErrorHandling')).toBe(true);
    });

    it('should toggle feature flags', () => {
      const initialValue = configManager.isFeatureEnabled('analytics');
      configManager.toggleFeature('analytics');
      expect(configManager.isFeatureEnabled('analytics')).toBe(!initialValue);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate valid configuration', () => {
      const validation = configManager.validateConfig();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid configuration', () => {
      configManager.set('api.timeout', -1000); // Invalid timeout
      const validation = configManager.validateConfig();
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Configuration Subscription', () => {
    it('should notify subscribers of configuration changes', () => {
      const callback = vi.fn();
      const unsubscribe = configManager.subscribe('api.timeout', callback);

      configManager.set('api.timeout', 20000);
      expect(callback).toHaveBeenCalledWith(20000);

      unsubscribe();
      configManager.set('api.timeout', 25000);
      expect(callback).toHaveBeenCalledTimes(1); // Should not be called after unsubscribe
    });
  });

  describe('Configuration Export/Import', () => {
    it('should export configuration as JSON', () => {
      const exported = configManager.exportConfig();
      expect(() => JSON.parse(exported)).not.toThrow();

      const parsed = JSON.parse(exported);
      expect(parsed).toHaveProperty('environment');
      expect(parsed).toHaveProperty('features');
    });

    it('should import valid configuration', () => {
      const testConfig = {
        ...configManager.getConfig(),
        api: { ...configManager.getConfig().api, timeout: 30000 },
      };

      const result = configManager.importConfig(JSON.stringify(testConfig));
      expect(result.isValid).toBe(true);
      expect(configManager.get('api.timeout')).toBe(30000);
    });

    it('should reject invalid configuration import', () => {
      const invalidConfig = '{"invalid": "config"}';
      const result = configManager.importConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Hot Reload', () => {
    it('should support hot reload in development', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      configManager.hotReload();
      expect(consoleSpy).toHaveBeenCalledWith('Configuration hot reloaded');

      consoleSpy.mockRestore();
    });

    it('should not hot reload in production', () => {
      mockEnv.MODE = 'production';
      const prodManager = new ConfigurationManager();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      prodManager.hotReload();
      expect(consoleSpy).not.toHaveBeenCalledWith('Configuration hot reloaded');

      consoleSpy.mockRestore();
    });
  });
});

describe('ConfigurationLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Environment Variable Loading', () => {
    it('should load configuration from environment variables', () => {
      const config = ConfigurationLoader.loadFromEnvironment();

      expect(config.api?.baseUrl).toBe('https://test-api.example.com');
      expect(config.cache?.duration).toBe(900000);
      expect(config.features?.debugMode).toBe(true);
      expect(config.logging?.level).toBe('DEBUG');
    });

    it('should handle missing environment variables', () => {
      const originalEnv = { ...mockEnv };
      delete mockEnv.VITE_API_BASE_URL;
      delete mockEnv.VITE_CACHE_DURATION;

      const config = ConfigurationLoader.loadFromEnvironment();
      expect(config.api?.baseUrl).toBeUndefined();
      expect(config.cache?.duration).toBeUndefined();

      // Restore environment
      Object.assign(mockEnv, originalEnv);
    });
  });

  describe('LocalStorage Loading', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should load configuration from localStorage', () => {
      const testConfig = { features: { debugMode: false } };
      localStorage.setItem('app-configuration', JSON.stringify(testConfig));

      const config = ConfigurationLoader.loadFromLocalStorage();
      expect(config.features?.debugMode).toBe(false);
    });

    it('should handle invalid localStorage data', () => {
      localStorage.setItem('app-configuration', 'invalid json');

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const config = ConfigurationLoader.loadFromLocalStorage();

      expect(config).toEqual({});
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should save configuration to localStorage', () => {
      const testConfig = { features: { debugMode: true } };
      ConfigurationLoader.saveToLocalStorage(testConfig);

      const stored = localStorage.getItem('app-configuration');
      expect(JSON.parse(stored!)).toEqual(testConfig);
    });
  });

  describe('URL Parameter Loading', () => {
    it('should load configuration from URL parameters', () => {
      // Mock window.location.search
      Object.defineProperty(window, 'location', {
        value: {
          search: '?debug=true&experimental=false&beta=true',
        },
        writable: true,
      });

      const config = ConfigurationLoader.loadFromUrlParams();
      expect(config.features?.debugMode).toBe(true);
      expect(config.features?.experimentalFeatures).toBe(false);
      expect(config.features?.betaFeatures).toBe(true);
    });
  });
});

describe('ConfigurationValidator', () => {
  describe('API Configuration Validation', () => {
    it('should validate valid API configuration', () => {
      const validConfig = {
        baseUrl: 'https://api.example.com',
        timeout: 10000,
        retryAttempts: 3,
      };

      const result = ConfigurationValidator.validateApiConfig(validConfig);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid API configuration', () => {
      const invalidConfig = {
        baseUrl: 'not-a-url',
        timeout: -1000,
        retryAttempts: 20,
      };

      const result = ConfigurationValidator.validateApiConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should generate warnings for suboptimal configuration', () => {
      const suboptimalConfig = {
        baseUrl: 'https://api.example.com',
        timeout: 100, // Too low
        retryAttempts: 15, // Too high
      };

      const result = ConfigurationValidator.validateApiConfig(suboptimalConfig);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Cache Configuration Validation', () => {
    it('should validate cache configuration', () => {
      const validConfig = {
        duration: 900000,
        maxSize: 50 * 1024 * 1024,
        strategy: 'lru',
      };

      const result = ConfigurationValidator.validateCacheConfig(validConfig);
      expect(result.isValid).toBe(true);
    });

    it('should detect invalid cache strategy', () => {
      const invalidConfig = {
        strategy: 'invalid-strategy',
      };

      const result = ConfigurationValidator.validateCacheConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cache strategy must be one of: lru, fifo, ttl');
    });
  });

  describe('Performance Configuration Validation', () => {
    it('should validate performance thresholds', () => {
      const config = {
        thresholds: {
          fcp: 1800,
          lcp: 2500,
          fid: 100,
          cls: 0.1,
        },
      };

      const result = ConfigurationValidator.validatePerformanceConfig(config);
      expect(result.isValid).toBe(true);
    });

    it('should warn about lenient thresholds', () => {
      const config = {
        thresholds: {
          fcp: 5000, // Too high
          lcp: 6000, // Too high
          fid: 500,  // Too high
          cls: 0.5,  // Too high
        },
      };

      const result = ConfigurationValidator.validatePerformanceConfig(config);
      expect(result.warnings.length).toBe(4);
    });
  });

  describe('Security Configuration Validation', () => {
    it('should validate security configuration', () => {
      const validConfig = {
        csp: {
          enabled: true,
          directives: {
            'default-src': ["'self'"],
          },
        },
        urlValidation: {
          allowedProtocols: ['https:'],
        },
      };

      const result = ConfigurationValidator.validateSecurityConfig(validConfig);
      expect(result.isValid).toBe(true);
    });

    it('should require allowed protocols', () => {
      const invalidConfig = {
        urlValidation: {
          allowedProtocols: [],
        },
      };

      const result = ConfigurationValidator.validateSecurityConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one allowed protocol must be specified');
    });
  });
});

describe('EnvironmentDetector', () => {
  it('should detect environment from Vite mode', () => {
    mockEnv.MODE = 'production';
    expect(EnvironmentDetector.detect()).toBe('production');

    mockEnv.MODE = 'development';
    expect(EnvironmentDetector.detect()).toBe('development');

    mockEnv.MODE = 'staging';
    expect(EnvironmentDetector.detect()).toBe('staging');
  });

  it('should provide environment check methods', () => {
    mockEnv.MODE = 'development';
    expect(EnvironmentDetector.isDevelopment()).toBe(true);
    expect(EnvironmentDetector.isProduction()).toBe(false);
    expect(EnvironmentDetector.isStaging()).toBe(false);
  });

  it('should detect environment from hostname', () => {
    // Mock window.location.hostname
    Object.defineProperty(window, 'location', {
      value: {
        hostname: 'staging.example.com',
        search: '',
      },
      writable: true,
    });

    mockEnv.MODE = undefined;
    mockEnv.NODE_ENV = undefined;

    expect(EnvironmentDetector.detect()).toBe('staging');
  });
});

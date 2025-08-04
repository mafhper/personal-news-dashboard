/**
 * Configuration Utilities Tests
 *
 * Tests for configuration utility functions
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  ConfigurationLoader,
  ConfigurationValidator,
  ConfigurationMerger,
  EnvironmentDetector,
  ConfigurationDebugger,
} from '../services/configurationUtils';

// Mock import.meta.env
const mockEnv = {
  MODE: 'development',
  NODE_ENV: 'development',
  VITE_API_BASE_URL: 'https://test-api.example.com',
  VITE_CACHE_DURATION: '900000',
  VITE_FEATURE_DEBUG_MODE: 'true',
  VITE_FEATURE_ANALYTICS: 'false',
  VITE_LOG_LEVEL: 'DEBUG',
};

vi.stubGlobal('import.meta', { env: mockEnv });

describe('ConfigurationLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadFromEnvironment', () => {
    it('should load API configuration from environment variables', () => {
      const config = ConfigurationLoader.loadFromEnvironment();

      expect(config.api?.baseUrl).toBe('https://test-api.example.com');
    });

    it('should load cache configuration from environment variables', () => {
      const config = ConfigurationLoader.loadFromEnvironment();

      expect(config.cache?.duration).toBe(900000);
    });

    it('should load feature flags from environment variables', () => {
      const config = ConfigurationLoader.loadFromEnvironment();

      expect(config.features?.debugMode).toBe(true);
      expect(config.features?.analytics).toBe(false);
    });

    it('should load logging configuration from environment variables', () => {
      const config = ConfigurationLoader.loadFromEnvironment();

      expect(config.logging?.level).toBe('DEBUG');
    });

    it('should handle missing environment variables gracefully', () => {
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

  describe('loadFromLocalStorage', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should load configuration from localStorage', () => {
      const testConfig = {
        features: { debugMode: false },
        api: { timeout: 20000 },
      };
      localStorage.setItem('app-configuration', JSON.stringify(testConfig));

      const config = ConfigurationLoader.loadFromLocalStorage();

      expect(config.features?.debugMode).toBe(false);
      expect(config.api?.timeout).toBe(20000);
    });

    it('should return empty object when localStorage is empty', () => {
      const config = ConfigurationLoader.loadFromLocalStorage();
      expect(config).toEqual({});
    });

    it('should handle invalid JSON in localStorage', () => {
      localStorage.setItem('app-configuration', 'invalid json');

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const config = ConfigurationLoader.loadFromLocalStorage();

      expect(config).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load configuration from localStorage:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('saveToLocalStorage', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should save configuration to localStorage', () => {
      const testConfig = {
        features: { debugMode: true },
        api: { timeout: 15000 },
      };

      ConfigurationLoader.saveToLocalStorage(testConfig);

      const stored = localStorage.getItem('app-configuration');
      expect(JSON.parse(stored!)).toEqual(testConfig);
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage.setItem to throw an error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      ConfigurationLoader.saveToLocalStorage({ test: 'config' });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save configuration to localStorage:',
        expect.any(Error)
      );

      // Restore original method
      localStorage.setItem = originalSetItem;
      consoleSpy.mockRestore();
    });
  });

  describe('loadFromUrlParams', () => {
    it('should load feature flags from URL parameters', () => {
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

    it('should return empty object when no URL parameters', () => {
      Object.defineProperty(window, 'location', {
        value: { search: '' },
        writable: true,
      });

      const config = ConfigurationLoader.loadFromUrlParams();
      expect(config).toEqual({});
    });
  });
});

describe('ConfigurationValidator', () => {
  describe('validateApiConfig', () => {
    it('should validate correct API configuration', () => {
      const validConfig = {
        baseUrl: 'https://api.example.com',
        timeout: 10000,
        retryAttempts: 3,
      };

      const result = ConfigurationValidator.validateApiConfig(validConfig);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing base URL', () => {
      const invalidConfig = {
        timeout: 10000,
        retryAttempts: 3,
      };

      const result = ConfigurationValidator.validateApiConfig(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('API base URL is required');
    });

    it('should detect invalid URL format', () => {
      const invalidConfig = {
        baseUrl: 'not-a-valid-url',
        timeout: 10000,
        retryAttempts: 3,
      };

      const result = ConfigurationValidator.validateApiConfig(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('API base URL must be a valid URL');
    });

    it('should warn about suboptimal timeout values', () => {
      const suboptimalConfig = {
        baseUrl: 'https://api.example.com',
        timeout: 500, // Too low
        retryAttempts: 3,
      };

      const result = ConfigurationValidator.validateApiConfig(suboptimalConfig);

      expect(result.warnings).toContain('API timeout should be between 1000ms and 60000ms');
    });

    it('should warn about excessive retry attempts', () => {
      const suboptimalConfig = {
        baseUrl: 'https://api.example.com',
        timeout: 10000,
        retryAttempts: 15, // Too high
      };

      const result = ConfigurationValidator.validateApiConfig(suboptimalConfig);

      expect(result.warnings).toContain('Retry attempts should be between 0 and 10');
    });
  });

  describe('validateCacheConfig', () => {
    it('should validate correct cache configuration', () => {
      const validConfig = {
        duration: 900000,
        maxSize: 50 * 1024 * 1024,
        strategy: 'lru',
        compression: true,
      };

      const result = ConfigurationValidator.validateCacheConfig(validConfig);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid cache strategy', () => {
      const invalidConfig = {
        strategy: 'invalid-strategy',
      };

      const result = ConfigurationValidator.validateCacheConfig(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cache strategy must be one of: lru, fifo, ttl');
    });

    it('should warn about short cache duration', () => {
      const suboptimalConfig = {
        duration: 30000, // 30 seconds - too short
      };

      const result = ConfigurationValidator.validateCacheConfig(suboptimalConfig);

      expect(result.warnings).toContain('Cache duration less than 1 minute may cause excessive network requests');
    });

    it('should warn about large cache size', () => {
      const suboptimalConfig = {
        maxSize: 200 * 1024 * 1024, // 200MB - too large
      };

      const result = ConfigurationValidator.validateCacheConfig(suboptimalConfig);

      expect(result.warnings).toContain('Cache size over 100MB may impact performance');
    });
  });

  describe('validatePerformanceConfig', () => {
    it('should validate correct performance configuration', () => {
      const validConfig = {
        thresholds: {
          fcp: 1800,
          lcp: 2500,
          fid: 100,
          cls: 0.1,
        },
      };

      const result = ConfigurationValidator.validatePerformanceConfig(validConfig);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn about lenient FCP threshold', () => {
      const suboptimalConfig = {
        thresholds: {
          fcp: 4000, // Too high
        },
      };

      const result = ConfigurationValidator.validatePerformanceConfig(suboptimalConfig);

      expect(result.warnings).toContain('FCP threshold over 3000ms may be too lenient');
    });

    it('should warn about lenient LCP threshold', () => {
      const suboptimalConfig = {
        thresholds: {
          lcp: 5000, // Too high
        },
      };

      const result = ConfigurationValidator.validatePerformanceConfig(suboptimalConfig);

      expect(result.warnings).toContain('LCP threshold over 4000ms may be too lenient');
    });

    it('should warn about lenient FID threshold', () => {
      const suboptimalConfig = {
        thresholds: {
          fid: 400, // Too high
        },
      };

      const result = ConfigurationValidator.validatePerformanceConfig(suboptimalConfig);

      expect(result.warnings).toContain('FID threshold over 300ms may be too lenient');
    });

    it('should warn about lenient CLS threshold', () => {
      const suboptimalConfig = {
        thresholds: {
          cls: 0.3, // Too high
        },
      };

      const result = ConfigurationValidator.validatePerformanceConfig(suboptimalConfig);

      expect(result.warnings).toContain('CLS threshold over 0.25 may be too lenient');
    });
  });

  describe('validateSecurityConfig', () => {
    it('should validate correct security configuration', () => {
      const validConfig = {
        csp: {
          enabled: true,
          directives: {
            'default-src': ["'self'"],
            'script-src': ["'self'", "'unsafe-inline'"],
          },
        },
        urlValidation: {
          allowedProtocols: ['https:', 'http:'],
          blockedDomains: [],
        },
      };

      const result = ConfigurationValidator.validateSecurityConfig(validConfig);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn about CSP enabled without directives', () => {
      const suboptimalConfig = {
        csp: {
          enabled: true,
          directives: {},
        },
      };

      const result = ConfigurationValidator.validateSecurityConfig(suboptimalConfig);

      expect(result.warnings).toContain('CSP is enabled but no directives are defined');
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

    it('should warn about potentially unsafe protocols', () => {
      const suboptimalConfig = {
        urlValidation: {
          allowedProtocols: ['https:', 'ftp:', 'file:'],
        },
      };

      const result = ConfigurationValidator.validateSecurityConfig(suboptimalConfig);

      expect(result.warnings).toContain('Potentially unsafe protocols detected: ftp:, file:');
    });
  });
});

describe('ConfigurationMerger', () => {
  it('should merge simple objects', () => {
    const target = { a: 1, b: 2 };
    const source = { b: 3, c: 4 };

    const result = ConfigurationMerger.merge(target, source);

    expect(result).toEqual({ a: 1, b: 3, c: 4 });
  });

  it('should deep merge nested objects', () => {
    const target = {
      api: { baseUrl: 'https://api.example.com', timeout: 10000 },
      features: { debugMode: false },
    };
    const source = {
      api: { timeout: 15000, retryAttempts: 3 },
      features: { analytics: true },
    };

    const result = ConfigurationMerger.merge(target, source);

    expect(result).toEqual({
      api: { baseUrl: 'https://api.example.com', timeout: 15000, retryAttempts: 3 },
      features: { debugMode: false, analytics: true },
    });
  });

  it('should handle multiple sources', () => {
    const target = { a: 1 };
    const source1 = { b: 2 };
    const source2 = { c: 3 };

    const result = ConfigurationMerger.merge(target, source1, source2);

    expect(result).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('should not modify arrays', () => {
    const target = { list: [1, 2, 3] };
    const source = { list: [4, 5, 6] };

    const result = ConfigurationMerger.merge(target, source);

    expect(result.list).toEqual([4, 5, 6]);
  });
});

describe('EnvironmentDetector', () => {
  beforeEach(() => {
    // Reset environment
    mockEnv.MODE = 'development';
    mockEnv.NODE_ENV = 'development';
  });

  it('should detect development environment from Vite mode', () => {
    mockEnv.MODE = 'development';
    expect(EnvironmentDetector.detect()).toBe('development');
  });

  it('should detect production environment from Vite mode', () => {
    mockEnv.MODE = 'production';
    expect(EnvironmentDetector.detect()).toBe('production');
  });

  it('should detect staging environment from Vite mode', () => {
    mockEnv.MODE = 'staging';
    expect(EnvironmentDetector.detect()).toBe('staging');
  });

  it('should fallback to NODE_ENV when Vite mode is not available', () => {
    delete mockEnv.MODE;
    mockEnv.NODE_ENV = 'production';
    expect(EnvironmentDetector.detect()).toBe('production');
  });

  it('should detect staging from hostname', () => {
    delete mockEnv.MODE;
    delete mockEnv.NODE_ENV;

    Object.defineProperty(window, 'location', {
      value: { hostname: 'staging.example.com' },
      writable: true,
    });

    expect(EnvironmentDetector.detect()).toBe('staging');
  });

  it('should detect development from localhost', () => {
    delete mockEnv.MODE;
    delete mockEnv.NODE_ENV;

    Object.defineProperty(window, 'location', {
      value: { hostname: 'localhost' },
      writable: true,
    });

    expect(EnvironmentDetector.detect()).toBe('development');
  });

  it('should default to production for unknown environments', () => {
    delete mockEnv.MODE;
    delete mockEnv.NODE_ENV;

    Object.defineProperty(window, 'location', {
      value: { hostname: 'unknown.example.com' },
      writable: true,
    });

    expect(EnvironmentDetector.detect()).toBe('production');
  });

  it('should provide environment check methods', () => {
    mockEnv.MODE = 'development';
    expect(EnvironmentDetector.isDevelopment()).toBe(true);
    expect(EnvironmentDetector.isStaging()).toBe(false);
    expect(EnvironmentDetector.isProduction()).toBe(false);

    mockEnv.MODE = 'production';
    expect(EnvironmentDetector.isDevelopment()).toBe(false);
    expect(EnvironmentDetector.isStaging()).toBe(false);
    expect(EnvironmentDetector.isProduction()).toBe(true);
  });
});

describe('ConfigurationDebugger', () => {
  it('should log configuration summary when debug mode is enabled', () => {
    const mockConfig = {
      environment: 'development',
      version: '1.0.0',
      features: { debugMode: true },
      performance: { monitoring: true },
      security: { csp: { enabled: true } },
      logging: { level: 'DEBUG' },
    } as any;

    const consoleSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});

    ConfigurationDebugger.logSummary(mockConfig);

    expect(consoleSpy).toHaveBeenCalledWith('🔧 Configuration Summary');
    expect(consoleLogSpy).toHaveBeenCalledWith('Environment:', 'development');
    expect(consoleLogSpy).toHaveBeenCalledWith('Version:', '1.0.0');
    expect(consoleGroupEndSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleGroupEndSpy.mockRestore();
  });

  it('should not log when debug mode is disabled', () => {
    const mockConfig = {
      features: { debugMode: false },
    } as any;

    const consoleSpy = vi.spyOn(console, 'group').mockImplementation(() => {});

    ConfigurationDebugger.logSummary(mockConfig);

    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

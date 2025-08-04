/**
 * useConfiguration Hook Tests
 *
 * Tests for the configuration React hooks
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConfiguration, useConfigSection, useFeatureFlags, useEnvironment } from '../hooks/useConfiguration';
import { configManager } from '../services/configurationManager';

// Mock the configuration manager
vi.mock('../services/configurationManager', () => {
  const mockConfig = {
    environment: 'development',
    version: '1.0.0',
    buildTimestamp: Date.now(),
    api: {
      baseUrl: 'https://api.example.com',
      timeout: 10000,
      retryAttempts: 3,
      rateLimit: { requests: 100, windowMs: 60000 },
    },
    cache: {
      duration: 900000,
      maxSize: 50 * 1024 * 1024,
      strategy: 'lru' as const,
      compression: true,
    },
    performance: {
      monitoring: true,
      webVitals: true,
      componentTiming: true,
      networkTracking: true,
      memoryTracking: true,
      thresholds: { fcp: 1800, lcp: 2500, fid: 100, cls: 0.1 },
    },
    security: {
      csp: {
        enabled: true,
        reportOnly: false,
        directives: { 'default-src': ["'self'"] },
      },
      sanitization: {
        enabled: true,
        allowedTags: ['p', 'br'],
        allowedAttributes: ['href'],
      },
      urlValidation: {
        allowedProtocols: ['https:'],
        blockedDomains: [],
      },
    },
    logging: {
      level: 'DEBUG' as const,
      transports: [{ type: 'console' as const, enabled: true, config: {} }],
      context: {
        includeUserInfo: true,
        includeSessionInfo: true,
        includeComponentInfo: true,
      },
    },
    features: {
      enhancedErrorHandling: true,
      advancedPerformanceMonitoring: true,
      offlineSupport: true,
      pushNotifications: false,
      analytics: false,
      experimentalFeatures: true,
      debugMode: true,
      betaFeatures: true,
    },
  };

  const mockListeners = new Map();

  return {
    configManager: {
      getConfig: vi.fn(() => mockConfig),
      getEnvironment: vi.fn(() => 'development'),
      isFeatureEnabled: vi.fn((feature: string) => mockConfig.features[feature as keyof typeof mockConfig.features]),
      toggleFeature: vi.fn((feature: string) => {
        mockConfig.features[feature as keyof typeof mockConfig.features] =
          !mockConfig.features[feature as keyof typeof mockConfig.features];
      }),
      get: vi.fn((keyPath: string, defaultValue?: any) => {
        const keys = keyPath.split('.');
        let value: any = mockConfig;
        for (const key of keys) {
          if (value && typeof value === 'object' && key in value) {
            value = value[key];
          } else {
            return defaultValue;
          }
        }
        return value;
      }),
      set: vi.fn((keyPath: string, value: any) => {
        const keys = keyPath.split('.');
        const lastKey = keys.pop()!;
        let target: any = mockConfig;
        for (const key of keys) {
          if (!(key in target) || typeof target[key] !== 'object') {
            target[key] = {};
          }
          target = target[key];
        }
        target[lastKey] = value;
      }),
      validateConfig: vi.fn(() => ({ isValid: true, errors: [], warnings: [] })),
      subscribe: vi.fn((keyPath: string, callback: (value: any) => void) => {
        if (!mockListeners.has(keyPath)) {
          mockListeners.set(keyPath, []);
        }
        mockListeners.get(keyPath).push(callback);
        return () => {
          const callbacks = mockListeners.get(keyPath);
          if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
              callbacks.splice(index, 1);
            }
          }
        };
      }),
      hotReload: vi.fn(),
      exportConfig: vi.fn(() => JSON.stringify(mockConfig)),
      importConfig: vi.fn(() => ({ isValid: true, errors: [], warnings: [] })),
    },
  };
});

describe('useConfiguration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return configuration and utility functions', () => {
    const { result } = renderHook(() => useConfiguration());

    expect(result.current.config).toBeDefined();
    expect(result.current.environment).toBe('development');
    expect(typeof result.current.isFeatureEnabled).toBe('function');
    expect(typeof result.current.toggleFeature).toBe('function');
    expect(typeof result.current.get).toBe('function');
    expect(typeof result.current.set).toBe('function');
    expect(typeof result.current.validateConfig).toBe('function');
    expect(typeof result.current.subscribe).toBe('function');
    expect(typeof result.current.hotReload).toBe('function');
    expect(typeof result.current.exportConfig).toBe('function');
    expect(typeof result.current.importConfig).toBe('function');
  });

  it('should check feature flags', () => {
    const { result } = renderHook(() => useConfiguration());

    expect(result.current.isFeatureEnabled('debugMode')).toBe(true);
    expect(result.current.isFeatureEnabled('pushNotifications')).toBe(false);
  });

  it('should toggle feature flags', () => {
    const { result } = renderHook(() => useConfiguration());

    act(() => {
      result.current.toggleFeature('analytics');
    });

    expect(configManager.toggleFeature).toHaveBeenCalledWith('analytics');
  });

  it('should get configuration values', () => {
    const { result } = renderHook(() => useConfiguration());

    const timeout = result.current.get('api.timeout');
    expect(timeout).toBe(10000);

    const defaultValue = result.current.get('nonexistent.key', 'default');
    expect(defaultValue).toBe('default');
  });

  it('should set configuration values', () => {
    const { result } = renderHook(() => useConfiguration());

    act(() => {
      result.current.set('api.timeout', 15000);
    });

    expect(configManager.set).toHaveBeenCalledWith('api.timeout', 15000);
  });

  it('should validate configuration', () => {
    const { result } = renderHook(() => useConfiguration());

    const validation = result.current.validateConfig();
    expect(validation.isValid).toBe(true);
    expect(configManager.validateConfig).toHaveBeenCalled();
  });

  it('should export configuration', () => {
    const { result } = renderHook(() => useConfiguration());

    const exported = result.current.exportConfig();
    expect(typeof exported).toBe('string');
    expect(configManager.exportConfig).toHaveBeenCalled();
  });

  it('should import configuration', () => {
    const { result } = renderHook(() => useConfiguration());

    const testConfig = '{"test": "config"}';
    const importResult = result.current.importConfig(testConfig);

    expect(importResult.isValid).toBe(true);
    expect(configManager.importConfig).toHaveBeenCalledWith(testConfig);
  });

  it('should hot reload configuration', () => {
    const { result } = renderHook(() => useConfiguration());

    act(() => {
      result.current.hotReload();
    });

    expect(configManager.hotReload).toHaveBeenCalled();
  });
});

describe('useConfigSection', () => {
  it('should return specific configuration section', () => {
    const { result } = renderHook(() => useConfigSection('api'));

    expect(result.current).toEqual({
      baseUrl: 'https://api.example.com',
      timeout: 10000,
      retryAttempts: 3,
      rateLimit: { requests: 100, windowMs: 60000 },
    });
  });

  it('should subscribe to section changes', () => {
    const { result } = renderHook(() => useConfigSection('api.timeout'));

    expect(result.current).toBe(10000);
    expect(configManager.subscribe).toHaveBeenCalledWith('api.timeout', expect.any(Function));
  });
});

describe('useFeatureFlags', () => {
  it('should return feature flags and utilities', () => {
    const { result } = renderHook(() => useFeatureFlags());

    expect(result.current.features).toBeDefined();
    expect(result.current.features.debugMode).toBe(true);
    expect(result.current.features.pushNotifications).toBe(false);
    expect(typeof result.current.isFeatureEnabled).toBe('function');
    expect(typeof result.current.toggleFeature).toBe('function');
  });

  it('should check individual feature flags', () => {
    const { result } = renderHook(() => useFeatureFlags());

    expect(result.current.isFeatureEnabled('enhancedErrorHandling')).toBe(true);
    expect(result.current.isFeatureEnabled('analytics')).toBe(false);
  });

  it('should toggle feature flags', () => {
    const { result } = renderHook(() => useFeatureFlags());

    act(() => {
      result.current.toggleFeature('offlineSupport');
    });

    expect(configManager.toggleFeature).toHaveBeenCalledWith('offlineSupport');
  });
});

describe('useEnvironment', () => {
  it('should return environment information', () => {
    const { result } = renderHook(() => useEnvironment());

    expect(result.current.environment).toBe('development');
    expect(result.current.isDevelopment).toBe(true);
    expect(result.current.isStaging).toBe(false);
    expect(result.current.isProduction).toBe(false);
    expect(result.current.config).toBeDefined();
  });

  it('should provide environment check booleans', () => {
    const { result } = renderHook(() => useEnvironment());

    expect(result.current.isDevelopment).toBe(true);
    expect(result.current.isStaging).toBe(false);
    expect(result.current.isProduction).toBe(false);
  });
});

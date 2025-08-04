/**
 * Configuration Manager
 *
 * Centralized configuration system with environment support, feature flags,
 * and type safety for the Personal News Dashboard.
 */

import { z } from 'zod';

// Environment types
export type Environment = 'development' | 'staging' | 'production';

// Configuration schemas for validation
const ApiConfigSchema = z.object({
  baseUrl: z.string().url(),
  timeout: z.number().positive(),
  retryAttempts: z.number().min(0).max(10),
  rateLimit: z.object({
    requests: z.number().positive(),
    windowMs: z.number().positive(),
  }),
});

const CacheConfigSchema = z.object({
  duration: z.number().positive(),
  maxSize: z.number().positive(),
  strategy: z.enum(['lru', 'fifo', 'ttl']),
  compression: z.boolean(),
});

const PerformanceConfigSchema = z.object({
  monitoring: z.boolean(),
  webVitals: z.boolean(),
  componentTiming: z.boolean(),
  networkTracking: z.boolean(),
  memoryTracking: z.boolean(),
  thresholds: z.object({
    fcp: z.number().positive(),
    lcp: z.number().positive(),
    fid: z.number().positive(),
    cls: z.number().positive(),
  }),
});

const SecurityConfigSchema = z.object({
  csp: z.object({
    enabled: z.boolean(),
    reportOnly: z.boolean(),
    directives: z.record(z.string(), z.array(z.string())),
  }),
  sanitization: z.object({
    enabled: z.boolean(),
    allowedTags: z.array(z.string()),
    allowedAttributes: z.array(z.string()),
  }),
  urlValidation: z.object({
    allowedProtocols: z.array(z.string()),
    blockedDomains: z.array(z.string()),
  }),
});

const LoggingConfigSchema = z.object({
  level: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR']),
  transports: z.array(z.object({
    type: z.enum(['console', 'remote', 'localStorage']),
    enabled: z.boolean(),
    config: z.record(z.string(), z.any()),
  })),
  context: z.object({
    includeUserInfo: z.boolean(),
    includeSessionInfo: z.boolean(),
    includeComponentInfo: z.boolean(),
  }),
});

const FeatureFlagsSchema = z.object({
  enhancedErrorHandling: z.boolean(),
  advancedPerformanceMonitoring: z.boolean(),
  offlineSupport: z.boolean(),
  pushNotifications: z.boolean(),
  analytics: z.boolean(),
  experimentalFeatures: z.boolean(),
  debugMode: z.boolean(),
  betaFeatures: z.boolean(),
});

const AppConfigurationSchema = z.object({
  environment: z.enum(['development', 'staging', 'production']),
  api: ApiConfigSchema,
  cache: CacheConfigSchema,
  performance: PerformanceConfigSchema,
  security: SecurityConfigSchema,
  logging: LoggingConfigSchema,
  features: FeatureFlagsSchema,
  version: z.string(),
  buildTimestamp: z.number(),
});

// Type definitions
export type ApiConfig = z.infer<typeof ApiConfigSchema>;
export type CacheConfig = z.infer<typeof CacheConfigSchema>;
export type PerformanceConfig = z.infer<typeof PerformanceConfigSchema>;
export type SecurityConfig = z.infer<typeof SecurityConfigSchema>;
export type LoggingConfig = z.infer<typeof LoggingConfigSchema>;
export type FeatureFlags = z.infer<typeof FeatureFlagsSchema>;
export type AppConfiguration = z.infer<typeof AppConfigurationSchema>;

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Configuration Manager class
export class ConfigurationManager {
  private config: AppConfiguration;
  private environment: Environment;
  private listeners: Map<string, ((value: any) => void)[]> = new Map();

  constructor() {
    this.environment = this.detectEnvironment();
    this.config = this.loadConfiguration();
    this.validateConfiguration();
  }

  /**
   * Detect the current environment
   */
  private detectEnvironment(): Environment {
    // Check Vite environment variables
    if (import.meta.env.MODE === 'production') return 'production';
    if (import.meta.env.MODE === 'staging') return 'staging';
    if (import.meta.env.MODE === 'development') return 'development';

    // Check NODE_ENV as fallback
    if (import.meta.env.NODE_ENV === 'production') return 'production';
    if (import.meta.env.NODE_ENV === 'development') return 'development';

    // Default to development for safety in tests
    return 'development';
  }

  /**
   * Load configuration based on environment
   */
  private loadConfiguration(): AppConfiguration {
    const baseConfig = this.getBaseConfiguration();
    const envConfig = this.getEnvironmentConfiguration(this.environment);

    // Merge configurations with environment overrides
    return this.mergeConfigurations(baseConfig, envConfig);
  }

  /**
   * Get base configuration that applies to all environments
   */
  private getBaseConfiguration(): AppConfiguration {
    return {
      environment: this.environment,
      version: import.meta.env.PACKAGE_VERSION || '1.0.0',
      buildTimestamp: Date.now(),
      api: {
        baseUrl: 'https://api.rss2json.com/v1/api.json',
        timeout: 10000,
        retryAttempts: 3,
        rateLimit: {
          requests: 100,
          windowMs: 60000,
        },
      },
      cache: {
        duration: 15 * 60 * 1000, // 15 minutes
        maxSize: 50 * 1024 * 1024, // 50MB
        strategy: 'lru',
        compression: true,
      },
      performance: {
        monitoring: true,
        webVitals: true,
        componentTiming: true,
        networkTracking: true,
        memoryTracking: true,
        thresholds: {
          fcp: 1800, // First Contentful Paint
          lcp: 2500, // Largest Contentful Paint
          fid: 100,  // First Input Delay
          cls: 0.1,  // Cumulative Layout Shift
        },
      },
      security: {
        csp: {
          enabled: true,
          reportOnly: false,
          directives: {
            'default-src': ["'self'"],
            'script-src': ["'self'", "'unsafe-inline'"],
            'style-src': ["'self'", "'unsafe-inline'"],
            'img-src': ["'self'", 'data:', 'https:'],
            'connect-src': [
              "'self'",
              'https://api.rss2json.com',
              'https://api.open-meteo.com',
            ],
          },
        },
        sanitization: {
          enabled: true,
          allowedTags: ['p', 'br', 'strong', 'em', 'a', 'img'],
          allowedAttributes: ['href', 'src', 'alt', 'title'],
        },
        urlValidation: {
          allowedProtocols: ['http:', 'https:'],
          blockedDomains: [],
        },
      },
      logging: {
        level: 'INFO',
        transports: [
          {
            type: 'console',
            enabled: true,
            config: {},
          },
        ],
        context: {
          includeUserInfo: false,
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
        experimentalFeatures: false,
        debugMode: false,
        betaFeatures: false,
      },
    };
  }

  /**
   * Get environment-specific configuration
   */
  private getEnvironmentConfiguration(env: Environment): Partial<AppConfiguration> {
    switch (env) {
      case 'development':
        return {
          logging: {
            level: 'DEBUG',
            transports: [
              {
                type: 'console',
                enabled: true,
                config: { colorize: true },
              },
            ],
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
          security: {
            csp: {
              enabled: true,
              reportOnly: true,
              directives: {
                'default-src': ["'self'"],
                'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                'style-src': ["'self'", "'unsafe-inline'"],
              },
            },
            sanitization: {
              enabled: true,
              allowedTags: ['p', 'br', 'strong', 'em', 'a', 'img', 'div', 'span'],
              allowedAttributes: ['href', 'src', 'alt', 'title', 'class', 'id'],
            },
            urlValidation: {
              allowedProtocols: ['http:', 'https:', 'file:'],
              blockedDomains: [],
            },
          },
        };

      case 'staging':
        return {
          logging: {
            level: 'INFO',
            transports: [
              {
                type: 'console',
                enabled: true,
                config: {},
              },
              {
                type: 'remote',
                enabled: true,
                config: {
                  endpoint: '/api/logs',
                  batchSize: 10,
                },
              },
            ],
            context: {
              includeUserInfo: false,
              includeSessionInfo: true,
              includeComponentInfo: true,
            },
          },
          features: {
            enhancedErrorHandling: true,
            advancedPerformanceMonitoring: true,
            offlineSupport: true,
            pushNotifications: true,
            analytics: true,
            experimentalFeatures: false,
            debugMode: false,
            betaFeatures: true,
          },
        };

      case 'production':
        return {
          logging: {
            level: 'WARN',
            transports: [
              {
                type: 'remote',
                enabled: true,
                config: {
                  endpoint: '/api/logs',
                  batchSize: 50,
                },
              },
            ],
            context: {
              includeUserInfo: false,
              includeSessionInfo: false,
              includeComponentInfo: false,
            },
          },
          features: {
            enhancedErrorHandling: true,
            advancedPerformanceMonitoring: false,
            offlineSupport: true,
            pushNotifications: true,
            analytics: true,
            experimentalFeatures: false,
            debugMode: false,
            betaFeatures: false,
          },
          performance: {
            monitoring: false,
            webVitals: true,
            componentTiming: false,
            networkTracking: false,
            memoryTracking: false,
            thresholds: {
              fcp: 1500,
              lcp: 2000,
              fid: 100,
              cls: 0.1,
            },
          },
        };

      default:
        return {};
    }
  }

  /**
   * Merge base configuration with environment-specific overrides
   */
  private mergeConfigurations(
    base: AppConfiguration,
    override: Partial<AppConfiguration>
  ): AppConfiguration {
    return {
      ...base,
      ...override,
      api: { ...base.api, ...override.api },
      cache: { ...base.cache, ...override.cache },
      performance: { ...base.performance, ...override.performance },
      security: {
        ...base.security,
        ...override.security,
        csp: { ...base.security.csp, ...override.security?.csp },
        sanitization: { ...base.security.sanitization, ...override.security?.sanitization },
        urlValidation: { ...base.security.urlValidation, ...override.security?.urlValidation },
      },
      logging: {
        ...base.logging,
        ...override.logging,
        context: { ...base.logging.context, ...override.logging?.context },
      },
      features: { ...base.features, ...override.features },
    };
  }

  /**
   * Validate the current configuration
   */
  private validateConfiguration(): ValidationResult {
    try {
      AppConfigurationSchema.parse(this.config);
      return {
        isValid: true,
        errors: [],
        warnings: [],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`),
          warnings: [],
        };
      }
      return {
        isValid: false,
        errors: ['Unknown validation error'],
        warnings: [],
      };
    }
  }

  /**
   * Get configuration value by key path
   */
  public get<T>(keyPath: string, defaultValue?: T): T {
    const keys = keyPath.split('.');
    let value: any = this.config;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue as T;
      }
    }

    return value as T;
  }

  /**
   * Set configuration value by key path
   */
  public set(keyPath: string, value: any): void {
    const keys = keyPath.split('.');
    const lastKey = keys.pop()!;
    let target: any = this.config;

    for (const key of keys) {
      if (!(key in target) || typeof target[key] !== 'object') {
        target[key] = {};
      }
      target = target[key];
    }

    target[lastKey] = value;

    // Notify listeners
    this.notifyListeners(keyPath, value);

    // Re-validate configuration
    const validation = this.validateConfiguration();
    if (!validation.isValid) {
      console.warn('Configuration validation failed after update:', validation.errors);
    }
  }

  /**
   * Get current environment
   */
  public getEnvironment(): Environment {
    return this.environment;
  }

  /**
   * Get feature flag value
   */
  public isFeatureEnabled(feature: keyof FeatureFlags): boolean {
    return this.config.features[feature];
  }

  /**
   * Toggle feature flag
   */
  public toggleFeature(feature: keyof FeatureFlags): void {
    this.config.features[feature] = !this.config.features[feature];
    this.notifyListeners(`features.${feature}`, this.config.features[feature]);
  }

  /**
   * Get full configuration
   */
  public getConfig(): AppConfiguration {
    return { ...this.config };
  }

  /**
   * Validate current configuration
   */
  public validateConfig(): ValidationResult {
    return this.validateConfiguration();
  }

  /**
   * Subscribe to configuration changes
   */
  public subscribe(keyPath: string, callback: (value: any) => void): () => void {
    if (!this.listeners.has(keyPath)) {
      this.listeners.set(keyPath, []);
    }
    this.listeners.get(keyPath)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(keyPath);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Notify listeners of configuration changes
   */
  private notifyListeners(keyPath: string, value: any): void {
    const callbacks = this.listeners.get(keyPath);
    if (callbacks) {
      callbacks.forEach(callback => callback(value));
    }
  }

  /**
   * Hot reload configuration (for development)
   */
  public hotReload(): void {
    if (this.environment === 'development') {
      this.config = this.loadConfiguration();
      console.log('Configuration hot reloaded');
    }
  }

  /**
   * Export configuration for debugging
   */
  public exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration from JSON
   */
  public importConfig(configJson: string): ValidationResult {
    try {
      const importedConfig = JSON.parse(configJson);
      const validation = AppConfigurationSchema.safeParse(importedConfig);

      if (validation.success) {
        this.config = validation.data;
        return {
          isValid: true,
          errors: [],
          warnings: [],
        };
      } else {
        return {
          isValid: false,
          errors: validation.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`),
          warnings: [],
        };
      }
    } catch (error) {
      return {
        isValid: false,
        errors: ['Invalid JSON format'],
        warnings: [],
      };
    }
  }
}

// Singleton instance
export const configManager = new ConfigurationManager();

// Export default instance
export default configManager;

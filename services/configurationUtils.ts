/**
 * Configuration Utilities
 *
 * Utility functions for configuration loading, validation, and management
 */

import type { AppConfiguration, Environment, ValidationResult } from './configurationManager';

/**
 * Configuration loader for different environments
 */
export class ConfigurationLoader {
  /**
   * Load configuration from environment variables
   */
  static loadFromEnvironment(): Partial<AppConfiguration> {
    const config: Partial<AppConfiguration> = {};

    // API Configuration
    if (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_TIMEOUT) {
      config.api = {
        baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.rss2json.com/v1/api.json',
        timeout: import.meta.env.VITE_API_TIMEOUT ? parseInt(import.meta.env.VITE_API_TIMEOUT, 10) : 10000,
        retryAttempts: 3,
        rateLimit: {
          requests: 100,
          windowMs: 60000,
        },
      };
    }

    // Cache Configuration
    if (import.meta.env.VITE_CACHE_DURATION) {
      config.cache = {
        duration: parseInt(import.meta.env.VITE_CACHE_DURATION, 10),
        maxSize: 50 * 1024 * 1024,
        strategy: 'lru' as const,
        compression: true,
      };
    }

    // Feature Flags
    const featureFlags: Partial<AppConfiguration['features']> = {};

    if (import.meta.env.VITE_FEATURE_ENHANCED_ERROR_HANDLING !== undefined) {
      featureFlags.enhancedErrorHandling = import.meta.env.VITE_FEATURE_ENHANCED_ERROR_HANDLING === 'true';
    }

    if (import.meta.env.VITE_FEATURE_PERFORMANCE_MONITORING !== undefined) {
      featureFlags.advancedPerformanceMonitoring = import.meta.env.VITE_FEATURE_PERFORMANCE_MONITORING === 'true';
    }

    if (import.meta.env.VITE_FEATURE_OFFLINE_SUPPORT !== undefined) {
      featureFlags.offlineSupport = import.meta.env.VITE_FEATURE_OFFLINE_SUPPORT === 'true';
    }

    if (import.meta.env.VITE_FEATURE_PUSH_NOTIFICATIONS !== undefined) {
      featureFlags.pushNotifications = import.meta.env.VITE_FEATURE_PUSH_NOTIFICATIONS === 'true';
    }

    if (import.meta.env.VITE_FEATURE_ANALYTICS !== undefined) {
      featureFlags.analytics = import.meta.env.VITE_FEATURE_ANALYTICS === 'true';
    }

    if (import.meta.env.VITE_FEATURE_DEBUG_MODE !== undefined) {
      featureFlags.debugMode = import.meta.env.VITE_FEATURE_DEBUG_MODE === 'true';
    }

    if (Object.keys(featureFlags).length > 0) {
      config.features = {
        enhancedErrorHandling: true,
        advancedPerformanceMonitoring: true,
        offlineSupport: true,
        pushNotifications: false,
        analytics: false,
        experimentalFeatures: false,
        debugMode: false,
        betaFeatures: false,
        ...featureFlags,
      };
    }

    // Logging Configuration
    if (import.meta.env.VITE_LOG_LEVEL) {
      config.logging = {
        level: import.meta.env.VITE_LOG_LEVEL as 'DEBUG' | 'INFO' | 'WARN' | 'ERROR',
        transports: [
          {
            type: 'console' as const,
            enabled: true,
            config: {},
          },
        ],
        context: {
          includeUserInfo: false,
          includeSessionInfo: true,
          includeComponentInfo: true,
        },
      };
    }

    return config;
  }

  /**
   * Load configuration from localStorage
   */
  static loadFromLocalStorage(): Partial<AppConfiguration> {
    try {
      const stored = localStorage.getItem('app-configuration');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load configuration from localStorage:', error);
    }
    return {};
  }

  /**
   * Save configuration to localStorage
   */
  static saveToLocalStorage(config: Partial<AppConfiguration>): void {
    try {
      localStorage.setItem('app-configuration', JSON.stringify(config));
    } catch (error) {
      console.warn('Failed to save configuration to localStorage:', error);
    }
  }

  /**
   * Load configuration from URL parameters
   */
  static loadFromUrlParams(): Partial<AppConfiguration> {
    const params = new URLSearchParams(window.location.search);
    const config: Partial<AppConfiguration> = {};

    // Feature flags from URL
    const featureFlags: Partial<AppConfiguration['features']> = {};

    if (params.has('debug')) {
      featureFlags.debugMode = params.get('debug') === 'true';
    }

    if (params.has('experimental')) {
      featureFlags.experimentalFeatures = params.get('experimental') === 'true';
    }

    if (params.has('beta')) {
      featureFlags.betaFeatures = params.get('beta') === 'true';
    }

    if (Object.keys(featureFlags).length > 0) {
      config.features = {
        enhancedErrorHandling: true,
        advancedPerformanceMonitoring: true,
        offlineSupport: true,
        pushNotifications: false,
        analytics: false,
        experimentalFeatures: false,
        debugMode: false,
        betaFeatures: false,
        ...featureFlags,
      };
    }

    return config;
  }
}

/**
 * Configuration validator
 */
export class ConfigurationValidator {
  /**
   * Validate API configuration
   */
  static validateApiConfig(config: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.baseUrl) {
      errors.push('API base URL is required');
    } else if (!this.isValidUrl(config.baseUrl)) {
      errors.push('API base URL must be a valid URL');
    }

    if (config.timeout && (config.timeout < 1000 || config.timeout > 60000)) {
      warnings.push('API timeout should be between 1000ms and 60000ms');
    }

    if (config.retryAttempts && (config.retryAttempts < 0 || config.retryAttempts > 10)) {
      warnings.push('Retry attempts should be between 0 and 10');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate cache configuration
   */
  static validateCacheConfig(config: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (config.duration && config.duration < 60000) {
      warnings.push('Cache duration less than 1 minute may cause excessive network requests');
    }

    if (config.maxSize && config.maxSize > 100 * 1024 * 1024) {
      warnings.push('Cache size over 100MB may impact performance');
    }

    if (config.strategy && !['lru', 'fifo', 'ttl'].includes(config.strategy)) {
      errors.push('Cache strategy must be one of: lru, fifo, ttl');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate performance configuration
   */
  static validatePerformanceConfig(config: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (config.thresholds) {
      const { fcp, lcp, fid, cls } = config.thresholds;

      if (fcp && fcp > 3000) {
        warnings.push('FCP threshold over 3000ms may be too lenient');
      }

      if (lcp && lcp > 4000) {
        warnings.push('LCP threshold over 4000ms may be too lenient');
      }

      if (fid && fid > 300) {
        warnings.push('FID threshold over 300ms may be too lenient');
      }

      if (cls && cls > 0.25) {
        warnings.push('CLS threshold over 0.25 may be too lenient');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate security configuration
   */
  static validateSecurityConfig(config: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (config.csp && config.csp.enabled) {
      if (!config.csp.directives || Object.keys(config.csp.directives).length === 0) {
        warnings.push('CSP is enabled but no directives are defined');
      }
    }

    if (config.urlValidation) {
      if (!config.urlValidation.allowedProtocols || config.urlValidation.allowedProtocols.length === 0) {
        errors.push('At least one allowed protocol must be specified');
      }

      const invalidProtocols = config.urlValidation.allowedProtocols?.filter(
        (protocol: string) => !['http:', 'https:', 'file:'].includes(protocol)
      );

      if (invalidProtocols && invalidProtocols.length > 0) {
        warnings.push(`Potentially unsafe protocols detected: ${invalidProtocols.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Check if a string is a valid URL
   */
  private static isValidUrl(string: string): boolean {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Configuration merger utility
 */
export class ConfigurationMerger {
  /**
   * Deep merge configuration objects
   */
  static merge<T extends Record<string, any>>(target: T, ...sources: Partial<T>[]): T {
    if (!sources.length) return target;
    const source = sources.shift();

    if (this.isObject(target) && this.isObject(source)) {
      for (const key in source) {
        if (this.isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          this.merge(target[key], source[key] as Partial<T[Extract<keyof T, string>]>);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }

    return this.merge(target, ...sources);
  }

  /**
   * Check if value is an object
   */
  private static isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
  }
}

/**
 * Environment detection utilities
 */
export class EnvironmentDetector {
  /**
   * Detect environment from various sources
   */
  static detect(): Environment {
    // Check Vite mode first
    if (import.meta.env.MODE === 'production') return 'production';
    if (import.meta.env.MODE === 'staging') return 'staging';
    if (import.meta.env.MODE === 'development') return 'development';

    // Check NODE_ENV as fallback
    if (import.meta.env.NODE_ENV === 'production') return 'production';
    if (import.meta.env.NODE_ENV === 'development') return 'development';

    // Check hostname patterns
    const hostname = window.location?.hostname;
    if (hostname && (hostname.includes('staging') || hostname.includes('test'))) {
      return 'staging';
    }

    if (hostname && (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.'))) {
      return 'development';
    }

    // Default to production for safety
    return 'production';
  }

  /**
   * Check if running in development
   */
  static isDevelopment(): boolean {
    return this.detect() === 'development';
  }

  /**
   * Check if running in staging
   */
  static isStaging(): boolean {
    return this.detect() === 'staging';
  }

  /**
   * Check if running in production
   */
  static isProduction(): boolean {
    return this.detect() === 'production';
  }
}

/**
 * Configuration debugging utilities
 */
export class ConfigurationDebugger {
  /**
   * Log configuration summary
   */
  static logSummary(config: AppConfiguration): void {
    if (config.features.debugMode) {
      console.group('🔧 Configuration Summary');
      console.log('Environment:', config.environment);
      console.log('Version:', config.version);
      console.log('Features:', config.features);
      console.log('Performance Monitoring:', config.performance.monitoring);
      console.log('Security CSP:', config.security.csp.enabled);
      console.log('Log Level:', config.logging.level);
      console.groupEnd();
    }
  }

  /**
   * Validate and log configuration issues
   */
  static validateAndLog(config: AppConfiguration): void {
    const apiValidation = ConfigurationValidator.validateApiConfig(config.api);
    const cacheValidation = ConfigurationValidator.validateCacheConfig(config.cache);
    const performanceValidation = ConfigurationValidator.validatePerformanceConfig(config.performance);
    const securityValidation = ConfigurationValidator.validateSecurityConfig(config.security);

    const allErrors = [
      ...apiValidation.errors,
      ...cacheValidation.errors,
      ...performanceValidation.errors,
      ...securityValidation.errors,
    ];

    const allWarnings = [
      ...apiValidation.warnings,
      ...cacheValidation.warnings,
      ...performanceValidation.warnings,
      ...securityValidation.warnings,
    ];

    if (allErrors.length > 0) {
      console.error('❌ Configuration Errors:', allErrors);
    }

    if (allWarnings.length > 0) {
      console.warn('⚠️ Configuration Warnings:', allWarnings);
    }

    if (allErrors.length === 0 && allWarnings.length === 0) {
      console.log('✅ Configuration validation passed');
    }
  }
}

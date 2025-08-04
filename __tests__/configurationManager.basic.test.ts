/**
 * Basic Configuration Manager Tests
 *
 * Basic tests to verify configuration system functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigurationManager } from '../services/configurationManager';

describe('ConfigurationManager - Basic Tests', () => {
  let configManager: ConfigurationManager;

  beforeEach(() => {
    configManager = new ConfigurationManager();
  });

  it('should create configuration manager instance', () => {
    expect(configManager).toBeDefined();
  });

  it('should have default environment', () => {
    const environment = configManager.getEnvironment();
    expect(['development', 'staging', 'production']).toContain(environment);
  });

  it('should get configuration values', () => {
    const config = configManager.getConfig();
    expect(config).toBeDefined();
    expect(config.environment).toBeDefined();
    expect(config.features).toBeDefined();
    expect(config.api).toBeDefined();
  });

  it('should get configuration by key path', () => {
    const environment = configManager.get('environment');
    expect(environment).toBeDefined();

    const timeout = configManager.get('api.timeout');
    expect(typeof timeout).toBe('number');
  });

  it('should set configuration values', () => {
    configManager.set('api.timeout', 15000);
    const timeout = configManager.get('api.timeout');
    expect(timeout).toBe(15000);
  });

  it('should check feature flags', () => {
    const isEnabled = configManager.isFeatureEnabled('enhancedErrorHandling');
    expect(typeof isEnabled).toBe('boolean');
  });

  it('should toggle feature flags', () => {
    const initialValue = configManager.isFeatureEnabled('analytics');
    configManager.toggleFeature('analytics');
    const newValue = configManager.isFeatureEnabled('analytics');
    expect(newValue).toBe(!initialValue);
  });

  it('should export configuration', () => {
    const exported = configManager.exportConfig();
    expect(typeof exported).toBe('string');
    expect(() => JSON.parse(exported)).not.toThrow();
  });

  it('should validate configuration', () => {
    const validation = configManager.validateConfig();
    expect(validation).toBeDefined();
    expect(typeof validation.isValid).toBe('boolean');
    expect(Array.isArray(validation.errors)).toBe(true);
    expect(Array.isArray(validation.warnings)).toBe(true);
  });
});

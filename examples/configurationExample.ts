/**
 * Configuration System Example
 *
 * This example demonstrates how to use the configuration management system
 * in the Personal News Dashboard application.
 */

import { configManager } from '../services/configurationManager';
// import { useConfiguration, useFeatureFlags, useEnvironment } from '../hooks/useConfiguration';

// Example 1: Basic Configuration Access
console.log('=== Basic Configuration Access ===');
console.log('Environment:', configManager.getEnvironment());
console.log('API Base URL:', configManager.get('api.baseUrl'));
console.log('Cache Duration:', configManager.get('cache.duration'));
console.log('Debug Mode:', configManager.isFeatureEnabled('debugMode'));

// Example 2: Feature Flag Usage
console.log('\n=== Feature Flag Management ===');
const features = [
  'enhancedErrorHandling',
  'advancedPerformanceMonitoring',
  'offlineSupport',
  'pushNotifications',
  'analytics',
  'debugMode'
] as const;

features.forEach(feature => {
  console.log(`${feature}: ${configManager.isFeatureEnabled(feature)}`);
});

// Example 3: Configuration Updates
console.log('\n=== Configuration Updates ===');
console.log('Original API timeout:', configManager.get('api.timeout'));
configManager.set('api.timeout', 20000);
console.log('Updated API timeout:', configManager.get('api.timeout'));

// Example 4: Environment-Specific Behavior
console.log('\n=== Environment-Specific Configuration ===');
const environment = configManager.getEnvironment();
switch (environment) {
  case 'development':
    console.log('Development mode: Enhanced logging and debugging enabled');
    console.log('Log level:', configManager.get('logging.level'));
    console.log('Performance monitoring:', configManager.get('performance.monitoring'));
    break;
  case 'staging':
    console.log('Staging mode: Testing features enabled');
    console.log('Beta features:', configManager.isFeatureEnabled('betaFeatures'));
    break;
  case 'production':
    console.log('Production mode: Optimized for performance');
    console.log('Analytics enabled:', configManager.isFeatureEnabled('analytics'));
    break;
}

// Example 5: Configuration Validation
console.log('\n=== Configuration Validation ===');
const validation = configManager.validateConfig();
console.log('Configuration is valid:', validation.isValid);
if (validation.errors.length > 0) {
  console.log('Errors:', validation.errors);
}
if (validation.warnings.length > 0) {
  console.log('Warnings:', validation.warnings);
}

// Example 6: Configuration Export/Import
console.log('\n=== Configuration Export/Import ===');
const exportedConfig = configManager.exportConfig();
console.log('Configuration exported successfully');

// Simulate importing configuration
const importResult = configManager.importConfig(exportedConfig);
console.log('Import result:', importResult.isValid ? 'Success' : 'Failed');

// Example 7: React Hook Usage (pseudo-code for demonstration)
console.log('\n=== React Hook Usage Examples ===');

// This would be used in a React component:
/*
function MyComponent() {
  const { config, isFeatureEnabled, toggleFeature } = useConfiguration();
  const { features } = useFeatureFlags();
  const { environment, isDevelopment } = useEnvironment();

  return (
    <div>
      <h1>Environment: {environment}</h1>
      {isDevelopment && <div>Debug Panel</div>}
      {isFeatureEnabled('analytics') && <AnalyticsComponent />}
      <button onClick={() => toggleFeature('debugMode')}>
        Toggle Debug Mode
      </button>
    </div>
  );
}
*/

console.log('React hooks provide easy access to configuration in components');

// Example 8: Configuration Subscription
console.log('\n=== Configuration Subscription ===');
const unsubscribe = configManager.subscribe('features.debugMode', (value) => {
  console.log('Debug mode changed to:', value);
});

// Toggle debug mode to trigger subscription
configManager.toggleFeature('debugMode');
configManager.toggleFeature('debugMode');

// Clean up subscription
unsubscribe();

// Example 9: Performance Configuration
console.log('\n=== Performance Configuration ===');
const performanceConfig = configManager.get('performance') as any;
console.log('Performance monitoring enabled:', performanceConfig.monitoring);
console.log('Web Vitals tracking:', performanceConfig.webVitals);
console.log('Performance thresholds:', performanceConfig.thresholds);

// Example 10: Security Configuration
console.log('\n=== Security Configuration ===');
const securityConfig = configManager.get('security') as any;
console.log('CSP enabled:', securityConfig.csp.enabled);
console.log('Content sanitization:', securityConfig.sanitization.enabled);
console.log('Allowed protocols:', securityConfig.urlValidation.allowedProtocols);

console.log('\n=== Configuration System Demo Complete ===');

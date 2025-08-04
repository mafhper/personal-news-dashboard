/**
 * App Integration Example
 *
 * This example shows how to integrate the configuration system
 * into the existing App.tsx component.
 */

import React, { useEffect } from "react";
import {
  useConfiguration,
  useFeatureFlags,
  useEnvironment,
} from "../hooks/useConfiguration";

// Example of how to modify the existing App component to use configuration
export const AppWithConfiguration: React.FC = () => {
  const { get, isFeatureEnabled } = useConfiguration();
  const { environment, isDevelopment } = useEnvironment();
  const { features } = useFeatureFlags();

  // Log configuration summary in development
  useEffect(() => {
    if (isDevelopment && isFeatureEnabled("debugMode")) {
      console.group("🔧 Application Configuration");
      console.log("Environment:", environment);
      console.log("API Base URL:", get("api.baseUrl"));
      console.log("Cache Duration:", get("cache.duration"));
      console.log("Features:", features);
      console.groupEnd();
    }
  }, [environment, isDevelopment, isFeatureEnabled, get, features]);

  // Example: Conditional rendering based on feature flags
  const renderPerformanceDebugger = () => {
    if (isFeatureEnabled("advancedPerformanceMonitoring") && isDevelopment) {
      // This would be the actual PerformanceDebugger component
      return <div>Performance Debugger Active</div>;
    }
    return null;
  };

  // Example: Environment-specific behavior
  const getCacheStrategy = () => {
    const cacheConfig = get("cache") as any;
    return {
      duration: cacheConfig.duration,
      strategy: cacheConfig.strategy,
      maxSize: cacheConfig.maxSize,
    };
  };

  // Example: API configuration for RSS fetching
  const getApiConfig = () => {
    const apiConfig = get("api") as any;
    return {
      baseUrl: apiConfig.baseUrl,
      timeout: apiConfig.timeout,
      retryAttempts: apiConfig.retryAttempts,
    };
  };

  // Example: Security configuration
  const getSecurityConfig = () => {
    const securityConfig = get("security") as any;
    return {
      sanitizationEnabled: securityConfig.sanitization.enabled,
      allowedProtocols: securityConfig.urlValidation.allowedProtocols,
      cspEnabled: securityConfig.csp.enabled,
    };
  };

  return (
    <div className="app-with-configuration">
      <h1>Personal News Dashboard</h1>
      <p>Environment: {environment}</p>

      {/* Conditional features based on configuration */}
      {isFeatureEnabled("enhancedErrorHandling") && (
        <div>Enhanced Error Handling Active</div>
      )}

      {isFeatureEnabled("offlineSupport") && <div>Offline Support Enabled</div>}

      {isFeatureEnabled("analytics") && <div>Analytics Tracking Active</div>}

      {/* Development-only features */}
      {isDevelopment && (
        <div>
          <h3>Development Tools</h3>
          {renderPerformanceDebugger()}
          {isFeatureEnabled("debugMode") && <div>Debug Mode Active</div>}
        </div>
      )}

      {/* Configuration display for demonstration */}
      <details>
        <summary>Configuration Details</summary>
        <pre>Cache Strategy: {JSON.stringify(getCacheStrategy(), null, 2)}</pre>
        <pre>API Config: {JSON.stringify(getApiConfig(), null, 2)}</pre>
        <pre>
          Security Config: {JSON.stringify(getSecurityConfig(), null, 2)}
        </pre>
      </details>
    </div>
  );
};

// Example of a component that uses configuration for conditional rendering
export const ConditionalFeatureComponent: React.FC = () => {
  const { isFeatureEnabled } = useConfiguration();

  if (!isFeatureEnabled("experimentalFeatures")) {
    return null;
  }

  return (
    <div className="experimental-feature">
      <h3>Experimental Feature</h3>
      <p>This component only renders when experimental features are enabled.</p>
    </div>
  );
};

// Example of a component that adapts based on environment
export const EnvironmentAwareComponent: React.FC = () => {
  const { environment, isDevelopment, isProduction } = useEnvironment();
  const { get } = useConfiguration();

  const logLevel = get("logging.level") as string;
  const performanceMonitoring = get("performance.monitoring") as boolean;

  return (
    <div className="environment-aware">
      <h3>Environment: {environment}</h3>

      {isDevelopment && (
        <div className="dev-info">
          <p>Log Level: {logLevel}</p>
          <p>
            Performance Monitoring:{" "}
            {performanceMonitoring ? "Enabled" : "Disabled"}
          </p>
        </div>
      )}

      {isProduction && (
        <div className="prod-info">
          <p>Production optimizations active</p>
        </div>
      )}
    </div>
  );
};

// Example of how to use configuration in service functions
import { configManager } from "../services/configurationManager";

export const configuredRssParser = {
  async fetchFeed(url: string) {
    const apiConfig = configManager.get("api") as any;
    const securityConfig = configManager.get("security") as any;

    // Validate URL against security configuration
    const isValidProtocol = securityConfig.urlValidation.allowedProtocols.some(
      (protocol: string) => url.startsWith(protocol)
    );

    if (!isValidProtocol) {
      throw new Error("URL protocol not allowed by security configuration");
    }

    // Use configured timeout and retry settings
    const fetchOptions = {
      timeout: apiConfig.timeout,
      // ... other options
    };

    // This would be the actual fetch implementation
    console.log("Fetching with config:", { url, options: fetchOptions });

    return { articles: [], title: "Example Feed" };
  },
};

export default AppWithConfiguration;

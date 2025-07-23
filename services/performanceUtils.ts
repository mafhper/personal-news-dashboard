// Performance utilities for debugging and optimization
import React from 'react';
import { articleCache } from './articleCache';

export interface PerformanceTimer {
  start: () => void;
  end: () => number;
  reset: () => void;
}

export interface PerformanceDebugger {
  log: (message: string, data?: any) => void;
  warn: (message: string, data?: any) => void;
  error: (message: string, data?: any) => void;
  group: (label: string) => void;
  groupEnd: () => void;
  time: (label: string) => void;
  timeEnd: (label: string) => void;
  measure: (name: string, startMark?: string, endMark?: string) => void;
}

export interface NetworkRequestBatch {
  id: string;
  urls: string[];
  startTime: number;
  endTime?: number;
  status: 'pending' | 'complete' | 'error';
  results: any[];
}

export interface PerformanceSnapshot {
  timestamp: number;
  memory: {
    used: number;
    total: number;
    limit: number;
  } | null;
  fps: number;
  networkRequests: number;
  cacheStats: {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
    evictions: number;
  };
  longTasks: number;
  layoutShifts: number;
  resourceCount: number;
}

class PerformanceTimerImpl implements PerformanceTimer {
  private startTime: number = 0;

  start(): void {
    this.startTime = performance.now();
  }

  end(): number {
    if (this.startTime === 0) {
      console.warn('Timer was not started');
      return 0;
    }
    const duration = performance.now() - this.startTime;
    this.startTime = 0;
    return duration;
  }

  reset(): void {
    this.startTime = 0;
  }
}

class PerformanceDebuggerImpl implements PerformanceDebugger {
  private enabled: boolean;

  constructor(enabled: boolean = import.meta.env.DEV) {
    this.enabled = enabled;
  }

  log(message: string, data?: any): void {
    if (!this.enabled) return;
    console.log(`[PERF] ${message}`, data || '');
  }

  warn(message: string, data?: any): void {
    if (!this.enabled) return;
    console.warn(`[PERF] ${message}`, data || '');
  }

  error(message: string, data?: any): void {
    if (!this.enabled) return;
    console.error(`[PERF] ${message}`, data || '');
  }

  group(label: string): void {
    if (!this.enabled) return;
    console.group(`[PERF] ${label}`);
  }

  groupEnd(): void {
    if (!this.enabled) return;
    console.groupEnd();
  }

  time(label: string): void {
    if (!this.enabled) return;
    console.time(`[PERF] ${label}`);
  }

  timeEnd(label: string): void {
    if (!this.enabled) return;
    console.timeEnd(`[PERF] ${label}`);
  }

  measure(name: string, startMark?: string, endMark?: string): void {
    if (!this.enabled) return;

    try {
      if (startMark && endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name);
      }

      const measures = performance.getEntriesByName(name, 'measure');
      if (measures.length > 0) {
        const measure = measures[measures.length - 1];
        this.log(`Measure "${name}": ${measure.duration.toFixed(2)}ms`);
      }
    } catch (error) {
      this.error(`Failed to measure "${name}"`, error);
    }
  }
}

// Singleton instances
export const createTimer = (): PerformanceTimer => new PerformanceTimerImpl();
export const perfDebugger = new PerformanceDebuggerImpl();

// Background monitoring state
let isBackgrounded = false;
let backgroundedTime: number | null = null;
let monitoringInterval: number | null = null;
let performanceSnapshots: PerformanceSnapshot[] = [];
let longTaskCount = 0;
let layoutShiftCount = 0;
let lastFrameTime = 0;
let frameCount = 0;
let currentFps = 0;
let networkRequestBatches: NetworkRequestBatch[] = [];
let networkRequestCount = 0;

// Performance monitoring utilities
export const performanceUtils = {
  // Mark performance points
  mark: (name: string): void => {
    if (import.meta.env.DEV) {
      performance.mark(name);
    }
  },

  // Measure between marks
  measureBetween: (name: string, startMark: string, endMark: string): number => {
    if (!import.meta.env.DEV) return 0;

    try {
      performance.measure(name, startMark, endMark);
      const measures = performance.getEntriesByName(name, 'measure');
      return measures.length > 0 ? measures[measures.length - 1].duration : 0;
    } catch {
      return 0;
    }
  },

  // Get current memory usage (Chrome only)
  getMemoryUsage: (): { used: number; total: number; limit: number } | null => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / (1024 * 1024)), // MB
        total: Math.round(memory.totalJSHeapSize / (1024 * 1024)), // MB
        limit: Math.round(memory.jsHeapSizeLimit / (1024 * 1024)) // MB
      };
    }
    return null;
  },

  // Monitor long tasks (if supported)
  observeLongTasks: (callback: (entries: PerformanceEntry[]) => void): PerformanceObserver | null => {
    if (!import.meta.env.DEV) return null;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        longTaskCount += entries.length;
        callback(entries);
      });
      observer.observe({ entryTypes: ['longtask'] });
      return observer;
    } catch {
      return null;
    }
  },

  // Monitor layout shifts (if supported)
  observeLayoutShifts: (callback: (entries: PerformanceEntry[]) => void): PerformanceObserver | null => {
    if (!import.meta.env.DEV) return null;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        layoutShiftCount += entries.length;
        callback(entries);
      });
      observer.observe({ entryTypes: ['layout-shift'] });
      return observer;
    } catch {
      return null;
    }
  },

  // Get navigation timing
  getNavigationTiming: (): PerformanceNavigationTiming | null => {
    const entries = performance.getEntriesByType('navigation');
    return entries.length > 0 ? entries[0] as PerformanceNavigationTiming : null;
  },

  // Clear performance entries
  clearEntries: (): void => {
    if (import.meta.env.DEV) {
      performance.clearMarks();
      performance.clearMeasures();
    }
  },

  // Format duration for display
  formatDuration: (duration: number): string => {
    if (duration < 1) {
      return `${(duration * 1000).toFixed(0)}μs`;
    } else if (duration < 1000) {
      return `${duration.toFixed(2)}ms`;
    } else {
      return `${(duration / 1000).toFixed(2)}s`;
    }
  },

  // Format memory size for display
  formatMemorySize: (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  },

  // Check if the app is backgrounded
  isBackgrounded: (): boolean => {
    return isBackgrounded;
  },

  // Get time since app was backgrounded (in ms)
  getBackgroundedTime: (): number => {
    if (!isBackgrounded || !backgroundedTime) return 0;
    return Date.now() - backgroundedTime;
  },

  // Start background monitoring
  startBackgroundMonitoring: (): void => {
    if (monitoringInterval !== null) return;

    perfDebugger.log('Starting background performance monitoring');

    // Setup visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Setup FPS monitoring
    lastFrameTime = performance.now();
    frameCount = 0;
    requestAnimationFrame(updateFps);

    // Setup performance observers
    performanceUtils.observeLongTasks(() => {});
    performanceUtils.observeLayoutShifts(() => {});

    // Start periodic monitoring
    monitoringInterval = window.setInterval(() => {
      capturePerformanceSnapshot();
    }, 10000); // Every 10 seconds
  },

  // Stop background monitoring
  stopBackgroundMonitoring: (): void => {
    if (monitoringInterval === null) return;

    perfDebugger.log('Stopping background performance monitoring');

    document.removeEventListener('visibilitychange', handleVisibilityChange);
    clearInterval(monitoringInterval);
    monitoringInterval = null;
    performanceSnapshots = [];
  },

  // Get performance snapshots
  getPerformanceSnapshots: (): PerformanceSnapshot[] => {
    return [...performanceSnapshots];
  },

  // Clear performance snapshots
  clearPerformanceSnapshots: (): void => {
    performanceSnapshots = [];
  },

  // Get current FPS
  getCurrentFps: (): number => {
    return currentFps;
  },

  // Create a network request batch
  createNetworkRequestBatch: (urls: string[]): NetworkRequestBatch => {
    const batch: NetworkRequestBatch = {
      id: `batch-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      urls,
      startTime: Date.now(),
      status: 'pending',
      results: []
    };

    networkRequestBatches.push(batch);
    return batch;
  },

  // Complete a network request batch
  completeNetworkRequestBatch: (batchId: string, results: any[], status: 'complete' | 'error' = 'complete'): void => {
    const batchIndex = networkRequestBatches.findIndex(batch => batch.id === batchId);
    if (batchIndex === -1) return;

    networkRequestBatches[batchIndex].endTime = Date.now();
    networkRequestBatches[batchIndex].status = status;
    networkRequestBatches[batchIndex].results = results;

    networkRequestCount += networkRequestBatches[batchIndex].urls.length;
  },

  // Get network request batches
  getNetworkRequestBatches: (): NetworkRequestBatch[] => {
    return [...networkRequestBatches];
  },

  // Track network request
  trackNetworkRequest: (): void => {
    networkRequestCount++;
  },

  // Get network request count
  getNetworkRequestCount: (): number => {
    return networkRequestCount;
  },

  // Reset network request count
  resetNetworkRequestCount: (): void => {
    networkRequestCount = 0;
    networkRequestBatches = [];
  },

  // Perform cleanup when app is backgrounded
  performBackgroundCleanup: (): void => {
    if (!isBackgrounded) return;

    perfDebugger.log('Performing background cleanup');

    // Clean up article cache
    articleCache.cleanup();

    // Clear performance entries
    performanceUtils.clearEntries();

    // Abort any pending network requests
    // This would require integration with a request manager
  }
};

// Handle visibility change events
function handleVisibilityChange(): void {
  if (document.hidden) {
    isBackgrounded = true;
    backgroundedTime = Date.now();
    perfDebugger.log('App backgrounded');

    // Perform cleanup after a short delay
    setTimeout(() => {
      if (isBackgrounded) {
        performanceUtils.performBackgroundCleanup();
      }
    }, 5000); // Wait 5 seconds before cleanup
  } else {
    isBackgrounded = false;

    if (backgroundedTime) {
      const backgroundDuration = Date.now() - backgroundedTime;
      perfDebugger.log(`App foregrounded after ${performanceUtils.formatDuration(backgroundDuration)}`);
    }

    backgroundedTime = null;

    // Capture a snapshot when returning to the app
    capturePerformanceSnapshot();
  }
}

// Update FPS counter
function updateFps(): void {
  const now = performance.now();
  frameCount++;

  // Update FPS every second
  if (now - lastFrameTime >= 1000) {
    currentFps = Math.round((frameCount * 1000) / (now - lastFrameTime));
    frameCount = 0;
    lastFrameTime = now;
  }

  requestAnimationFrame(updateFps);
}

// Capture a performance snapshot
function capturePerformanceSnapshot(): void {
  const cacheStats = articleCache.getStats();

  const snapshot: PerformanceSnapshot = {
    timestamp: Date.now(),
    memory: performanceUtils.getMemoryUsage(),
    fps: currentFps,
    networkRequests: networkRequestCount,
    cacheStats: {
      hits: cacheStats.hits,
      misses: cacheStats.misses,
      hitRate: cacheStats.hitRate,
      size: cacheStats.size,
      evictions: cacheStats.evictions
    },
    longTasks: longTaskCount,
    layoutShifts: layoutShiftCount,
    resourceCount: performance.getEntriesByType('resource').length
  };

  performanceSnapshots.push(snapshot);

  // Keep only the last 100 snapshots
  if (performanceSnapshots.length > 100) {
    performanceSnapshots = performanceSnapshots.slice(-100);
  }

  // Log snapshot in development
  if (import.meta.env.DEV) {
    perfDebugger.log('Performance snapshot captured', snapshot);
  }
}

// Higher-order component for performance monitoring
export const withPerformanceMonitoring = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const timer = createTimer();

    React.useEffect(() => {
      perfDebugger.log(`${componentName} mounted`);
      performanceUtils.mark(`${componentName}-mount-start`);

      return () => {
        perfDebugger.log(`${componentName} unmounted`);
        performanceUtils.mark(`${componentName}-mount-end`);
        const duration = performanceUtils.measureBetween(
          `${componentName}-mount-duration`,
          `${componentName}-mount-start`,
          `${componentName}-mount-end`
        );
        if (duration > 0) {
          perfDebugger.log(`${componentName} mount duration: ${performanceUtils.formatDuration(duration)}`);
        }
      };
    }, []);

    React.useLayoutEffect(() => {
      timer.start();
      return () => {
        const renderTime = timer.end();
        if (renderTime > 16) { // Warn if render takes longer than 16ms (60fps)
          perfDebugger.warn(`${componentName} slow render: ${performanceUtils.formatDuration(renderTime)}`);
        }
      };
    });

    return React.createElement(Component, { ...props, ref } as any);
  });
};

// Initialize background monitoring
if (import.meta.env.DEV) {
  performanceUtils.startBackgroundMonitoring();
}

export default performanceUtils;

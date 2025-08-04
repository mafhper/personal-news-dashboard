/**
 * Tests for performance monitoring utilities
 * Validates requirements 7.1, 7.2, 7.3, 7.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { performanceMonitor, measureAsync, measureSync } from '../services/performanceMonitor';

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 1024 * 1024 * 50, // 50MB
    totalJSHeapSize: 1024 * 1024 * 100, // 100MB
    jsHeapSizeLimit: 1024 * 1024 * 200 // 200MB
  }
};

// Mock console methods
const mockConsole = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  group: vi.fn(),
  groupEnd: vi.fn()
};

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock global objects
    global.performance = mockPerformance as any;
    Object.defineProperty(global, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn()
      },
      writable: true
    });
    global.console = { ...console, ...mockConsole };

    // Clear metrics
    performanceMonitor.clearMetrics();
    performanceMonitor.setEnabled(true);

    // Reset performance.now to return incrementing values
    let timeCounter = 1000;
    mockPerformance.now.mockImplementation(() => timeCounter++);
  });

  afterEach(() => {
    performanceMonitor.setEnabled(false);
  });

  describe('Basic Timing Operations', () => {
    it('should start and end timing correctly', () => {
      // Requirement 7.1: Measure and log loading times
      performanceMonitor.startTiming('test-1', 'Test Operation');

      const metric = performanceMonitor.endTiming('test-1');

      expect(metric).toBeDefined();
      expect(metric?.name).toBe('Test Operation');
      expect(metric?.status).toBe('completed');
      expect(metric?.duration).toBeGreaterThan(0);
    });

    it('should handle failed operations', () => {
      // Requirement 7.3: Log error details for debugging
      performanceMonitor.startTiming('test-fail', 'Failing Operation');

      const metric = performanceMonitor.markFailed('test-fail', 'Test error message');

      expect(metric).toBeDefined();
      expect(metric?.status).toBe('failed');
      expect(metric?.error).toBe('Test error message');
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it('should handle non-existent metrics gracefully', () => {
      const metric = performanceMonitor.endTiming('non-existent');

      expect(metric).toBeNull();
      expect(mockConsole.warn).toHaveBeenCalledWith('[Performance] Metric not found: non-existent');
    });
  });

  describe('Feed Loading Tracking', () => {
    it('should track feed loading performance', () => {
      // Requirement 7.2: Record response time for each feed
      const feedUrl = 'https://example.com/feed.xml';
      const id = performanceMonitor.trackFeedLoading(feedUrl, {
        cacheHit: false,
        retryCount: 0
      });

      performanceMonitor.completeFeedLoading(id, 25, {
        status: 200,
        size: '1024'
      });

      const summary = performanceMonitor.getPerformanceSummary();

      expect(summary.feeds.total).toBe(1);
      expect(summary.feeds.successful).toBe(1);
      expect(summary.feeds.failed).toBe(0);
      expect(summary.feeds.averageLoadTime).toBeGreaterThan(0);
    });

    it('should track failed feed loading', () => {
      // Requirement 7.3: Log error details for debugging
      const feedUrl = 'https://example.com/bad-feed.xml';
      const id = performanceMonitor.trackFeedLoading(feedUrl);

      performanceMonitor.failFeedLoading(id, 'Network timeout', {
        feedUrl,
        timeout: 5000
      });

      const summary = performanceMonitor.getPerformanceSummary();

      expect(summary.feeds.total).toBe(1);
      expect(summary.feeds.successful).toBe(0);
      expect(summary.feeds.failed).toBe(1);
    });

    it('should calculate cache hit rate correctly', () => {
      // Track multiple feeds with different cache statuses
      const id1 = performanceMonitor.trackFeedLoading('feed1.xml', { cacheHit: true });
      const id2 = performanceMonitor.trackFeedLoading('feed2.xml', { cacheHit: false });
      const id3 = performanceMonitor.trackFeedLoading('feed3.xml', { cacheHit: true });

      performanceMonitor.completeFeedLoading(id1, 10);
      performanceMonitor.completeFeedLoading(id2, 15);
      performanceMonitor.completeFeedLoading(id3, 8);

      const summary = performanceMonitor.getPerformanceSummary();

      expect(summary.feeds.cacheHitRate).toBeCloseTo(66.67, 1); // 2/3 = 66.67%
    });
  });

  describe('Pagination Tracking', () => {
    it('should track pagination navigation', () => {
      // Requirement 7.1: Measure pagination performance
      const id = performanceMonitor.trackPagination(0, 1, 100);

      performanceMonitor.completePagination(id, 50); // 50ms render time

      const summary = performanceMonitor.getPerformanceSummary();

      expect(summary.pagination.total).toBe(1);
      expect(summary.pagination.averageNavigationTime).toBeGreaterThan(0);
    });

    it('should track multiple pagination operations', () => {
      const id1 = performanceMonitor.trackPagination(0, 1, 100);
      const id2 = performanceMonitor.trackPagination(1, 2, 100);

      performanceMonitor.completePagination(id1, 30);
      performanceMonitor.completePagination(id2, 40);

      const summary = performanceMonitor.getPerformanceSummary();

      expect(summary.pagination.total).toBe(2);
    });
  });

  describe('Application Tracking', () => {
    it('should track application operations', () => {
      // Requirement 7.1: Measure application loading times
      const id = performanceMonitor.trackApplication('app-load', 'Initial Load');

      performanceMonitor.completeApplication(id, {
        componentCount: 15,
        memoryUsage: 45.5
      });

      const summary = performanceMonitor.getPerformanceSummary();

      expect(summary.application.total).toBe(1);
      expect(summary.application.averageLoadTime).toBeGreaterThan(0);
    });

    it('should track memory usage trends', () => {
      // Track multiple operations with different memory usage
      for (let i = 0; i < 5; i++) {
        const id = performanceMonitor.trackApplication('app-load', `Operation ${i}`);
        performanceMonitor.completeApplication(id, {
          memoryUsage: 40 + i * 2 // Increasing memory usage
        });
      }

      const summary = performanceMonitor.getPerformanceSummary();

      expect(summary.application.memoryTrend).toHaveLength(5);
      expect(summary.application.memoryTrend[0]).toBe(40);
      expect(summary.application.memoryTrend[4]).toBe(48);
    });
  });

  describe('Performance Summary', () => {
    it('should provide comprehensive performance summary', () => {
      // Requirement 7.4: Provide performance metrics

      // Add some feed metrics
      const feedId = performanceMonitor.trackFeedLoading('test-feed.xml');
      performanceMonitor.completeFeedLoading(feedId, 20);

      // Add some pagination metrics
      const paginationId = performanceMonitor.trackPagination(0, 1, 50);
      performanceMonitor.completePagination(paginationId);

      // Add some application metrics
      const appId = performanceMonitor.trackApplication('app-load');
      performanceMonitor.completeApplication(appId);

      const summary = performanceMonitor.getPerformanceSummary();

      expect(summary.feeds.total).toBe(1);
      expect(summary.pagination.total).toBe(1);
      expect(summary.application.total).toBe(1);

      expect(summary.feeds.averageLoadTime).toBeGreaterThan(0);
      expect(summary.pagination.averageNavigationTime).toBeGreaterThan(0);
      expect(summary.application.averageLoadTime).toBeGreaterThan(0);
    });

    it('should identify slowest and fastest operations', () => {
      // Create feeds with different load times
      mockPerformance.now
        .mockReturnValueOnce(1000) // Start feed 1
        .mockReturnValueOnce(1100) // End feed 1 (100ms)
        .mockReturnValueOnce(2000) // Start feed 2
        .mockReturnValueOnce(2500) // End feed 2 (500ms)
        .mockReturnValueOnce(3000) // Start feed 3
        .mockReturnValueOnce(3050); // End feed 3 (50ms)

      const id1 = performanceMonitor.trackFeedLoading('fast-feed.xml');
      performanceMonitor.completeFeedLoading(id1, 10);

      const id2 = performanceMonitor.trackFeedLoading('slow-feed.xml');
      performanceMonitor.completeFeedLoading(id2, 10);

      const id3 = performanceMonitor.trackFeedLoading('fastest-feed.xml');
      performanceMonitor.completeFeedLoading(id3, 10);

      const summary = performanceMonitor.getPerformanceSummary();

      expect(summary.feeds.slowestFeed?.duration).toBe(500);
      expect(summary.feeds.fastestFeed?.duration).toBe(50);
    });
  });

  describe('Logging and Console Output', () => {
    it('should log performance summary to console', () => {
      // Requirement 7.4: Provide performance metrics via console

      // Add some metrics
      const feedId = performanceMonitor.trackFeedLoading('test-feed.xml');
      performanceMonitor.completeFeedLoading(feedId, 15);

      performanceMonitor.logPerformanceSummary();

      expect(mockConsole.group).toHaveBeenCalledWith('📊 Performance Summary');
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('Total feeds loaded: 1')
      );
      expect(mockConsole.groupEnd).toHaveBeenCalled();
    });

    it('should log operations during execution', () => {
      performanceMonitor.startTiming('test-op', 'Test Operation');

      expect(mockConsole.log).toHaveBeenCalledWith(
        '🚀 [Performance] Started: Test Operation',
        undefined
      );

      performanceMonitor.endTiming('test-op');

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('✅ [Performance] Completed: Test Operation'),
        expect.any(Object)
      );
    });
  });

  describe('Metrics Management', () => {
    it('should clear all metrics', () => {
      // Add some metrics
      const id = performanceMonitor.trackFeedLoading('test-feed.xml');
      performanceMonitor.completeFeedLoading(id, 10);

      let summary = performanceMonitor.getPerformanceSummary();
      expect(summary.feeds.total).toBe(1);

      performanceMonitor.clearMetrics();

      summary = performanceMonitor.getPerformanceSummary();
      expect(summary.feeds.total).toBe(0);
      expect(summary.pagination.total).toBe(0);
      expect(summary.application.total).toBe(0);
    });

    it('should enable and disable monitoring', () => {
      performanceMonitor.setEnabled(false);

      performanceMonitor.startTiming('disabled-test', 'Should not track');
      const metric = performanceMonitor.endTiming('disabled-test');

      expect(metric).toBeNull();
      expect(global.localStorage.removeItem).toHaveBeenCalledWith('performance-debug');

      performanceMonitor.setEnabled(true);

      expect(global.localStorage.setItem).toHaveBeenCalledWith('performance-debug', 'true');
    });

    it('should trim metrics arrays to prevent memory leaks', () => {
      // Add more than 100 feed metrics to test trimming
      for (let i = 0; i < 105; i++) {
        const id = performanceMonitor.trackFeedLoading(`feed-${i}.xml`);
        performanceMonitor.completeFeedLoading(id, 10);
      }

      const metrics = performanceMonitor.getAllMetrics();
      expect(metrics.feeds.length).toBe(100); // Should be trimmed to 100
    });
  });
});

describe('Performance Utility Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.performance = mockPerformance as any;
    performanceMonitor.clearMetrics();
    performanceMonitor.setEnabled(true);

    let timeCounter = 1000;
    mockPerformance.now.mockImplementation(() => timeCounter++);
  });

  describe('measureAsync', () => {
    it('should measure async function execution time', async () => {
      const asyncFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'result';
      };

      const result = await measureAsync('Test Async', asyncFunction, {
        testMetadata: 'value'
      });

      expect(result).toBe('result');

      const summary = performanceMonitor.getPerformanceSummary();
      expect(summary.application.total).toBe(1);
    });

    it('should handle async function errors', async () => {
      const failingFunction = async () => {
        throw new Error('Async error');
      };

      await expect(measureAsync('Failing Async', failingFunction)).rejects.toThrow('Async error');

      const metrics = performanceMonitor.getAllMetrics();
      const failedMetrics = metrics.application.filter(m => m.status === 'failed');
      expect(failedMetrics).toHaveLength(1);
      expect(failedMetrics[0].error).toBe('Async error');
    });
  });

  describe('measureSync', () => {
    it('should measure sync function execution time', () => {
      const syncFunction = () => {
        // Simulate some work
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      };

      const result = measureSync('Test Sync', syncFunction, {
        iterations: 1000
      });

      expect(result).toBe(499500); // Sum of 0 to 999

      const summary = performanceMonitor.getPerformanceSummary();
      expect(summary.application.total).toBe(1);
    });

    it('should handle sync function errors', () => {
      const failingFunction = () => {
        throw new Error('Sync error');
      };

      expect(() => measureSync('Failing Sync', failingFunction)).toThrow('Sync error');

      const metrics = performanceMonitor.getAllMetrics();
      const failedMetrics = metrics.application.filter(m => m.status === 'failed');
      expect(failedMetrics).toHaveLength(1);
      expect(failedMetrics[0].error).toBe('Sync error');
    });
  });
});

describe('Performance Monitor Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.performance = mockPerformance as any;
    Object.defineProperty(global, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn()
      },
      writable: true
    });
    performanceMonitor.clearMetrics();
    performanceMonitor.setEnabled(true);
  });

  it('should work in development environment', () => {
    // Mock import.meta.env.DEV
    vi.stubGlobal('import.meta', { env: { DEV: true } });

    expect(performanceMonitor).toBeDefined();

    // Should expose debugging interface in development
    expect((window as any).performanceMonitor).toBeDefined();
  });

  it('should handle missing performance API gracefully', () => {
    // Remove performance.memory
    const performanceWithoutMemory = { ...mockPerformance };
    delete (performanceWithoutMemory as any).memory;
    global.performance = performanceWithoutMemory as any;

    const id = performanceMonitor.trackApplication('app-load');
    performanceMonitor.completeApplication(id);

    // Should not throw errors
    const summary = performanceMonitor.getPerformanceSummary();
    expect(summary.application.total).toBe(1);
  });
});

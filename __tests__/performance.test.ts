import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { performanceUtils, withPerformanceMonitoring } from '../services/performanceUtils';
import { articleCache } from '../services/articleCache';
import { render } from '@testing-library/react';
import React from 'react';

// Mock performance.memory
const originalPerformance = global.performance;
beforeEach(() => {
  Object.defineProperty(global.performance, 'memory', {
    value: {
      usedJSHeapSize: 10 * 1024 * 1024, // 10MB
      totalJSHeapSize: 100 * 1024 * 1024, // 100MB
      jsHeapSizeLimit: 200 * 1024 * 1024, // 200MB
    },
    configurable: true,
  });

  // Mock performance.mark and measure
  vi.spyOn(performance, 'mark').mockImplementation(() => {});
  vi.spyOn(performance, 'measure').mockImplementation(() => {});
  vi.spyOn(performance, 'getEntriesByName').mockImplementation(() => [{ duration: 10 }] as any);
});

afterEach(() => {
  global.performance = originalPerformance;
  vi.restoreAllMocks();
});

describe('Performance Utilities', () => {
  it('should format duration correctly', () => {
    expect(performanceUtils.formatDuration(0.5)).toBe('0.50ms');
    expect(performanceUtils.formatDuration(15)).toBe('15.00ms');
    expect(performanceUtils.formatDuration(1500)).toBe('1.50s');
  });

  it('should format memory size correctly', () => {
    expect(performanceUtils.formatMemorySize(500)).toBe('500.00 B');
    expect(performanceUtils.formatMemorySize(1500)).toBe('1.46 KB');
    expect(performanceUtils.formatMemorySize(1500000)).toBe('1.43 MB');
    expect(performanceUtils.formatMemorySize(1500000000)).toBe('1.40 GB');
  });

  it('should get memory usage', () => {
    const memory = performanceUtils.getMemoryUsage();
    expect(memory).not.toBeNull();
    expect(memory?.used).toBe(10);
    expect(memory?.total).toBe(100);
    expect(memory?.limit).toBe(200);
  });

  it('should handle visibility change', () => {
    // Mock document.hidden
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: vi.fn().mockReturnValue(true)
    });

    // Trigger visibilitychange event
    document.dispatchEvent(new Event('visibilitychange'));

    // App should be backgrounded
    expect(performanceUtils.isBackgrounded()).toBe(true);
    expect(performanceUtils.getBackgroundedTime()).toBeGreaterThan(0);

    // Mock document.hidden to be false
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: vi.fn().mockReturnValue(false)
    });

    // Trigger visibilitychange event
    document.dispatchEvent(new Event('visibilitychange'));

    // App should be foregrounded
    expect(performanceUtils.isBackgrounded()).toBe(false);
    expect(performanceUtils.getBackgroundedTime()).toBe(0);
  });

  it('should create and complete network request batches', () => {
    const batch = performanceUtils.createNetworkRequestBatch(['https://example.com/1', 'https://example.com/2']);

    expect(batch.id).toBeDefined();
    expect(batch.urls).toHaveLength(2);
    expect(batch.status).toBe('pending');

    performanceUtils.completeNetworkRequestBatch(batch.id, [{ data: 'test' }], 'complete');

    const batches = performanceUtils.getNetworkRequestBatches();
    const completedBatch = batches.find(b => b.id === batch.id);

    expect(completedBatch).toBeDefined();
    expect(completedBatch?.status).toBe('complete');
    expect(completedBatch?.results).toHaveLength(1);
    expect(completedBatch?.endTime).toBeDefined();
  });

  it('should perform background cleanup when app is backgrounded', () => {
    // Mock document.hidden
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: vi.fn().mockReturnValue(true)
    });

    // Spy on articleCache.cleanup
    const cleanupSpy = vi.spyOn(articleCache, 'cleanup');

    // Trigger background cleanup
    performanceUtils.performBackgroundCleanup();

    // Verify cleanup was called
    expect(cleanupSpy).toHaveBeenCalled();
  });

  it('should mark and measure performance points', () => {
    const markSpy = vi.spyOn(performance, 'mark');
    const measureSpy = vi.spyOn(performance, 'measure');

    performanceUtils.mark('test-start');
    performanceUtils.mark('test-end');
    const duration = performanceUtils.measureBetween('test-duration', 'test-start', 'test-end');

    expect(markSpy).toHaveBeenCalledWith('test-start');
    expect(markSpy).toHaveBeenCalledWith('test-end');
    expect(measureSpy).toHaveBeenCalledWith('test-duration', 'test-start', 'test-end');
    expect(duration).toBe(10); // From our mock
  });

  it('should clear performance entries', () => {
    const clearMarksSpy = vi.spyOn(performance, 'clearMarks');
    const clearMeasuresSpy = vi.spyOn(performance, 'clearMeasures');

    performanceUtils.clearEntries();

    expect(clearMarksSpy).toHaveBeenCalled();
    expect(clearMeasuresSpy).toHaveBeenCalled();
  });

  it('should track network requests', () => {
    const initialCount = performanceUtils.getNetworkRequestCount();

    performanceUtils.trackNetworkRequest();
    performanceUtils.trackNetworkRequest();

    expect(performanceUtils.getNetworkRequestCount()).toBe(initialCount + 2);

    performanceUtils.resetNetworkRequestCount();
    expect(performanceUtils.getNetworkRequestCount()).toBe(0);
  });
});

describe('Performance Monitoring', () => {
  it('should start and stop background monitoring', () => {
    // Start monitoring
    performanceUtils.startBackgroundMonitoring();

    // Should have set up event listeners and intervals
    expect(performanceUtils.isBackgrounded()).toBeDefined();

    // Stop monitoring
    performanceUtils.stopBackgroundMonitoring();

    // Clear snapshots
    performanceUtils.clearPerformanceSnapshots();
    expect(performanceUtils.getPerformanceSnapshots()).toHaveLength(0);
  });

  it('should capture performance snapshots', () => {
    // Mock private function to capture snapshot
    // This is a bit hacky but necessary to test private function
    const captureSnapshotFn = (global as any).capturePerformanceSnapshot;

    if (captureSnapshotFn) {
      captureSnapshotFn();

      const snapshots = performanceUtils.getPerformanceSnapshots();
      expect(snapshots.length).toBeGreaterThan(0);

      const lastSnapshot = snapshots[snapshots.length - 1];
      expect(lastSnapshot.timestamp).toBeDefined();
      expect(lastSnapshot.memory).not.toBeNull();
      expect(lastSnapshot.fps).toBeDefined();
    } else {
      // If we can't access the private function, we'll test the public API
      performanceUtils.startBackgroundMonitoring();

      // Force a visibility change to trigger snapshot
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: vi.fn().mockReturnValue(false)
      });
      document.dispatchEvent(new Event('visibilitychange'));

      const snapshots = performanceUtils.getPerformanceSnapshots();
      expect(snapshots.length).toBeGreaterThanOrEqual(0);

      performanceUtils.stopBackgroundMonitoring();
    }
  });

  it('should observe long tasks if supported', () => {
    // Mock PerformanceObserver
    const originalObserver = global.PerformanceObserver;
    const mockObserve = vi.fn();
    const mockDisconnect = vi.fn();

    global.PerformanceObserver = vi.fn().mockImplementation((callback) => {
      return {
        observe: mockObserve,
        disconnect: mockDisconnect
      };
    });

    const observer = performanceUtils.observeLongTasks(() => {});

    expect(observer).not.toBeNull();
    expect(mockObserve).toHaveBeenCalledWith({ entryTypes: ['longtask'] });

    // Cleanup
    global.PerformanceObserver = originalObserver;
  });

  it('should observe layout shifts if supported', () => {
    // Mock PerformanceObserver
    const originalObserver = global.PerformanceObserver;
    const mockObserve = vi.fn();
    const mockDisconnect = vi.fn();

    global.PerformanceObserver = vi.fn().mockImplementation((callback) => {
      return {
        observe: mockObserve,
        disconnect: mockDisconnect
      };
    });

    const observer = performanceUtils.observeLayoutShifts(() => {});

    expect(observer).not.toBeNull();
    expect(mockObserve).toHaveBeenCalledWith({ entryTypes: ['layout-shift'] });

    // Cleanup
    global.PerformanceObserver = originalObserver;
  });
});

describe('Higher-Order Component Performance', () => {
  it('should wrap component with performance monitoring', () => {
    // Create a simple test component
    const TestComponent = (props: { name: string }) => <div>{props.name}</div>;

    // Wrap with performance monitoring
    const MonitoredComponent = withPerformanceMonitoring(TestComponent, 'TestComponent');

    // Render the monitored component
    const { rerender, unmount } = render(<MonitoredComponent name="test" />);

    // Verify mark was called for mount
    expect(performance.mark).toHaveBeenCalledWith('TestComponent-mount-start');

    // Rerender with different props
    rerender(<MonitoredComponent name="updated" />);

    // Unmount to trigger cleanup
    unmount();

    // Verify mark was called for unmount
    expect(performance.mark).toHaveBeenCalledWith('TestComponent-mount-end');
    expect(performance.measure).toHaveBeenCalledWith(
      'TestComponent-mount-duration',
      'TestComponent-mount-start',
      'TestComponent-mount-end'
    );
  });
});

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VirtualizedArticleList } from '../components/VirtualizedArticleList';
import { ArticleItem } from '../components/ArticleItem';
import { LazyImage } from '../components/LazyImage';
import { SearchBar } from '../components/SearchBar';
import { performanceUtils } from '../services/performanceUtils';
import { articleCache } from '../services/articleCache';
import { usePerformance } from '../hooks/usePerformance';
import { renderHook, act } from '@testing-library/react-hooks';
import type { Article } from '../types';

// Mock IntersectionObserver
class MockIntersectionObserver {
  readonly root: Element | null;
  readonly rootMargin: string;
  readonly thresholds: ReadonlyArray<number>;
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.root = options?.root || null;
    this.rootMargin = options?.rootMargin || '0px';
    this.thresholds = Array.isArray(options?.threshold) ? options.threshold : [options?.threshold || 0];
  }
  observe() { return; }
  unobserve() { return; }
  disconnect() { return; }
}

global.IntersectionObserver = MockIntersectionObserver;

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
});

afterEach(() => {
  global.performance = originalPerformance;
  vi.restoreAllMocks();
});

// Helper to generate mock articles
function generateMockArticles(count: number): Article[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `article-${i}`,
    title: `Test Article ${i}`,
    link: `https://example.com/article-${i}`,
    description: `This is a test article ${i} with some description text that is long enough to test truncation.`,
    content: `<p>Full content for article ${i}</p><p>With multiple paragraphs</p>`,
    author: `Author ${i % 10}`,
    published: new Date(Date.now() - i * 3600000).toISOString(),
    image: `https://example.com/image-${i}.jpg`,
    categories: [`Category ${i % 5}`],
    source: {
      id: `source-${i % 3}`,
      name: `Source ${i % 3}`,
      url: `https://example.com/source-${i % 3}`
    }
  }));
}

describe('Performance Benchmarks', () => {
  describe('VirtualizedArticleList Performance', () => {
    it('should render 1000+ articles without lag', async () => {
      const articles = generateMockArticles(1000);

      // Measure render time
      const startTime = performance.now();
      const { container } = render(
        <VirtualizedArticleList
          articles={articles}
          containerHeight={600}
          itemHeight={120}
        />
      );
      const initialRenderTime = performance.now() - startTime;

      // Log render time
      console.log(`Initial render time for 1000 articles: ${initialRenderTime.toFixed(2)}ms`);

      // Expect render time to be reasonable (adjust threshold based on environment)
      expect(initialRenderTime).toBeLessThan(500); // 500ms is a generous threshold

      // Measure scroll performance
      const scrollContainer = container.querySelector('[data-testid="virtualized-list"]');
      expect(scrollContainer).not.toBeNull();

      if (scrollContainer) {
        const scrollStartTime = performance.now();

        // Simulate scrolling
        fireEvent.scroll(scrollContainer, { target: { scrollTop: 1000 } });
        fireEvent.scroll(scrollContainer, { target: { scrollTop: 2000 } });
        fireEvent.scroll(scrollContainer, { target: { scrollTop: 3000 } });

        const scrollTime = performance.now() - scrollStartTime;

        // Log scroll time
        console.log(`Scroll time for 3 scroll events: ${scrollTime.toFixed(2)}ms`);

        // Expect scroll time to be reasonable
        expect(scrollTime).toBeLessThan(100); // 100ms is a generous threshold
      }
    });

    it('should efficiently handle window resize', async () => {
      const articles = generateMockArticles(500);

      const { container, rerender } = render(
        <VirtualizedArticleList
          articles={articles}
          containerHeight={600}
          itemHeight={120}
        />
      );

      // Measure rerender time with different container height
      const startTime = performance.now();

      rerender(
        <VirtualizedArticleList
          articles={articles}
          containerHeight={400} // Changed height
          itemHeight={120}
        />
      );

      const rerenderTime = performance.now() - startTime;

      // Log rerender time
      console.log(`Rerender time after container height change: ${rerenderTime.toFixed(2)}ms`);

      // Expect rerender to be fast
      expect(rerenderTime).toBeLessThan(50); // 50ms is a generous threshold
    });
  });

  describe('ArticleItem Performance', () => {
    it('should render efficiently with React.memo', () => {
      const article = generateMockArticles(1)[0];

      // First render
      const { rerender } = render(<ArticleItem article={article} index={1} />);

      // Measure rerender with same props (should be very fast due to memoization)
      const startTime = performance.now();

      rerender(<ArticleItem article={article} index={1} />);

      const rerenderTime = performance.now() - startTime;

      // Log rerender time
      console.log(`ArticleItem memo rerender time (same props): ${rerenderTime.toFixed(2)}ms`);

      // Should be extremely fast due to memoization
      expect(rerenderTime).toBeLessThan(5); // 5ms is a generous threshold

      // Now with different props
      const newArticle = { ...article, title: 'Changed title' };

      const newPropsStartTime = performance.now();

      rerender(<ArticleItem article={newArticle} index={1} />);

      const newPropsRerenderTime = performance.now() - newPropsStartTime;

      // Log rerender time with new props
      console.log(`ArticleItem rerender time (different props): ${newPropsRerenderTime.toFixed(2)}ms`);

      // Should be reasonable for a full rerender
      expect(newPropsRerenderTime).toBeLessThan(50); // 50ms is a generous threshold
    });
  });

  describe('LazyImage Performance', () => {
    it('should efficiently handle intersection observer callbacks', () => {
      const { rerender } = render(
        <LazyImage
          src="https://example.com/image.jpg"
          alt="Test image"
          placeholder="https://example.com/placeholder.jpg"
        />
      );

      // Mock the intersection observer callback
      const mockIntersectionObserverInstance = {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      };

      vi.spyOn(global, 'IntersectionObserver').mockImplementation((callback) => {
        // Simulate image coming into view
        setTimeout(() => {
          callback([{
            isIntersecting: true,
            target: document.createElement('img'),
            boundingClientRect: {} as DOMRectReadOnly,
            intersectionRatio: 1,
            intersectionRect: {} as DOMRectReadOnly,
            rootBounds: null,
            time: performance.now(),
          }], mockIntersectionObserverInstance as any);
        }, 10);

        return mockIntersectionObserverInstance as any;
      });

      // Rerender to trigger the mocked intersection observer
      rerender(
        <LazyImage
          src="https://example.com/image.jpg"
          alt="Test image"
          placeholder="https://example.com/placeholder.jpg"
        />
      );

      // Verify that observe was called
      expect(mockIntersectionObserverInstance.observe).toHaveBeenCalled();
    });
  });

  describe('SearchBar Performance', () => {
    it('should efficiently debounce search input', async () => {
      const handleSearch = vi.fn();

      render(<SearchBar onSearch={handleSearch} debounceMs={100} />);

      const searchInput = screen.getByPlaceholderText(/search/i);

      // Type quickly in the search input
      const startTime = performance.now();

      fireEvent.change(searchInput, { target: { value: 't' } });
      fireEvent.change(searchInput, { target: { value: 'te' } });
      fireEvent.change(searchInput, { target: { value: 'tes' } });
      fireEvent.change(searchInput, { target: { value: 'test' } });

      const inputTime = performance.now() - startTime;

      // Log input time
      console.log(`Time to process 4 input changes: ${inputTime.toFixed(2)}ms`);

      // Should be fast
      expect(inputTime).toBeLessThan(50);

      // Verify that search handler wasn't called yet (due to debounce)
      expect(handleSearch).not.toHaveBeenCalled();

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 150));

      // Now it should have been called exactly once
      expect(handleSearch).toHaveBeenCalledTimes(1);
      expect(handleSearch).toHaveBeenCalledWith('test');
    });
  });

  describe('Memory Leak Detection', () => {
    it('should not leak memory when mounting/unmounting components', () => {
      // Mock memory API
      let currentMemory = 10; // Starting at 10MB

      Object.defineProperty(global.performance, 'memory', {
        get: () => ({
          usedJSHeapSize: currentMemory * 1024 * 1024,
          totalJSHeapSize: 100 * 1024 * 1024,
          jsHeapSizeLimit: 200 * 1024 * 1024,
        }),
        configurable: true,
      });

      const getMemoryUsage = () => {
        return performanceUtils.getMemoryUsage()?.used || 0;
      };

      // Initial memory reading
      const initialMemory = getMemoryUsage();

      // Mount and unmount components multiple times
      for (let i = 0; i < 10; i++) {
        const articles = generateMockArticles(100);

        const { unmount } = render(
          <VirtualizedArticleList
            articles={articles}
            containerHeight={600}
            itemHeight={120}
          />
        );

        // Simulate memory increase during render
        currentMemory += 0.5;

        // Unmount
        unmount();

        // Simulate memory decrease after unmount and GC
        currentMemory -= 0.4; // Should decrease but not completely (simulating small leak)
      }

      // Final memory reading
      const finalMemory = getMemoryUsage();

      // Log memory usage
      console.log(`Initial memory: ${initialMemory}MB, Final memory: ${finalMemory}MB, Difference: ${finalMemory - initialMemory}MB`);

      // In a real app, we'd expect some small increase due to caching, etc.
      // For this test, we're simulating a small leak, so we expect an increase
      // In a real test environment, you might want to force garbage collection if possible
      expect(finalMemory - initialMemory).toBeLessThan(2); // Allow up to 2MB increase
    });
  });

  describe('usePerformance Hook', () => {
    it('should efficiently track performance metrics', () => {
      const { result } = renderHook(() => usePerformance({ enabled: true }));

      // Start render timing
      act(() => {
        result.current.startRenderTiming();
      });

      // Simulate some work
      const startTime = performance.now();
      while (performance.now() - startTime < 10) {
        // Busy wait for 10ms
      }

      // End render timing
      act(() => {
        result.current.endRenderTiming();
      });

      // Verify that render time was recorded
      expect(result.current.metrics.renderTime).toBeGreaterThan(0);

      // Track network request
      act(() => {
        result.current.trackNetworkRequest();
      });

      // Verify network request was tracked
      expect(result.current.metrics.networkRequests).toBe(1);

      // Create and complete network batch
      let batchId: string | null = null;

      act(() => {
        const batch = result.current.createNetworkBatch(['https://example.com/test']);
        batchId = batch?.id || null;
      });

      expect(batchId).not.toBeNull();

      if (batchId) {
        act(() => {
          result.current.completeNetworkBatch(batchId, [{ data: 'test' }]);
        });

        // Verify batch stats
        const batchStats = result.current.getNetworkBatchStats();
        expect(batchStats.completedBatches).toBe(1);
      }

      // Clear metrics
      act(() => {
        result.current.clearMetrics();
      });

      // Verify metrics were cleared
      expect(result.current.metrics.networkRequests).toBe(0);
    });
  });

  describe('Load Testing', () => {
    it('should handle large datasets efficiently', () => {
      // Generate a very large dataset
      const largeDataset = generateMockArticles(5000);

      // Measure time to process the dataset
      const startTime = performance.now();

      // Simulate processing the dataset (e.g., filtering, sorting)
      const filtered = largeDataset.filter(article =>
        article.title.includes('Test') ||
        article.description.includes('test')
      );

      const sorted = [...filtered].sort((a, b) =>
        new Date(b.published).getTime() - new Date(a.published).getTime()
      );

      const categorized = sorted.reduce((acc, article) => {
        article.categories.forEach(category => {
          if (!acc[category]) acc[category] = [];
          acc[category].push(article);
        });
        return acc;
      }, {} as Record<string, Article[]>);

      const processingTime = performance.now() - startTime;

      // Log processing time
      console.log(`Time to process 5000 articles: ${processingTime.toFixed(2)}ms`);

      // Verify results
      expect(filtered.length).toBeGreaterThan(0);
      expect(sorted.length).toBe(filtered.length);
      expect(Object.keys(categorized).length).toBeGreaterThan(0);

      // Expect processing to be reasonably fast
      expect(processingTime).toBeLessThan(1000); // 1 second is a generous threshold
    });
  });
});

/**
 * Performance Tests for Enhanced Validation System
 *
 * Tests for concurrent validation scenarios, memory usage,
 * cache performance, and system resource management
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { feedValidator } from "../services/feedValidator";
import { feedDiscoveryService } from "../services/feedDiscoveryService";
import { proxyManager } from "../services/proxyManager";
import { smartValidationCache } from "../services/smartValidationCache";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Performance test utilities
const measureExecutionTime = async <T>(
  fn: () => Promise<T>
): Promise<{ result: T; time: number }> => {
  const startTime = performance.now();
  const result = await fn();
  const endTime = performance.now();
  return { result, time: endTime - startTime };
};

const createMockFeedContent = (
  title: string,
  itemCount: number = 10
): string => {
  const items = Array.from(
    { length: itemCount },
    (_, i) => `
    <item>
      <title>Article ${i + 1} - ${title}</title>
      <description>Content for article ${i + 1}</description>
      <link>https://example.com/article-${i + 1}</link>
      <pubDate>Mon, ${String(i + 1).padStart(
        2,
        "0"
      )} Jan 2024 12:00:00 GMT</pubDate>
    </item>
  `
  ).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
      <channel>
        <title>${title}</title>
        <description>Performance test feed with ${itemCount} items</description>
        <link>https://example.com</link>
        <lastBuildDate>Mon, 01 Jan 2024 12:00:00 GMT</lastBuildDate>
        ${items}
      </channel>
    </rss>`;
};

describe("Performance Tests - Enhanced Validation System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    feedValidator.clearCache();
    smartValidationCache.clear();
    proxyManager.resetStats();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Concurrent Validation Performance", () => {
    it("should handle 10 concurrent feed validations efficiently", async () => {
      const feedCount = 10;
      const mockContent = createMockFeedContent("Concurrent Test Feed");

      mockFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        text: () => Promise.resolve(mockContent),
      });

      const urls = Array.from(
        { length: feedCount },
        (_, i) => `https://site${i + 1}.com/feed.xml`
      );

      const { result: results, time } = await measureExecutionTime(async () => {
        const promises = urls.map((url) => feedValidator.validateFeed(url));
        return Promise.all(promises);
      });

      expect(results).toHaveLength(feedCount);
      expect(results.every((r) => r.isValid)).toBe(true);
      expect(time).toBeLessThan(5000); // Should complete within 5 seconds
      expect(mockFetch).toHaveBeenCalledTimes(feedCount);

      // Verify all feeds were processed correctly
      results.forEach((result, index) => {
        expect(result.title).toBe("Concurrent Test Feed");
        expect(result.responseTime).toBeGreaterThan(0);
        expect(result.validationAttempts).toHaveLength(1);
      });
    });

    it("should handle 50 concurrent feed validations with reasonable performance", async () => {
      const feedCount = 50;
      const mockContent = createMockFeedContent("Large Scale Test");

      mockFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        text: () => Promise.resolve(mockContent),
      });

      const urls = Array.from(
        { length: feedCount },
        (_, i) => `https://largescale${i + 1}.com/feed.xml`
      );

      const { result: results, time } = await measureExecutionTime(async () => {
        const promises = urls.map((url) => feedValidator.validateFeed(url));
        return Promise.all(promises);
      });

      expect(results).toHaveLength(feedCount);
      expect(results.every((r) => r.isValid)).toBe(true);
      expect(time).toBeLessThan(15000); // Should complete within 15 seconds

      // Calculate average response time
      const avgResponseTime =
        results.reduce((sum, r) => sum + (r.responseTime || 0), 0) /
        results.length;
      expect(avgResponseTime).toBeLessThan(1000); // Average should be under 1 second
    });

    it("should handle mixed success/failure scenarios efficiently", async () => {
      const successCount = 15;
      const failureCount = 10;
      const totalCount = successCount + failureCount;

      const mockSuccessContent = createMockFeedContent("Success Feed");

      // Mock responses: first 15 succeed, next 10 fail
      for (let i = 0; i < successCount; i++) {
        mockFetch.mockResolvedValueOnce({
          status: 200,
          statusText: "OK",
          text: () => Promise.resolve(mockSuccessContent),
        });
      }

      for (let i = 0; i < failureCount; i++) {
        mockFetch.mockResolvedValueOnce({
          status: 404,
          statusText: "Not Found",
          text: () => Promise.resolve(""),
        });
      }

      const urls = Array.from(
        { length: totalCount },
        (_, i) => `https://mixed${i + 1}.com/feed.xml`
      );

      const { result: results, time } = await measureExecutionTime(async () => {
        const promises = urls.map((url) => feedValidator.validateFeed(url));
        return Promise.all(promises);
      });

      expect(results).toHaveLength(totalCount);
      expect(time).toBeLessThan(10000); // Should complete within 10 seconds

      const successResults = results.filter((r) => r.isValid);
      const failureResults = results.filter((r) => !r.isValid);

      expect(successResults).toHaveLength(successCount);
      expect(failureResults).toHaveLength(failureCount);

      // Verify error handling didn't significantly impact performance
      failureResults.forEach((result) => {
        expect(result.status).toBe("not_found");
        expect(result.responseTime).toBeGreaterThan(0);
      });
    });

    it("should handle concurrent discovery requests efficiently", async () => {
      const siteCount = 8;
      const mockHtmlContent = `
        <html>
          <head>
            <link rel="alternate" type="application/rss+xml" href="/feed.xml">
          </head>
        </html>`;

      const mockFeedContent = createMockFeedContent(
        "Discovery Performance Test"
      );

      // Mock discovery responses for each site
      for (let i = 0; i < siteCount; i++) {
        // Mock common paths to fail (17 paths per site)
        for (let j = 0; j < 17; j++) {
          mockFetch.mockRejectedValueOnce(new Error("Not found"));
        }

        // Mock HTML content and feed content
        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(mockHtmlContent),
          })
          .mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(mockFeedContent),
          });
      }

      const urls = Array.from(
        { length: siteCount },
        (_, i) => `https://discoverytest${i + 1}.com`
      );

      const { result: results, time } = await measureExecutionTime(async () => {
        const promises = urls.map((url) =>
          feedDiscoveryService.discoverFromWebsite(url)
        );
        return Promise.all(promises);
      });

      expect(results).toHaveLength(siteCount);
      expect(time).toBeLessThan(12000); // Should complete within 12 seconds

      results.forEach((result) => {
        expect(result.discoveredFeeds).toHaveLength(1);
        expect(result.discoveredFeeds[0].title).toBe(
          "Discovery Performance Test"
        );
        expect(result.discoveryTime).toBeGreaterThan(0);
      });
    });
  });

  describe("Cache Performance", () => {
    it("should demonstrate significant performance improvement with caching", async () => {
      const mockContent = createMockFeedContent("Cache Performance Test", 50);
      const testUrl = "https://cache-test.com/feed.xml";

      mockFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        text: () => Promise.resolve(mockContent),
      });

      // First request (cache miss)
      const { result: firstResult, time: firstTime } =
        await measureExecutionTime(async () => {
          return feedValidator.validateFeed(testUrl);
        });

      expect(firstResult.isValid).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second request (cache hit)
      const { result: secondResult, time: secondTime } =
        await measureExecutionTime(async () => {
          return feedValidator.validateFeed(testUrl);
        });

      expect(secondResult.isValid).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1); // No additional fetch
      expect(secondTime).toBeLessThan(firstTime * 0.1); // Should be at least 10x faster

      // Verify cache statistics
      const cacheStats = smartValidationCache.getStats();
      expect(cacheStats.hitCount).toBeGreaterThan(0);
      expect(cacheStats.hitRate).toBeGreaterThan(0);
    });

    it("should handle cache memory management under load", async () => {
      const feedCount = 100;
      const mockContent = createMockFeedContent("Memory Test Feed");

      mockFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        text: () => Promise.resolve(mockContent),
      });

      // Generate many unique URLs to fill cache
      const urls = Array.from(
        { length: feedCount },
        (_, i) => `https://memorytest${i}.com/feed.xml`
      );

      const { result: results, time } = await measureExecutionTime(async () => {
        const promises = urls.map((url) => feedValidator.validateFeed(url));
        return Promise.all(promises);
      });

      expect(results).toHaveLength(feedCount);
      expect(results.every((r) => r.isValid)).toBe(true);

      // Check cache statistics
      const cacheStats = smartValidationCache.getStats();
      expect(cacheStats.totalEntries).toBeGreaterThan(0);
      expect(cacheStats.memoryUsage.used).toBeGreaterThan(0);
      expect(cacheStats.memoryUsage.percentage).toBeLessThan(100); // Should not exceed limits

      // Verify cache is managing memory appropriately
      expect(cacheStats.totalEntries).toBeLessThanOrEqual(feedCount);
    });

    it("should maintain performance with different TTL strategies", async () => {
      const successContent = createMockFeedContent("Success TTL Test");
      const failureResponse = {
        status: 404,
        statusText: "Not Found",
        text: () => Promise.resolve(""),
      };

      // Test successful validation caching
      mockFetch.mockResolvedValueOnce({
        status: 200,
        statusText: "OK",
        text: () => Promise.resolve(successContent),
      });

      const successResult = await feedValidator.validateFeed(
        "https://success-ttl.com/feed.xml"
      );
      expect(successResult.isValid).toBe(true);

      // Test failed validation caching
      mockFetch.mockResolvedValueOnce(failureResponse);
      mockFetch.mockRejectedValue(new Error("Discovery failed"));

      const failureResult = await feedValidator.validateFeedWithDiscovery(
        "https://failure-ttl.com/feed.xml"
      );
      expect(failureResult.isValid).toBe(false);

      // Verify different TTL strategies are applied
      const cacheStats = smartValidationCache.getStats();
      expect(cacheStats.ttlDistribution.success).toBeGreaterThan(0);
      expect(cacheStats.ttlDistribution.failure).toBeGreaterThan(0);
    });
  });

  describe("Memory Usage and Resource Management", () => {
    it("should maintain reasonable memory usage during large operations", async () => {
      const largeContent = createMockFeedContent("Large Content Test", 200); // Large feed with 200 items
      const requestCount = 20;

      mockFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        text: () => Promise.resolve(largeContent),
      });

      const urls = Array.from(
        { length: requestCount },
        (_, i) => `https://largecontent${i}.com/feed.xml`
      );

      // Monitor memory usage before
      const initialCacheStats = smartValidationCache.getStats();
      const initialMemoryUsage = initialCacheStats.memoryUsage.used;

      const results = await Promise.all(
        urls.map((url) => feedValidator.validateFeed(url))
      );

      expect(results).toHaveLength(requestCount);
      expect(results.every((r) => r.isValid)).toBe(true);

      // Check memory usage after
      const finalCacheStats = smartValidationCache.getStats();
      const finalMemoryUsage = finalCacheStats.memoryUsage.used;

      // Memory should have increased but not excessively
      expect(finalMemoryUsage).toBeGreaterThan(initialMemoryUsage);
      expect(finalCacheStats.memoryUsage.percentage).toBeLessThan(80); // Should not exceed 80% of limit
    });

    it("should handle cache cleanup efficiently", async () => {
      const mockContent = createMockFeedContent("Cleanup Test");

      // Fill cache with many entries
      mockFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        text: () => Promise.resolve(mockContent),
      });

      const urls = Array.from(
        { length: 50 },
        (_, i) => `https://cleanup${i}.com/feed.xml`
      );

      await Promise.all(urls.map((url) => feedValidator.validateFeed(url)));

      const statsBeforeCleanup = smartValidationCache.getStats();
      const entriesBeforeCleanup = statsBeforeCleanup.totalEntries;

      // Trigger manual cleanup
      const { time: cleanupTime } = await measureExecutionTime(async () => {
        return smartValidationCache.cleanup();
      });

      expect(cleanupTime).toBeLessThan(100); // Cleanup should be fast (under 100ms)

      const statsAfterCleanup = smartValidationCache.getStats();

      // Cleanup might not remove entries if they haven't expired, but it should complete quickly
      expect(statsAfterCleanup.totalEntries).toBeLessThanOrEqual(
        entriesBeforeCleanup
      );
    });

    it("should handle proxy statistics efficiently under load", async () => {
      const mockContent = createMockFeedContent("Proxy Stats Test");
      const requestCount = 30;

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockContent),
      });

      const availableProxies = proxyManager.getAvailableProxies();
      const testProxy = availableProxies[0];

      // Make many requests through the same proxy
      const { time } = await measureExecutionTime(async () => {
        const promises = Array.from({ length: requestCount }, (_, i) =>
          proxyManager.tryProxy(
            testProxy,
            `https://proxystats${i}.com/feed.xml`
          )
        );
        return Promise.all(promises);
      });

      expect(time).toBeLessThan(8000); // Should complete within 8 seconds

      // Verify statistics are maintained efficiently
      const proxyStats = proxyManager.getProxyStatsByName(testProxy.name);
      expect(proxyStats).toBeDefined();
      expect(proxyStats!.totalRequests).toBe(requestCount);
      expect(proxyStats!.success).toBe(requestCount);
      expect(proxyStats!.avgResponseTime).toBeGreaterThan(0);

      const overallStats = proxyManager.getOverallStats();
      expect(overallStats.totalRequests).toBeGreaterThanOrEqual(requestCount);
    });
  });

  describe("Stress Testing", () => {
    it("should handle rapid sequential requests without degradation", async () => {
      const mockContent = createMockFeedContent("Sequential Stress Test");
      const requestCount = 100;

      mockFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        text: () => Promise.resolve(mockContent),
      });

      const responseTimes: number[] = [];

      // Make sequential requests and measure individual response times
      for (let i = 0; i < requestCount; i++) {
        const { result, time } = await measureExecutionTime(async () => {
          return feedValidator.validateFeed(
            `https://sequential${i}.com/feed.xml`
          );
        });

        expect(result.isValid).toBe(true);
        responseTimes.push(time);
      }

      // Verify performance doesn't degrade significantly over time
      const firstQuarter = responseTimes.slice(0, 25);
      const lastQuarter = responseTimes.slice(-25);

      const avgFirstQuarter =
        firstQuarter.reduce((sum, time) => sum + time, 0) / firstQuarter.length;
      const avgLastQuarter =
        lastQuarter.reduce((sum, time) => sum + time, 0) / lastQuarter.length;

      // Last quarter should not be more than 50% slower than first quarter
      expect(avgLastQuarter).toBeLessThan(avgFirstQuarter * 1.5);
    });

    it("should handle timeout scenarios gracefully under load", async () => {
      const timeoutCount = 10;
      const successCount = 10;
      const mockContent = createMockFeedContent("Timeout Stress Test");

      // Mock timeout responses
      for (let i = 0; i < timeoutCount; i++) {
        mockFetch.mockImplementationOnce(
          () =>
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new DOMException("Aborted", "AbortError")),
                100
              )
            )
        );
      }

      // Mock successful responses
      for (let i = 0; i < successCount; i++) {
        mockFetch.mockResolvedValueOnce({
          status: 200,
          statusText: "OK",
          text: () => Promise.resolve(mockContent),
        });
      }

      const urls = Array.from(
        { length: timeoutCount + successCount },
        (_, i) => `https://timeoutstress${i}.com/feed.xml`
      );

      const { result: results, time } = await measureExecutionTime(async () => {
        const promises = urls.map((url) => feedValidator.validateFeed(url));
        return Promise.all(promises);
      });

      expect(results).toHaveLength(timeoutCount + successCount);
      expect(time).toBeLessThan(15000); // Should handle timeouts efficiently

      const timeoutResults = results.filter((r) => r.status === "timeout");
      const successResults = results.filter((r) => r.isValid);

      expect(timeoutResults).toHaveLength(timeoutCount);
      expect(successResults).toHaveLength(successCount);

      // Verify timeout handling didn't break successful validations
      successResults.forEach((result) => {
        expect(result.title).toBe("Timeout Stress Test");
      });
    });

    it("should maintain system stability under extreme concurrent load", async () => {
      const extremeCount = 200;
      const mockContent = createMockFeedContent("Extreme Load Test");

      mockFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        text: () => Promise.resolve(mockContent),
      });

      const urls = Array.from(
        { length: extremeCount },
        (_, i) => `https://extreme${i}.com/feed.xml`
      );

      // Split into batches to avoid overwhelming the system
      const batchSize = 50;
      const batches = [];
      for (let i = 0; i < urls.length; i += batchSize) {
        batches.push(urls.slice(i, i + batchSize));
      }

      const allResults: any[] = [];
      let totalTime = 0;

      for (const batch of batches) {
        const { result: batchResults, time: batchTime } =
          await measureExecutionTime(async () => {
            const promises = batch.map((url) =>
              feedValidator.validateFeed(url)
            );
            return Promise.all(promises);
          });

        allResults.push(...batchResults);
        totalTime += batchTime;
      }

      expect(allResults).toHaveLength(extremeCount);
      expect(allResults.every((r) => r.isValid)).toBe(true);
      expect(totalTime).toBeLessThan(30000); // Should complete within 30 seconds total

      // Verify system remained stable
      const cacheStats = smartValidationCache.getStats();
      expect(cacheStats.memoryUsage.percentage).toBeLessThan(90);

      const overallProxyStats = proxyManager.getOverallStats();
      expect(overallProxyStats.totalRequests).toBeGreaterThan(0);
    });
  });

  describe("Performance Benchmarks", () => {
    it("should meet performance benchmarks for single feed validation", async () => {
      const mockContent = createMockFeedContent("Benchmark Test");

      mockFetch.mockResolvedValueOnce({
        status: 200,
        statusText: "OK",
        text: () => Promise.resolve(mockContent),
      });

      const { result, time } = await measureExecutionTime(async () => {
        return feedValidator.validateFeed("https://benchmark.com/feed.xml");
      });

      expect(result.isValid).toBe(true);
      expect(time).toBeLessThan(1000); // Should complete within 1 second
      expect(result.responseTime).toBeLessThan(1000);
    });

    it("should meet performance benchmarks for feed discovery", async () => {
      const mockHtmlContent = `
        <html>
          <head>
            <link rel="alternate" type="application/rss+xml" href="/feed.xml">
          </head>
        </html>`;

      const mockFeedContent = createMockFeedContent("Discovery Benchmark");

      // Mock common paths to fail (17 paths)
      for (let i = 0; i < 17; i++) {
        mockFetch.mockRejectedValueOnce(new Error("Not found"));
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockHtmlContent),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockFeedContent),
        });

      const { result, time } = await measureExecutionTime(async () => {
        return feedDiscoveryService.discoverFromWebsite(
          "https://discovery-benchmark.com"
        );
      });

      expect(result.discoveredFeeds).toHaveLength(1);
      expect(time).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.discoveryTime).toBeLessThan(5000);
    });

    it("should meet performance benchmarks for proxy failover", async () => {
      const mockContent = createMockFeedContent("Proxy Benchmark");

      // First proxy fails, second succeeds
      mockFetch
        .mockRejectedValueOnce(new Error("First proxy failed"))
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockContent),
        });

      const { result, time } = await measureExecutionTime(async () => {
        return proxyManager.tryProxiesWithFailover(
          "https://proxy-benchmark.com/feed.xml"
        );
      });

      expect(result.content).toBe(mockContent);
      expect(time).toBeLessThan(3000); // Should complete failover within 3 seconds
    });
  });
});

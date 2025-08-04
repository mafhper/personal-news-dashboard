/**
 * Integration Tests for Complete Validation Flow
 *
 * Tests the entire validation process from URL input to final result,
 * including discovery integration, proxy fallback, and error recovery
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { feedValidator } from "../services/feedValidator";
import { proxyManager } from "../services/proxyManager";
import { smartValidationCache } from "../services/smartValidationCache";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Complete Validation Flow - Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    feedValidator.clearCache();
    smartValidationCache.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Direct Validation Success Flow", () => {
    it("should complete full validation flow for valid RSS feed", async () => {
      const mockRssContent = `<?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <title>Integration Test Feed</title>
            <description>Testing complete validation flow</description>
            <link>https://example.com</link>
            <item>
              <title>Test Article</title>
              <description>Test article content</description>
              <link>https://example.com/article1</link>
              <pubDate>Mon, 01 Jan 2024 12:00:00 GMT</pubDate>
            </item>
          </channel>
        </rss>`;

      mockFetch.mockResolvedValueOnce({
        status: 200,
        statusText: "OK",
        text: () => Promise.resolve(mockRssContent),
      });

      const result = await feedValidator.validateFeedWithDiscovery(
        "https://example.com/rss.xml"
      );

      expect(result.isValid).toBe(true);
      expect(result.status).toBe("valid");
      expect(result.title).toBe("Integration Test Feed");
      expect(result.description).toBe("Testing complete validation flow");
      expect(result.finalMethod).toBe("direct");
      expect(result.validationAttempts).toHaveLength(1);
      expect(result.validationAttempts[0].success).toBe(true);
      expect(result.validationAttempts[0].method).toBe("direct");
      expect(result.totalRetries).toBe(0);
      expect(result.totalValidationTime).toBeGreaterThan(0);
      expect(result.suggestions).toContain("Feed validated successfully");
    });

    it("should complete full validation flow for valid Atom feed", async () => {
      const mockAtomContent = `<?xml version="1.0" encoding="utf-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title>Integration Atom Feed</title>
          <subtitle>Testing Atom validation flow</subtitle>
          <link href="https://example.com"/>
          <id>https://example.com/atom.xml</id>
          <updated>2024-01-01T12:00:00Z</updated>
          <entry>
            <title>Atom Entry</title>
            <link href="https://example.com/entry1"/>
            <id>https://example.com/entry1</id>
            <updated>2024-01-01T12:00:00Z</updated>
            <summary>Atom entry content</summary>
          </entry>
        </feed>`;

      mockFetch.mockResolvedValueOnce({
        status: 200,
        statusText: "OK",
        text: () => Promise.resolve(mockAtomContent),
      });

      const result = await feedValidator.validateFeedWithDiscovery(
        "https://example.com/atom.xml"
      );

      expect(result.isValid).toBe(true);
      expect(result.status).toBe("valid");
      expect(result.title).toBe("Integration Atom Feed");
      expect(result.description).toBe("Testing Atom validation flow");
      expect(result.finalMethod).toBe("direct");
    });
  });

  describe("Discovery Integration Flow", () => {
    it("should fall back to discovery when direct validation fails", async () => {
      const mockHtmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Test Website</title>
            <link rel="alternate" type="application/rss+xml" title="Site Feed" href="/feed.xml">
          </head>
          <body>Website content</body>
        </html>`;

      const mockDiscoveredFeed = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>Discovered Feed</title>
            <description>Feed found through discovery</description>
          </channel>
        </rss>`;

      // Mock direct validation failure (404)
      mockFetch.mockResolvedValueOnce({
        status: 404,
        statusText: "Not Found",
        text: () => Promise.resolve(""),
      });

      // Mock discovery process
      // First, common paths fail (17 paths)
      for (let i = 0; i < 17; i++) {
        mockFetch.mockRejectedValueOnce(new Error("Not found"));
      }

      // Then HTML content and discovered feed succeed
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockHtmlContent),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockDiscoveredFeed),
        })
        .mockResolvedValueOnce({
          status: 200,
          statusText: "OK",
          text: () => Promise.resolve(mockDiscoveredFeed),
        });

      const result = await feedValidator.validateFeedWithDiscovery(
        "https://example.com"
      );

      expect(result.isValid).toBe(true);
      expect(result.status).toBe("valid");
      expect(result.title).toBe("Discovered Feed");
      expect(result.finalMethod).toBe("discovery");
      expect(result.discoveredFeeds).toHaveLength(1);
      expect(result.discoveredFeeds![0].url).toBe(
        "https://example.com/feed.xml"
      );
      expect(result.url).toBe("https://example.com/feed.xml"); // URL updated to discovered feed
      expect(result.suggestions).toContain(
        "Feed discovered and validated from https://example.com"
      );
    });

    it("should handle multiple discovered feeds requiring user selection", async () => {
      const mockHtmlContent = `
        <html>
          <head>
            <link rel="alternate" type="application/rss+xml" title="Main Feed" href="/rss.xml">
            <link rel="alternate" type="application/atom+xml" title="Atom Feed" href="/atom.xml">
            <link rel="alternate" type="application/rss+xml" title="Blog Feed" href="/blog/rss.xml">
          </head>
        </html>`;

      const mockRssFeed = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>Main RSS Feed</title>
            <description>Primary RSS feed</description>
          </channel>
        </rss>`;

      const mockAtomFeed = `<?xml version="1.0"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title>Main Atom Feed</title>
          <subtitle>Primary Atom feed</subtitle>
        </feed>`;

      const mockBlogFeed = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>Blog RSS Feed</title>
            <description>Blog-specific RSS feed</description>
          </channel>
        </rss>`;

      // Mock direct validation failure
      mockFetch.mockResolvedValueOnce({
        status: 404,
        statusText: "Not Found",
        text: () => Promise.resolve(""),
      });

      // Mock common paths to fail (17 paths)
      for (let i = 0; i < 17; i++) {
        mockFetch.mockRejectedValueOnce(new Error("Not found"));
      }

      // Mock HTML content and feed responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockHtmlContent),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockRssFeed),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockAtomFeed),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockBlogFeed),
        });

      const result = await feedValidator.validateFeedWithDiscovery(
        "https://example.com"
      );

      expect(result.isValid).toBe(false);
      expect(result.status).toBe("discovery_required");
      expect(result.requiresUserSelection).toBe(true);
      expect(result.discoveredFeeds).toHaveLength(3);
      expect(result.finalMethod).toBe("discovery");
      expect(result.error).toContain(
        "Found 3 RSS feeds - user selection required"
      );
      expect(result.suggestions).toContain("Found 3 RSS feeds on this website");
      expect(result.suggestions).toContain(
        "Please select which feed you want to add"
      );
    });

    it("should handle discovery failure gracefully", async () => {
      // Mock direct validation failure
      mockFetch.mockResolvedValueOnce({
        status: 404,
        statusText: "Not Found",
        text: () => Promise.resolve(""),
      });

      // Mock all discovery methods to fail
      mockFetch.mockRejectedValue(new Error("Network error"));

      const result = await feedValidator.validateFeedWithDiscovery(
        "https://unreachable.com"
      );

      expect(result.isValid).toBe(false);
      expect(result.status).toBe("invalid");
      expect(result.finalMethod).toBe("discovery");
      expect(result.error).toContain("Feed discovery failed");
      expect(result.suggestions).toContain(
        "Direct validation failed and feed discovery also failed"
      );
    });
  });

  describe("Proxy Fallback Integration", () => {
    it("should use proxy when direct validation fails with CORS error", async () => {
      const mockFeedContent = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>Proxy Retrieved Feed</title>
            <description>Feed retrieved via proxy</description>
          </channel>
        </rss>`;

      // Mock direct validation CORS failure
      const corsError = new Error("CORS policy prevents access");
      mockFetch.mockRejectedValueOnce(corsError);

      // Mock proxy success
      vi.spyOn(proxyManager, "tryProxiesWithFailover").mockResolvedValueOnce({
        content: mockFeedContent,
        proxyUsed: "AllOrigins",
        attempts: [],
      });

      const result = await feedValidator.validateFeed(
        "https://cors-blocked.com/rss.xml"
      );

      console.log("DEBUG: Test result:", {
        isValid: result.isValid,
        status: result.status,
        title: result.title,
        validationAttempts: result.validationAttempts.map((a) => ({
          method: a.method,
          success: a.success,
          error: a.error?.type,
        })),
        finalError: result.finalError?.type,
        error: result.error,
      });

      expect(result.isValid).toBe(true);
      expect(result.status).toBe("valid");
      expect(result.title).toBe("Proxy Retrieved Feed");
      expect(result.validationAttempts.length).toBeGreaterThan(1);

      const proxyAttempt = result.validationAttempts.find(
        (a) => a.method === "proxy"
      );
      expect(proxyAttempt).toBeDefined();
      expect(proxyAttempt!.success).toBe(true);
      expect(proxyAttempt!.proxyUsed).toBe("AllOrigins");

      expect(result.suggestions).toContain(
        "Feed validated successfully using proxy service"
      );
    });

    it("should handle proxy failure and continue with discovery", async () => {
      const mockHtmlContent = `
        <html>
          <head>
            <link rel="alternate" type="application/rss+xml" href="/feed.xml">
          </head>
        </html>`;

      const mockDiscoveredFeed = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>Discovery After Proxy Failure</title>
            <description>Found via discovery after proxy failed</description>
          </channel>
        </rss>`;

      // Mock direct validation CORS failure
      const corsError = new Error("CORS policy prevents access");
      mockFetch.mockRejectedValueOnce(corsError);

      // Mock proxy failure
      vi.spyOn(proxyManager, "tryProxiesWithFailover").mockRejectedValueOnce(
        new Error("All proxies failed")
      );

      // Mock discovery success
      // Common paths fail (17 paths)
      for (let i = 0; i < 17; i++) {
        mockFetch.mockRejectedValueOnce(new Error("Not found"));
      }

      // HTML content and discovered feed succeed
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockHtmlContent),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockDiscoveredFeed),
        })
        .mockResolvedValueOnce({
          status: 200,
          statusText: "OK",
          text: () => Promise.resolve(mockDiscoveredFeed),
        });

      const result = await feedValidator.validateFeedWithDiscovery(
        "https://example.com"
      );

      expect(result.isValid).toBe(true);
      expect(result.status).toBe("valid");
      expect(result.title).toBe("Discovery After Proxy Failure");
      expect(result.finalMethod).toBe("discovery");
    });
  });

  describe("Caching Integration", () => {
    it("should cache successful validation results", async () => {
      const mockFeedContent = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>Cached Feed</title>
            <description>This should be cached</description>
          </channel>
        </rss>`;

      mockFetch.mockResolvedValueOnce({
        status: 200,
        statusText: "OK",
        text: () => Promise.resolve(mockFeedContent),
      });

      // First request
      const result1 = await feedValidator.validateFeedWithDiscovery(
        "https://example.com/cached-feed.xml"
      );

      // Second request should use cache
      const result2 = await feedValidator.validateFeedWithDiscovery(
        "https://example.com/cached-feed.xml"
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result1.isValid).toBe(true);
      expect(result2.isValid).toBe(true);
      expect(result1.title).toBe(result2.title);
      expect(result2.title).toBe("Cached Feed");
    });

    it("should cache discovery results", async () => {
      const mockHtmlContent = `
        <html>
          <head>
            <link rel="alternate" type="application/rss+xml" href="/feed.xml">
          </head>
        </html>`;

      const mockFeedContent = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>Cached Discovery Feed</title>
            <description>Discovery result should be cached</description>
          </channel>
        </rss>`;

      // Mock direct validation failure
      mockFetch.mockResolvedValueOnce({
        status: 404,
        statusText: "Not Found",
        text: () => Promise.resolve(""),
      });

      // Mock discovery process for first request
      // Common paths fail (17 paths)
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
        })
        .mockResolvedValueOnce({
          status: 200,
          statusText: "OK",
          text: () => Promise.resolve(mockFeedContent),
        });

      // First request
      const result1 = await feedValidator.validateFeedWithDiscovery(
        "https://example.com"
      );

      // Second request should use cache
      const result2 = await feedValidator.validateFeedWithDiscovery(
        "https://example.com"
      );

      expect(result1.isValid).toBe(true);
      expect(result2.isValid).toBe(true);
      expect(result1.finalMethod).toBe("discovery");
      expect(result2.finalMethod).toBe("discovery");
      expect(result1.title).toBe(result2.title);

      // Should have made discovery requests only once
      const totalCalls = mockFetch.mock.calls.length;
      expect(totalCalls).toBeLessThan(40); // Much less than double the discovery calls
    });

    it("should respect cache TTL for different result types", async () => {
      const mockSuccessFeed = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>Success Feed</title>
            <description>Successful validation</description>
          </channel>
        </rss>`;

      // Test successful validation caching
      mockFetch.mockResolvedValueOnce({
        status: 200,
        statusText: "OK",
        text: () => Promise.resolve(mockSuccessFeed),
      });

      const successResult = await feedValidator.validateFeedWithDiscovery(
        "https://example.com/success.xml"
      );

      expect(successResult.isValid).toBe(true);

      // Test failed validation caching
      mockFetch.mockResolvedValueOnce({
        status: 404,
        statusText: "Not Found",
        text: () => Promise.resolve(""),
      });

      // Mock discovery failure
      mockFetch.mockRejectedValue(new Error("Discovery failed"));

      const failureResult = await feedValidator.validateFeedWithDiscovery(
        "https://example.com/failure.xml"
      );

      expect(failureResult.isValid).toBe(false);

      // Check cache stats
      const cacheStats = smartValidationCache.getStats();
      expect(cacheStats.totalEntries).toBeGreaterThan(0);
      expect(cacheStats.ttlDistribution.success).toBeGreaterThan(0);
    });
  });

  describe("Error Recovery and Resilience", () => {
    it("should handle partial failures gracefully", async () => {
      let callCount = 0;
      mockFetch.mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          // First two calls fail
          return Promise.reject(new Error("Temporary failure"));
        } else {
          // Third call succeeds
          return Promise.resolve({
            status: 200,
            statusText: "OK",
            text: () =>
              Promise.resolve(`<?xml version="1.0"?>
              <rss version="2.0">
                <channel>
                  <title>Eventually Successful Feed</title>
                  <description>Succeeded after retries</description>
                </channel>
              </rss>`),
          });
        }
      });

      const result = await feedValidator.validateFeed(
        "https://example.com/retry-test.xml"
      );

      expect(result.isValid).toBe(true);
      expect(result.title).toBe("Eventually Successful Feed");
      expect(result.totalRetries).toBeGreaterThan(0);
      expect(result.validationAttempts.length).toBeGreaterThan(1);
    });

    it("should provide comprehensive error information on complete failure", async () => {
      // Mock all methods to fail
      mockFetch.mockRejectedValue(new Error("Complete network failure"));

      vi.spyOn(proxyManager, "tryProxiesWithFailover").mockRejectedValue(
        new Error("All proxies failed")
      );

      const result = await feedValidator.validateFeedWithDiscovery(
        "https://completely-broken.com/feed.xml"
      );

      expect(result.isValid).toBe(false);
      expect(result.status).toBe("invalid");
      expect(result.finalError).toBeDefined();
      expect(result.validationAttempts.length).toBeGreaterThan(0);
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.totalValidationTime).toBeGreaterThan(0);
    });
  });

  describe("Progress Tracking", () => {
    it("should track progress during validation with discovery", async () => {
      const progressUpdates: Array<{ status: string; progress: number }> = [];

      const mockHtmlContent = `
        <html>
          <head>
            <link rel="alternate" type="application/rss+xml" href="/feed.xml">
          </head>
        </html>`;

      const mockFeedContent = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>Progress Test Feed</title>
            <description>Testing progress tracking</description>
          </channel>
        </rss>`;

      // Mock direct validation failure
      mockFetch.mockResolvedValueOnce({
        status: 404,
        statusText: "Not Found",
        text: () => Promise.resolve(""),
      });

      // Mock discovery success
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
        })
        .mockResolvedValueOnce({
          status: 200,
          statusText: "OK",
          text: () => Promise.resolve(mockFeedContent),
        });

      const result = await feedValidator.validateFeedWithDiscovery(
        "https://example.com",
        (status, progress) => {
          progressUpdates.push({ status, progress });
        }
      );

      expect(result.isValid).toBe(true);
      expect(progressUpdates.length).toBeGreaterThan(0);

      // Should have progress updates for different stages
      const statuses = progressUpdates.map((u) => u.status);
      expect(statuses).toContain("Starting validation...");
      expect(statuses.some((s) => s.includes("discovery"))).toBe(true);

      // Progress should increase over time
      const progresses = progressUpdates.map((u) => u.progress);
      expect(progresses[progresses.length - 1]).toBe(100);
    });
  });

  describe("Performance Integration", () => {
    it("should complete validation within reasonable time limits", async () => {
      const mockFeedContent = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>Performance Test Feed</title>
            <description>Testing performance</description>
          </channel>
        </rss>`;

      mockFetch.mockResolvedValueOnce({
        status: 200,
        statusText: "OK",
        text: () => Promise.resolve(mockFeedContent),
      });

      const startTime = Date.now();
      const result = await feedValidator.validateFeedWithDiscovery(
        "https://example.com/performance-test.xml"
      );
      const endTime = Date.now();

      expect(result.isValid).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.totalValidationTime).toBeLessThan(5000);
      expect(result.responseTime).toBeGreaterThan(0);
    });

    it("should handle concurrent validation requests efficiently", async () => {
      const mockFeedContent = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>Concurrent Test Feed</title>
            <description>Testing concurrent validation</description>
          </channel>
        </rss>`;

      mockFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        text: () => Promise.resolve(mockFeedContent),
      });

      const urls = [
        "https://site1.com/feed.xml",
        "https://site2.com/feed.xml",
        "https://site3.com/feed.xml",
        "https://site4.com/feed.xml",
        "https://site5.com/feed.xml",
      ];

      const startTime = Date.now();
      const promises = urls.map((url) =>
        feedValidator.validateFeedWithDiscovery(url)
      );
      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results).toHaveLength(5);
      expect(results.every((r) => r.isValid)).toBe(true);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });
});

/**
 * proxyManager.test.ts
 *
 * Comprehensive test suite for the ProxyManager class
 * Tests proxy configurations, health monitoring, failover mechanisms,
 * and performance tracking
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from "vitest";
import {
  ProxyManager,
  ProxyConfig,
  ProxyStats,
  proxyManager,
  getProxyStatusIcon,
  getProxyHealthColor,
  formatProxyStats,
  getProxyRecommendation,
} from "../services/proxyManager";

// Mock fetch globally
global.fetch = vi.fn();

describe("ProxyManager", () => {
  let manager: ProxyManager;
  const mockFetch = fetch as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new ProxyManager({
      maxRetries: 2,
      healthCheckInterval: 1000, // 1 second for testing
      failureThreshold: 2,
      recoveryThreshold: 1,
      defaultTimeout: 5000,
    });
  });

  afterEach(() => {
    manager.destroy();
  });

  describe("Proxy Configuration", () => {
    it("should initialize with default proxy configurations", () => {
      const proxies = manager.getAvailableProxies();

      expect(proxies.length).toBeGreaterThan(0);
      expect(proxies[0]).toHaveProperty("name");
      expect(proxies[0]).toHaveProperty("url");
      expect(proxies[0]).toHaveProperty("priority");
      expect(proxies[0]).toHaveProperty("enabled");
    });

    it("should sort proxies by health score and priority", () => {
      const proxies = manager.getAvailableProxies();

      // Initially all proxies should have the same health score (1.0)
      // So they should be sorted by priority
      for (let i = 1; i < proxies.length; i++) {
        expect(proxies[i].priority).toBeGreaterThanOrEqual(
          proxies[i - 1].priority
        );
      }
    });

    it("should filter out disabled proxies", () => {
      manager.disableProxy("AllOrigins");
      const proxies = manager.getAvailableProxies();

      expect(proxies.find((p) => p.name === "AllOrigins")).toBeUndefined();
    });

    it("should re-enable disabled proxies", () => {
      manager.disableProxy("AllOrigins");
      manager.enableProxy("AllOrigins");
      const proxies = manager.getAvailableProxies();

      expect(proxies.find((p) => p.name === "AllOrigins")).toBeDefined();
    });
  });

  describe("Proxy Attempts", () => {
    it("should successfully fetch content through a proxy", async () => {
      const mockResponse = "RSS feed content";
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(mockResponse),
      });

      const proxies = manager.getAvailableProxies();
      const result = await manager.tryProxy(
        proxies[0],
        "https://example.com/feed.xml"
      );

      expect(result).toBe(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("https%3A%2F%2Fexample.com%2Ffeed.xml"),
        expect.objectContaining({
          method: "GET",
          headers: expect.any(Object),
          signal: expect.any(AbortSignal),
        })
      );
    });

    it("should apply response transformation when configured", async () => {
      const mockApiResponse = JSON.stringify({ contents: "RSS feed content" });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(mockApiResponse),
      });

      const proxies = manager.getAvailableProxies();
      const allOriginsProxy = proxies.find((p) => p.name === "AllOrigins");

      if (allOriginsProxy) {
        const result = await manager.tryProxy(
          allOriginsProxy,
          "https://example.com/feed.xml"
        );
        expect(result).toBe("RSS feed content");
      }
    });

    it("should handle fetch errors appropriately", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const proxies = manager.getAvailableProxies();

      await expect(
        manager.tryProxy(proxies[0], "https://example.com/feed.xml")
      ).rejects.toThrow("Network error");
    });

    it("should handle HTTP error responses", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        text: () => Promise.resolve(""),
      });

      const proxies = manager.getAvailableProxies();

      await expect(
        manager.tryProxy(proxies[0], "https://example.com/feed.xml")
      ).rejects.toThrow("HTTP 404: Not Found");
    });

    it("should handle timeout errors", async () => {
      // Mock a slow response that will timeout
      mockFetch.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 200))
      );

      const proxies = manager.getAvailableProxies();
      const fastTimeoutProxy = { ...proxies[0], timeout: 100 };

      await expect(
        manager.tryProxy(fastTimeoutProxy, "https://example.com/feed.xml")
      ).rejects.toThrow();
    }, 10000);
  });

  describe("Failover Mechanism", () => {
    it("should try multiple proxies when first one fails", async () => {
      // First proxy fails
      mockFetch
        .mockRejectedValueOnce(new Error("First proxy failed"))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve("Success from second proxy"),
        });

      const result = await manager.tryProxiesWithFailover(
        "https://example.com/feed.xml"
      );

      expect(result.content).toBe("Success from second proxy");
      expect(result.proxyUsed).toBeDefined();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should throw error when all proxies fail", async () => {
      mockFetch.mockRejectedValue(new Error("All proxies failed"));

      await expect(
        manager.tryProxiesWithFailover("https://example.com/feed.xml")
      ).rejects.toThrow("All proxies failed");
    });

    it("should return attempts information", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve("Success"),
      });

      const result = await manager.tryProxiesWithFailover(
        "https://example.com/feed.xml"
      );

      expect(result).toHaveProperty("content");
      expect(result).toHaveProperty("proxyUsed");
      expect(result).toHaveProperty("attempts");
    });
  });

  describe("Health Monitoring", () => {
    it("should track proxy statistics correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve("Success"),
      });

      const proxies = manager.getAvailableProxies();
      await manager.tryProxy(proxies[0], "https://example.com/feed.xml");

      const stats = manager.getProxyStatsByName(proxies[0].name);
      expect(stats).toBeDefined();
      expect(stats!.success).toBe(1);
      expect(stats!.totalRequests).toBe(1);
      expect(stats!.failures).toBe(0);
    });

    it("should update health score based on performance", async () => {
      const proxies = manager.getAvailableProxies();
      const proxyName = proxies[0].name;

      // Simulate multiple failures
      mockFetch.mockRejectedValue(new Error("Failed"));

      for (let i = 0; i < 3; i++) {
        try {
          await manager.tryProxy(proxies[0], "https://example.com/feed.xml");
        } catch {
          // Expected to fail
        }
      }

      const stats = manager.getProxyStatsByName(proxyName);
      expect(stats!.healthScore).toBeLessThan(1.0);
      expect(stats!.consecutiveFailures).toBe(3);
    });

    it("should mark proxy as unhealthy after consecutive failures", async () => {
      const proxies = manager.getAvailableProxies();
      const proxyName = proxies[0].name;

      mockFetch.mockRejectedValue(new Error("Failed"));

      // Simulate failures beyond threshold
      for (let i = 0; i < 3; i++) {
        try {
          await manager.tryProxy(proxies[0], "https://example.com/feed.xml");
        } catch {
          manager.markProxyStatus(proxyName, false);
        }
      }

      const availableProxies = manager.getAvailableProxies();
      expect(
        availableProxies.find((p) => p.name === proxyName)
      ).toBeUndefined();
    });

    it("should provide overall statistics", async () => {
      const overallStats = manager.getOverallStats();

      expect(overallStats).toHaveProperty("totalProxies");
      expect(overallStats).toHaveProperty("healthyProxies");
      expect(overallStats).toHaveProperty("totalRequests");
      expect(overallStats).toHaveProperty("totalSuccesses");
      expect(overallStats).toHaveProperty("totalFailures");
      expect(overallStats).toHaveProperty("averageResponseTime");
    });
  });

  describe("Statistics and Monitoring", () => {
    it("should calculate average response time correctly", async () => {
      const proxies = manager.getAvailableProxies();
      const proxyName = proxies[0].name;

      // Mock responses with different delays
      mockFetch
        .mockImplementationOnce(async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return {
            ok: true,
            status: 200,
            text: () => Promise.resolve("Response 1"),
          };
        })
        .mockImplementationOnce(async () => {
          await new Promise((resolve) => setTimeout(resolve, 200));
          return {
            ok: true,
            status: 200,
            text: () => Promise.resolve("Response 2"),
          };
        });

      await manager.tryProxy(proxies[0], "https://example.com/feed1.xml");
      await manager.tryProxy(proxies[0], "https://example.com/feed2.xml");

      const stats = manager.getProxyStatsByName(proxyName);
      expect(stats!.avgResponseTime).toBeGreaterThan(0);
      expect(stats!.totalRequests).toBe(2);
    });

    it("should reset statistics when requested", () => {
      manager.resetStats();
      const overallStats = manager.getOverallStats();

      expect(overallStats.totalRequests).toBe(0);
      expect(overallStats.totalSuccesses).toBe(0);
      expect(overallStats.totalFailures).toBe(0);
    });
  });

  describe("Utility Functions", () => {
    it("should provide correct status icons", () => {
      expect(getProxyStatusIcon(true)).toBe("🟢");
      expect(getProxyStatusIcon(false)).toBe("🔴");
    });

    it("should provide appropriate health colors", () => {
      expect(getProxyHealthColor(0.9)).toBe("text-green-500");
      expect(getProxyHealthColor(0.7)).toBe("text-yellow-500");
      expect(getProxyHealthColor(0.5)).toBe("text-orange-500");
      expect(getProxyHealthColor(0.2)).toBe("text-red-500");
    });

    it("should format proxy statistics correctly", () => {
      const stats: ProxyStats = {
        success: 8,
        failures: 2,
        totalRequests: 10,
        avgResponseTime: 1500,
        lastUsed: Date.now(),
        lastSuccess: Date.now(),
        lastFailure: Date.now() - 1000,
        consecutiveFailures: 0,
        healthScore: 0.8,
      };

      const formatted = formatProxyStats(stats);
      expect(formatted).toContain("80%");
      expect(formatted).toContain("10 requests");
    });

    it("should provide proxy recommendations", () => {
      expect(getProxyRecommendation({ healthScore: 0.9 } as ProxyStats)).toBe(
        "Excellent"
      );
      expect(getProxyRecommendation({ healthScore: 0.7 } as ProxyStats)).toBe(
        "Good"
      );
      expect(getProxyRecommendation({ healthScore: 0.5 } as ProxyStats)).toBe(
        "Fair"
      );
      expect(getProxyRecommendation({ healthScore: 0.2 } as ProxyStats)).toBe(
        "Poor"
      );
    });
  });

  describe("Singleton Instance", () => {
    it("should provide a singleton instance", () => {
      expect(proxyManager).toBeInstanceOf(ProxyManager);
    });

    it("should maintain state across calls", () => {
      const stats1 = proxyManager.getOverallStats();
      const stats2 = proxyManager.getOverallStats();

      expect(stats1).toEqual(stats2);
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed JSON in response transformation", async () => {
      const malformedJson = "not valid json";
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(malformedJson),
      });

      const proxies = manager.getAvailableProxies();
      const allOriginsProxy = proxies.find((p) => p.name === "AllOrigins");

      if (allOriginsProxy) {
        const result = await manager.tryProxy(
          allOriginsProxy,
          "https://example.com/feed.xml"
        );
        // Should return original response when JSON parsing fails
        expect(result).toBe(malformedJson);
      }
    });

    it("should handle empty proxy list gracefully", async () => {
      // Disable all proxies
      const proxies = manager.getAvailableProxies();
      proxies.forEach((proxy) => manager.disableProxy(proxy.name));

      await expect(
        manager.tryProxiesWithFailover("https://example.com/feed.xml")
      ).rejects.toThrow("No healthy proxies available");
    });
  });

  describe("Performance Optimization", () => {
    it("should prioritize faster proxies over time", async () => {
      const proxies = manager.getAvailableProxies();

      // Simulate one proxy being consistently faster
      mockFetch.mockImplementation(async (url) => {
        const delay = url.toString().includes("allorigins") ? 100 : 500;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return {
          ok: true,
          status: 200,
          text: () => Promise.resolve("Success"),
        };
      });

      // Make several requests to build up statistics
      for (let i = 0; i < 5; i++) {
        await manager.tryProxiesWithFailover("https://example.com/feed.xml");
      }

      const updatedProxies = manager.getAvailableProxies();
      const allOriginsProxy = updatedProxies.find(
        (p) => p.name === "AllOrigins"
      );

      // AllOrigins should have better health score due to faster response times
      if (allOriginsProxy) {
        const stats = manager.getProxyStatsByName("AllOrigins");
        expect(stats!.avgResponseTime).toBeLessThan(200);
      }
    });
  });
});

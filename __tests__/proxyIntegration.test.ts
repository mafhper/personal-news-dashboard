/**
 * CORS Proxy Management and Fallback Tests
 *
 * Tests for proxy manager functionality, health monitoring,
 * automatic failover, and performance tracking
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  proxyManager,
  ProxyManager,
  getProxyStatusIcon,
  getProxyHealthColor,
  formatProxyStats,
  getProxyRecommendation,
} from "../services/proxyManager";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("CORS Proxy Management Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    proxyManager.resetStats();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Basic Proxy Functionality", () => {
    it("should successfully fetch content through AllOrigins proxy", async () => {
      const mockContent = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>Proxy Test Feed</title>
            <description>Retrieved via AllOrigins</description>
          </channel>
        </rss>`;

      const mockAllOriginsResponse = {
        contents: mockContent,
        status: { http_code: 200 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockAllOriginsResponse)),
      });

      const availableProxies = proxyManager.getAvailableProxies();
      const allOriginsProxy = availableProxies.find(
        (p) => p.name === "AllOrigins"
      );

      expect(allOriginsProxy).toBeDefined();

      const result = await proxyManager.tryProxy(
        allOriginsProxy!,
        "https://example.com/rss.xml"
      );

      expect(result).toBe(mockContent);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("api.allorigins.win"),
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Accept: "application/json",
          }),
        })
      );
    });

    it("should successfully fetch content through CorsProxy.io", async () => {
      const mockContent = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>CorsProxy Test Feed</title>
            <description>Retrieved via CorsProxy.io</description>
          </channel>
        </rss>`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockContent),
      });

      const availableProxies = proxyManager.getAvailableProxies();
      const corsProxyIo = availableProxies.find(
        (p) => p.name === "CorsProxy.io"
      );

      expect(corsProxyIo).toBeDefined();

      const result = await proxyManager.tryProxy(
        corsProxyIo!,
        "https://example.com/rss.xml"
      );

      expect(result).toBe(mockContent);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("corsproxy.io"),
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Accept: expect.stringContaining("application/rss+xml"),
          }),
        })
      );
    });

    it("should handle proxy response transformation", async () => {
      const mockRawResponse = JSON.stringify({
        contents:
          "<?xml version='1.0'?><rss><channel><title>Test</title></channel></rss>",
        status: { http_code: 200 },
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockRawResponse),
      });

      const availableProxies = proxyManager.getAvailableProxies();
      const allOriginsProxy = availableProxies.find(
        (p) => p.name === "AllOrigins"
      );

      const result = await proxyManager.tryProxy(
        allOriginsProxy!,
        "https://example.com/rss.xml"
      );

      expect(result).toBe(
        "<?xml version='1.0'?><rss><channel><title>Test</title></channel></rss>"
      );
    });
  });

  describe("Proxy Failover and Health Management", () => {
    it("should try multiple proxies with automatic failover", async () => {
      const mockContent = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>Failover Test Feed</title>
            <description>Retrieved after failover</description>
          </channel>
        </rss>`;

      // First proxy fails, second succeeds
      mockFetch
        .mockRejectedValueOnce(new Error("AllOrigins failed"))
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockContent),
        });

      const result = await proxyManager.tryProxiesWithFailover(
        "https://example.com/rss.xml"
      );

      expect(result.content).toBe(mockContent);
      expect(result.proxyUsed).toBe("CorsProxy.io");
      expect(result.attempts).toBeDefined();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should mark proxies as unhealthy after consecutive failures", async () => {
      const targetUrl = "https://example.com/rss.xml";

      // Simulate multiple failures for AllOrigins
      for (let i = 0; i < 4; i++) {
        mockFetch.mockRejectedValueOnce(new Error("Proxy failed"));

        try {
          const availableProxies = proxyManager.getAvailableProxies();
          const allOriginsProxy = availableProxies.find(
            (p) => p.name === "AllOrigins"
          );
          if (allOriginsProxy) {
            await proxyManager.tryProxy(allOriginsProxy, targetUrl);
          }
        } catch (error) {
          // Expected to fail
        }
      }

      const stats = proxyManager.getProxyStatsByName("AllOrigins");
      expect(stats).toBeDefined();
      expect(stats!.consecutiveFailures).toBeGreaterThanOrEqual(3);
      expect(stats!.healthScore).toBeLessThan(0.5);
    });

    it("should prioritize healthy proxies over unhealthy ones", async () => {
      // Mark AllOrigins as unhealthy
      for (let i = 0; i < 4; i++) {
        proxyManager.markProxyStatus("AllOrigins", false);
      }

      // Mark CorsProxy.io as healthy
      proxyManager.markProxyStatus("CorsProxy.io", true);

      const availableProxies = proxyManager.getAvailableProxies();

      // CorsProxy.io should be first due to better health
      expect(availableProxies[0].name).toBe("CorsProxy.io");
    });

    it("should handle all proxies failing", async () => {
      mockFetch.mockRejectedValue(new Error("All proxies failed"));

      await expect(
        proxyManager.tryProxiesWithFailover("https://example.com/rss.xml")
      ).rejects.toThrow("All proxies failed");
    });

    it("should recover unhealthy proxies after time", async () => {
      // Mark proxy as unhealthy
      for (let i = 0; i < 4; i++) {
        proxyManager.markProxyStatus("AllOrigins", false);
      }

      const statsBeforeRecovery =
        proxyManager.getProxyStatsByName("AllOrigins");
      expect(statsBeforeRecovery!.healthScore).toBeLessThan(0.5);

      // Simulate successful request after recovery time
      proxyManager.markProxyStatus("AllOrigins", true);

      const statsAfterRecovery = proxyManager.getProxyStatsByName("AllOrigins");
      expect(statsAfterRecovery!.consecutiveFailures).toBe(0);
      expect(statsAfterRecovery!.healthScore).toBeGreaterThan(0.5);
    });
  });

  describe("Performance Tracking and Statistics", () => {
    it("should track proxy performance statistics", async () => {
      const mockContent =
        "<?xml version='1.0'?><rss><channel><title>Stats Test</title></channel></rss>";

      // Simulate multiple successful requests
      for (let i = 0; i < 5; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockContent),
        });

        const availableProxies = proxyManager.getAvailableProxies();
        const allOriginsProxy = availableProxies.find(
          (p) => p.name === "AllOrigins"
        );

        await proxyManager.tryProxy(
          allOriginsProxy!,
          "https://example.com/rss.xml"
        );
      }

      const stats = proxyManager.getProxyStatsByName("AllOrigins");
      expect(stats).toBeDefined();
      expect(stats!.success).toBe(5);
      expect(stats!.failures).toBe(0);
      expect(stats!.totalRequests).toBe(5);
      expect(stats!.avgResponseTime).toBeGreaterThan(0);
      expect(stats!.healthScore).toBeGreaterThan(0.8);
    });

    it("should calculate average response times correctly", async () => {
      const mockContent =
        "<?xml version='1.0'?><rss><channel><title>Response Time Test</title></channel></rss>";

      // Mock responses with different delays
      const delays = [100, 200, 300, 400, 500];

      for (const delay of delays) {
        mockFetch.mockImplementationOnce(
          () =>
            new Promise((resolve) =>
              setTimeout(
                () =>
                  resolve({
                    ok: true,
                    text: () => Promise.resolve(mockContent),
                  }),
                delay
              )
            )
        );

        const availableProxies = proxyManager.getAvailableProxies();
        const corsProxyIo = availableProxies.find(
          (p) => p.name === "CorsProxy.io"
        );

        await proxyManager.tryProxy(
          corsProxyIo!,
          "https://example.com/rss.xml"
        );
      }

      const stats = proxyManager.getProxyStatsByName("CorsProxy.io");
      expect(stats).toBeDefined();
      expect(stats!.avgResponseTime).toBeGreaterThan(200); // Should be around 300ms average
      expect(stats!.avgResponseTime).toBeLessThan(400);
    });

    it("should provide overall proxy manager statistics", async () => {
      const mockContent =
        "<?xml version='1.0'?><rss><channel><title>Overall Stats</title></channel></rss>";

      // Make requests through different proxies
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockContent),
        })
        .mockRejectedValueOnce(new Error("Failed"))
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockContent),
        });

      const availableProxies = proxyManager.getAvailableProxies();

      // Successful request
      await proxyManager.tryProxy(
        availableProxies[0],
        "https://example.com/rss1.xml"
      );

      // Failed request
      try {
        await proxyManager.tryProxy(
          availableProxies[1],
          "https://example.com/rss2.xml"
        );
      } catch (error) {
        // Expected to fail
      }

      // Another successful request
      await proxyManager.tryProxy(
        availableProxies[2],
        "https://example.com/rss3.xml"
      );

      const overallStats = proxyManager.getOverallStats();
      expect(overallStats.totalProxies).toBeGreaterThan(0);
      expect(overallStats.totalRequests).toBe(3);
      expect(overallStats.totalSuccesses).toBe(2);
      expect(overallStats.totalFailures).toBe(1);
      expect(overallStats.averageResponseTime).toBeGreaterThan(0);
    });
  });

  describe("Proxy Configuration and Management", () => {
    it("should allow disabling and enabling proxies", async () => {
      const initialProxies = proxyManager.getAvailableProxies();
      const initialCount = initialProxies.length;

      // Disable a proxy
      proxyManager.disableProxy("AllOrigins");

      const proxiesAfterDisable = proxyManager.getAvailableProxies();
      expect(proxiesAfterDisable.length).toBe(initialCount - 1);
      expect(
        proxiesAfterDisable.find((p) => p.name === "AllOrigins")
      ).toBeUndefined();

      // Re-enable the proxy
      proxyManager.enableProxy("AllOrigins");

      const proxiesAfterEnable = proxyManager.getAvailableProxies();
      expect(proxiesAfterEnable.length).toBe(initialCount);
      expect(
        proxiesAfterEnable.find((p) => p.name === "AllOrigins")
      ).toBeDefined();
    });

    it("should handle timeout configurations correctly", async () => {
      const availableProxies = proxyManager.getAvailableProxies();
      const corsAnywhereProxy = availableProxies.find(
        (p) => p.name === "CORS Anywhere"
      );

      expect(corsAnywhereProxy).toBeDefined();
      expect(corsAnywhereProxy!.timeout).toBe(12000); // 12 seconds as configured

      // Mock a slow response that should timeout
      mockFetch.mockImplementationOnce(
        () =>
          new Promise(
            (resolve) =>
              setTimeout(
                () =>
                  resolve({
                    ok: true,
                    text: () => Promise.resolve("slow response"),
                  }),
                15000
              ) // 15 seconds - should timeout
          )
      );

      const startTime = Date.now();

      await expect(
        proxyManager.tryProxy(
          corsAnywhereProxy!,
          "https://slow-site.com/rss.xml"
        )
      ).rejects.toThrow();

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(13000); // Should timeout before 13 seconds
    });

    it("should create custom proxy manager instances", () => {
      const customConfig = {
        maxRetries: 5,
        defaultTimeout: 15000,
        failureThreshold: 5,
      };

      const customManager = new ProxyManager(customConfig);
      const config = customManager.getConfiguration();

      expect(config.maxRetries).toBe(5);
      expect(config.defaultTimeout).toBe(15000);
      expect(config.failureThreshold).toBe(5);

      customManager.destroy();
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle malformed proxy responses", async () => {
      // Mock malformed JSON response from AllOrigins
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve("{ invalid json }"),
      });

      const availableProxies = proxyManager.getAvailableProxies();
      const allOriginsProxy = availableProxies.find(
        (p) => p.name === "AllOrigins"
      );

      await expect(
        proxyManager.tryProxy(allOriginsProxy!, "https://example.com/rss.xml")
      ).rejects.toThrow();
    });

    it("should handle HTTP error responses from proxies", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: () => Promise.resolve("Server Error"),
      });

      const availableProxies = proxyManager.getAvailableProxies();
      const corsProxyIo = availableProxies.find(
        (p) => p.name === "CorsProxy.io"
      );

      await expect(
        proxyManager.tryProxy(corsProxyIo!, "https://example.com/rss.xml")
      ).rejects.toThrow("HTTP 500: Internal Server Error");
    });

    it("should handle network timeouts gracefully", async () => {
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new DOMException("Aborted", "AbortError")),
              100
            )
          )
      );

      const availableProxies = proxyManager.getAvailableProxies();
      const testProxy = availableProxies[0];

      await expect(
        proxyManager.tryProxy(testProxy, "https://timeout-test.com/rss.xml")
      ).rejects.toThrow();
    });

    it("should handle concurrent proxy requests safely", async () => {
      const mockContent =
        "<?xml version='1.0'?><rss><channel><title>Concurrent</title></channel></rss>";

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockContent),
      });

      const availableProxies = proxyManager.getAvailableProxies();
      const testProxy = availableProxies[0];

      const promises = Array.from({ length: 10 }, (_, i) =>
        proxyManager.tryProxy(testProxy, `https://example.com/feed${i}.xml`)
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      expect(results.every((r) => r === mockContent)).toBe(true);

      const stats = proxyManager.getProxyStatsByName(testProxy.name);
      expect(stats!.totalRequests).toBe(10);
      expect(stats!.success).toBe(10);
    });
  });

  describe("Utility Functions", () => {
    it("should return correct proxy status icons", () => {
      expect(getProxyStatusIcon(true)).toBe("🟢");
      expect(getProxyStatusIcon(false)).toBe("🔴");
    });

    it("should return correct health colors", () => {
      expect(getProxyHealthColor(0.9)).toBe("text-green-500");
      expect(getProxyHealthColor(0.7)).toBe("text-yellow-500");
      expect(getProxyHealthColor(0.5)).toBe("text-orange-500");
      expect(getProxyHealthColor(0.3)).toBe("text-red-500");
    });

    it("should format proxy statistics correctly", () => {
      const mockStats = {
        success: 8,
        failures: 2,
        totalRequests: 10,
        avgResponseTime: 250,
        lastUsed: Date.now(),
        lastSuccess: Date.now(),
        lastFailure: Date.now() - 1000,
        consecutiveFailures: 0,
        healthScore: 0.8,
      };

      const formatted = formatProxyStats(mockStats);
      expect(formatted).toBe("80% success (10 requests)");
    });

    it("should provide proxy recommendations", () => {
      expect(getProxyRecommendation({ healthScore: 0.9 } as any)).toBe(
        "Excellent"
      );
      expect(getProxyRecommendation({ healthScore: 0.7 } as any)).toBe("Good");
      expect(getProxyRecommendation({ healthScore: 0.5 } as any)).toBe("Fair");
      expect(getProxyRecommendation({ healthScore: 0.3 } as any)).toBe("Poor");
    });
  });

  describe("Integration with Feed Validator", () => {
    it("should integrate seamlessly with feed validation process", async () => {
      const mockFeedContent = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>Integration Test Feed</title>
            <description>Testing proxy integration</description>
          </channel>
        </rss>`;

      // Mock successful proxy response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockFeedContent),
      });

      const result = await proxyManager.tryProxiesWithFailover(
        "https://example.com/rss.xml"
      );

      expect(result.content).toBe(mockFeedContent);
      expect(result.proxyUsed).toBeDefined();
      expect(result.attempts).toBeDefined();

      // Verify proxy statistics were updated
      const stats = proxyManager.getProxyStatsByName(result.proxyUsed);
      expect(stats).toBeDefined();
      expect(stats!.success).toBeGreaterThan(0);
    });

    it("should provide detailed attempt information for debugging", async () => {
      const mockContent =
        "<?xml version='1.0'?><rss><channel><title>Debug Test</title></channel></rss>";

      // First proxy fails, second succeeds
      mockFetch
        .mockRejectedValueOnce(new Error("First proxy failed"))
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockContent),
        });

      const result = await proxyManager.tryProxiesWithFailover(
        "https://example.com/rss.xml"
      );

      expect(result.attempts).toBeDefined();
      expect(result.attempts.length).toBeGreaterThan(0);

      // Should have information about both successful and failed attempts
      const failedAttempts = result.attempts.filter((a) => !a.success);
      const successfulAttempts = result.attempts.filter((a) => a.success);

      expect(failedAttempts.length).toBeGreaterThan(0);
      expect(successfulAttempts.length).toBeGreaterThan(0);
    });
  });
});

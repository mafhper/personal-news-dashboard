import { describe, it, expect, vi, beforeEach } from "vitest";
import { feedValidator } from "../services/feedValidator";
import { proxyManager } from "../services/proxyManager";

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Debug Proxy Test", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should debug proxy fallback", async () => {
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

    console.log("=== DEBUG RESULT ===");
    console.log("isValid:", result.isValid);
    console.log("status:", result.status);
    console.log("title:", result.title);
    console.log("error:", result.error);
    console.log("finalError:", result.finalError);
    console.log(
      "validationAttempts:",
      result.validationAttempts.map((a) => ({
        method: a.method,
        success: a.success,
        error: a.error?.type,
        errorMessage: a.error?.message,
      }))
    );
    console.log("===================");

    // Test comprehensive error information
    mockFetch.mockReset();
    mockFetch.mockRejectedValue(new Error("Complete network failure"));

    vi.spyOn(proxyManager, "tryProxiesWithFailover").mockRejectedValue(
      new Error("All proxies failed")
    );

    const result2 = await feedValidator.validateFeedWithDiscovery(
      "https://completely-broken.com/feed.xml"
    );

    // Debug by throwing the result
    throw new Error(
      `DEBUG COMPREHENSIVE ERROR: isValid: ${result2.isValid}, status: ${
        result2.status
      }, error: ${result2.error}, finalError: ${
        result2.finalError ? "DEFINED" : "UNDEFINED"
      }, finalMethod: ${
        result2.finalMethod
      }, validationAttempts: ${JSON.stringify(
        result2.validationAttempts.map((a) => ({
          method: a.method,
          success: a.success,
          error: a.error?.type,
          errorMessage: a.error?.message,
        })),
        null,
        2
      )}`
    );

    expect(result.isValid).toBe(true);
  });
});

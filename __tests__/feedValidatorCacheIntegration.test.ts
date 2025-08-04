/**
 * feedValidatorCacheIntegration.test.ts
 *
 * Integration tests to verify FeedValidator properly uses SmartValidationCache
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { feedValidator } from "../services/feedValidator";
import { smartValidationCache } from "../services/smartValidationCache";

describe("FeedValidator SmartValidationCache Integration", () => {
  beforeEach(() => {
    // Clear cache before each test
    feedValidator.clearCache();
  });

  it("should use SmartValidationCache for caching validation results", async () => {
    const testUrl = "https://example.com/feed.xml";

    // Mock fetch to return a valid RSS feed
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      text: () =>
        Promise.resolve(`
        <?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <title>Test Feed</title>
            <description>Test Description</description>
            <item>
              <title>Test Item</title>
              <description>Test Item Description</description>
            </item>
          </channel>
        </rss>
      `),
    });

    // First validation should hit the network
    const result1 = await feedValidator.validateFeed(testUrl);
    expect(result1.isValid).toBe(true);
    expect(result1.title).toBe("Test Feed");

    // Second validation should use cache
    const result2 = await feedValidator.validateFeed(testUrl);
    expect(result2.isValid).toBe(true);
    expect(result2.title).toBe("Test Feed");

    // Verify fetch was only called once (second call used cache)
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("should provide cache statistics", () => {
    const stats = feedValidator.getCacheStats();

    expect(stats).toBeDefined();
    expect(typeof stats.totalEntries).toBe("number");
    expect(typeof stats.totalSize).toBe("number");
    expect(typeof stats.hitCount).toBe("number");
    expect(typeof stats.missCount).toBe("number");
    expect(typeof stats.hitRate).toBe("number");
  });

  it("should allow manual cache refresh", async () => {
    const testUrl = "https://example.com/feed.xml";

    // Mock fetch to return a valid RSS feed
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      text: () =>
        Promise.resolve(`
        <?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <title>Test Feed</title>
            <description>Test Description</description>
          </channel>
        </rss>
      `),
    });

    // First validation
    await feedValidator.validateFeed(testUrl);

    // Refresh cache entry
    const refreshed = feedValidator.refreshCachedResult(testUrl);
    expect(refreshed).toBe(true);

    // Next validation should hit network again due to refresh
    await feedValidator.validateFeed(testUrl);

    // Should have been called twice due to refresh
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("should clear validation cache using pattern matching", async () => {
    const testUrl1 = "https://example1.com/feed.xml";
    const testUrl2 = "https://example2.com/feed.xml";

    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      text: () =>
        Promise.resolve(`
        <?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <title>Test Feed</title>
            <description>Test Description</description>
          </channel>
        </rss>
      `),
    });

    // Validate both feeds to cache them
    await feedValidator.validateFeed(testUrl1);
    await feedValidator.validateFeed(testUrl2);

    // Clear cache
    feedValidator.clearCache();

    // Next validations should hit network again
    await feedValidator.validateFeed(testUrl1);
    await feedValidator.validateFeed(testUrl2);

    // Should have been called 4 times total (2 initial + 2 after clear)
    expect(fetch).toHaveBeenCalledTimes(4);
  });

  it("should use different TTL strategies for success and failure results", async () => {
    const successUrl = "https://success.com/feed.xml";
    const failureUrl = "https://failure.com/feed.xml";

    // Mock successful response
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        status: 200,
        text: () =>
          Promise.resolve(`
          <?xml version="1.0" encoding="UTF-8"?>
          <rss version="2.0">
            <channel>
              <title>Success Feed</title>
              <description>Success Description</description>
            </channel>
          </rss>
        `),
      })
      // Mock failure response
      .mockResolvedValueOnce({
        status: 404,
        statusText: "Not Found",
      });

    // Validate success case
    const successResult = await feedValidator.validateFeed(successUrl);
    expect(successResult.isValid).toBe(true);

    // Validate failure case
    const failureResult = await feedValidator.validateFeed(failureUrl);
    expect(failureResult.isValid).toBe(false);

    // Check that both results are cached
    const stats = feedValidator.getCacheStats();
    expect(stats.totalEntries).toBeGreaterThanOrEqual(2);

    // Verify TTL distribution shows both success and failure entries
    expect(stats.ttlDistribution.success).toBeGreaterThanOrEqual(1);
    expect(stats.ttlDistribution.failure).toBeGreaterThanOrEqual(1);
  });
});

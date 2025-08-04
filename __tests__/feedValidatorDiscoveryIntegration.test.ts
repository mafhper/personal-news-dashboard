/**
 * feedValidatorDiscoveryIntegration.test.ts
 *
 * Tests for the integration between feed validation and feed discovery services.
 * Verifies that the enhanced validation flow correctly attempts discovery when
 * direct validation fails and handles user selection scenarios.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  feedValidator,
  type FeedValidationResult,
} from "../services/feedValidator";
import {
  feedDiscoveryService,
  type DiscoveredFeed,
  type FeedDiscoveryResult,
} from "../services/feedDiscoveryService";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Feed Validator Discovery Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    feedValidator.clearCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("validateFeedWithDiscovery", () => {
    it("should return direct validation result when feed is valid", async () => {
      // Mock successful direct validation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => `<?xml version="1.0"?>
          <rss version="2.0">
            <channel>
              <title>Test Feed</title>
              <description>Test Description</description>
              <item>
                <title>Test Item</title>
                <link>https://example.com/item1</link>
              </item>
            </channel>
          </rss>`,
      });

      const progressCallback = vi.fn();
      const result = await feedValidator.validateFeedWithDiscovery(
        "https://example.com/feed.xml",
        progressCallback
      );

      expect(result.isValid).toBe(true);
      expect(result.status).toBe("valid");
      expect(result.finalMethod).toBe("direct");
      expect(result.title).toBe("Test Feed");
      expect(progressCallback).toHaveBeenCalledWith(
        "Starting validation...",
        10
      );
      expect(progressCallback).toHaveBeenCalledWith(
        "Validation successful",
        100
      );
    });

    it("should attempt discovery when direct validation fails", async () => {
      // Mock failed direct validation
      mockFetch.mockRejectedValueOnce(new Error("CORS error"));

      // Mock discovery service
      const mockDiscoveryResult: FeedDiscoveryResult = {
        originalUrl: "https://example.com",
        discoveredFeeds: [],
        discoveryMethods: ["common-paths", "html-parsing"],
        totalAttempts: 5,
        successfulAttempts: 0,
        discoveryTime: 1000,
        suggestions: ["No RSS feeds found on this website"],
      };

      vi.spyOn(feedDiscoveryService, "discoverFromWebsite").mockResolvedValue(
        mockDiscoveryResult
      );

      const progressCallback = vi.fn();
      const result = await feedValidator.validateFeedWithDiscovery(
        "https://example.com",
        progressCallback
      );

      expect(result.isValid).toBe(false);
      expect(result.status).toBe("discovery_required");
      expect(result.finalMethod).toBe("discovery");
      expect(result.discoveryResult).toEqual(mockDiscoveryResult);
      expect(progressCallback).toHaveBeenCalledWith(
        "Direct validation failed, attempting discovery...",
        30
      );
      expect(progressCallback).toHaveBeenCalledWith("Discovery completed", 70);
    });

    it("should auto-validate single discovered feed", async () => {
      // Clear cache to ensure fresh test
      feedValidator.clearCache();

      // Mock failed direct validation (all retries fail)
      mockFetch
        .mockRejectedValueOnce(new Error("CORS error"))
        .mockRejectedValueOnce(new Error("CORS error"))
        .mockRejectedValueOnce(new Error("CORS error"))
        .mockRejectedValueOnce(new Error("CORS error")); // For proxy attempt

      const discoveredFeed: DiscoveredFeed = {
        url: "https://example.com/rss.xml",
        title: "Discovered Feed",
        description: "A discovered RSS feed",
        type: "rss",
        discoveryMethod: "link-tag",
        confidence: 0.9,
        lastValidated: Date.now(),
      };

      const mockDiscoveryResult: FeedDiscoveryResult = {
        originalUrl: "https://example.com",
        discoveredFeeds: [discoveredFeed],
        discoveryMethods: ["html-parsing"],
        totalAttempts: 1,
        successfulAttempts: 1,
        discoveryTime: 500,
        suggestions: ["Found one RSS feed on this website"],
      };

      vi.spyOn(feedDiscoveryService, "discoverFromWebsite").mockResolvedValue(
        mockDiscoveryResult
      );

      // Mock successful validation of discovered feed
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => `<?xml version="1.0"?>
          <rss version="2.0">
            <channel>
              <title>Discovered Feed</title>
              <description>A discovered RSS feed</description>
            </channel>
          </rss>`,
      });

      const progressCallback = vi.fn();
      const result = await feedValidator.validateFeedWithDiscovery(
        "https://example.com",
        progressCallback
      );

      expect(result.isValid).toBe(true);
      expect(result.status).toBe("valid");
      expect(result.finalMethod).toBe("discovery");
      expect(result.url).toBe("https://example.com/rss.xml"); // Should use discovered URL
      expect(result.title).toBe("Discovered Feed");
      expect(progressCallback).toHaveBeenCalledWith(
        "Validating discovered feed...",
        90
      );
      expect(progressCallback).toHaveBeenCalledWith(
        "Discovery process completed",
        100
      );
    });

    it("should require user selection for multiple discovered feeds", async () => {
      // Mock failed direct validation
      mockFetch.mockRejectedValueOnce(new Error("CORS error"));

      const discoveredFeeds: DiscoveredFeed[] = [
        {
          url: "https://example.com/rss.xml",
          title: "Main Feed",
          type: "rss",
          discoveryMethod: "link-tag",
          confidence: 0.9,
        },
        {
          url: "https://example.com/atom.xml",
          title: "Atom Feed",
          type: "atom",
          discoveryMethod: "link-tag",
          confidence: 0.8,
        },
      ];

      const mockDiscoveryResult: FeedDiscoveryResult = {
        originalUrl: "https://example.com",
        discoveredFeeds,
        discoveryMethods: ["html-parsing"],
        totalAttempts: 1,
        successfulAttempts: 1,
        discoveryTime: 500,
        suggestions: [
          "Found 2 RSS feeds on this website",
          "Choose the feed that best matches your interests",
        ],
      };

      vi.spyOn(feedDiscoveryService, "discoverFromWebsite").mockResolvedValue(
        mockDiscoveryResult
      );

      const result = await feedValidator.validateFeedWithDiscovery(
        "https://example.com"
      );

      expect(result.isValid).toBe(false);
      expect(result.status).toBe("discovery_required");
      expect(result.requiresUserSelection).toBe(true);
      expect(result.discoveredFeeds).toHaveLength(2);
      expect(result.error).toContain(
        "Found 2 RSS feeds - user selection required"
      );
    });

    it("should handle discovery failure gracefully", async () => {
      // Mock failed direct validation
      mockFetch.mockRejectedValueOnce(new Error("CORS error"));

      // Mock discovery failure
      vi.spyOn(feedDiscoveryService, "discoverFromWebsite").mockRejectedValue(
        new Error("Discovery service unavailable")
      );

      const progressCallback = vi.fn();
      const result = await feedValidator.validateFeedWithDiscovery(
        "https://example.com",
        progressCallback
      );

      expect(result.isValid).toBe(false);
      expect(result.status).toBe("invalid");
      expect(result.finalMethod).toBe("discovery");
      expect(result.error).toContain("Feed discovery failed");
      expect(progressCallback).toHaveBeenCalledWith("Discovery failed", 100);
    });
  });

  describe("validateDiscoveredFeed", () => {
    it("should validate a selected discovered feed", async () => {
      const discoveredFeed: DiscoveredFeed = {
        url: "https://example.com/selected-feed.xml",
        title: "Selected Feed",
        description: "User selected feed",
        type: "rss",
        discoveryMethod: "link-tag",
        confidence: 0.9,
      };

      // Mock successful validation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => `<?xml version="1.0"?>
          <rss version="2.0">
            <channel>
              <title>Selected Feed</title>
              <description>User selected feed</description>
            </channel>
          </rss>`,
      });

      const result = await feedValidator.validateDiscoveredFeed(
        discoveredFeed,
        "https://example.com"
      );

      expect(result.isValid).toBe(true);
      expect(result.status).toBe("valid");
      expect(result.finalMethod).toBe("discovery");
      expect(result.discoveredFeeds).toHaveLength(1);
      expect(result.suggestions).toContain(
        "Feed selected from discovery results for https://example.com"
      );
      expect(result.suggestions).toContain("Discovery method: link-tag");
      expect(result.suggestions).toContain("Confidence: 90%");
    });

    it("should handle validation failure of discovered feed", async () => {
      const discoveredFeed: DiscoveredFeed = {
        url: "https://example.com/invalid-feed.xml",
        title: "Invalid Feed",
        type: "rss",
        discoveryMethod: "common-path",
        confidence: 0.7,
      };

      // Mock failed validation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => "Not a valid RSS feed",
      });

      const result = await feedValidator.validateDiscoveredFeed(
        discoveredFeed,
        "https://example.com"
      );

      expect(result.isValid).toBe(false);
      expect(result.finalMethod).toBe("discovery");
      expect(result.discoveredFeeds).toHaveLength(1);
    });
  });

  describe("progress tracking", () => {
    it("should call progress callback with appropriate stages", async () => {
      // Mock failed direct validation (multiple retries)
      mockFetch
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"));

      // Mock discovery with single feed
      const discoveredFeed: DiscoveredFeed = {
        url: "https://example.com/feed.xml",
        title: "Test Feed",
        type: "rss",
        discoveryMethod: "common-path",
        confidence: 0.8,
      };

      vi.spyOn(feedDiscoveryService, "discoverFromWebsite").mockResolvedValue({
        originalUrl: "https://example.com",
        discoveredFeeds: [discoveredFeed],
        discoveryMethods: ["common-paths"],
        totalAttempts: 1,
        successfulAttempts: 1,
        discoveryTime: 300,
        suggestions: [],
      });

      // Mock successful validation of discovered feed
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => `<?xml version="1.0"?>
          <rss version="2.0">
            <channel>
              <title>Test Feed</title>
            </channel>
          </rss>`,
      });

      const progressCallback = vi.fn();
      await feedValidator.validateFeedWithDiscovery(
        "https://example.com",
        progressCallback
      );

      expect(progressCallback).toHaveBeenCalledWith(
        "Starting validation...",
        10
      );
      expect(progressCallback).toHaveBeenCalledWith(
        "Direct validation failed, attempting discovery...",
        30
      );
      expect(progressCallback).toHaveBeenCalledWith("Discovery completed", 70);
      expect(progressCallback).toHaveBeenCalledWith(
        "Validating discovered feed...",
        90
      );
      expect(progressCallback).toHaveBeenCalledWith(
        "Discovery process completed",
        100
      );
    });
  });

  describe("caching behavior", () => {
    it("should cache discovery results", async () => {
      // Mock failed direct validation
      mockFetch.mockRejectedValueOnce(new Error("CORS error"));

      const mockDiscoveryResult: FeedDiscoveryResult = {
        originalUrl: "https://example.com",
        discoveredFeeds: [],
        discoveryMethods: ["common-paths"],
        totalAttempts: 1,
        successfulAttempts: 0,
        discoveryTime: 100,
        suggestions: ["No feeds found"],
      };

      vi.spyOn(feedDiscoveryService, "discoverFromWebsite").mockResolvedValue(
        mockDiscoveryResult
      );

      // First call
      const result1 = await feedValidator.validateFeedWithDiscovery(
        "https://example.com"
      );

      // Second call should return cached result
      const result2 = await feedValidator.validateFeedWithDiscovery(
        "https://example.com"
      );

      expect(result1).toEqual(result2);
      expect(feedDiscoveryService.discoverFromWebsite).toHaveBeenCalledTimes(1);
    });

    it("should not cache results that require user selection", async () => {
      // Mock failed direct validation
      mockFetch.mockRejectedValueOnce(new Error("CORS error"));
      mockFetch.mockRejectedValueOnce(new Error("CORS error"));

      const discoveredFeeds: DiscoveredFeed[] = [
        {
          url: "https://example.com/feed1.xml",
          title: "Feed 1",
          type: "rss",
          discoveryMethod: "link-tag",
          confidence: 0.9,
        },
        {
          url: "https://example.com/feed2.xml",
          title: "Feed 2",
          type: "atom",
          discoveryMethod: "link-tag",
          confidence: 0.8,
        },
      ];

      const mockDiscoveryResult: FeedDiscoveryResult = {
        originalUrl: "https://example.com",
        discoveredFeeds,
        discoveryMethods: ["html-parsing"],
        totalAttempts: 1,
        successfulAttempts: 1,
        discoveryTime: 200,
        suggestions: [],
      };

      vi.spyOn(feedDiscoveryService, "discoverFromWebsite").mockResolvedValue(
        mockDiscoveryResult
      );

      // First call
      const result1 = await feedValidator.validateFeedWithDiscovery(
        "https://example.com"
      );

      // Second call should not use cache for user selection scenarios
      const result2 = await feedValidator.validateFeedWithDiscovery(
        "https://example.com"
      );

      expect(result1.requiresUserSelection).toBe(true);
      expect(result2.requiresUserSelection).toBe(true);
      expect(feedDiscoveryService.discoverFromWebsite).toHaveBeenCalledTimes(2);
    });
  });
});

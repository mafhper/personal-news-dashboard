/**
 * Feed Duplicate Detection and Prevention Tests
 *
 * Tests for duplicate feed detection, URL normalization,
 * content fingerprinting, and duplicate resolution
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  feedDuplicateDetector,
  FeedDuplicateDetector,
} from "../services/feedDuplicateDetector";
import type { FeedSource } from "../types";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock feed validator
vi.mock("../services/feedValidator", () => ({
  feedValidator: {
    validateFeed: vi.fn(),
  },
}));

import { feedValidator } from "../services/feedValidator";

describe("Feed Duplicate Detection Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    feedDuplicateDetector.clearCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("URL Normalization", () => {
    it("should normalize URLs by removing www prefix", () => {
      const urls = [
        "https://www.example.com/feed.xml",
        "https://example.com/feed.xml",
        "http://www.example.com/feed.xml",
        "http://example.com/feed.xml",
      ];

      const normalized = urls.map((url) =>
        feedDuplicateDetector.normalizeUrl(url)
      );

      // All should normalize to the same URL (without www, https)
      expect(normalized[0]).toBe("https://example.com/feed.xml");
      expect(normalized[1]).toBe("https://example.com/feed.xml");
      expect(normalized[2]).toBe("http://example.com/feed.xml");
      expect(normalized[3]).toBe("http://example.com/feed.xml");
    });

    it("should normalize URLs by removing tracking parameters", () => {
      const urlWithTracking =
        "https://example.com/feed.xml?utm_source=test&utm_medium=email&utm_campaign=newsletter&ref=homepage&fbclid=123";
      const cleanUrl = "https://example.com/feed.xml?category=tech";

      const normalizedTracking =
        feedDuplicateDetector.normalizeUrl(urlWithTracking);
      const normalizedClean = feedDuplicateDetector.normalizeUrl(cleanUrl);

      expect(normalizedTracking).toBe("https://example.com/feed.xml");
      expect(normalizedClean).toBe(
        "https://example.com/feed.xml?category=tech"
      );
    });

    it("should normalize URLs by removing trailing slashes", () => {
      const urls = [
        "https://example.com/feed/",
        "https://example.com/feed",
        "https://example.com/",
        "https://example.com",
      ];

      const normalized = urls.map((url) =>
        feedDuplicateDetector.normalizeUrl(url)
      );

      expect(normalized[0]).toBe("https://example.com/feed");
      expect(normalized[1]).toBe("https://example.com/feed");
      expect(normalized[2]).toBe("https://example.com");
      expect(normalized[3]).toBe("https://example.com");
    });

    it("should sort query parameters for consistency", () => {
      const url1 = "https://example.com/feed.xml?b=2&a=1&c=3";
      const url2 = "https://example.com/feed.xml?a=1&b=2&c=3";
      const url3 = "https://example.com/feed.xml?c=3&a=1&b=2";

      const normalized1 = feedDuplicateDetector.normalizeUrl(url1);
      const normalized2 = feedDuplicateDetector.normalizeUrl(url2);
      const normalized3 = feedDuplicateDetector.normalizeUrl(url3);

      expect(normalized1).toBe(normalized2);
      expect(normalized2).toBe(normalized3);
      expect(normalized1).toBe("https://example.com/feed.xml?a=1&b=2&c=3");
    });

    it("should handle malformed URLs gracefully", () => {
      const malformedUrls = [
        "not-a-url",
        "ftp://example.com/feed.xml",
        "https://",
        "",
        "example.com/feed.xml",
      ];

      malformedUrls.forEach((url) => {
        expect(() => feedDuplicateDetector.normalizeUrl(url)).not.toThrow();
        const normalized = feedDuplicateDetector.normalizeUrl(url);
        expect(typeof normalized).toBe("string");
      });
    });
  });

  describe("Content Fingerprinting", () => {
    it("should generate fingerprints for RSS feeds", async () => {
      const mockValidationResult = {
        isValid: true,
        title: "Test RSS Feed",
        description: "A test RSS feed for fingerprinting",
      };

      (feedValidator.validateFeed as any).mockResolvedValueOnce(
        mockValidationResult
      );

      const fingerprint =
        await feedDuplicateDetector.generateContentFingerprint(
          "https://example.com/rss.xml"
        );

      expect(fingerprint).toBeDefined();
      expect(fingerprint!.url).toBe("https://example.com/rss.xml");
      expect(fingerprint!.title).toBe("Test RSS Feed");
      expect(fingerprint!.description).toBe(
        "A test RSS feed for fingerprinting"
      );
      expect(fingerprint!.contentHash).toBeDefined();
      expect(fingerprint!.normalizedUrl).toBe("https://example.com/rss.xml");
      expect(fingerprint!.lastUpdated).toBeGreaterThan(0);
    });

    it("should generate identical fingerprints for identical content", async () => {
      const mockValidationResult = {
        isValid: true,
        title: "Identical Feed",
        description: "Same content, different URLs",
      };

      (feedValidator.validateFeed as any).mockResolvedValue(
        mockValidationResult
      );

      const fingerprint1 =
        await feedDuplicateDetector.generateContentFingerprint(
          "https://example.com/feed1.xml"
        );
      const fingerprint2 =
        await feedDuplicateDetector.generateContentFingerprint(
          "https://example.com/feed2.xml"
        );

      expect(fingerprint1).toBeDefined();
      expect(fingerprint2).toBeDefined();
      expect(fingerprint1!.contentHash).toBe(fingerprint2!.contentHash);
    });

    it("should generate different fingerprints for different content", async () => {
      (feedValidator.validateFeed as any)
        .mockResolvedValueOnce({
          isValid: true,
          title: "Feed One",
          description: "First feed description",
        })
        .mockResolvedValueOnce({
          isValid: true,
          title: "Feed Two",
          description: "Second feed description",
        });

      const fingerprint1 =
        await feedDuplicateDetector.generateContentFingerprint(
          "https://example.com/feed1.xml"
        );
      const fingerprint2 =
        await feedDuplicateDetector.generateContentFingerprint(
          "https://example.com/feed2.xml"
        );

      expect(fingerprint1).toBeDefined();
      expect(fingerprint2).toBeDefined();
      expect(fingerprint1!.contentHash).not.toBe(fingerprint2!.contentHash);
    });

    it("should handle invalid feeds gracefully", async () => {
      (feedValidator.validateFeed as any).mockResolvedValueOnce({
        isValid: false,
        error: "Invalid feed format",
      });

      const fingerprint =
        await feedDuplicateDetector.generateContentFingerprint(
          "https://example.com/invalid.xml"
        );

      expect(fingerprint).toBeNull();
    });

    it("should cache fingerprints to improve performance", async () => {
      const mockValidationResult = {
        isValid: true,
        title: "Cached Feed",
        description: "This should be cached",
      };

      (feedValidator.validateFeed as any).mockResolvedValueOnce(
        mockValidationResult
      );

      const url = "https://example.com/cached.xml";

      // First call
      const fingerprint1 =
        await feedDuplicateDetector.generateContentFingerprint(url);

      // Second call should use cache
      const fingerprint2 =
        await feedDuplicateDetector.generateContentFingerprint(url);

      expect(fingerprint1).toBeDefined();
      expect(fingerprint2).toBeDefined();
      expect(fingerprint1!.contentHash).toBe(fingerprint2!.contentHash);
      expect(feedValidator.validateFeed).toHaveBeenCalledTimes(1); // Only called once due to caching
    });
  });

  describe("Duplicate Detection", () => {
    it("should detect duplicates by normalized URL", async () => {
      const existingFeeds: FeedSource[] = [
        {
          url: "https://www.example.com/feed.xml",
          customTitle: "Example Feed",
        },
        { url: "https://other.com/rss.xml", customTitle: "Other Feed" },
      ];

      const newFeedUrl = "https://example.com/feed.xml"; // Same as first, but without www

      const result = await feedDuplicateDetector.detectDuplicate(
        newFeedUrl,
        existingFeeds
      );

      expect(result.isDuplicate).toBe(true);
      expect(result.duplicateOf).toBe(existingFeeds[0]);
      expect(result.confidence).toBe(1.0);
      expect(result.reason).toBe("Identical normalized URLs");
      expect(result.normalizedUrl).toBe("https://example.com/feed.xml");
    });

    it("should detect duplicates by content fingerprint", async () => {
      const existingFeeds: FeedSource[] = [
        { url: "https://example.com/feed1.xml", customTitle: "Feed One" },
        { url: "https://example.com/feed2.xml", customTitle: "Feed Two" },
      ];

      const newFeedUrl = "https://different.com/rss.xml";

      // Mock identical content for existing and new feed
      const mockValidationResult = {
        isValid: true,
        title: "Same Content Feed",
        description: "Identical content, different URLs",
      };

      (feedValidator.validateFeed as any).mockResolvedValue(
        mockValidationResult
      );

      const result = await feedDuplicateDetector.detectDuplicate(
        newFeedUrl,
        existingFeeds
      );

      expect(result.isDuplicate).toBe(true);
      expect(result.duplicateOf).toBe(existingFeeds[0]);
      expect(result.confidence).toBe(0.95);
      expect(result.reason).toBe("Identical content fingerprint");
      expect(result.contentFingerprint).toBeDefined();
    });

    it("should detect duplicates by similar titles", async () => {
      const existingFeeds: FeedSource[] = [
        { url: "https://example.com/feed1.xml", customTitle: "Tech News Feed" },
      ];

      const newFeedUrl = "https://different.com/rss.xml";

      (feedValidator.validateFeed as any)
        .mockResolvedValueOnce({
          isValid: true,
          title: "Tech News Feed",
          description: "Existing feed description",
        })
        .mockResolvedValueOnce({
          isValid: true,
          title: "Tech News Feed",
          description: "New feed description",
        });

      const result = await feedDuplicateDetector.detectDuplicate(
        newFeedUrl,
        existingFeeds
      );

      expect(result.isDuplicate).toBe(true);
      expect(result.duplicateOf).toBe(existingFeeds[0]);
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.reason).toContain("Very similar titles");
    });

    it("should not detect false positives", async () => {
      const existingFeeds: FeedSource[] = [
        { url: "https://example.com/feed.xml", customTitle: "Example Feed" },
        { url: "https://other.com/rss.xml", customTitle: "Other Feed" },
      ];

      const newFeedUrl = "https://completely-different.com/news.xml";

      (feedValidator.validateFeed as any)
        .mockResolvedValueOnce({
          isValid: true,
          title: "Example Feed Title",
          description: "Example feed description",
        })
        .mockResolvedValueOnce({
          isValid: true,
          title: "Other Feed Title",
          description: "Other feed description",
        })
        .mockResolvedValueOnce({
          isValid: true,
          title: "Completely Different Feed",
          description: "Totally different content",
        });

      const result = await feedDuplicateDetector.detectDuplicate(
        newFeedUrl,
        existingFeeds
      );

      expect(result.isDuplicate).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.reason).toBe("No duplicates detected");
    });

    it("should handle validation failures gracefully", async () => {
      const existingFeeds: FeedSource[] = [
        { url: "https://example.com/feed.xml", customTitle: "Example Feed" },
      ];

      const newFeedUrl = "https://invalid.com/feed.xml";

      (feedValidator.validateFeed as any).mockResolvedValueOnce({
        isValid: false,
        error: "Invalid feed",
      });

      const result = await feedDuplicateDetector.detectDuplicate(
        newFeedUrl,
        existingFeeds
      );

      expect(result.isDuplicate).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.reason).toBe("Unable to generate content fingerprint");
    });
  });

  describe("Duplicate Group Detection", () => {
    it("should find duplicate groups in feed list", async () => {
      const feeds: FeedSource[] = [
        { url: "https://example.com/feed1.xml", customTitle: "Feed 1" },
        {
          url: "https://www.example.com/feed1.xml",
          customTitle: "Feed 1 Duplicate",
        }, // Same as above
        { url: "https://other.com/rss.xml", customTitle: "Other Feed" },
        {
          url: "https://different.com/feed.xml",
          customTitle: "Different Feed",
        },
        {
          url: "https://other.com/rss.xml?utm_source=test",
          customTitle: "Other Feed Duplicate",
        }, // Same as other.com
      ];

      // Mock validation results
      (feedValidator.validateFeed as any)
        .mockResolvedValueOnce({
          isValid: true,
          title: "Example Feed",
          description: "Example description",
        })
        .mockResolvedValueOnce({
          isValid: true,
          title: "Other Feed",
          description: "Other description",
        })
        .mockResolvedValueOnce({
          isValid: true,
          title: "Different Feed",
          description: "Different description",
        });

      const duplicateGroups = await feedDuplicateDetector.findDuplicateGroups(
        feeds
      );

      expect(duplicateGroups).toHaveLength(2); // Two groups of duplicates

      // Check first group (example.com feeds)
      const exampleGroup = duplicateGroups.find((g) =>
        g.feeds.some((f) => f.url.includes("example.com"))
      );
      expect(exampleGroup).toBeDefined();
      expect(exampleGroup!.feeds).toHaveLength(2);

      // Check second group (other.com feeds)
      const otherGroup = duplicateGroups.find((g) =>
        g.feeds.some((f) => f.url.includes("other.com"))
      );
      expect(otherGroup).toBeDefined();
      expect(otherGroup!.feeds).toHaveLength(2);
    });

    it("should handle feeds with no duplicates", async () => {
      const feeds: FeedSource[] = [
        { url: "https://unique1.com/feed.xml", customTitle: "Unique 1" },
        { url: "https://unique2.com/feed.xml", customTitle: "Unique 2" },
        { url: "https://unique3.com/feed.xml", customTitle: "Unique 3" },
      ];

      (feedValidator.validateFeed as any).mockResolvedValue({
        isValid: true,
        title: "Unique Feed",
        description: "Each feed is unique",
      });

      const duplicateGroups = await feedDuplicateDetector.findDuplicateGroups(
        feeds
      );

      expect(duplicateGroups).toHaveLength(0);
    });
  });

  describe("Duplicate Removal", () => {
    it("should remove duplicates keeping first occurrence", async () => {
      const feeds: FeedSource[] = [
        { url: "https://example.com/feed.xml", customTitle: "Original Feed" },
        {
          url: "https://www.example.com/feed.xml",
          customTitle: "Duplicate Feed",
        },
        { url: "https://unique.com/feed.xml", customTitle: "Unique Feed" },
      ];

      (feedValidator.validateFeed as any).mockResolvedValue({
        isValid: true,
        title: "Test Feed",
        description: "Test description",
      });

      const result = await feedDuplicateDetector.removeDuplicates(feeds, {
        action: "keep_first",
      });

      expect(result.uniqueFeeds).toHaveLength(2);
      expect(result.removedDuplicates).toHaveLength(1);

      // Should keep the first occurrence
      const keptFeed = result.uniqueFeeds.find((f) =>
        f.url.includes("example.com")
      );
      expect(keptFeed).toBeDefined();
      expect(keptFeed!.customTitle).toBe("Original Feed");

      // Should remove the duplicate
      expect(result.removedDuplicates[0].originalFeed.customTitle).toBe(
        "Duplicate Feed"
      );
      expect(result.removedDuplicates[0].duplicateOf.customTitle).toBe(
        "Original Feed"
      );
    });

    it("should remove duplicates keeping last occurrence", async () => {
      const feeds: FeedSource[] = [
        { url: "https://example.com/feed.xml", customTitle: "Original Feed" },
        { url: "https://www.example.com/feed.xml", customTitle: "Latest Feed" },
        { url: "https://unique.com/feed.xml", customTitle: "Unique Feed" },
      ];

      (feedValidator.validateFeed as any).mockResolvedValue({
        isValid: true,
        title: "Test Feed",
        description: "Test description",
      });

      const result = await feedDuplicateDetector.removeDuplicates(feeds, {
        action: "keep_last",
      });

      expect(result.uniqueFeeds).toHaveLength(2);
      expect(result.removedDuplicates).toHaveLength(1);

      // Should keep the last occurrence
      const keptFeed = result.uniqueFeeds.find(
        (f) => f.customTitle === "Latest Feed"
      );
      expect(keptFeed).toBeDefined();

      // Should remove the original
      expect(result.removedDuplicates[0].originalFeed.customTitle).toBe(
        "Original Feed"
      );
    });

    it("should merge duplicate feeds when requested", async () => {
      const feeds: FeedSource[] = [
        {
          url: "https://example.com/feed.xml",
          customTitle: "Original Title",
          categoryId: "tech",
        },
        {
          url: "https://www.example.com/feed.xml",
          customTitle: "Alternative Title",
          categoryId: "news",
        },
      ];

      (feedValidator.validateFeed as any).mockResolvedValue({
        isValid: true,
        title: "Test Feed",
        description: "Test description",
      });

      const result = await feedDuplicateDetector.removeDuplicates(feeds, {
        action: "merge",
        mergeCustomTitles: true,
        mergeCategories: true,
      });

      expect(result.uniqueFeeds).toHaveLength(1);
      expect(result.removedDuplicates).toHaveLength(1);

      const mergedFeed = result.uniqueFeeds[0];
      expect(mergedFeed.customTitle).toBe("Original Title / Alternative Title");
      expect(mergedFeed.categoryId).toBe("tech"); // Should use first non-empty category
    });

    it("should handle user selection for duplicate resolution", async () => {
      const feeds: FeedSource[] = [
        { url: "https://example.com/feed.xml", customTitle: "Feed A" },
        { url: "https://www.example.com/feed.xml", customTitle: "Feed B" },
      ];

      const preferredFeed = feeds[1]; // User prefers Feed B

      (feedValidator.validateFeed as any).mockResolvedValue({
        isValid: true,
        title: "Test Feed",
        description: "Test description",
      });

      const result = await feedDuplicateDetector.removeDuplicates(feeds, {
        action: "user_select",
        preferredFeed,
      });

      expect(result.uniqueFeeds).toHaveLength(1);
      expect(result.uniqueFeeds[0]).toBe(preferredFeed);
      expect(result.removedDuplicates).toHaveLength(1);
      expect(result.removedDuplicates[0].originalFeed.customTitle).toBe(
        "Feed A"
      );
    });
  });

  describe("String Similarity", () => {
    it("should calculate string similarity correctly", () => {
      const detector = new FeedDuplicateDetector();

      // Access private method for testing
      const calculateSimilarity = (
        detector as any
      ).calculateStringSimilarity.bind(detector);

      // Identical strings
      expect(calculateSimilarity("hello", "hello")).toBe(1.0);

      // Completely different strings
      expect(calculateSimilarity("hello", "world")).toBeLessThan(0.5);

      // Similar strings
      expect(calculateSimilarity("hello world", "hello word")).toBeGreaterThan(
        0.8
      );

      // Empty strings
      expect(calculateSimilarity("", "")).toBe(1.0);
      expect(calculateSimilarity("hello", "")).toBe(0.0);
      expect(calculateSimilarity("", "world")).toBe(0.0);

      // Case sensitivity
      expect(calculateSimilarity("Hello", "hello")).toBeGreaterThan(0.8);
    });
  });

  describe("Cache Management", () => {
    it("should provide cache statistics", () => {
      const stats = feedDuplicateDetector.getCacheStats();

      expect(stats).toBeDefined();
      expect(stats.size).toBeGreaterThanOrEqual(0);
      expect(typeof stats.oldestEntry).toBe("number");
      expect(typeof stats.newestEntry).toBe("number");
    });

    it("should clear cache when requested", async () => {
      // Add something to cache first
      const mockValidationResult = {
        isValid: true,
        title: "Cache Test Feed",
        description: "Testing cache functionality",
      };

      (feedValidator.validateFeed as any).mockResolvedValueOnce(
        mockValidationResult
      );

      await feedDuplicateDetector.generateContentFingerprint(
        "https://cache-test.com/feed.xml"
      );

      let stats = feedDuplicateDetector.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);

      feedDuplicateDetector.clearCache();

      stats = feedDuplicateDetector.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle empty feed lists", async () => {
      const result = await feedDuplicateDetector.detectDuplicate(
        "https://example.com/feed.xml",
        []
      );

      expect(result.isDuplicate).toBe(false);
      expect(result.confidence).toBe(0);
    });

    it("should handle feeds with missing titles", async () => {
      const existingFeeds: FeedSource[] = [
        { url: "https://example.com/feed.xml" }, // No custom title
      ];

      (feedValidator.validateFeed as any).mockResolvedValue({
        isValid: true,
        title: "", // Empty title
        description: "Feed with no title",
      });

      const result = await feedDuplicateDetector.detectDuplicate(
        "https://different.com/feed.xml",
        existingFeeds
      );

      expect(result.isDuplicate).toBe(false);
    });

    it("should handle network errors during fingerprinting", async () => {
      (feedValidator.validateFeed as any).mockRejectedValueOnce(
        new Error("Network error")
      );

      const fingerprint =
        await feedDuplicateDetector.generateContentFingerprint(
          "https://unreachable.com/feed.xml"
        );

      expect(fingerprint).toBeNull();
    });

    it("should handle very long titles and descriptions", async () => {
      const longTitle = "A".repeat(1000);
      const longDescription = "B".repeat(2000);

      (feedValidator.validateFeed as any).mockResolvedValueOnce({
        isValid: true,
        title: longTitle,
        description: longDescription,
      });

      const fingerprint =
        await feedDuplicateDetector.generateContentFingerprint(
          "https://long-content.com/feed.xml"
        );

      expect(fingerprint).toBeDefined();
      expect(fingerprint!.title).toBe(longTitle);
      expect(fingerprint!.description).toBe(longDescription);
      expect(fingerprint!.contentHash).toBeDefined();
    });

    it("should handle special characters in URLs and content", async () => {
      const specialUrl = "https://example.com/feed-with-special-chars-éñ.xml";
      const specialTitle = "Feed with Special Characters: éñüñ & symbols!";

      (feedValidator.validateFeed as any).mockResolvedValueOnce({
        isValid: true,
        title: specialTitle,
        description: "Description with special chars: ñáéíóú",
      });

      const fingerprint =
        await feedDuplicateDetector.generateContentFingerprint(specialUrl);

      expect(fingerprint).toBeDefined();
      expect(fingerprint!.url).toBe(specialUrl);
      expect(fingerprint!.title).toBe(specialTitle);
    });
  });
});

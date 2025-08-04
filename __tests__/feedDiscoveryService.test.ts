/**
 * feedDiscoveryService.test.ts
 *
 * Comprehensive tests for the feed discovery service functionality
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  feedDiscoveryService,
  DiscoveredFeed,
  FeedDiscoveryResult,
  getFeedTypeIcon,
  getFeedTypeColor,
  getDiscoveryMethodText,
  getConfidenceText,
  getConfidenceColor,
} from "../services/feedDiscoveryService";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper to create mock fetch responses for common paths
const createCommonPathMocks = (
  successPath?: string,
  successContent?: string
) => {
  const commonPaths = [
    "/rss.xml",
    "/feed.xml",
    "/atom.xml",
    "/rss",
    "/feed",
    "/feeds/all.atom.xml",
    "/feeds/posts/default",
    "/blog/rss.xml",
    "/blog/feed.xml",
    "/news/rss.xml",
    "/index.xml",
    "/feed/",
    "/rss/",
    "/feeds/",
    "/wp-rss2.php",
    "/wp-atom.php",
    "/wp-rdf.php",
  ];

  return commonPaths.map((path) => {
    if (successPath && path === successPath && successContent) {
      return mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(successContent),
      });
    } else {
      return mockFetch.mockRejectedValueOnce(new Error("Not found"));
    }
  });
};

describe("FeedDiscoveryService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("discoverFromWebsite", () => {
    it("should discover feeds from common paths", async () => {
      // Mock successful RSS feed response
      const mockRssContent = `<?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <title>Test Blog</title>
            <description>A test blog feed</description>
            <item>
              <title>Test Article</title>
              <description>Test content</description>
            </item>
          </channel>
        </rss>`;

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockRssContent),
        })
        .mockRejectedValue(new Error("Not found")); // Other paths fail

      const result = await feedDiscoveryService.discoverFromWebsite(
        "https://example.com"
      );

      expect(result.originalUrl).toBe("https://example.com");
      expect(result.discoveredFeeds).toHaveLength(1);
      expect(result.discoveredFeeds[0]).toMatchObject({
        url: "https://example.com/rss.xml",
        title: "Test Blog",
        description: "A test blog feed",
        type: "rss",
        discoveryMethod: "common-path",
      });
      expect(result.discoveredFeeds[0].confidence).toBeGreaterThan(0.8);
      expect(result.successfulAttempts).toBe(1);
    });

    it("should discover feeds from HTML link tags", async () => {
      const mockHtmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Test Website</title>
            <link rel="alternate" type="application/rss+xml" title="RSS Feed" href="/feed.xml">
            <link rel="alternate" type="application/atom+xml" title="Atom Feed" href="/atom.xml">
          </head>
          <body>Content</body>
        </html>`;

      const mockRssContent = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>RSS Feed Title</title>
            <description>RSS Feed Description</description>
          </channel>
        </rss>`;

      const mockAtomContent = `<?xml version="1.0" encoding="utf-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title>Atom Feed Title</title>
          <subtitle>Atom Feed Description</subtitle>
        </feed>`;

      // Mock all common paths to fail (17 paths)
      for (let i = 0; i < 17; i++) {
        mockFetch.mockRejectedValueOnce(new Error("Not found"));
      }

      // Then mock HTML content and feed content
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockHtmlContent),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockRssContent),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockAtomContent),
        });

      const result = await feedDiscoveryService.discoverFromWebsite(
        "https://example.com"
      );

      expect(result.discoveredFeeds.length).toBeGreaterThanOrEqual(2);

      const feedUrls = result.discoveredFeeds.map((f) => f.url);
      expect(feedUrls).toContain("https://example.com/feed.xml");
      expect(feedUrls).toContain("https://example.com/atom.xml");

      const rssFeeds = result.discoveredFeeds.filter(
        (f) => f.url === "https://example.com/feed.xml"
      );
      const atomFeeds = result.discoveredFeeds.filter(
        (f) => f.url === "https://example.com/atom.xml"
      );

      expect(rssFeeds).toHaveLength(1);
      expect(atomFeeds).toHaveLength(1);

      expect(rssFeeds[0]).toMatchObject({
        url: "https://example.com/feed.xml",
        title: "RSS Feed Title",
        description: "RSS Feed Description",
        type: "rss",
        discoveryMethod: "link-tag",
      });

      expect(atomFeeds[0]).toMatchObject({
        url: "https://example.com/atom.xml",
        title: "Atom Feed Title",
        description: "Atom Feed Description",
        type: "atom",
        discoveryMethod: "link-tag",
      });
    });

    it("should handle URLs without protocol", async () => {
      const mockRssContent = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>Test Feed</title>
            <description>Test Description</description>
          </channel>
        </rss>`;

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockRssContent),
        })
        .mockRejectedValue(new Error("Not found"));

      const result = await feedDiscoveryService.discoverFromWebsite(
        "example.com"
      );

      expect(result.originalUrl).toBe("example.com");
      expect(result.discoveredFeeds).toHaveLength(1);
      expect(result.discoveredFeeds[0].url).toBe("https://example.com/rss.xml");
    });

    it("should return empty results when no feeds are found", async () => {
      mockFetch.mockRejectedValue(new Error("Not found"));

      const result = await feedDiscoveryService.discoverFromWebsite(
        "https://example.com"
      );

      expect(result.discoveredFeeds).toHaveLength(0);
      expect(result.successfulAttempts).toBe(0);
      expect(result.suggestions).toContain(
        "No RSS feeds found on this website"
      );
    });

    it("should deduplicate feeds found by multiple methods", async () => {
      const mockHtmlContent = `
        <html>
          <head>
            <link rel="alternate" type="application/rss+xml" href="/rss.xml">
          </head>
        </html>`;

      const mockRssContent = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>Test Feed</title>
            <description>Test Description</description>
          </channel>
        </rss>`;

      // Mock: first common path (/rss.xml) succeeds, others fail
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockRssContent),
      }); // /rss.xml succeeds

      // Mock remaining 16 common paths to fail
      for (let i = 0; i < 16; i++) {
        mockFetch.mockRejectedValueOnce(new Error("Not found"));
      }

      // Mock HTML content fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockHtmlContent),
      });

      // Mock feed content fetch from HTML (should be deduplicated)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockRssContent),
      });

      const result = await feedDiscoveryService.discoverFromWebsite(
        "https://example.com"
      );

      // Should only have one feed despite being found by both methods
      expect(result.discoveredFeeds).toHaveLength(1);
      expect(result.discoveredFeeds[0].url).toBe("https://example.com/rss.xml");
      // Should keep the one with higher confidence (common-path has higher confidence)
      expect(result.discoveredFeeds[0].discoveryMethod).toBe("common-path");
    });
  });

  describe("scanHtmlForFeeds", () => {
    it("should extract feeds from link tags", async () => {
      const html = `
        <html>
          <head>
            <link rel="alternate" type="application/rss+xml" title="RSS Feed" href="/feed.xml">
            <link rel="alternate" type="application/atom+xml" title="Atom Feed" href="/atom.xml">
          </head>
        </html>`;

      const mockRssContent = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>RSS Title</title>
            <description>RSS Description</description>
          </channel>
        </rss>`;

      const mockAtomContent = `<?xml version="1.0"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title>Atom Title</title>
          <subtitle>Atom Description</subtitle>
        </feed>`;

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockRssContent),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockAtomContent),
        });

      const feeds = await feedDiscoveryService.scanHtmlForFeeds(
        html,
        "https://example.com"
      );

      expect(feeds).toHaveLength(2);
      expect(feeds[0]).toMatchObject({
        url: "https://example.com/feed.xml",
        title: "RSS Title",
        type: "rss",
        discoveryMethod: "link-tag",
      });
      expect(feeds[1]).toMatchObject({
        url: "https://example.com/atom.xml",
        title: "Atom Title",
        type: "atom",
        discoveryMethod: "link-tag",
      });
    });

    it("should extract feeds from meta tags", async () => {
      const html = `
        <html>
          <head>
            <meta property="og:rss" content="https://example.com/rss.xml">
            <meta name="rss" content="/feed.xml">
          </head>
        </html>`;

      const mockRssContent = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>Meta RSS Feed</title>
            <description>Found via meta tag</description>
          </channel>
        </rss>`;

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockRssContent),
      });

      const feeds = await feedDiscoveryService.scanHtmlForFeeds(
        html,
        "https://example.com"
      );

      expect(feeds).toHaveLength(2);
      expect(feeds.every((f) => f.discoveryMethod === "meta-tag")).toBe(true);
    });

    it("should handle relative URLs correctly", async () => {
      const html = `
        <html>
          <head>
            <link rel="alternate" type="application/rss+xml" href="../feed.xml">
            <link rel="alternate" type="application/atom+xml" href="./atom.xml">
          </head>
        </html>`;

      const mockFeedContent = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>Test</title>
            <description>Test</description>
          </channel>
        </rss>`;

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockFeedContent),
      });

      const feeds = await feedDiscoveryService.scanHtmlForFeeds(
        html,
        "https://example.com/blog/"
      );

      expect(feeds).toHaveLength(2);
      expect(feeds[0].url).toBe("https://example.com/feed.xml");
      expect(feeds[1].url).toBe("https://example.com/blog/atom.xml");
    });

    it("should handle invalid HTML gracefully", async () => {
      const invalidHtml =
        "<html><head><title>Test</title></head><body><p>No feeds here</p></body></html>";

      const feeds = await feedDiscoveryService.scanHtmlForFeeds(
        invalidHtml,
        "https://example.com"
      );

      expect(feeds).toHaveLength(0);
    });
  });

  describe("tryCommonFeedPaths", () => {
    it("should try multiple common paths", async () => {
      const mockRssContent = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>Common Path Feed</title>
            <description>Found at common path</description>
          </channel>
        </rss>`;

      // Mock: first path fails, second succeeds, rest fail
      mockFetch
        .mockRejectedValueOnce(new Error("Not found"))
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockRssContent),
        })
        .mockRejectedValue(new Error("Not found"));

      const feeds = await feedDiscoveryService.tryCommonFeedPaths(
        "https://example.com"
      );

      expect(feeds).toHaveLength(1);
      expect(feeds[0]).toMatchObject({
        url: "https://example.com/feed.xml",
        title: "Common Path Feed",
        description: "Found at common path",
        type: "rss",
        discoveryMethod: "common-path",
      });
      expect(feeds[0].confidence).toBeGreaterThan(0.8);
    });

    it("should handle all paths failing", async () => {
      mockFetch.mockRejectedValue(new Error("Not found"));

      const feeds = await feedDiscoveryService.tryCommonFeedPaths(
        "https://example.com"
      );

      expect(feeds).toHaveLength(0);
    });
  });

  describe("extractFeedMetadata", () => {
    it("should extract RSS 2.0 metadata", async () => {
      const rssContent = `<?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <title>RSS Feed Title</title>
            <description>RSS Feed Description</description>
            <item>
              <title>Article 1</title>
              <description>Article content</description>
            </item>
          </channel>
        </rss>`;

      const metadata = await feedDiscoveryService.extractFeedMetadata(
        rssContent
      );

      expect(metadata).toEqual({
        title: "RSS Feed Title",
        description: "RSS Feed Description",
        type: "rss",
      });
    });

    it("should extract Atom metadata", async () => {
      const atomContent = `<?xml version="1.0" encoding="utf-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title>Atom Feed Title</title>
          <subtitle>Atom Feed Subtitle</subtitle>
          <entry>
            <title>Entry 1</title>
            <summary>Entry content</summary>
          </entry>
        </feed>`;

      const metadata = await feedDiscoveryService.extractFeedMetadata(
        atomContent
      );

      expect(metadata).toEqual({
        title: "Atom Feed Title",
        description: "Atom Feed Subtitle",
        type: "atom",
      });
    });

    it("should extract RSS 1.0 (RDF) metadata", async () => {
      const rdfContent = `<?xml version="1.0" encoding="UTF-8"?>
        <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
                 xmlns="http://purl.org/rss/1.0/">
          <channel>
            <title>RDF Feed Title</title>
            <description>RDF Feed Description</description>
          </channel>
          <item>
            <title>Item 1</title>
            <description>Item content</description>
          </item>
        </rdf:RDF>`;

      const metadata = await feedDiscoveryService.extractFeedMetadata(
        rdfContent
      );

      expect(metadata).toEqual({
        title: "RDF Feed Title",
        description: "RDF Feed Description",
        type: "rdf",
      });
    });

    it("should handle invalid XML", async () => {
      const invalidXml = "This is not XML content";

      await expect(
        feedDiscoveryService.extractFeedMetadata(invalidXml)
      ).rejects.toThrow("Failed to extract feed metadata");
    });

    it("should handle unknown feed format", async () => {
      const unknownFormat = `<?xml version="1.0"?>
        <unknown>
          <title>Unknown Format</title>
        </unknown>`;

      await expect(
        feedDiscoveryService.extractFeedMetadata(unknownFormat)
      ).rejects.toThrow("Failed to extract feed metadata");
    });
  });

  describe("utility functions", () => {
    it("should return correct feed type icons", () => {
      expect(getFeedTypeIcon("rss")).toBe("📡");
      expect(getFeedTypeIcon("atom")).toBe("⚛️");
      expect(getFeedTypeIcon("rdf")).toBe("🔗");
    });

    it("should return correct feed type colors", () => {
      expect(getFeedTypeColor("rss")).toBe("text-orange-500");
      expect(getFeedTypeColor("atom")).toBe("text-blue-500");
      expect(getFeedTypeColor("rdf")).toBe("text-green-500");
    });

    it("should return correct discovery method text", () => {
      expect(getDiscoveryMethodText("link-tag")).toBe("HTML Link Tag");
      expect(getDiscoveryMethodText("meta-tag")).toBe("HTML Meta Tag");
      expect(getDiscoveryMethodText("common-path")).toBe("Common Path");
      expect(getDiscoveryMethodText("content-scan")).toBe("Content Scan");
    });

    it("should return correct confidence text", () => {
      expect(getConfidenceText(0.95)).toBe("Very High");
      expect(getConfidenceText(0.85)).toBe("High");
      expect(getConfidenceText(0.75)).toBe("Medium");
      expect(getConfidenceText(0.65)).toBe("Low");
      expect(getConfidenceText(0.55)).toBe("Very Low");
    });

    it("should return correct confidence colors", () => {
      expect(getConfidenceColor(0.95)).toBe("text-green-600");
      expect(getConfidenceColor(0.85)).toBe("text-green-500");
      expect(getConfidenceColor(0.75)).toBe("text-yellow-500");
      expect(getConfidenceColor(0.65)).toBe("text-orange-500");
      expect(getConfidenceColor(0.55)).toBe("text-red-500");
    });
  });

  describe("error handling", () => {
    it("should handle network timeouts gracefully", async () => {
      // Mock a timeout scenario
      mockFetch.mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Request timed out")), 100)
          )
      );

      const result = await feedDiscoveryService.discoverFromWebsite(
        "https://example.com"
      );

      expect(result.discoveredFeeds).toHaveLength(0);
      expect(result.suggestions).toContain(
        "No RSS feeds found on this website"
      );
    });

    it("should handle malformed URLs gracefully", async () => {
      const result = await feedDiscoveryService.discoverFromWebsite(
        "not-a-url"
      );

      // Should still attempt discovery with normalized URL
      expect(result.originalUrl).toBe("not-a-url");
      expect(result.discoveredFeeds).toHaveLength(0);
    });

    it("should handle partial failures in HTML scanning", async () => {
      const html = `
        <html>
          <head>
            <link rel="alternate" type="application/rss+xml" href="/good-feed.xml">
            <link rel="alternate" type="application/rss+xml" href="/bad-feed.xml">
          </head>
        </html>`;

      const mockGoodFeed = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>Good Feed</title>
            <description>This works</description>
          </channel>
        </rss>`;

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockGoodFeed),
        })
        .mockRejectedValueOnce(new Error("Bad feed"));

      const feeds = await feedDiscoveryService.scanHtmlForFeeds(
        html,
        "https://example.com"
      );

      // Should return at least the successful feed
      expect(feeds.length).toBeGreaterThanOrEqual(1);
      const goodFeed = feeds.find((f) => f.title === "Good Feed");
      expect(goodFeed).toBeDefined();
      expect(goodFeed?.title).toBe("Good Feed");
    });
  });
});

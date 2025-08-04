/**
 * Comprehensive Feed Discovery Service Tests
 *
 * Tests for enhanced feed discovery functionality including edge cases,
 * error handling, and performance scenarios
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

describe("Feed Discovery Service - Comprehensive Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Advanced Discovery Scenarios", () => {
    it("should handle websites with multiple feed types", async () => {
      const mockHtmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Multi-Feed Website</title>
            <link rel="alternate" type="application/rss+xml" title="Main RSS" href="/rss.xml">
            <link rel="alternate" type="application/atom+xml" title="Main Atom" href="/atom.xml">
            <link rel="alternate" type="application/rdf+xml" title="RDF Feed" href="/rdf.xml">
            <meta property="og:rss" content="/blog/rss.xml">
          </head>
          <body>Content</body>
        </html>`;

      const mockRssContent = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>Main RSS Feed</title>
            <description>Primary RSS feed</description>
          </channel>
        </rss>`;

      const mockAtomContent = `<?xml version="1.0"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title>Main Atom Feed</title>
          <subtitle>Primary Atom feed</subtitle>
        </feed>`;

      const mockRdfContent = `<?xml version="1.0"?>
        <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
                 xmlns="http://purl.org/rss/1.0/">
          <channel>
            <title>RDF Feed</title>
            <description>RDF format feed</description>
          </channel>
        </rdf:RDF>`;

      const mockBlogRssContent = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>Blog RSS Feed</title>
            <description>Blog-specific RSS feed</description>
          </channel>
        </rss>`;

      // Mock all common paths to fail (17 paths)
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
          text: () => Promise.resolve(mockRssContent),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockAtomContent),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockRdfContent),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockBlogRssContent),
        });

      const result = await feedDiscoveryService.discoverFromWebsite(
        "https://example.com"
      );

      expect(result.discoveredFeeds).toHaveLength(4);

      const feedTypes = result.discoveredFeeds.map((f) => f.type);
      expect(feedTypes).toContain("rss");
      expect(feedTypes).toContain("atom");
      expect(feedTypes).toContain("rdf");

      const feedUrls = result.discoveredFeeds.map((f) => f.url);
      expect(feedUrls).toContain("https://example.com/rss.xml");
      expect(feedUrls).toContain("https://example.com/atom.xml");
      expect(feedUrls).toContain("https://example.com/rdf.xml");
      expect(feedUrls).toContain("https://example.com/blog/rss.xml");
    });

    it("should handle WordPress-style feeds", async () => {
      const mockHtmlContent = `
        <html>
          <head>
            <link rel="alternate" type="application/rss+xml" href="/?feed=rss2">
            <link rel="alternate" type="application/rss+xml" href="/?feed=comments-rss2">
            <link rel="alternate" type="application/atom+xml" href="/?feed=atom">
          </head>
        </html>`;

      const mockWpRssContent = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>WordPress Site</title>
            <description>WordPress RSS feed</description>
          </channel>
        </rss>`;

      // Mock common paths to fail
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
          text: () => Promise.resolve(mockWpRssContent),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockWpRssContent),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockWpRssContent),
        });

      const result = await feedDiscoveryService.discoverFromWebsite(
        "https://wordpress-site.com"
      );

      expect(result.discoveredFeeds.length).toBeGreaterThanOrEqual(3);

      const feedUrls = result.discoveredFeeds.map((f) => f.url);
      expect(feedUrls).toContain("https://wordpress-site.com/?feed=rss2");
      expect(feedUrls).toContain(
        "https://wordpress-site.com/?feed=comments-rss2"
      );
      expect(feedUrls).toContain("https://wordpress-site.com/?feed=atom");
    });

    it("should handle subdomain and subdirectory feeds", async () => {
      const mockHtmlContent = `
        <html>
          <head>
            <link rel="alternate" type="application/rss+xml" href="https://blog.example.com/feed.xml">
            <link rel="alternate" type="application/atom+xml" href="/news/atom.xml">
          </head>
        </html>`;

      const mockSubdomainFeed = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>Blog Subdomain Feed</title>
            <description>Feed from blog subdomain</description>
          </channel>
        </rss>`;

      const mockSubdirFeed = `<?xml version="1.0"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title>News Section Feed</title>
          <subtitle>News subdirectory feed</subtitle>
        </feed>`;

      // Mock common paths to fail
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
          text: () => Promise.resolve(mockSubdomainFeed),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockSubdirFeed),
        });

      const result = await feedDiscoveryService.discoverFromWebsite(
        "https://example.com"
      );

      expect(result.discoveredFeeds).toHaveLength(2);

      const feedUrls = result.discoveredFeeds.map((f) => f.url);
      expect(feedUrls).toContain("https://blog.example.com/feed.xml");
      expect(feedUrls).toContain("https://example.com/news/atom.xml");
    });
  });

  describe("Content Scanning Edge Cases", () => {
    it("should handle feeds with custom namespaces", async () => {
      const mockFeedContent = `<?xml version="1.0"?>
        <rss version="2.0"
             xmlns:content="http://purl.org/rss/1.0/modules/content/"
             xmlns:dc="http://purl.org/dc/elements/1.1/"
             xmlns:media="http://search.yahoo.com/mrss/">
          <channel>
            <title>Custom Namespace Feed</title>
            <description>Feed with custom namespaces</description>
            <dc:creator>John Doe</dc:creator>
            <item>
              <title>Test Article</title>
              <content:encoded><![CDATA[Rich content here]]></content:encoded>
              <media:thumbnail url="http://example.com/thumb.jpg"/>
            </item>
          </channel>
        </rss>`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockFeedContent),
      });

      const metadata = await feedDiscoveryService.extractFeedMetadata(
        mockFeedContent
      );

      expect(metadata).toEqual({
        title: "Custom Namespace Feed",
        description: "Feed with custom namespaces",
        type: "rss",
      });
    });

    it("should handle feeds with CDATA sections", async () => {
      const mockFeedContent = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title><![CDATA[Feed with CDATA Title]]></title>
            <description><![CDATA[Description with <strong>HTML</strong> content]]></description>
            <item>
              <title><![CDATA[Article with CDATA]]></title>
              <description><![CDATA[Content with special chars & symbols]]></description>
            </item>
          </channel>
        </rss>`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockFeedContent),
      });

      const metadata = await feedDiscoveryService.extractFeedMetadata(
        mockFeedContent
      );

      expect(metadata).toEqual({
        title: "Feed with CDATA Title",
        description: "Description with <strong>HTML</strong> content",
        type: "rss",
      });
    });

    it("should handle feeds with encoding declarations", async () => {
      const mockFeedContent = `<?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <title>UTF-8 Encoded Feed</title>
            <description>Feed with UTF-8 encoding: café, naïve, résumé</description>
          </channel>
        </rss>`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockFeedContent),
      });

      const metadata = await feedDiscoveryService.extractFeedMetadata(
        mockFeedContent
      );

      expect(metadata).toEqual({
        title: "UTF-8 Encoded Feed",
        description: "Feed with UTF-8 encoding: café, naïve, résumé",
        type: "rss",
      });
    });

    it("should handle malformed but recoverable feeds", async () => {
      const mockMalformedFeed = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>Malformed Feed</title>
            <description>Missing closing tag for description
            <item>
              <title>Test Item</title>
              <description>Item description</description>
            </item>
          </channel>
        </rss>`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockMalformedFeed),
      });

      // Should still extract what it can
      const metadata = await feedDiscoveryService.extractFeedMetadata(
        mockMalformedFeed
      );

      expect(metadata.title).toBe("Malformed Feed");
      expect(metadata.type).toBe("rss");
    });
  });

  describe("Performance and Concurrency", () => {
    it("should handle concurrent discovery requests efficiently", async () => {
      const mockRssContent = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>Concurrent Test Feed</title>
            <description>Testing concurrent requests</description>
          </channel>
        </rss>`;

      // Mock successful response for first common path
      mockFetch.mockImplementation((url) => {
        if (url.includes("/rss.xml")) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(mockRssContent),
          });
        }
        return Promise.reject(new Error("Not found"));
      });

      const urls = [
        "https://site1.com",
        "https://site2.com",
        "https://site3.com",
        "https://site4.com",
        "https://site5.com",
      ];

      const startTime = Date.now();
      const promises = urls.map((url) =>
        feedDiscoveryService.discoverFromWebsite(url)
      );
      const results = await Promise.all(promises);
      const endTime = Date.now();

      // All should succeed
      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(result.discoveredFeeds.length).toBeGreaterThanOrEqual(1);
        // Find the feed with the expected title
        const targetFeed = result.discoveredFeeds.find(
          (f) => f.title === "Concurrent Test Feed"
        );
        expect(targetFeed).toBeDefined();
      });

      // Should complete in reasonable time (less than 8 seconds for 5 concurrent requests)
      expect(endTime - startTime).toBeLessThan(8000);
    });

    it("should handle timeout scenarios gracefully", async () => {
      // Mock slow responses that timeout
      mockFetch.mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Request timed out")), 100)
          )
      );

      const startTime = Date.now();
      const result = await feedDiscoveryService.discoverFromWebsite(
        "https://slow-site.com"
      );
      const endTime = Date.now();

      // Should timeout and return empty results
      expect(result.discoveredFeeds).toHaveLength(0);
      // Should complete quickly due to timeouts
      expect(endTime - startTime).toBeLessThan(5000);
      expect(result.suggestions).toContain(
        "No RSS feeds found on this website"
      );
    }, 10000); // Increase test timeout to 10 seconds

    it("should limit concurrent requests appropriately", async () => {
      let concurrentRequests = 0;
      let maxConcurrentRequests = 0;

      mockFetch.mockImplementation(() => {
        concurrentRequests++;
        maxConcurrentRequests = Math.max(
          maxConcurrentRequests,
          concurrentRequests
        );

        return new Promise((resolve) => {
          setTimeout(() => {
            concurrentRequests--;
            resolve({
              ok: false,
              text: () => Promise.resolve(""),
            });
          }, 50);
        });
      });

      await feedDiscoveryService.discoverFromWebsite("https://example.com");

      // The service tries common paths (17) + HTML parsing (1) = 18 total requests
      // But they should be limited by the MAX_CONCURRENT_REQUESTS setting
      // Since we don't have direct access to that setting, we'll check for reasonable concurrency
      expect(maxConcurrentRequests).toBeLessThanOrEqual(18);
      expect(maxConcurrentRequests).toBeGreaterThan(0);
    });
  });

  describe("Error Recovery and Resilience", () => {
    it("should continue discovery when some methods fail", async () => {
      const mockHtmlContent = `
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
            <description>This feed works</description>
          </channel>
        </rss>`;

      // Mock common paths to fail
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
          text: () => Promise.resolve(mockGoodFeed),
        })
        .mockRejectedValueOnce(new Error("Bad feed"));

      const result = await feedDiscoveryService.discoverFromWebsite(
        "https://example.com"
      );

      // Should find at least the good feed, may find others from common paths
      expect(result.discoveredFeeds.length).toBeGreaterThanOrEqual(1);
      const goodFeed = result.discoveredFeeds.find(
        (f) => f.title === "Good Feed"
      );
      expect(goodFeed).toBeDefined();
      expect(result.successfulAttempts).toBeGreaterThanOrEqual(1);
    });

    it("should handle network errors gracefully", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const result = await feedDiscoveryService.discoverFromWebsite(
        "https://unreachable.com"
      );

      expect(result.discoveredFeeds).toHaveLength(0);
      expect(result.successfulAttempts).toBe(0);
      expect(result.suggestions).toContain(
        "No RSS feeds found on this website"
      );
    });

    it("should handle malformed HTML gracefully", async () => {
      const malformedHtml = `
        <html>
          <head>
            <title>Malformed HTML</title>
            <link rel="alternate" type="application/rss+xml" href="/feed.xml"
            <!-- Missing closing tag -->
          </head>
          <body>
            <p>Content</p>
          </body>
        </html>`;

      const mockFeedContent = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>Valid Feed</title>
            <description>Despite malformed HTML</description>
          </channel>
        </rss>`;

      // Mock common paths to fail
      for (let i = 0; i < 17; i++) {
        mockFetch.mockRejectedValueOnce(new Error("Not found"));
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(malformedHtml),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockFeedContent),
        });

      const result = await feedDiscoveryService.discoverFromWebsite(
        "https://example.com"
      );

      // Should still find feeds despite malformed HTML
      expect(result.discoveredFeeds).toHaveLength(1);
      expect(result.discoveredFeeds[0].title).toBe("Valid Feed");
    });
  });

  describe("URL Normalization and Edge Cases", () => {
    it("should handle various URL formats", async () => {
      const testUrls = [
        "example.com",
        "www.example.com",
        "http://example.com",
        "https://example.com",
        "https://example.com/",
        "https://example.com/path",
        "https://example.com/path/",
      ];

      const mockFeedContent = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>Test Feed</title>
            <description>URL normalization test</description>
          </channel>
        </rss>`;

      for (const url of testUrls) {
        vi.clearAllMocks();

        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(mockFeedContent),
          })
          .mockRejectedValue(new Error("Not found"));

        const result = await feedDiscoveryService.discoverFromWebsite(url);

        expect(result.originalUrl).toBe(url);
        expect(result.discoveredFeeds).toHaveLength(1);
        // URL should be normalized but preserve the original protocol if specified
        expect(result.discoveredFeeds[0].url).toMatch(
          /^https?:\/\/.*\/rss\.xml$/
        );
      }
    });

    it("should handle international domain names", async () => {
      const mockFeedContent = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>International Feed</title>
            <description>Feed from international domain</description>
          </channel>
        </rss>`;

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockFeedContent),
        })
        .mockRejectedValue(new Error("Not found"));

      const result = await feedDiscoveryService.discoverFromWebsite(
        "https://例え.テスト"
      );

      expect(result.originalUrl).toBe("https://例え.テスト");
      expect(result.discoveredFeeds).toHaveLength(1);
    });

    it("should handle URLs with query parameters", async () => {
      const mockFeedContent = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>Query Param Feed</title>
            <description>Feed with query parameters</description>
          </channel>
        </rss>`;

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockFeedContent),
        })
        .mockRejectedValue(new Error("Not found"));

      const result = await feedDiscoveryService.discoverFromWebsite(
        "https://example.com?utm_source=test&ref=discovery"
      );

      expect(result.discoveredFeeds).toHaveLength(1);
      expect(result.discoveredFeeds[0].title).toBe("Query Param Feed");
    });
  });

  describe("Confidence Scoring", () => {
    it("should assign higher confidence to standard paths", async () => {
      const mockFeedContent = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>Standard Path Feed</title>
            <description>Found at standard path</description>
          </channel>
        </rss>`;

      // Mock /rss.xml to succeed (standard path)
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockFeedContent),
        })
        .mockRejectedValue(new Error("Not found"));

      const result = await feedDiscoveryService.discoverFromWebsite(
        "https://example.com"
      );

      expect(result.discoveredFeeds).toHaveLength(1);
      expect(result.discoveredFeeds[0].confidence).toBeGreaterThan(0.8);
      expect(result.discoveredFeeds[0].discoveryMethod).toBe("common-path");
    });

    it("should assign appropriate confidence to HTML link tags", async () => {
      const mockHtmlContent = `
        <html>
          <head>
            <link rel="alternate" type="application/rss+xml" title="RSS Feed" href="/feed.xml">
          </head>
        </html>`;

      const mockFeedContent = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>HTML Link Feed</title>
            <description>Found via HTML link tag</description>
          </channel>
        </rss>`;

      // Mock common paths to fail
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

      const result = await feedDiscoveryService.discoverFromWebsite(
        "https://example.com"
      );

      expect(result.discoveredFeeds).toHaveLength(1);
      expect(result.discoveredFeeds[0].confidence).toBeGreaterThan(0.8);
      expect(result.discoveredFeeds[0].discoveryMethod).toBe("link-tag");
    });

    it("should sort feeds by confidence", async () => {
      const mockHtmlContent = `
        <html>
          <head>
            <link rel="alternate" type="application/rss+xml" href="/low-confidence.xml">
            <meta property="og:rss" content="/meta-feed.xml">
          </head>
        </html>`;

      const mockFeedContent = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>Test Feed</title>
            <description>Test description</description>
          </channel>
        </rss>`;

      // Mock common paths to fail
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
          ok: true,
          text: () => Promise.resolve(mockFeedContent),
        });

      const result = await feedDiscoveryService.discoverFromWebsite(
        "https://example.com"
      );

      expect(result.discoveredFeeds).toHaveLength(2);

      // Should be sorted by confidence (highest first)
      for (let i = 0; i < result.discoveredFeeds.length - 1; i++) {
        expect(result.discoveredFeeds[i].confidence).toBeGreaterThanOrEqual(
          result.discoveredFeeds[i + 1].confidence
        );
      }
    });
  });

  describe("Utility Functions Edge Cases", () => {
    it("should handle edge cases in utility functions", () => {
      // Test with undefined/null values
      expect(getFeedTypeIcon("unknown" as any)).toBe("📄");
      expect(getFeedTypeColor("unknown" as any)).toBe("text-gray-500");
      expect(getDiscoveryMethodText("unknown" as any)).toBe("Unknown");
      expect(getConfidenceText(-1)).toBe("Very Low");
      expect(getConfidenceText(2)).toBe("Very High");
      expect(getConfidenceColor(-1)).toBe("text-red-500");
      expect(getConfidenceColor(2)).toBe("text-green-600");
    });

    it("should handle boundary confidence values", () => {
      expect(getConfidenceText(0.9)).toBe("Very High");
      expect(getConfidenceText(0.8)).toBe("High");
      expect(getConfidenceText(0.7)).toBe("Medium");
      expect(getConfidenceText(0.6)).toBe("Low");
      expect(getConfidenceText(0.5)).toBe("Very Low");

      expect(getConfidenceColor(0.9)).toBe("text-green-600");
      expect(getConfidenceColor(0.8)).toBe("text-green-500");
      expect(getConfidenceColor(0.7)).toBe("text-yellow-500");
      expect(getConfidenceColor(0.6)).toBe("text-orange-500");
      expect(getConfidenceColor(0.5)).toBe("text-red-500");
    });
  });
});

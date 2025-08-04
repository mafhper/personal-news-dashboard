/**
 * Enhanced Feed Validator Tests
 *
 * Tests for the enhanced feed validation service with retry logic,
 * error classification, and validation attempt tracking
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  feedValidator,
  ValidationErrorType,
  getFeedStatusIcon,
  getFeedStatusColor,
  getFeedStatusText,
  getValidationSuggestions,
  getValidationAttemptSummary,
  getLastValidationError,
  isValidationRetryable,
} from "../services/feedValidator";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Enhanced Feed Validator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    feedValidator.clearCache();
  });

  describe("Basic Validation", () => {
    it("should validate a successful RSS feed", async () => {
      const mockRSSContent = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>Test Feed</title>
            <description>Test Description</description>
            <item>
              <title>Test Article</title>
              <link>https://example.com/article</link>
            </item>
          </channel>
        </rss>`;

      mockFetch.mockResolvedValueOnce({
        status: 200,
        statusText: "OK",
        text: () => Promise.resolve(mockRSSContent),
      });

      const result = await feedValidator.validateFeed(
        "https://example.com/rss"
      );

      expect(result.isValid).toBe(true);
      expect(result.status).toBe("valid");
      expect(result.title).toBe("Test Feed");
      expect(result.description).toBe("Test Description");
      expect(result.validationAttempts).toHaveLength(1);
      expect(result.validationAttempts[0].success).toBe(true);
      expect(result.totalRetries).toBe(0);
    });

    it("should validate a successful Atom feed", async () => {
      const mockAtomContent = `<?xml version="1.0"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title>Test Atom Feed</title>
          <subtitle>Test Atom Description</subtitle>
          <entry>
            <title>Test Entry</title>
            <link href="https://example.com/entry"/>
          </entry>
        </feed>`;

      mockFetch.mockResolvedValueOnce({
        status: 200,
        statusText: "OK",
        text: () => Promise.resolve(mockAtomContent),
      });

      const result = await feedValidator.validateFeed(
        "https://example.com/atom"
      );

      expect(result.isValid).toBe(true);
      expect(result.status).toBe("valid");
      expect(result.title).toBe("Test Atom Feed");
      expect(result.description).toBe("Test Atom Description");
    });
  });

  describe("Error Classification", () => {
    it("should classify 404 errors as NOT_FOUND", async () => {
      mockFetch.mockResolvedValueOnce({
        status: 404,
        statusText: "Not Found",
        text: () => Promise.resolve(""),
      });

      const result = await feedValidator.validateFeed(
        "https://example.com/notfound"
      );

      expect(result.isValid).toBe(false);
      expect(result.status).toBe("not_found");
      expect(result.finalError?.type).toBe(ValidationErrorType.NOT_FOUND);
      expect(result.suggestions).toContain(
        "The feed URL was not found on the server"
      );
    });

    it("should classify 500 errors as SERVER_ERROR", async () => {
      mockFetch.mockResolvedValue({
        status: 500,
        statusText: "Internal Server Error",
        text: () => Promise.resolve(""),
      });

      const result = await feedValidator.validateFeed(
        "https://example.com/error"
      );

      expect(result.isValid).toBe(false);
      expect(result.status).toBe("server_error");
      expect(result.finalError?.type).toBe(ValidationErrorType.SERVER_ERROR);
      expect(result.suggestions).toContain("The server is experiencing issues");
    });

    it("should classify CORS errors correctly", async () => {
      const corsError = new Error(
        "Failed to fetch: CORS policy prevents access"
      );
      mockFetch.mockRejectedValue(corsError);

      const result = await feedValidator.validateFeed(
        "https://example.com/cors"
      );

      expect(result.isValid).toBe(false);
      expect(result.status).toBe("cors_error");
      expect(result.finalError?.type).toBe(ValidationErrorType.CORS_ERROR);
      expect(result.suggestions).toContain(
        "The feed server doesn't allow direct browser access"
      );
    });
  });

  describe("Parse Error Handling", () => {
    it("should handle invalid XML content", async () => {
      const invalidXML = "This is not XML content";

      mockFetch.mockResolvedValueOnce({
        status: 200,
        statusText: "OK",
        text: () => Promise.resolve(invalidXML),
      });

      const result = await feedValidator.validateFeed(
        "https://example.com/invalid"
      );

      expect(result.isValid).toBe(false);
      expect(result.status).toBe("parse_error");
      expect(result.finalError?.type).toBe(ValidationErrorType.PARSE_ERROR);
      expect(result.suggestions).toContain(
        "Check if the URL points to a valid RSS or Atom feed"
      );
    });

    it("should handle valid XML that is not a feed", async () => {
      const validXMLNotFeed = `<?xml version="1.0"?>
        <document>
          <title>Not a feed</title>
        </document>`;

      mockFetch.mockResolvedValueOnce({
        status: 200,
        statusText: "OK",
        text: () => Promise.resolve(validXMLNotFeed),
      });

      const result = await feedValidator.validateFeed(
        "https://example.com/notfeed"
      );

      expect(result.isValid).toBe(false);
      expect(result.status).toBe("parse_error");
      expect(result.error).toContain("Not a valid RSS, Atom, or RDF feed");
    });
  });

  describe("Content Cleanup and Parsing Improvements", () => {
    describe("RSS 1.0 (RDF) Feed Support", () => {
      it("should validate RSS 1.0 (RDF) feeds", async () => {
        const rdfFeed = `<?xml version="1.0"?>
          <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
                   xmlns="http://purl.org/rss/1.0/">
            <channel rdf:about="http://example.com/">
              <title>RDF Test Feed</title>
              <description>Test RDF Description</description>
            </channel>
          </rdf:RDF>`;

        mockFetch.mockResolvedValueOnce({
          status: 200,
          statusText: "OK",
          text: () => Promise.resolve(rdfFeed),
        });

        const result = await feedValidator.validateFeed(
          "https://example.com/rdf"
        );

        expect(result.isValid).toBe(true);
        expect(result.status).toBe("valid");
        expect(result.title).toBe("RDF Test Feed");
        expect(result.description).toBe("Test RDF Description");
      });

      it("should handle RDF feeds with missing namespaces", async () => {
        const malformedRDF = `<?xml version="1.0"?>
          <rdf:RDF>
            <channel rdf:about="http://example.com/">
              <title>Malformed RDF Feed</title>
              <description>Missing namespaces</description>
            </channel>
          </rdf:RDF>`;

        mockFetch.mockResolvedValueOnce({
          status: 200,
          statusText: "OK",
          text: () => Promise.resolve(malformedRDF),
        });

        const result = await feedValidator.validateFeed(
          "https://example.com/malformed-rdf"
        );

        expect(result.isValid).toBe(true);
        expect(result.status).toBe("valid");
        expect(result.title).toBe("Malformed RDF Feed");
      });
    });

    describe("Atom Feed Support", () => {
      it("should validate Atom feeds with proper namespace", async () => {
        const atomFeed = `<?xml version="1.0" encoding="UTF-8"?>
          <feed xmlns="http://www.w3.org/2005/Atom">
            <title>Atom Test Feed</title>
            <subtitle>Test Atom Subtitle</subtitle>
            <entry>
              <title>Test Entry</title>
              <link href="https://example.com/entry"/>
            </entry>
          </feed>`;

        mockFetch.mockResolvedValueOnce({
          status: 200,
          statusText: "OK",
          text: () => Promise.resolve(atomFeed),
        });

        const result = await feedValidator.validateFeed(
          "https://example.com/atom"
        );

        expect(result.isValid).toBe(true);
        expect(result.status).toBe("valid");
        expect(result.title).toBe("Atom Test Feed");
        expect(result.description).toBe("Test Atom Subtitle");
      });

      it("should handle Atom feeds with missing namespace", async () => {
        const atomWithoutNS = `<?xml version="1.0"?>
          <feed>
            <title>Atom Without Namespace</title>
            <subtitle>Missing namespace</subtitle>
            <entry>
              <title>Test Entry</title>
            </entry>
          </feed>`;

        mockFetch.mockResolvedValueOnce({
          status: 200,
          statusText: "OK",
          text: () => Promise.resolve(atomWithoutNS),
        });

        const result = await feedValidator.validateFeed(
          "https://example.com/atom-no-ns"
        );

        expect(result.isValid).toBe(true);
        expect(result.status).toBe("valid");
        expect(result.title).toBe("Atom Without Namespace");
      });
    });

    describe("Content Cleanup", () => {
      it("should handle feeds with BOM (Byte Order Mark)", async () => {
        const feedWithBOM =
          '\uFEFF<?xml version="1.0"?>\n<rss version="2.0"><channel><title>BOM Feed</title><description>Has BOM</description></channel></rss>';

        mockFetch.mockResolvedValueOnce({
          status: 200,
          statusText: "OK",
          text: () => Promise.resolve(feedWithBOM),
        });

        const result = await feedValidator.validateFeed(
          "https://example.com/bom"
        );

        expect(result.isValid).toBe(true);
        expect(result.status).toBe("valid");
        expect(result.title).toBe("BOM Feed");
      });

      it("should fix XML declaration issues", async () => {
        const malformedXMLDecl = `<?xml version="1.0"?>
          <?xml version="1.0" encoding="UTF-8"?>
          <rss version="2.0">
            <channel>
              <title>Multiple XML Declarations</title>
              <description>Should be fixed</description>
            </channel>
          </rss>`;

        mockFetch.mockResolvedValueOnce({
          status: 200,
          statusText: "OK",
          text: () => Promise.resolve(malformedXMLDecl),
        });

        const result = await feedValidator.validateFeed(
          "https://example.com/multi-xml-decl"
        );

        expect(result.isValid).toBe(true);
        expect(result.status).toBe("valid");
        expect(result.title).toBe("Multiple XML Declarations");
      });

      it("should handle malformed CDATA sections", async () => {
        const malformedCDATA = `<?xml version="1.0"?>
          <rss version="2.0">
            <channel>
              <title>CDATA Test</title>
              <description><![CDATA[Unclosed CDATA section</description>
            </channel>
          </rss>`;

        mockFetch.mockResolvedValueOnce({
          status: 200,
          statusText: "OK",
          text: () => Promise.resolve(malformedCDATA),
        });

        const result = await feedValidator.validateFeed(
          "https://example.com/malformed-cdata"
        );

        expect(result.isValid).toBe(true);
        expect(result.status).toBe("valid");
        expect(result.title).toBe("CDATA Test");
      });

      it("should handle feeds with encoding issues", async () => {
        const feedWithEncodingIssues = `<?xml version="1.0"?>
          <rss version="2.0">
            <channel>
              <title>Smart "quotes" and —dashes</title>
              <description>Contains…ellipsis and non-breaking spaces</description>
            </channel>
          </rss>`;

        mockFetch.mockResolvedValueOnce({
          status: 200,
          statusText: "OK",
          text: () => Promise.resolve(feedWithEncodingIssues),
        });

        const result = await feedValidator.validateFeed(
          "https://example.com/encoding-issues"
        );

        expect(result.isValid).toBe(true);
        expect(result.status).toBe("valid");
        expect(result.title).toBe('Smart "quotes" and -dashes');
        expect(result.description).toBe(
          "Contains...ellipsis and non-breaking spaces"
        );
      });

      it("should remove invalid XML characters", async () => {
        const feedWithInvalidChars = `<?xml version="1.0"?>
          <rss version="2.0">
            <channel>
              <title>Invalid\x08Chars\x0BTest</title>
              <description>Contains\x00invalid\x1Fcharacters</description>
            </channel>
          </rss>`;

        mockFetch.mockResolvedValueOnce({
          status: 200,
          statusText: "OK",
          text: () => Promise.resolve(feedWithInvalidChars),
        });

        const result = await feedValidator.validateFeed(
          "https://example.com/invalid-chars"
        );

        expect(result.isValid).toBe(true);
        expect(result.status).toBe("valid");
        expect(result.title).toBe("InvalidCharsTest");
        expect(result.description).toBe("Containsinvalidcharacters");
      });

      it("should fix RSS feeds missing channel structure", async () => {
        const rssWithoutChannel = `<?xml version="1.0"?>
          <rss version="2.0">
            <title>Missing Channel</title>
            <description>No channel wrapper</description>
          </rss>`;

        mockFetch.mockResolvedValueOnce({
          status: 200,
          statusText: "OK",
          text: () => Promise.resolve(rssWithoutChannel),
        });

        const result = await feedValidator.validateFeed(
          "https://example.com/no-channel"
        );

        expect(result.isValid).toBe(true);
        expect(result.status).toBe("valid");
        expect(result.title).toBe("Missing Channel");
      });

      it("should add missing RSS version attribute", async () => {
        const rssWithoutVersion = `<?xml version="1.0"?>
          <rss>
            <channel>
              <title>No Version</title>
              <description>Missing version attribute</description>
            </channel>
          </rss>`;

        mockFetch.mockResolvedValueOnce({
          status: 200,
          statusText: "OK",
          text: () => Promise.resolve(rssWithoutVersion),
        });

        const result = await feedValidator.validateFeed(
          "https://example.com/no-version"
        );

        expect(result.isValid).toBe(true);
        expect(result.status).toBe("valid");
        expect(result.title).toBe("No Version");
      });
    });

    describe("Namespace-Aware Parsing", () => {
      it("should handle feeds with mixed namespaces", async () => {
        const mixedNamespaces = `<?xml version="1.0"?>
          <rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
            <channel>
              <title>Mixed Namespaces</title>
              <description>Has multiple namespaces</description>
              <item>
                <title>Test Item</title>
                <content:encoded><![CDATA[Rich content]]></content:encoded>
              </item>
            </channel>
          </rss>`;

        mockFetch.mockResolvedValueOnce({
          status: 200,
          statusText: "OK",
          text: () => Promise.resolve(mixedNamespaces),
        });

        const result = await feedValidator.validateFeed(
          "https://example.com/mixed-ns"
        );

        expect(result.isValid).toBe(true);
        expect(result.status).toBe("valid");
        expect(result.title).toBe("Mixed Namespaces");
      });

      it("should handle feeds with default namespaces", async () => {
        const defaultNamespace = `<?xml version="1.0"?>
          <feed xmlns="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
            <title>Default Namespace Feed</title>
            <subtitle>Uses default namespace</subtitle>
            <entry>
              <title>Test Entry</title>
              <media:thumbnail url="http://example.com/thumb.jpg"/>
            </entry>
          </feed>`;

        mockFetch.mockResolvedValueOnce({
          status: 200,
          statusText: "OK",
          text: () => Promise.resolve(defaultNamespace),
        });

        const result = await feedValidator.validateFeed(
          "https://example.com/default-ns"
        );

        expect(result.isValid).toBe(true);
        expect(result.status).toBe("valid");
        expect(result.title).toBe("Default Namespace Feed");
        expect(result.description).toBe("Uses default namespace");
      });
    });

    describe("Tolerant Parsing", () => {
      it("should handle feeds with minor XML formatting issues", async () => {
        const minorIssues = `<?xml version="1.0"?>
          <rss version="2.0">
            <channel>
              <title>Minor   Issues</title>
              <description>Has    extra    whitespace
              and line breaks</description>
              <item>
                <title>Test</title>
                <link>http://example.com</link>
              </item>
            </channel>
          </rss>`;

        mockFetch.mockResolvedValueOnce({
          status: 200,
          statusText: "OK",
          text: () => Promise.resolve(minorIssues),
        });

        const result = await feedValidator.validateFeed(
          "https://example.com/minor-issues"
        );

        expect(result.isValid).toBe(true);
        expect(result.status).toBe("valid");
        expect(result.title).toBe("Minor Issues");
        expect(result.description).toBe("Has extra whitespace and line breaks");
      });

      it("should handle feeds with HTML entities", async () => {
        const htmlEntities = `<?xml version="1.0"?>
          <rss version="2.0">
            <channel>
              <title>HTML &amp; Entities &lt;Test&gt;</title>
              <description>&quot;Quotes&quot; &amp; &#39;Apostrophes&#39;</description>
            </channel>
          </rss>`;

        mockFetch.mockResolvedValueOnce({
          status: 200,
          statusText: "OK",
          text: () => Promise.resolve(htmlEntities),
        });

        const result = await feedValidator.validateFeed(
          "https://example.com/html-entities"
        );

        expect(result.isValid).toBe(true);
        expect(result.status).toBe("valid");
        expect(result.title).toBe("HTML & Entities <Test>");
        expect(result.description).toBe("\"Quotes\" & 'Apostrophes'");
      });

      it("should truncate very long titles and descriptions", async () => {
        const longContent = "A".repeat(600);
        const longFeed = `<?xml version="1.0"?>
          <rss version="2.0">
            <channel>
              <title>${longContent}</title>
              <description>${longContent}</description>
            </channel>
          </rss>`;

        mockFetch.mockResolvedValueOnce({
          status: 200,
          statusText: "OK",
          text: () => Promise.resolve(longFeed),
        });

        const result = await feedValidator.validateFeed(
          "https://example.com/long-content"
        );

        expect(result.isValid).toBe(true);
        expect(result.status).toBe("valid");
        expect(result.title?.length).toBeLessThanOrEqual(500);
        expect(result.description?.length).toBeLessThanOrEqual(500);
      });
    });

    describe("Feed Type Detection", () => {
      it("should correctly identify RSS 2.0 feeds", async () => {
        const rss2Feed = `<?xml version="1.0"?>
          <rss version="2.0">
            <channel>
              <title>RSS 2.0 Feed</title>
              <description>Standard RSS 2.0</description>
            </channel>
          </rss>`;

        mockFetch.mockResolvedValueOnce({
          status: 200,
          statusText: "OK",
          text: () => Promise.resolve(rss2Feed),
        });

        const result = await feedValidator.validateFeed(
          "https://example.com/rss2"
        );

        expect(result.isValid).toBe(true);
        expect(result.status).toBe("valid");
      });

      it("should correctly identify Atom feeds", async () => {
        const atomFeed = `<?xml version="1.0"?>
          <feed xmlns="http://www.w3.org/2005/Atom">
            <title>Atom Feed</title>
            <subtitle>Standard Atom</subtitle>
          </feed>`;

        mockFetch.mockResolvedValueOnce({
          status: 200,
          statusText: "OK",
          text: () => Promise.resolve(atomFeed),
        });

        const result = await feedValidator.validateFeed(
          "https://example.com/atom"
        );

        expect(result.isValid).toBe(true);
        expect(result.status).toBe("valid");
      });

      it("should correctly identify RSS 1.0 (RDF) feeds", async () => {
        const rdfFeed = `<?xml version="1.0"?>
          <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
                   xmlns="http://purl.org/rss/1.0/">
            <channel rdf:about="http://example.com/">
              <title>RSS 1.0 Feed</title>
              <description>Standard RSS 1.0</description>
            </channel>
          </rdf:RDF>`;

        mockFetch.mockResolvedValueOnce({
          status: 200,
          statusText: "OK",
          text: () => Promise.resolve(rdfFeed),
        });

        const result = await feedValidator.validateFeed(
          "https://example.com/rdf"
        );

        expect(result.isValid).toBe(true);
        expect(result.status).toBe("valid");
      });
    });
  });

  describe("Caching", () => {
    it("should return cached results for repeated requests", async () => {
      const mockRSSContent = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>Cached Feed</title>
            <description>This should be cached</description>
          </channel>
        </rss>`;

      mockFetch.mockResolvedValueOnce({
        status: 200,
        statusText: "OK",
        text: () => Promise.resolve(mockRSSContent),
      });

      // First request
      const result1 = await feedValidator.validateFeed(
        "https://example.com/cached"
      );

      // Second request should use cache
      const result2 = await feedValidator.validateFeed(
        "https://example.com/cached"
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(result2);
      expect(result2.title).toBe("Cached Feed");
    });
  });

  describe("Validation History and Statistics", () => {
    it("should track validation history", async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        statusText: "OK",
        text: () =>
          Promise.resolve(`<?xml version="1.0"?>
          <rss version="2.0">
            <channel>
              <title>History Test</title>
              <description>Testing history</description>
            </channel>
          </rss>`),
      });

      await feedValidator.validateFeed("https://example.com/history");

      const history = feedValidator.getValidationHistory(
        "https://example.com/history"
      );

      expect(history).toHaveLength(1);
      expect(history[0].success).toBe(true);
      expect(history[0].method).toBe("direct");
      expect(history[0].responseTime).toBeGreaterThanOrEqual(0);
    });

    it("should provide validation statistics", async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        statusText: "OK",
        text: () =>
          Promise.resolve(`<?xml version="1.0"?>
          <rss version="2.0">
            <channel>
              <title>Stats Test</title>
              <description>Testing stats</description>
            </channel>
          </rss>`),
      });

      await feedValidator.validateFeed("https://example.com/stats");

      const stats = feedValidator.getValidationStats(
        "https://example.com/stats"
      );

      expect(stats).not.toBeNull();
      expect(stats!.totalAttempts).toBe(1);
      expect(stats!.successfulAttempts).toBe(1);
      expect(stats!.failedAttempts).toBe(0);
      expect(stats!.totalRetries).toBe(0);
      expect(stats!.averageResponseTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Utility Functions", () => {
    it("should return correct status icons", () => {
      expect(getFeedStatusIcon("valid")).toBe("✅");
      expect(getFeedStatusIcon("invalid")).toBe("❌");
      expect(getFeedStatusIcon("timeout")).toBe("⏱️");
      expect(getFeedStatusIcon("network_error")).toBe("🌐");
      expect(getFeedStatusIcon("cors_error")).toBe("🚫");
      expect(getFeedStatusIcon("not_found")).toBe("🔍");
      expect(getFeedStatusIcon("server_error")).toBe("🔧");
      expect(getFeedStatusIcon("parse_error")).toBe("📄");
      expect(getFeedStatusIcon("checking")).toBe("🔄");
    });

    it("should return correct status colors", () => {
      expect(getFeedStatusColor("valid")).toBe("text-green-500");
      expect(getFeedStatusColor("invalid")).toBe("text-red-500");
      expect(getFeedStatusColor("cors_error")).toBe("text-red-400");
      expect(getFeedStatusColor("server_error")).toBe("text-red-600");
    });

    it("should return correct status text", () => {
      expect(getFeedStatusText("valid")).toBe("Funcionando");
      expect(getFeedStatusText("cors_error")).toBe("Erro CORS");
      expect(getFeedStatusText("not_found")).toBe("Não Encontrado");
      expect(getFeedStatusText("server_error")).toBe("Erro do Servidor");
    });

    it("should extract validation suggestions", () => {
      const result = {
        suggestions: ["Test suggestion 1", "Test suggestion 2"],
      } as any;

      const suggestions = getValidationSuggestions(result);
      expect(suggestions).toEqual(["Test suggestion 1", "Test suggestion 2"]);
    });

    it("should generate validation attempt summary", () => {
      const result = {
        validationAttempts: [{ attemptNumber: 1 }],
        totalRetries: 0,
        totalValidationTime: 2500,
      } as any;

      const summary = getValidationAttemptSummary(result);
      expect(summary).toBe("Validated in 3s");

      const resultWithRetries = {
        validationAttempts: [
          { attemptNumber: 1 },
          { attemptNumber: 2 },
          { attemptNumber: 3 },
        ],
        totalRetries: 2,
        totalValidationTime: 5000,
      } as any;

      const summaryWithRetries = getValidationAttemptSummary(resultWithRetries);
      expect(summaryWithRetries).toBe("3 attempts (2 retries) in 5s");
    });

    it("should check if validation is retryable", () => {
      const retryableResult = {
        finalError: { retryable: true },
      } as any;

      const nonRetryableResult = {
        finalError: { retryable: false },
      } as any;

      expect(isValidationRetryable(retryableResult)).toBe(true);
      expect(isValidationRetryable(nonRetryableResult)).toBe(false);
    });
  });

  describe("Multiple Feed Validation", () => {
    it("should validate multiple feeds in parallel", async () => {
      const mockRSSContent = `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <title>Parallel Test</title>
            <description>Testing parallel validation</description>
          </channel>
        </rss>`;

      mockFetch.mockResolvedValue({
        status: 200,
        statusText: "OK",
        text: () => Promise.resolve(mockRSSContent),
      });

      const urls = [
        "https://example.com/feed1",
        "https://example.com/feed2",
        "https://example.com/feed3",
      ];

      const results = await feedValidator.validateFeeds(urls);

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.isValid)).toBe(true);
      expect(results.every((r) => r.title === "Parallel Test")).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe("Retry Logic (simplified)", () => {
    it("should not retry on non-retryable errors like 404", async () => {
      mockFetch.mockResolvedValueOnce({
        status: 404,
        statusText: "Not Found",
        text: () => Promise.resolve(""),
      });

      const result = await feedValidator.validateFeed(
        "https://example.com/noretry"
      );

      expect(result.isValid).toBe(false);
      expect(result.validationAttempts).toHaveLength(1);
      expect(result.totalRetries).toBe(0);
      expect(result.status).toBe("not_found");
    });
  });
});

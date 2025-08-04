/**
 * OPML Export Service Tests
 *
 * Tests for OPML file generation, validation, duplicate prevention,
 * and download functionality
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { OPMLExportService } from "../services/opmlExportService";
import type { FeedSource, FeedCategory } from "../types";

// Mock feedDuplicateDetector
vi.mock("../services/feedDuplicateDetector", () => ({
  feedDuplicateDetector: {
    removeDuplicates: vi.fn(),
  },
}));

import { feedDuplicateDetector } from "../services/feedDuplicateDetector";

// Mock DOM methods for download testing
const mockCreateElement = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();

Object.defineProperty(global, "document", {
  value: {
    createElement: mockCreateElement,
    body: {
      appendChild: mockAppendChild,
      removeChild: mockRemoveChild,
    },
  },
});

Object.defineProperty(global, "URL", {
  value: {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  },
});

Object.defineProperty(global, "Blob", {
  value: class MockBlob {
    constructor(public content: string[], public options: any) {}
  },
});

describe("OPML Export Service Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock for duplicate detector
    (feedDuplicateDetector.removeDuplicates as any).mockResolvedValue({
      uniqueFeeds: [],
      removedDuplicates: [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Basic OPML Generation", () => {
    it("should generate valid OPML for simple feed list", async () => {
      const feeds: FeedSource[] = [
        { url: "https://example.com/feed.xml", customTitle: "Example Feed" },
        { url: "https://test.com/rss.xml", customTitle: "Test Feed" },
      ];

      (feedDuplicateDetector.removeDuplicates as any).mockResolvedValueOnce({
        uniqueFeeds: feeds,
        removedDuplicates: [],
      });

      const opml = await OPMLExportService.generateOPML(feeds);

      expect(opml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(opml).toContain('<opml version="2.0">');
      expect(opml).toContain("<head>");
      expect(opml).toContain("<title>Personal News Dashboard Feeds</title>");
      expect(opml).toContain("<body>");
      expect(opml).toContain('text="Example Feed"');
      expect(opml).toContain('xmlUrl="https://example.com/feed.xml"');
      expect(opml).toContain('text="Test Feed"');
      expect(opml).toContain('xmlUrl="https://test.com/rss.xml"');
      expect(opml).toContain("</opml>");
    });

    it("should generate OPML with custom options", async () => {
      const feeds: FeedSource[] = [
        { url: "https://example.com/feed.xml", customTitle: "Example Feed" },
      ];

      const options = {
        title: "My Custom Feed Collection",
        description: "Custom description for my feeds",
        ownerName: "John Doe",
        ownerEmail: "john@example.com",
      };

      (feedDuplicateDetector.removeDuplicates as any).mockResolvedValueOnce({
        uniqueFeeds: feeds,
        removedDuplicates: [],
      });

      const opml = await OPMLExportService.generateOPML(feeds, [], options);

      expect(opml).toContain("<title>My Custom Feed Collection</title>");
      expect(opml).toContain("<ownerName>John Doe</ownerName>");
      expect(opml).toContain("<ownerEmail>john@example.com</ownerEmail>");
    });

    it("should generate OPML with proper date formatting", async () => {
      const feeds: FeedSource[] = [
        { url: "https://example.com/feed.xml", customTitle: "Example Feed" },
      ];

      (feedDuplicateDetector.removeDuplicates as any).mockResolvedValueOnce({
        uniqueFeeds: feeds,
        removedDuplicates: [],
      });

      const opml = await OPMLExportService.generateOPML(feeds);

      // Should contain properly formatted dates
      expect(opml).toMatch(/<dateCreated>.*GMT<\/dateCreated>/);
      expect(opml).toMatch(/<dateModified>.*GMT<\/dateModified>/);
    });

    it("should handle empty feed list", async () => {
      (feedDuplicateDetector.removeDuplicates as any).mockResolvedValueOnce({
        uniqueFeeds: [],
        removedDuplicates: [],
      });

      const opml = await OPMLExportService.generateOPML([]);

      expect(opml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(opml).toContain('<opml version="2.0">');
      expect(opml).toContain("<head>");
      expect(opml).toContain("<body>");
      expect(opml).toContain("</body>");
      expect(opml).toContain("</opml>");

      // Should not contain any outline elements
      expect(opml).not.toContain("<outline");
    });
  });

  describe("Category Support", () => {
    it("should organize feeds by categories", async () => {
      const categories: FeedCategory[] = [
        {
          id: "tech",
          name: "Technology",
          description: "Tech news and updates",
          order: 1,
        },
        {
          id: "news",
          name: "General News",
          description: "General news sources",
          order: 2,
        },
      ];

      const feeds: FeedSource[] = [
        {
          url: "https://techcrunch.com/feed",
          customTitle: "TechCrunch",
          categoryId: "tech",
        },
        {
          url: "https://arstechnica.com/rss",
          customTitle: "Ars Technica",
          categoryId: "tech",
        },
        {
          url: "https://bbc.com/rss",
          customTitle: "BBC News",
          categoryId: "news",
        },
        {
          url: "https://uncategorized.com/feed",
          customTitle: "Uncategorized Feed",
        }, // No category
      ];

      (feedDuplicateDetector.removeDuplicates as any).mockResolvedValueOnce({
        uniqueFeeds: feeds,
        removedDuplicates: [],
      });

      const opml = await OPMLExportService.generateOPML(feeds, categories);

      // Should contain category outlines
      expect(opml).toContain('<outline text="Technology"');
      expect(opml).toContain('description="Tech news and updates"');
      expect(opml).toContain('<outline text="General News"');
      expect(opml).toContain('description="General news sources"');

      // Should contain feeds within categories
      expect(opml).toContain('text="TechCrunch"');
      expect(opml).toContain('text="Ars Technica"');
      expect(opml).toContain('text="BBC News"');

      // Should contain uncategorized section
      expect(opml).toContain('<outline text="Uncategorized"');
      expect(opml).toContain('text="Uncategorized Feed"');
    });

    it("should respect category order", async () => {
      const categories: FeedCategory[] = [
        { id: "news", name: "News", order: 2 },
        { id: "tech", name: "Technology", order: 1 },
        { id: "sports", name: "Sports", order: 3 },
      ];

      const feeds: FeedSource[] = [
        {
          url: "https://tech.com/feed",
          customTitle: "Tech Feed",
          categoryId: "tech",
        },
        {
          url: "https://news.com/feed",
          customTitle: "News Feed",
          categoryId: "news",
        },
        {
          url: "https://sports.com/feed",
          customTitle: "Sports Feed",
          categoryId: "sports",
        },
      ];

      (feedDuplicateDetector.removeDuplicates as any).mockResolvedValueOnce({
        uniqueFeeds: feeds,
        removedDuplicates: [],
      });

      const opml = await OPMLExportService.generateOPML(feeds, categories);

      // Find positions of categories in the OPML
      const techPos = opml.indexOf('text="Technology"');
      const newsPos = opml.indexOf('text="News"');
      const sportsPos = opml.indexOf('text="Sports"');

      // Should be in order: Technology (1), News (2), Sports (3)
      expect(techPos).toBeLessThan(newsPos);
      expect(newsPos).toBeLessThan(sportsPos);
    });

    it("should handle categories without feeds", async () => {
      const categories: FeedCategory[] = [
        { id: "tech", name: "Technology", order: 1 },
        { id: "empty", name: "Empty Category", order: 2 },
      ];

      const feeds: FeedSource[] = [
        {
          url: "https://tech.com/feed",
          customTitle: "Tech Feed",
          categoryId: "tech",
        },
      ];

      (feedDuplicateDetector.removeDuplicates as any).mockResolvedValueOnce({
        uniqueFeeds: feeds,
        removedDuplicates: [],
      });

      const opml = await OPMLExportService.generateOPML(feeds, categories);

      // Should contain Technology category
      expect(opml).toContain('text="Technology"');
      expect(opml).toContain('text="Tech Feed"');

      // Should not contain empty category
      expect(opml).not.toContain('text="Empty Category"');
    });

    it("should disable categorization when requested", async () => {
      const categories: FeedCategory[] = [
        { id: "tech", name: "Technology", order: 1 },
      ];

      const feeds: FeedSource[] = [
        {
          url: "https://tech.com/feed",
          customTitle: "Tech Feed",
          categoryId: "tech",
        },
        { url: "https://other.com/feed", customTitle: "Other Feed" },
      ];

      const options = {
        includeCategories: false,
      };

      (feedDuplicateDetector.removeDuplicates as any).mockResolvedValueOnce({
        uniqueFeeds: feeds,
        removedDuplicates: [],
      });

      const opml = await OPMLExportService.generateOPML(
        feeds,
        categories,
        options
      );

      // Should not contain category outlines
      expect(opml).not.toContain('text="Technology"');

      // Should contain feeds directly in body
      expect(opml).toContain('text="Tech Feed"');
      expect(opml).toContain('text="Other Feed"');
    });
  });

  describe("Feed Metadata and URL Handling", () => {
    it("should derive HTML URLs from feed URLs", async () => {
      const feeds: FeedSource[] = [
        { url: "https://example.com/rss.xml", customTitle: "Example RSS" },
        { url: "https://blog.example.com/feed.xml", customTitle: "Blog Feed" },
        { url: "https://news.example.com/atom.xml", customTitle: "News Atom" },
        { url: "https://site.com/blog/rss.xml", customTitle: "Blog RSS" },
      ];

      (feedDuplicateDetector.removeDuplicates as any).mockResolvedValueOnce({
        uniqueFeeds: feeds,
        removedDuplicates: [],
      });

      const opml = await OPMLExportService.generateOPML(feeds);

      // Should derive appropriate HTML URLs
      expect(opml).toContain('htmlUrl="https://example.com"');
      expect(opml).toContain('htmlUrl="https://blog.example.com"');
      expect(opml).toContain('htmlUrl="https://news.example.com"');
      expect(opml).toContain('htmlUrl="https://site.com/blog"');
    });

    it("should use domain names as default titles", async () => {
      const feeds: FeedSource[] = [
        { url: "https://example.com/feed.xml" }, // No custom title
        { url: "https://www.test.com/rss.xml" }, // No custom title
      ];

      (feedDuplicateDetector.removeDuplicates as any).mockResolvedValueOnce({
        uniqueFeeds: feeds,
        removedDuplicates: [],
      });

      const opml = await OPMLExportService.generateOPML(feeds);

      // Should use domain names as titles
      expect(opml).toContain('text="example.com"');
      expect(opml).toContain('text="test.com"'); // Should remove www
    });

    it("should include category metadata when enabled", async () => {
      const feeds: FeedSource[] = [
        {
          url: "https://example.com/feed.xml",
          customTitle: "Example Feed",
          categoryId: "tech",
        },
      ];

      const options = {
        includeFeedMetadata: true,
      };

      (feedDuplicateDetector.removeDuplicates as any).mockResolvedValueOnce({
        uniqueFeeds: feeds,
        removedDuplicates: [],
      });

      const opml = await OPMLExportService.generateOPML(feeds, [], options);

      expect(opml).toContain('category="tech"');
    });

    it("should exclude metadata when disabled", async () => {
      const feeds: FeedSource[] = [
        {
          url: "https://example.com/feed.xml",
          customTitle: "Example Feed",
          categoryId: "tech",
        },
      ];

      const options = {
        includeFeedMetadata: false,
      };

      (feedDuplicateDetector.removeDuplicates as any).mockResolvedValueOnce({
        uniqueFeeds: feeds,
        removedDuplicates: [],
      });

      const opml = await OPMLExportService.generateOPML(feeds, [], options);

      expect(opml).not.toContain('category="tech"');
    });
  });

  describe("XML Escaping and Special Characters", () => {
    it("should properly escape XML special characters", async () => {
      const feeds: FeedSource[] = [
        {
          url: "https://example.com/feed.xml",
          customTitle: "Feed with <special> & \"characters\" & 'quotes'",
        },
      ];

      (feedDuplicateDetector.removeDuplicates as any).mockResolvedValueOnce({
        uniqueFeeds: feeds,
        removedDuplicates: [],
      });

      const opml = await OPMLExportService.generateOPML(feeds);

      // Should escape special characters
      expect(opml).toContain(
        'text="Feed with &lt;special&gt; &amp; &quot;characters&quot; &amp; &#39;quotes&#39;"'
      );
      expect(opml).not.toContain(
        'text="Feed with <special> & "characters" & \'quotes\'"'
      );
    });

    it("should handle Unicode characters", async () => {
      const feeds: FeedSource[] = [
        {
          url: "https://example.com/feed.xml",
          customTitle: "Feed with Unicode: café, naïve, résumé, 中文",
        },
      ];

      const options = {
        title: "Unicode Test: café & naïve",
        ownerName: "José María",
      };

      (feedDuplicateDetector.removeDuplicates as any).mockResolvedValueOnce({
        uniqueFeeds: feeds,
        removedDuplicates: [],
      });

      const opml = await OPMLExportService.generateOPML(feeds, [], options);

      expect(opml).toContain(
        'text="Feed with Unicode: café, naïve, résumé, 中文"'
      );
      expect(opml).toContain("<title>Unicode Test: café &amp; naïve</title>");
      expect(opml).toContain("<ownerName>José María</ownerName>");
    });

    it("should handle empty and null values", async () => {
      const feeds: FeedSource[] = [
        { url: "https://example.com/feed.xml", customTitle: "" },
        { url: "https://test.com/feed.xml" }, // No custom title
      ];

      const options = {
        ownerEmail: "", // Empty email
      };

      (feedDuplicateDetector.removeDuplicates as any).mockResolvedValueOnce({
        uniqueFeeds: feeds,
        removedDuplicates: [],
      });

      const opml = await OPMLExportService.generateOPML(feeds, [], options);

      // Should handle empty values gracefully
      expect(opml).toContain('text="example.com"'); // Should use domain as fallback
      expect(opml).toContain('text="test.com"');
      expect(opml).not.toContain("<ownerEmail></ownerEmail>"); // Should omit empty email
    });
  });

  describe("Duplicate Prevention Integration", () => {
    it("should remove duplicates before generating OPML", async () => {
      const feeds: FeedSource[] = [
        { url: "https://example.com/feed.xml", customTitle: "Original Feed" },
        {
          url: "https://www.example.com/feed.xml",
          customTitle: "Duplicate Feed",
        },
        { url: "https://unique.com/feed.xml", customTitle: "Unique Feed" },
      ];

      const mockResult = {
        uniqueFeeds: [
          { url: "https://example.com/feed.xml", customTitle: "Original Feed" },
          { url: "https://unique.com/feed.xml", customTitle: "Unique Feed" },
        ],
        removedDuplicates: [
          {
            originalFeed: {
              url: "https://www.example.com/feed.xml",
              customTitle: "Duplicate Feed",
            },
            duplicateOf: {
              url: "https://example.com/feed.xml",
              customTitle: "Original Feed",
            },
            reason: "Duplicate detected",
          },
        ],
      };

      (feedDuplicateDetector.removeDuplicates as any).mockResolvedValueOnce(
        mockResult
      );

      const opml = await OPMLExportService.generateOPML(feeds);

      // Should only contain unique feeds
      expect(opml).toContain('text="Original Feed"');
      expect(opml).toContain('text="Unique Feed"');
      expect(opml).not.toContain('text="Duplicate Feed"');

      // Should have called duplicate detection
      expect(feedDuplicateDetector.removeDuplicates).toHaveBeenCalledWith(
        feeds,
        { action: "keep_first" }
      );
    });

    it("should provide duplicate detection information", () => {
      const feeds: FeedSource[] = [
        { url: "https://example.com/feed.xml", customTitle: "Feed 1" },
        { url: "https://www.example.com/feed.xml", customTitle: "Feed 2" },
        { url: "https://unique.com/feed.xml", customTitle: "Feed 3" },
      ];

      const result = OPMLExportService.detectDuplicates(feeds);

      expect(result.duplicates).toHaveLength(1);
      expect(result.uniqueFeeds).toHaveLength(2);
      expect(result.duplicateCount).toBe(1);

      const duplicate = result.duplicates[0];
      expect(duplicate.originalFeed.customTitle).toBe("Feed 2");
      expect(duplicate.duplicateOf.customTitle).toBe("Feed 1");
      expect(duplicate.normalizedUrl).toBe("https://example.com/feed.xml");
    });
  });

  describe("OPML Validation", () => {
    it("should validate correct OPML structure", () => {
      const validOPML = `<?xml version="1.0" encoding="UTF-8"?>
        <opml version="2.0">
          <head>
            <title>Test Feeds</title>
            <dateCreated>Mon, 01 Jan 2024 12:00:00 GMT</dateCreated>
            <dateModified>Mon, 01 Jan 2024 12:00:00 GMT</dateModified>
          </head>
          <body>
            <outline text="Test Feed" type="rss" xmlUrl="https://example.com/feed.xml"/>
          </body>
        </opml>`;

      const result = OPMLExportService.validateOPML(validOPML);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it("should detect missing required elements", () => {
      const invalidOPML = `<?xml version="1.0" encoding="UTF-8"?>
        <opml version="2.0">
          <body>
            <outline text="Test Feed" type="rss" xmlUrl="https://example.com/feed.xml"/>
          </body>
        </opml>`;

      const result = OPMLExportService.validateOPML(invalidOPML);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Missing OPML head section");
    });

    it("should detect malformed XML", () => {
      const malformedOPML = `<?xml version="1.0" encoding="UTF-8"?>
        <opml version="2.0">
          <head>
            <title>Test Feeds</title>
          </head>
          <body>
            <outline text="Test Feed" type="rss" xmlUrl="https://example.com/feed.xml"
          </body>
        </opml>`;

      const result = OPMLExportService.validateOPML(malformedOPML);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should provide warnings for missing optional elements", () => {
      const minimalOPML = `<?xml version="1.0" encoding="UTF-8"?>
        <opml version="2.0">
          <head></head>
          <body>
            <outline text="Test Feed" type="rss" xmlUrl="https://example.com/feed.xml"/>
          </body>
        </opml>`;

      const result = OPMLExportService.validateOPML(minimalOPML);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain("Missing title in head section");
      expect(result.warnings).toContain("Missing dateCreated in head section");
    });
  });

  describe("File Download Functionality", () => {
    it("should create download with correct filename", () => {
      const opmlContent =
        '<?xml version="1.0"?><opml><head><title>Test</title></head><body></body></opml>';

      const mockLink = {
        href: "",
        download: "",
        click: vi.fn(),
      };

      mockCreateElement.mockReturnValueOnce(mockLink);
      mockCreateObjectURL.mockReturnValueOnce("blob:mock-url");

      OPMLExportService.downloadOPML(opmlContent, "my-feeds");

      expect(mockCreateElement).toHaveBeenCalledWith("a");
      expect(mockLink.download).toBe("my-feeds.opml");
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalledWith(mockLink);
      expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    });

    it("should add .opml extension if missing", () => {
      const opmlContent =
        '<?xml version="1.0"?><opml><head><title>Test</title></head><body></body></opml>';

      const mockLink = {
        href: "",
        download: "",
        click: vi.fn(),
      };

      mockCreateElement.mockReturnValueOnce(mockLink);
      mockCreateObjectURL.mockReturnValueOnce("blob:mock-url");

      OPMLExportService.downloadOPML(opmlContent, "feeds-without-extension");

      expect(mockLink.download).toBe("feeds-without-extension.opml");
    });

    it("should not duplicate .opml extension", () => {
      const opmlContent =
        '<?xml version="1.0"?><opml><head><title>Test</title></head><body></body></opml>';

      const mockLink = {
        href: "",
        download: "",
        click: vi.fn(),
      };

      mockCreateElement.mockReturnValueOnce(mockLink);
      mockCreateObjectURL.mockReturnValueOnce("blob:mock-url");

      OPMLExportService.downloadOPML(opmlContent, "feeds.opml");

      expect(mockLink.download).toBe("feeds.opml");
    });

    it("should handle download errors gracefully", () => {
      const opmlContent =
        '<?xml version="1.0"?><opml><head><title>Test</title></head><body></body></opml>';

      mockCreateElement.mockImplementationOnce(() => {
        throw new Error("DOM error");
      });

      expect(() => {
        OPMLExportService.downloadOPML(opmlContent, "test-feeds");
      }).toThrow("Failed to download OPML file");
    });

    it("should generate filename with timestamp", () => {
      const filename = OPMLExportService.generateFilename("my-feeds");

      expect(filename).toMatch(
        /^my-feeds-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.opml$/
      );
    });

    it("should use default base name", () => {
      const filename = OPMLExportService.generateFilename();

      expect(filename).toMatch(
        /^feeds-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.opml$/
      );
    });
  });

  describe("WordPress and Complex Feed Scenarios", () => {
    it("should handle WordPress-style feed URLs", async () => {
      const feeds: FeedSource[] = [
        {
          url: "https://blog.example.com/?feed=rss2",
          customTitle: "WordPress RSS",
        },
        {
          url: "https://blog.example.com/?feed=atom",
          customTitle: "WordPress Atom",
        },
        {
          url: "https://blog.example.com/?feed=comments-rss2",
          customTitle: "WordPress Comments",
        },
      ];

      (feedDuplicateDetector.removeDuplicates as any).mockResolvedValueOnce({
        uniqueFeeds: feeds,
        removedDuplicates: [],
      });

      const opml = await OPMLExportService.generateOPML(feeds);

      expect(opml).toContain('xmlUrl="https://blog.example.com/?feed=rss2"');
      expect(opml).toContain('xmlUrl="https://blog.example.com/?feed=atom"');
      expect(opml).toContain(
        'xmlUrl="https://blog.example.com/?feed=comments-rss2"'
      );

      // Should derive HTML URLs correctly
      expect(opml).toContain('htmlUrl="https://blog.example.com"');
    });

    it("should handle subdomain and subdirectory feeds", async () => {
      const feeds: FeedSource[] = [
        {
          url: "https://blog.example.com/feed.xml",
          customTitle: "Blog Subdomain",
        },
        {
          url: "https://example.com/blog/rss.xml",
          customTitle: "Blog Subdirectory",
        },
        {
          url: "https://news.example.com/feeds/all.xml",
          customTitle: "News Subdomain",
        },
      ];

      (feedDuplicateDetector.removeDuplicates as any).mockResolvedValueOnce({
        uniqueFeeds: feeds,
        removedDuplicates: [],
      });

      const opml = await OPMLExportService.generateOPML(feeds);

      expect(opml).toContain('htmlUrl="https://blog.example.com"');
      expect(opml).toContain('htmlUrl="https://example.com/blog"');
      expect(opml).toContain('htmlUrl="https://news.example.com"');
    });

    it("should handle feeds with complex query parameters", async () => {
      const feeds: FeedSource[] = [
        {
          url: "https://example.com/feed.xml?category=tech&format=rss&limit=20",
          customTitle: "Filtered Tech Feed",
        },
      ];

      (feedDuplicateDetector.removeDuplicates as any).mockResolvedValueOnce({
        uniqueFeeds: feeds,
        removedDuplicates: [],
      });

      const opml = await OPMLExportService.generateOPML(feeds);

      expect(opml).toContain(
        'xmlUrl="https://example.com/feed.xml?category=tech&amp;format=rss&amp;limit=20"'
      );
      expect(opml).toContain('htmlUrl="https://example.com"');
    });
  });

  describe("Large Scale and Performance", () => {
    it("should handle large numbers of feeds efficiently", async () => {
      const feedCount = 1000;
      const feeds: FeedSource[] = Array.from({ length: feedCount }, (_, i) => ({
        url: `https://site${i}.com/feed.xml`,
        customTitle: `Feed ${i}`,
        categoryId: i % 10 === 0 ? "tech" : undefined, // Every 10th feed in tech category
      }));

      const categories: FeedCategory[] = [
        { id: "tech", name: "Technology", order: 1 },
      ];

      (feedDuplicateDetector.removeDuplicates as any).mockResolvedValueOnce({
        uniqueFeeds: feeds,
        removedDuplicates: [],
      });

      const startTime = Date.now();
      const opml = await OPMLExportService.generateOPML(feeds, categories);
      const endTime = Date.now();

      expect(opml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(opml).toContain('<opml version="2.0">');
      expect(opml).toContain("</opml>");

      // Should complete within reasonable time (less than 5 seconds)
      expect(endTime - startTime).toBeLessThan(5000);

      // Should contain all feeds
      expect(opml.split("<outline").length - 1).toBeGreaterThan(feedCount); // -1 because split creates empty first element
    });

    it("should handle feeds with very long titles and descriptions", async () => {
      const longTitle = "A".repeat(500);
      const longDescription = "B".repeat(1000);

      const feeds: FeedSource[] = [
        { url: "https://example.com/feed.xml", customTitle: longTitle },
      ];

      const categories: FeedCategory[] = [
        {
          id: "test",
          name: "Test Category",
          description: longDescription,
          order: 1,
        },
      ];

      (feedDuplicateDetector.removeDuplicates as any).mockResolvedValueOnce({
        uniqueFeeds: feeds,
        removedDuplicates: [],
      });

      const opml = await OPMLExportService.generateOPML(feeds, categories);

      expect(opml).toContain(longTitle);
      expect(opml).toContain(longDescription);
      expect(opml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    });
  });
});

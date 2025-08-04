/**
 * discoveryIntegrationSimple.test.ts
 *
 * Simple integration test to verify that feed discovery integration is working
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { feedValidator } from "../services/feedValidator";
import { feedDiscoveryService } from "../services/feedDiscoveryService";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Discovery Integration - Simple Test", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    feedValidator.clearCache();
  });

  it("should have validateFeedWithDiscovery method available", () => {
    expect(typeof feedValidator.validateFeedWithDiscovery).toBe("function");
  });

  it("should have validateDiscoveredFeed method available", () => {
    expect(typeof feedValidator.validateDiscoveredFeed).toBe("function");
  });

  it("should call progress callback during discovery process", async () => {
    // Mock failed validation
    mockFetch.mockRejectedValue(new Error("Network error"));

    // Mock discovery service to return empty results
    vi.spyOn(feedDiscoveryService, "discoverFromWebsite").mockResolvedValue({
      originalUrl: "https://example.com",
      discoveredFeeds: [],
      discoveryMethods: ["common-paths"],
      totalAttempts: 1,
      successfulAttempts: 0,
      discoveryTime: 100,
      suggestions: ["No feeds found"],
    });

    const progressCallback = vi.fn();
    const result = await feedValidator.validateFeedWithDiscovery(
      "https://example.com",
      progressCallback
    );

    // Verify progress callback was called
    expect(progressCallback).toHaveBeenCalledWith("Starting validation...", 10);
    expect(progressCallback).toHaveBeenCalledWith(
      "Direct validation failed, attempting discovery...",
      30
    );
    expect(progressCallback).toHaveBeenCalledWith("Discovery completed", 70);

    // Verify result structure
    expect(result).toHaveProperty("discoveryResult");
    expect(result).toHaveProperty("discoveredFeeds");
    expect(result).toHaveProperty("finalMethod");
    expect(result.status).toBe("discovery_required");
  });

  it("should handle multiple discovered feeds requiring user selection", async () => {
    // Mock failed validation
    mockFetch.mockRejectedValue(new Error("CORS error"));

    // Mock discovery service to return multiple feeds
    const discoveredFeeds = [
      {
        url: "https://example.com/rss.xml",
        title: "Main Feed",
        type: "rss" as const,
        discoveryMethod: "link-tag" as const,
        confidence: 0.9,
      },
      {
        url: "https://example.com/atom.xml",
        title: "Atom Feed",
        type: "atom" as const,
        discoveryMethod: "link-tag" as const,
        confidence: 0.8,
      },
    ];

    vi.spyOn(feedDiscoveryService, "discoverFromWebsite").mockResolvedValue({
      originalUrl: "https://example.com",
      discoveredFeeds,
      discoveryMethods: ["html-parsing"],
      totalAttempts: 1,
      successfulAttempts: 1,
      discoveryTime: 200,
      suggestions: ["Found 2 RSS feeds on this website"],
    });

    const result = await feedValidator.validateFeedWithDiscovery(
      "https://example.com"
    );

    expect(result.requiresUserSelection).toBe(true);
    expect(result.discoveredFeeds).toHaveLength(2);
    expect(result.status).toBe("discovery_required");
    expect(result.error).toContain(
      "Found 2 RSS feeds - user selection required"
    );
  });
});

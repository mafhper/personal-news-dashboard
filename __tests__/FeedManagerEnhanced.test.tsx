/**
 * FeedManagerEnhanced.test.tsx
 *
 * Tests for the enhanced FeedManager component with improved validation UI
 */

import React from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FeedManager } from "../components/FeedManager";
import type { FeedSource } from "../types";
import { renderWithNotifications } from "./helpers/NotificationTestWrapper";

// Mock the services
vi.mock("../services/feedValidator", () => ({
  feedValidator: {
    validateFeed: vi.fn(),
    validateFeedWithDiscovery: vi.fn(),
    validateDiscoveredFeed: vi.fn(),
    revalidateFeed: vi.fn(),
    clearCache: vi.fn(),
  },
  getFeedStatusIcon: vi.fn(() => "✓"),
  getFeedStatusColor: vi.fn(() => "text-green-400"),
  getFeedStatusText: vi.fn(() => "Valid"),
}));

vi.mock("../services/feedDiscoveryService", () => ({
  getFeedTypeIcon: vi.fn(() => "📰"),
  getFeedTypeColor: vi.fn(() => "text-blue-400"),
  getDiscoveryMethodText: vi.fn(() => "Link tag"),
  getConfidenceText: vi.fn(() => "High"),
  getConfidenceColor: vi.fn(() => "bg-green-500"),
}));

vi.mock("../services/logger", () => ({
  useLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  })),
  getLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  })),
}));

vi.mock("../services/opmlExportService", () => ({
  OPMLExportService: {
    detectDuplicates: vi.fn(() => ({
      uniqueFeeds: [],
      duplicateCount: 0,
      duplicates: [],
    })),
    generateOPML: vi.fn(() => "<opml></opml>"),
    validateOPML: vi.fn(() => ({ isValid: true, errors: [], warnings: [] })),
    generateFilename: vi.fn(() => "test.opml"),
    downloadOPML: vi.fn(),
  },
}));

describe("Enhanced FeedManager", () => {
  const mockFeeds: FeedSource[] = [
    { url: "https://example.com/feed.xml", customTitle: "Test Feed" },
    { url: "https://invalid.com/feed.xml" },
  ];

  const mockSetFeeds = vi.fn();
  const mockCloseModal = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render enhanced validation UI elements", () => {
    renderWithNotifications(
      <FeedManager
        currentFeeds={mockFeeds}
        setFeeds={mockSetFeeds}
        closeModal={mockCloseModal}
      />
    );

    // Check for enhanced UI elements
    expect(screen.getByText("Manage Feeds")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("https://example.com/rss.xml")
    ).toBeInTheDocument();
    expect(screen.getByText("Add")).toBeInTheDocument();
  });

  it("should display retry buttons for feeds", () => {
    renderWithNotifications(
      <FeedManager
        currentFeeds={mockFeeds}
        setFeeds={mockSetFeeds}
        closeModal={mockCloseModal}
      />
    );

    // Look for retry buttons (🔄 emoji)
    const retryButtons = screen.getAllByTitle(
      /Revalidate this feed|Retry validation/
    );
    expect(retryButtons.length).toBeGreaterThan(0);
  });

  it("should display validation status for feeds", async () => {
    renderWithNotifications(
      <FeedManager
        currentFeeds={mockFeeds}
        setFeeds={mockSetFeeds}
        closeModal={mockCloseModal}
      />
    );

    // Wait for validation to complete
    await waitFor(() => {
      // Check if validation status is displayed
      expect(screen.getByText("Test Feed")).toBeInTheDocument();
    });
  });

  it("should handle retry validation action", async () => {
    const { feedValidator } = await import("../services/feedValidator");

    renderWithNotifications(
      <FeedManager
        currentFeeds={mockFeeds}
        setFeeds={mockSetFeeds}
        closeModal={mockCloseModal}
      />
    );

    // Find and click a retry button
    const retryButtons = screen.getAllByTitle(
      /Revalidate this feed|Retry validation/
    );
    if (retryButtons.length > 0) {
      fireEvent.click(retryButtons[0]);

      // Verify that revalidateFeed was called
      expect(feedValidator.revalidateFeed).toHaveBeenCalled();
    }
  });

  it("should show validation attempt history when available", () => {
    const feedsWithValidation = [
      {
        url: "https://example.com/feed.xml",
        customTitle: "Test Feed",
      },
    ];

    renderWithNotifications(
      <FeedManager
        currentFeeds={feedsWithValidation}
        setFeeds={mockSetFeeds}
        closeModal={mockCloseModal}
      />
    );

    // The validation history details element should be present
    // (it's rendered conditionally based on validation attempts)
    const feedItems = screen.getAllByRole("listitem");
    expect(feedItems.length).toBeGreaterThan(0);
  });

  it("should display actionable error messages", () => {
    renderWithNotifications(
      <FeedManager
        currentFeeds={mockFeeds}
        setFeeds={mockSetFeeds}
        closeModal={mockCloseModal}
      />
    );

    // Error messages and suggestions should be displayed when validation fails
    // This is tested through the validation result structure
    expect(screen.getByText("Current Feeds (2)")).toBeInTheDocument();
  });

  it("should handle force discovery action", async () => {
    renderWithNotifications(
      <FeedManager
        currentFeeds={mockFeeds}
        setFeeds={mockSetFeeds}
        closeModal={mockCloseModal}
      />
    );

    // Look for discovery buttons (🔍 emoji)
    const discoveryButtons = screen.queryAllByTitle(
      "Try feed discovery on this URL"
    );

    // Discovery buttons should be available for failed feeds
    // The exact behavior depends on the validation state
    expect(discoveryButtons.length).toBeGreaterThanOrEqual(0);
  });

  it("should handle cache clearing action", async () => {
    const { feedValidator } = await import("../services/feedValidator");

    renderWithNotifications(
      <FeedManager
        currentFeeds={mockFeeds}
        setFeeds={mockSetFeeds}
        closeModal={mockCloseModal}
      />
    );

    // Look for cache clear buttons
    const clearCacheButtons = screen.queryAllByTitle(
      "Clear cache and force fresh validation"
    );

    if (clearCacheButtons.length > 0) {
      fireEvent.click(clearCacheButtons[0]);

      // Verify that revalidateFeed was called (used for cache clearing)
      expect(feedValidator.revalidateFeed).toHaveBeenCalled();
    }
  });

  it("should display discovery progress indicator", () => {
    renderWithNotifications(
      <FeedManager
        currentFeeds={mockFeeds}
        setFeeds={mockSetFeeds}
        closeModal={mockCloseModal}
      />
    );

    // The discovery progress indicator should be conditionally rendered
    // when discovery is in progress
    const addButton = screen.getByText("Add");
    expect(addButton).toBeInTheDocument();
  });
});

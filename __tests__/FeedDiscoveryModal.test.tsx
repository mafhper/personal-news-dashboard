/**
 * FeedDiscoveryModal.test.tsx
 *
 * Tests for the FeedDiscoveryModal component
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { FeedDiscoveryModal } from "../components/FeedDiscoveryModal";
import { NotificationTestWrapper } from "./helpers/NotificationTestWrapper";
import type { DiscoveredFeed } from "../services/feedDiscoveryService";

const renderWithNotifications = (component: React.ReactElement) => {
  return render(component, { wrapper: NotificationTestWrapper });
};

describe("FeedDiscoveryModal", () => {
  const mockDiscoveredFeeds: DiscoveredFeed[] = [
    {
      url: "https://example.com/feed.xml",
      title: "Example Feed",
      description: "An example RSS feed",
      discoveryMethod: "direct",
      confidence: 0.9,
      type: "rss",
    },
    {
      url: "https://example.com/blog/feed",
      title: "Blog Feed",
      description: "Blog RSS feed",
      discoveryMethod: "link_discovery",
      confidence: 0.7,
      type: "rss",
    },
  ];

  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
    originalUrl: "https://example.com",
    discoveredFeeds: mockDiscoveredFeeds,
    onSelectFeed: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render modal with discovered feeds", () => {
    renderWithNotifications(<FeedDiscoveryModal {...mockProps} />);

    expect(screen.getByText("Multiple Feeds Discovered")).toBeInTheDocument();
    expect(screen.getByText("2 feeds found")).toBeInTheDocument();
    expect(screen.getByText("Example Feed")).toBeInTheDocument();
    expect(screen.getByText("Blog Feed")).toBeInTheDocument();
  });

  it("should display original URL", () => {
    renderWithNotifications(<FeedDiscoveryModal {...mockProps} />);

    expect(screen.getByText("https://example.com")).toBeInTheDocument();
  });

  it("should show confidence badges", () => {
    renderWithNotifications(<FeedDiscoveryModal {...mockProps} />);

    expect(screen.getByText("High Confidence")).toBeInTheDocument();
    expect(screen.getByText("Medium Confidence")).toBeInTheDocument();
  });

  it("should show discovery method badges", () => {
    renderWithNotifications(<FeedDiscoveryModal {...mockProps} />);

    expect(screen.getByText("Direct RSS")).toBeInTheDocument();
    expect(screen.getByText("Link Discovery")).toBeInTheDocument();
  });

  it("should handle feed selection", () => {
    renderWithNotifications(<FeedDiscoveryModal {...mockProps} />);

    const selectButtons = screen.getAllByText("Select");
    fireEvent.click(selectButtons[0]);

    expect(mockProps.onSelectFeed).toHaveBeenCalledWith(mockDiscoveredFeeds[0]);
  });

  it("should handle card click for selection", () => {
    renderWithNotifications(<FeedDiscoveryModal {...mockProps} />);

    const feedCard = screen
      .getByText("Example Feed")
      .closest(".cursor-pointer");
    fireEvent.click(feedCard!);

    expect(mockProps.onSelectFeed).toHaveBeenCalledWith(mockDiscoveredFeeds[0]);
  });

  it("should handle modal close", () => {
    renderWithNotifications(<FeedDiscoveryModal {...mockProps} />);

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it("should disable interactions when loading", () => {
    renderWithNotifications(
      <FeedDiscoveryModal {...mockProps} isLoading={true} />
    );

    const selectButtons = screen.getAllByText("Select");
    expect(selectButtons[0]).toBeDisabled();

    const cancelButton = screen.getByText("Cancel");
    expect(cancelButton).toBeDisabled();
  });

  it("should truncate long URLs", () => {
    const longUrlFeed: DiscoveredFeed = {
      url: "https://very-long-domain-name-that-should-be-truncated.com/very/long/path/to/feed.xml",
      title: "Long URL Feed",
      discoveryMethod: "direct",
      confidence: 0.8,
      type: "rss",
    };

    renderWithNotifications(
      <FeedDiscoveryModal {...mockProps} discoveredFeeds={[longUrlFeed]} />
    );

    expect(screen.getByText(/\.\.\.$/)).toBeInTheDocument();
  });

  it("should show feed descriptions when available", () => {
    renderWithNotifications(<FeedDiscoveryModal {...mockProps} />);

    expect(screen.getByText("An example RSS feed")).toBeInTheDocument();
    expect(screen.getByText("Blog RSS feed")).toBeInTheDocument();
  });
});

/**
 * FeedManagerControls.test.tsx
 *
 * Tests for the FeedManagerControls component
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { FeedManagerControls } from "../components/FeedManagerControls";
import { NotificationTestWrapper } from "./helpers/NotificationTestWrapper";

const renderWithNotifications = (component: React.ReactElement) => {
  return render(component, { wrapper: NotificationTestWrapper });
};

describe("FeedManagerControls", () => {
  const mockProps = {
    searchTerm: "",
    onSearchChange: vi.fn(),
    statusFilter: "all",
    onStatusFilterChange: vi.fn(),
    sortBy: "name",
    onSortChange: vi.fn(),
    viewMode: "grid" as const,
    onViewModeChange: vi.fn(),
    isSelectMode: false,
    onToggleSelectMode: vi.fn(),
    selectedCount: 0,
    totalCount: 5,
    onSelectAll: vi.fn(),
    onClearSelection: vi.fn(),
    onBulkDelete: vi.fn(),
    onBulkValidate: vi.fn(),
    onBulkExport: vi.fn(),
    onClearFilters: vi.fn(),
    onRefreshAll: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render search input and basic controls", () => {
    renderWithNotifications(<FeedManagerControls {...mockProps} />);

    expect(
      screen.getByPlaceholderText(
        "Search feeds by URL, title, or description..."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Select")).toBeInTheDocument();
    expect(screen.getByText("5 feeds")).toBeInTheDocument();
  });

  it("should handle search input changes", () => {
    renderWithNotifications(<FeedManagerControls {...mockProps} />);

    const searchInput = screen.getByPlaceholderText(
      "Search feeds by URL, title, or description..."
    );
    fireEvent.change(searchInput, { target: { value: "test search" } });

    expect(mockProps.onSearchChange).toHaveBeenCalledWith("test search");
  });

  it("should handle status filter changes", () => {
    renderWithNotifications(<FeedManagerControls {...mockProps} />);

    const statusSelect = screen.getByDisplayValue("All Status");
    fireEvent.change(statusSelect, { target: { value: "valid" } });

    expect(mockProps.onStatusFilterChange).toHaveBeenCalledWith("valid");
  });

  it("should handle sort changes", () => {
    renderWithNotifications(<FeedManagerControls {...mockProps} />);

    const sortSelect = screen.getByDisplayValue("Sort by Name");
    fireEvent.change(sortSelect, { target: { value: "status" } });

    expect(mockProps.onSortChange).toHaveBeenCalledWith("status");
  });

  it("should toggle select mode", () => {
    renderWithNotifications(<FeedManagerControls {...mockProps} />);

    const selectButton = screen.getByText("Select");
    fireEvent.click(selectButton);

    expect(mockProps.onToggleSelectMode).toHaveBeenCalled();
  });

  it("should show selection bar when in select mode", () => {
    renderWithNotifications(
      <FeedManagerControls
        {...mockProps}
        isSelectMode={true}
        selectedCount={2}
      />
    );

    expect(screen.getByText("2 of 5 selected")).toBeInTheDocument();
    expect(screen.getByText("Select All")).toBeInTheDocument();
  });

  it("should show bulk actions when feeds are selected", () => {
    renderWithNotifications(
      <FeedManagerControls
        {...mockProps}
        isSelectMode={true}
        selectedCount={2}
      />
    );

    expect(screen.getByTitle("Validate 2 selected feeds")).toBeInTheDocument();
    expect(screen.getByTitle("Export 2 selected feeds")).toBeInTheDocument();
    expect(screen.getByTitle("Delete 2 selected feeds")).toBeInTheDocument();
  });

  it("should handle bulk delete action", () => {
    renderWithNotifications(
      <FeedManagerControls
        {...mockProps}
        isSelectMode={true}
        selectedCount={2}
      />
    );

    const deleteButton = screen.getByTitle("Delete 2 selected feeds");
    fireEvent.click(deleteButton);

    expect(mockProps.onBulkDelete).toHaveBeenCalled();
  });

  it("should show clear filters button when filters are active", () => {
    renderWithNotifications(
      <FeedManagerControls {...mockProps} searchTerm="test" />
    );

    expect(screen.getByText("Clear Filters")).toBeInTheDocument();
  });

  it("should show active filter badges", () => {
    renderWithNotifications(
      <FeedManagerControls
        {...mockProps}
        searchTerm="test search"
        statusFilter="valid"
      />
    );

    expect(screen.getByText('Search: "test search"')).toBeInTheDocument();
    expect(screen.getByText("Status: valid")).toBeInTheDocument();
  });

  it("should handle view mode changes", () => {
    renderWithNotifications(<FeedManagerControls {...mockProps} />);

    const listViewButton = screen.getByTitle("List view");
    fireEvent.click(listViewButton);

    expect(mockProps.onViewModeChange).toHaveBeenCalledWith("list");
  });

  it("should handle refresh all action", () => {
    renderWithNotifications(<FeedManagerControls {...mockProps} />);

    const refreshButton = screen.getByTitle("Refresh all feeds");
    fireEvent.click(refreshButton);

    expect(mockProps.onRefreshAll).toHaveBeenCalled();
  });

  it("should show loading state when validating", () => {
    renderWithNotifications(
      <FeedManagerControls {...mockProps} isValidating={true} />
    );

    const refreshButton = screen.getByTitle("Refresh all feeds");
    expect(refreshButton).toBeDisabled();
  });

  it("should handle select all/deselect all", () => {
    renderWithNotifications(
      <FeedManagerControls
        {...mockProps}
        isSelectMode={true}
        selectedCount={5}
        totalCount={5}
      />
    );

    const deselectAllButton = screen.getByText("Deselect All");
    fireEvent.click(deselectAllButton);

    expect(mockProps.onClearSelection).toHaveBeenCalled();
  });
});

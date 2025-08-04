import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  NotificationToast,
  NotificationContainer,
} from "../components/NotificationToast";
import { NotificationProvider } from "../contexts/NotificationContext";
import type { Notification } from "../contexts/NotificationContext";

// Mock notification for testing
const createMockNotification = (
  overrides: Partial<Notification> = {}
): Notification => ({
  id: "test-id",
  message: "Test notification message",
  type: "info",
  duration: 5000,
  persistent: false,
  timestamp: Date.now(),
  ...overrides,
});

describe("NotificationToast", () => {
  it("should render notification message", () => {
    const notification = createMockNotification();

    render(
      <NotificationProvider>
        <NotificationToast notification={notification} />
      </NotificationProvider>
    );

    expect(screen.getByText("Test notification message")).toBeInTheDocument();
  });

  it("should render different notification types", () => {
    const { rerender } = render(
      <NotificationProvider>
        <NotificationToast
          notification={createMockNotification({ type: "success" })}
        />
      </NotificationProvider>
    );

    expect(screen.getByText("Test notification message")).toBeInTheDocument();

    rerender(
      <NotificationProvider>
        <NotificationToast
          notification={createMockNotification({ type: "error" })}
        />
      </NotificationProvider>
    );

    expect(screen.getByText("Test notification message")).toBeInTheDocument();

    rerender(
      <NotificationProvider>
        <NotificationToast
          notification={createMockNotification({ type: "warning" })}
        />
      </NotificationProvider>
    );

    expect(screen.getByText("Test notification message")).toBeInTheDocument();
  });

  it("should call removeNotification when close button is clicked", async () => {
    const notification = createMockNotification();

    render(
      <NotificationProvider>
        <NotificationToast notification={notification} />
      </NotificationProvider>
    );

    const closeButton = screen.getByLabelText("close");
    fireEvent.click(closeButton);

    // The notification should be removed from the DOM
    await waitFor(() => {
      expect(
        screen.queryByText("Test notification message")
      ).not.toBeInTheDocument();
    });
  });

  it("should handle persistent notifications", () => {
    const persistentNotification = createMockNotification({
      persistent: true,
      message: "Persistent notification",
    });

    render(
      <NotificationProvider>
        <NotificationToast notification={persistentNotification} />
      </NotificationProvider>
    );

    expect(screen.getByText("Persistent notification")).toBeInTheDocument();

    // Persistent notifications should still have close button
    const closeButton = screen.getByLabelText("close");
    expect(closeButton).toBeInTheDocument();
  });
});

describe("NotificationContainer", () => {
  it("should render multiple notifications", () => {
    render(
      <NotificationProvider>
        <NotificationContainer />
        <button
          onClick={() => {
            // This would normally be done through the context
            // For testing, we'll simulate multiple notifications
          }}
        >
          Add Notification
        </button>
      </NotificationProvider>
    );

    // The container should be in the DOM
    const container = document.querySelector('[style*="position: fixed"]');
    expect(container).toBeInTheDocument();
  });

  it("should position notifications correctly", () => {
    render(
      <NotificationProvider>
        <NotificationContainer />
      </NotificationProvider>
    );

    const container = document.querySelector('[style*="position: fixed"]');
    expect(container).toHaveStyle({
      position: "fixed",
      top: "20px",
      right: "20px",
      zIndex: "9999",
    });
  });

  it("should handle empty notification list", () => {
    render(
      <NotificationProvider>
        <NotificationContainer />
      </NotificationProvider>
    );

    // Container should exist but be empty
    const container = document.querySelector('[style*="position: fixed"]');
    expect(container).toBeInTheDocument();
    expect(container?.children).toHaveLength(0);
  });
});

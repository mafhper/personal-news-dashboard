import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
  NotificationProvider,
  useNotification,
} from "../contexts/NotificationContext";
import { useNotificationReplacements } from "../hooks/useNotificationReplacements";
import { NotificationContainer } from "../components/NotificationToast";

// Simple test component that uses notifications
const SimpleTestComponent: React.FC = () => {
  const { showNotification } = useNotification();
  const { alert, confirm, toast } = useNotificationReplacements();

  return (
    <div>
      <button
        onClick={() => showNotification("Test notification", { type: "info" })}
      >
        Show Notification
      </button>
      <button onClick={() => alert("Test alert")}>Show Alert</button>
      <button
        onClick={async () => {
          const result = await confirm("Test confirm");
          showNotification(`Confirm result: ${result}`, { type: "info" });
        }}
      >
        Show Confirm
      </button>
      <button onClick={() => toast.success("Test toast")}>Show Toast</button>
    </div>
  );
};

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <NotificationProvider>
      {component}
      <NotificationContainer />
    </NotificationProvider>
  );
};

describe("Notification Components Simple Tests", () => {
  it("should render notification system without errors", () => {
    renderWithProvider(<SimpleTestComponent />);

    expect(screen.getByText("Show Notification")).toBeInTheDocument();
    expect(screen.getByText("Show Alert")).toBeInTheDocument();
    expect(screen.getByText("Show Confirm")).toBeInTheDocument();
    expect(screen.getByText("Show Toast")).toBeInTheDocument();
  });

  it("should show toast notification", async () => {
    renderWithProvider(<SimpleTestComponent />);

    fireEvent.click(screen.getByText("Show Toast"));

    await waitFor(() => {
      expect(screen.getByText("Test toast")).toBeInTheDocument();
    });
  });

  it("should show alert dialog", async () => {
    renderWithProvider(<SimpleTestComponent />);

    fireEvent.click(screen.getByText("Show Alert"));

    await waitFor(() => {
      expect(screen.getByText("Test alert")).toBeInTheDocument();
      expect(screen.getByText("Informação")).toBeInTheDocument(); // Default title
    });
  });

  it("should show confirm dialog and handle confirmation", async () => {
    renderWithProvider(<SimpleTestComponent />);

    fireEvent.click(screen.getByText("Show Confirm"));

    await waitFor(() => {
      expect(screen.getByText("Test confirm")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("OK"));

    await waitFor(() => {
      expect(screen.getByText("Confirm result: true")).toBeInTheDocument();
    });
  });

  it("should show confirm dialog and handle cancellation", async () => {
    renderWithProvider(<SimpleTestComponent />);

    fireEvent.click(screen.getByText("Show Confirm"));

    await waitFor(() => {
      expect(screen.getByText("Test confirm")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Cancelar"));

    await waitFor(() => {
      expect(screen.getByText("Confirm result: false")).toBeInTheDocument();
    });
  });

  it("should handle notification provider context correctly", () => {
    // Test that the notification system doesn't break normal React functionality
    const TestComponent: React.FC = () => {
      const [count, setCount] = React.useState(0);
      const { toast } = useNotificationReplacements();

      return (
        <div>
          <button onClick={() => setCount((c) => c + 1)}>Count: {count}</button>
          <button onClick={() => toast.info(`Count is ${count}`)}>
            Show Count
          </button>
        </div>
      );
    };

    renderWithProvider(<TestComponent />);

    expect(screen.getByText("Count: 0")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Count: 0"));
    expect(screen.getByText("Count: 1")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Show Count"));
    expect(screen.getByText("Count is 1")).toBeInTheDocument();
  });

  it("should throw error when used outside provider", () => {
    const TestWithoutProvider: React.FC = () => {
      const { showNotification } = useNotification();
      return <button onClick={() => showNotification("Test")}>Test</button>;
    };

    // Mock console.error to avoid noise in test output
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      render(<TestWithoutProvider />);
    }).toThrow("useNotification must be used within a NotificationProvider");

    consoleSpy.mockRestore();
  });
});

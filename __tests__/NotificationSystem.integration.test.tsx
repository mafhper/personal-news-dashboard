import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  NotificationProvider,
  useNotification,
} from "../contexts/NotificationContext";
import { useNotificationReplacements } from "../hooks/useNotificationReplacements";
import { NotificationContainer } from "../components/NotificationToast";

// Test component that uses the notification system
const TestComponent: React.FC = () => {
  const { showNotification, showAlert, showConfirm } = useNotification();
  const { alert, confirm, toast, alertSuccess, alertError, confirmDanger } =
    useNotificationReplacements();

  return (
    <div>
      <button
        onClick={() => showNotification("Toast notification", { type: "info" })}
      >
        Show Toast
      </button>
      <button
        onClick={() => showNotification("Success toast", { type: "success" })}
      >
        Show Success Toast
      </button>
      <button
        onClick={() => showNotification("Error toast", { type: "error" })}
      >
        Show Error Toast
      </button>
      <button
        onClick={() =>
          showNotification("Persistent toast", { persistent: true })
        }
      >
        Show Persistent Toast
      </button>
      <button onClick={() => showAlert("Alert message", { type: "info" })}>
        Show Alert
      </button>
      <button
        onClick={async () => {
          const result = await showConfirm({
            message: "Confirm message",
            title: "Confirm Title",
          });
          showNotification(`Confirm result: ${result}`, { type: "info" });
        }}
      >
        Show Confirm
      </button>

      {/* Test useNotificationReplacements hook */}
      <button onClick={() => alert("Replacement alert")}>
        Replacement Alert
      </button>
      <button
        onClick={async () => {
          const result = await confirm("Replacement confirm");
          toast.info(`Replacement confirm result: ${result}`);
        }}
      >
        Replacement Confirm
      </button>
      <button onClick={() => toast.success("Replacement toast success")}>
        Replacement Toast Success
      </button>
      <button onClick={() => alertSuccess("Success alert")}>
        Success Alert
      </button>
      <button onClick={() => alertError("Error alert")}>Error Alert</button>
      <button
        onClick={async () => {
          const result = await confirmDanger("Danger confirm", "Danger Title");
          toast.info(`Danger confirm result: ${result}`);
        }}
      >
        Danger Confirm
      </button>
    </div>
  );
};

describe("Notification System Integration", () => {
  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <NotificationProvider>
        {component}
        <NotificationContainer />
      </NotificationProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Toast Notifications", () => {
    it("should show and auto-hide toast notifications", async () => {
      renderWithProvider(<TestComponent />);

      fireEvent.click(screen.getByText("Show Toast"));

      expect(screen.getByText("Toast notification")).toBeInTheDocument();

      // Toast should auto-hide after duration (we'll wait a bit)
      await waitFor(
        () => {
          expect(
            screen.queryByText("Toast notification")
          ).not.toBeInTheDocument();
        },
        { timeout: 6000 }
      );
    });

    it("should show different types of toast notifications", async () => {
      renderWithProvider(<TestComponent />);

      fireEvent.click(screen.getByText("Show Success Toast"));
      expect(screen.getByText("Success toast")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Show Error Toast"));
      expect(screen.getByText("Error toast")).toBeInTheDocument();
    });

    it("should handle persistent toast notifications", async () => {
      renderWithProvider(<TestComponent />);

      fireEvent.click(screen.getByText("Show Persistent Toast"));
      expect(screen.getByText("Persistent toast")).toBeInTheDocument();

      // Wait longer than normal auto-hide duration
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 6000));
      });

      // Persistent toast should still be there
      expect(screen.getByText("Persistent toast")).toBeInTheDocument();

      // But should be removable by clicking close
      const closeButton = screen.getByLabelText("close");
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText("Persistent toast")).not.toBeInTheDocument();
      });
    });
  });

  describe("Alert Dialogs", () => {
    it("should show and close alert dialogs", async () => {
      renderWithProvider(<TestComponent />);

      fireEvent.click(screen.getByText("Show Alert"));

      expect(screen.getByText("Alert message")).toBeInTheDocument();
      expect(screen.getByText("Informação")).toBeInTheDocument(); // Default title

      fireEvent.click(screen.getByText("OK"));

      await waitFor(() => {
        expect(screen.queryByText("Alert message")).not.toBeInTheDocument();
      });
    });
  });

  describe("Confirm Dialogs", () => {
    it("should show confirm dialog and handle confirmation", async () => {
      renderWithProvider(<TestComponent />);

      fireEvent.click(screen.getByText("Show Confirm"));

      expect(screen.getByText("Confirm message")).toBeInTheDocument();
      expect(screen.getByText("Confirm Title")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Confirmar"));

      await waitFor(() => {
        expect(screen.getByText("Confirm result: true")).toBeInTheDocument();
      });
    });

    it("should show confirm dialog and handle cancellation", async () => {
      renderWithProvider(<TestComponent />);

      fireEvent.click(screen.getByText("Show Confirm"));

      expect(screen.getByText("Confirm message")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Cancelar"));

      await waitFor(() => {
        expect(screen.getByText("Confirm result: false")).toBeInTheDocument();
      });
    });
  });

  describe("useNotificationReplacements Hook", () => {
    it("should provide replacement for window.alert", async () => {
      renderWithProvider(<TestComponent />);

      fireEvent.click(screen.getByText("Replacement Alert"));

      expect(screen.getByText("Replacement alert")).toBeInTheDocument();
      expect(screen.getByText("Informação")).toBeInTheDocument();
    });

    it("should provide replacement for window.confirm", async () => {
      renderWithProvider(<TestComponent />);

      fireEvent.click(screen.getByText("Replacement Confirm"));

      expect(screen.getByText("Replacement confirm")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Confirmar"));

      await waitFor(() => {
        expect(
          screen.getByText("Replacement confirm result: true")
        ).toBeInTheDocument();
      });
    });

    it("should provide toast notifications", async () => {
      renderWithProvider(<TestComponent />);

      fireEvent.click(screen.getByText("Replacement Toast Success"));

      expect(screen.getByText("Replacement toast success")).toBeInTheDocument();
    });

    it("should provide specialized alert methods", async () => {
      renderWithProvider(<TestComponent />);

      fireEvent.click(screen.getByText("Success Alert"));
      expect(screen.getByText("Success alert")).toBeInTheDocument();
      expect(screen.getByText("Sucesso")).toBeInTheDocument();

      // Close the success alert
      fireEvent.click(screen.getByText("OK"));

      await waitFor(() => {
        expect(screen.queryByText("Success alert")).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Error Alert"));
      expect(screen.getByText("Error alert")).toBeInTheDocument();
      expect(screen.getByText("Erro")).toBeInTheDocument();
    });

    it("should provide specialized confirm methods", async () => {
      renderWithProvider(<TestComponent />);

      fireEvent.click(screen.getByText("Danger Confirm"));

      expect(screen.getByText("Danger confirm")).toBeInTheDocument();
      expect(screen.getByText("Danger Title")).toBeInTheDocument();
      expect(screen.getByText("Excluir")).toBeInTheDocument(); // Danger confirm button

      fireEvent.click(screen.getByText("Excluir"));

      await waitFor(() => {
        expect(
          screen.getByText("Danger confirm result: true")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Multiple Notifications", () => {
    it("should handle multiple simultaneous notifications", async () => {
      renderWithProvider(<TestComponent />);

      // Show multiple toasts
      fireEvent.click(screen.getByText("Show Toast"));
      fireEvent.click(screen.getByText("Show Success Toast"));
      fireEvent.click(screen.getByText("Show Error Toast"));

      expect(screen.getByText("Toast notification")).toBeInTheDocument();
      expect(screen.getByText("Success toast")).toBeInTheDocument();
      expect(screen.getByText("Error toast")).toBeInTheDocument();
    });
  });

  describe("Backward Compatibility", () => {
    it("should work without breaking existing functionality", async () => {
      // Test that the notification system doesn't interfere with normal React behavior
      const TestBackwardCompatibility: React.FC = () => {
        const [count, setCount] = React.useState(0);
        const { toast } = useNotificationReplacements();

        return (
          <div>
            <button onClick={() => setCount((c) => c + 1)}>
              Count: {count}
            </button>
            <button onClick={() => toast.info(`Count is now ${count}`)}>
              Show Count Toast
            </button>
          </div>
        );
      };

      renderWithProvider(<TestBackwardCompatibility />);

      fireEvent.click(screen.getByText("Count: 0"));
      expect(screen.getByText("Count: 1")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Show Count Toast"));
      expect(screen.getByText("Count is now 1")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should handle errors gracefully", () => {
      // Test component that tries to use notifications outside provider
      const TestWithoutProvider: React.FC = () => {
        const { showNotification } = useNotification();
        return <button onClick={() => showNotification("Test")}>Test</button>;
      };

      // This should throw an error
      expect(() => {
        render(<TestWithoutProvider />);
      }).toThrow("useNotification must be used within a NotificationProvider");
    });
  });
});

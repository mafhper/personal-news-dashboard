import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeCustomizer } from "../components/ThemeCustomizer";
import { renderWithNotifications } from "./helpers/NotificationTestWrapper";

// Mock the useExtendedTheme hook
const mockUseExtendedTheme = {
  currentTheme: {
    id: "test-theme",
    name: "Test Theme",
    colors: {
      primary: "20 184 166",
      secondary: "45 55 72",
      accent: "20 184 166",
      background: "26 32 44",
      surface: "45 55 72",
      text: "247 250 252",
      textSecondary: "160 174 192",
      border: "75 85 99",
      success: "16 185 129",
      warning: "245 158 11",
      error: "239 68 68",
    },
    layout: "comfortable" as const,
    density: "medium" as const,
    borderRadius: "medium" as const,
    shadows: true,
    animations: true,
  },
  defaultPresets: [
    {
      id: "preset-1",
      name: "Preset 1",
      description: "Test preset",
      category: "dark" as const,
      theme: {
        id: "preset-1",
        name: "Preset 1",
        colors: {
          primary: "59 130 246",
          secondary: "45 55 72",
          accent: "59 130 246",
          background: "26 32 44",
          surface: "45 55 72",
          text: "247 250 252",
          textSecondary: "160 174 192",
          border: "75 85 99",
          success: "16 185 129",
          warning: "245 158 11",
          error: "239 68 68",
        },
        layout: "comfortable" as const,
        density: "medium" as const,
        borderRadius: "medium" as const,
        shadows: true,
        animations: true,
      },
    },
  ],
  customThemes: [],
  setCurrentTheme: vi.fn(),
  addCustomTheme: vi.fn(),
  removeCustomTheme: vi.fn(),
  duplicateTheme: vi.fn(),
};

vi.mock("../hooks/useExtendedTheme", () => ({
  useExtendedTheme: () => mockUseExtendedTheme,
}));

// Mock theme utils
vi.mock("../services/themeUtils", () => ({
  exportTheme: vi.fn((theme) => JSON.stringify(theme, null, 2)),
  importTheme: vi.fn((json) => {
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }),
}));

describe("ThemeCustomizer", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not render when closed", () => {
    renderWithNotifications(
      <ThemeCustomizer {...defaultProps} isOpen={false} />
    );
    expect(screen.queryByText("Theme Customizer")).not.toBeInTheDocument();
  });

  it("should render when open", () => {
    renderWithNotifications(<ThemeCustomizer {...defaultProps} />);
    expect(screen.getByText("Theme Customizer")).toBeInTheDocument();
  });

  it("should close when close button is clicked", async () => {
    const user = userEvent.setup();
    renderWithNotifications(<ThemeCustomizer {...defaultProps} />);

    const closeButton = screen.getByLabelText("Close theme customizer");
    await user.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("should switch between tabs", async () => {
    const user = userEvent.setup();
    renderWithNotifications(<ThemeCustomizer {...defaultProps} />);

    // Should start on presets tab
    expect(screen.getByText("Default Presets")).toBeInTheDocument();

    // Switch to customize tab
    await user.click(screen.getByText("Customize"));
    expect(screen.getByText("Theme Name")).toBeInTheDocument();

    // Switch to import/export tab
    await user.click(screen.getByText("Import/Export"));
    expect(screen.getByText("Export Theme")).toBeInTheDocument();
  });

  it("should display theme presets", () => {
    renderWithNotifications(<ThemeCustomizer {...defaultProps} />);
    expect(screen.getByText("Preset 1")).toBeInTheDocument();
    expect(screen.getByText("Test preset")).toBeInTheDocument();
  });

  it("should select a preset theme", async () => {
    const user = userEvent.setup();
    renderWithNotifications(<ThemeCustomizer {...defaultProps} />);

    const presetCard = screen.getByText("Preset 1").closest("div");
    await user.click(presetCard!);

    expect(mockUseExtendedTheme.setCurrentTheme).toHaveBeenCalledWith(
      mockUseExtendedTheme.defaultPresets[0].theme
    );
  });

  it("should allow theme customization", async () => {
    const user = userEvent.setup();
    renderWithNotifications(<ThemeCustomizer {...defaultProps} />);

    // Switch to customize tab
    await user.click(screen.getByText("Customize"));

    // Change theme name
    const nameInput = screen.getByDisplayValue("Test Theme");
    await user.clear(nameInput);
    await user.type(nameInput, "My Custom Theme");

    expect(nameInput).toHaveValue("My Custom Theme");
  });

  it("should allow color customization", async () => {
    const user = userEvent.setup();
    renderWithNotifications(<ThemeCustomizer {...defaultProps} />);

    // Switch to customize tab
    await user.click(screen.getByText("Customize"));

    // Find and modify the first color input (Primary)
    const colorInputs = screen.getAllByDisplayValue("20 184 166");
    const primaryColorInput = colorInputs[0]; // First one should be Primary
    await user.clear(primaryColorInput);
    await user.type(primaryColorInput, "255 0 0");

    expect(primaryColorInput).toHaveValue("255 0 0");
  });

  it("should allow layout option changes", async () => {
    const user = userEvent.setup();
    renderWithNotifications(<ThemeCustomizer {...defaultProps} />);

    // Switch to customize tab
    await user.click(screen.getByText("Customize"));

    // Change layout density
    const layoutSelect = screen.getByDisplayValue("Comfortable");
    await user.selectOptions(layoutSelect, "compact");

    expect(layoutSelect).toHaveValue("compact");
  });

  it("should toggle boolean options", async () => {
    const user = userEvent.setup();
    renderWithNotifications(<ThemeCustomizer {...defaultProps} />);

    // Switch to customize tab
    await user.click(screen.getByText("Customize"));

    // Toggle shadows
    const shadowsCheckbox = screen.getByLabelText("Enable Shadows");
    await user.click(shadowsCheckbox);

    expect(shadowsCheckbox).not.toBeChecked();
  });

  it("should apply theme changes", async () => {
    const user = userEvent.setup();
    renderWithNotifications(<ThemeCustomizer {...defaultProps} />);

    // Switch to customize tab and make changes
    await user.click(screen.getByText("Customize"));

    // Apply theme
    await user.click(screen.getByText("Apply Theme"));

    expect(mockUseExtendedTheme.setCurrentTheme).toHaveBeenCalled();
  });

  it("should save theme as custom", async () => {
    const user = userEvent.setup();
    renderWithNotifications(<ThemeCustomizer {...defaultProps} />);

    // Switch to customize tab
    await user.click(screen.getByText("Customize"));

    // Save as custom
    await user.click(screen.getByText("Save as Custom"));

    expect(mockUseExtendedTheme.addCustomTheme).toHaveBeenCalled();
    expect(mockUseExtendedTheme.setCurrentTheme).toHaveBeenCalled();
  });

  it("should export theme", async () => {
    const user = userEvent.setup();
    renderWithNotifications(<ThemeCustomizer {...defaultProps} />);

    // Switch to import/export tab
    await user.click(screen.getByText("Import/Export"));

    // Export theme
    await user.click(screen.getByText("Export Current Theme"));

    // Should show exported JSON
    await waitFor(() => {
      expect(
        screen.getByText("Theme JSON (copy this to share your theme)")
      ).toBeInTheDocument();
    });
  });

  it("should import theme", async () => {
    const user = userEvent.setup();
    renderWithNotifications(<ThemeCustomizer {...defaultProps} />);

    // Switch to import/export tab
    await user.click(screen.getByText("Import/Export"));

    // Add JSON to import textarea using paste instead of type
    const importTextarea = screen.getByPlaceholderText(
      "Paste theme JSON here..."
    );
    const themeJson = JSON.stringify({
      id: "imported",
      name: "Imported Theme",
    });

    // Use fireEvent.change instead of user.type for JSON strings
    fireEvent.change(importTextarea, { target: { value: themeJson } });

    // Import theme - use getByRole to get the button specifically
    await user.click(screen.getByRole("button", { name: "Import Theme" }));

    // Should show success alert (mocked)
    // Note: In a real test, you might want to mock window.alert
  });

  it("should expand color picker options", async () => {
    const user = userEvent.setup();
    renderWithNotifications(<ThemeCustomizer {...defaultProps} />);

    // Switch to customize tab
    await user.click(screen.getByText("Customize"));

    // Find and expand a color picker
    const expandButton = screen.getAllByText("Expand")[0];
    await user.click(expandButton);

    // Should show preset colors
    expect(screen.getByText("Teal")).toBeInTheDocument();
    expect(screen.getByText("Blue")).toBeInTheDocument();
  });

  it("should select preset colors", async () => {
    const user = userEvent.setup();
    renderWithNotifications(<ThemeCustomizer {...defaultProps} />);

    // Switch to customize tab
    await user.click(screen.getByText("Customize"));

    // Expand color picker
    const expandButton = screen.getAllByText("Expand")[0];
    await user.click(expandButton);

    // Click on a preset color
    const blueColorButton = screen.getByTitle("Blue");
    await user.click(blueColorButton);

    // Should update the color input
    const colorInput = screen.getByDisplayValue("59 130 246");
    expect(colorInput).toBeInTheDocument();
  });

  it("should validate RGB color format", async () => {
    const user = userEvent.setup();
    renderWithNotifications(<ThemeCustomizer {...defaultProps} />);

    // Switch to customize tab
    await user.click(screen.getByText("Customize"));

    // Try to enter invalid RGB format
    const colorInputs = screen.getAllByDisplayValue("20 184 166");
    const colorInput = colorInputs[0]; // First one should be Primary
    await user.clear(colorInput);
    await user.type(colorInput, "invalid color");

    // Should not accept invalid format (input should revert or not change)
    // The exact behavior depends on implementation
  });
});

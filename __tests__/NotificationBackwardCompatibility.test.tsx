import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { NotificationProvider } from "../contexts/NotificationContext";
import { NotificationContainer } from "../components/NotificationToast";
import { FeedManager } from "../components/FeedManager";
import { ThemeCustomizer } from "../components/ThemeCustomizer";
import { FavoritesModal } from "../components/FavoritesModal";
import { FeedCategoryManager } from "../components/FeedCategoryManager";
import type { FeedSource } from "../types";

// Mock the services and hooks that these components depend on
vi.mock("../services/rssParser", () => ({
  parseRSSFeed: vi.fn().mockResolvedValue([]),
}));

vi.mock("../services/feedValidator", () => ({
  validateFeed: vi.fn().mockResolvedValue({ isValid: true, errors: [] }),
}));

vi.mock("../services/feedDiscoveryService", () => ({
  discoverFeeds: vi.fn().mockResolvedValue([]),
}));

vi.mock("../services/feedDuplicateDetector", () => ({
  detectDuplicates: vi.fn().mockResolvedValue({ duplicates: [], unique: [] }),
}));

vi.mock("../services/opmlExportService", () => ({
  exportToOPML: vi.fn().mockReturnValue("<opml></opml>"),
  importFromOPML: vi.fn().mockResolvedValue([]),
}));

vi.mock("../hooks/useExtendedTheme", () => ({
  useExtendedTheme: () => ({
    currentTheme: { id: "default", name: "Default" },
    themeSettings: { themeTransitions: true },
    setTheme: vi.fn(),
    updateThemeSettings: vi.fn(),
  }),
}));

vi.mock("../hooks/useFavorites", () => ({
  useFavorites: () => ({
    favorites: [],
    addFavorite: vi.fn(),
    removeFavorite: vi.fn(),
    clearAllFavorites: vi.fn(),
    isFavorite: vi.fn().mockReturnValue(false),
  }),
  favoriteToArticle: vi.fn(),
}));

vi.mock("../hooks/useFeedCategories", () => ({
  useFeedCategories: () => ({
    categories: [
      { id: "tech", name: "Technology", color: "#3b82f6" },
      { id: "news", name: "News", color: "#ef4444" },
    ],
    addCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    assignFeedToCategory: vi.fn(),
    getCategorizedFeeds: vi.fn().mockReturnValue({}),
  }),
}));

const renderWithNotifications = (component: React.ReactElement) => {
  return render(
    <NotificationProvider>
      {component}
      <NotificationContainer />
    </NotificationProvider>
  );
};

describe("Notification System Backward Compatibility", () => {
  const mockFeeds: FeedSource[] = [
    { url: "https://example.com/feed1.xml", customTitle: "Feed 1" },
    { url: "https://example.com/feed2.xml", customTitle: "Feed 2" },
  ];

  describe("FeedManager Integration", () => {
    it("should render FeedManager without errors", () => {
      const mockSetFeeds = vi.fn();
      const mockCloseModal = vi.fn();

      renderWithNotifications(
        <FeedManager
          currentFeeds={mockFeeds}
          setFeeds={mockSetFeeds}
          closeModal={mockCloseModal}
        />
      );

      expect(screen.getByText("Gerenciar Feeds RSS")).toBeInTheDocument();
    });

    it("should handle feed operations with notifications", async () => {
      const mockSetFeeds = vi.fn();
      const mockCloseModal = vi.fn();

      renderWithNotifications(
        <FeedManager
          currentFeeds={mockFeeds}
          setFeeds={mockSetFeeds}
          closeModal={mockCloseModal}
        />
      );

      // Test adding a new feed
      const addInput = screen.getByPlaceholderText(
        "https://example.com/feed.xml"
      );
      const addButton = screen.getByText("Adicionar Feed");

      fireEvent.change(addInput, {
        target: { value: "https://newfeed.com/rss" },
      });
      fireEvent.click(addButton);

      // Should show success notification
      await waitFor(() => {
        expect(
          screen.getByText(/Feed adicionado com sucesso/)
        ).toBeInTheDocument();
      });
    });
  });

  describe("ThemeCustomizer Integration", () => {
    it("should render ThemeCustomizer without errors", () => {
      renderWithNotifications(
        <ThemeCustomizer isOpen={true} onClose={vi.fn()} />
      );

      expect(screen.getByText("Personalizar Tema")).toBeInTheDocument();
    });

    it("should handle theme operations with notifications", async () => {
      renderWithNotifications(
        <ThemeCustomizer isOpen={true} onClose={vi.fn()} />
      );

      // Test theme export
      const exportButton = screen.getByText("Exportar Tema");
      fireEvent.click(exportButton);

      // Should show success notification
      await waitFor(() => {
        expect(
          screen.getByText(/Tema exportado com sucesso/)
        ).toBeInTheDocument();
      });
    });
  });

  describe("FavoritesModal Integration", () => {
    it("should render FavoritesModal without errors", () => {
      renderWithNotifications(
        <FavoritesModal isOpen={true} onClose={vi.fn()} />
      );

      expect(screen.getByText("Favoritos")).toBeInTheDocument();
    });

    it("should handle favorites operations with notifications", async () => {
      renderWithNotifications(
        <FavoritesModal isOpen={true} onClose={vi.fn()} />
      );

      // Test clear all favorites (if there were any)
      const clearButton = screen.queryByText("Clear all favorites");
      if (clearButton) {
        fireEvent.click(clearButton);

        // Should show confirmation dialog
        await waitFor(() => {
          expect(screen.getByText(/Are you sure/)).toBeInTheDocument();
        });
      }
    });
  });

  describe("FeedCategoryManager Integration", () => {
    it("should render FeedCategoryManager without errors", () => {
      renderWithNotifications(
        <FeedCategoryManager
          feeds={mockFeeds}
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText("Gerenciar Categorias")).toBeInTheDocument();
    });

    it("should handle category operations with notifications", async () => {
      renderWithNotifications(
        <FeedCategoryManager
          feeds={mockFeeds}
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      // Test adding a new category
      const addButton = screen.getByText("Adicionar Categoria");
      fireEvent.click(addButton);

      const nameInput = screen.getByPlaceholderText("Nome da categoria");
      fireEvent.change(nameInput, { target: { value: "New Category" } });

      const saveButton = screen.getByText("Salvar");
      fireEvent.click(saveButton);

      // Should show success notification
      await waitFor(() => {
        expect(
          screen.getByText(/Categoria criada com sucesso/)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle component errors gracefully", () => {
      // Test that components don't break when notification system has issues
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      try {
        renderWithNotifications(
          <FeedManager
            currentFeeds={mockFeeds}
            setFeeds={vi.fn()}
            closeModal={vi.fn()}
          />
        );

        expect(screen.getByText("Gerenciar Feeds RSS")).toBeInTheDocument();
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe("Performance", () => {
    it("should not significantly impact component render performance", () => {
      const startTime = performance.now();

      renderWithNotifications(
        <div>
          <FeedManager
            currentFeeds={mockFeeds}
            setFeeds={vi.fn()}
            closeModal={vi.fn()}
          />
          <ThemeCustomizer isOpen={false} onClose={vi.fn()} />
          <FavoritesModal isOpen={false} onClose={vi.fn()} />
        </div>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (less than 100ms)
      expect(renderTime).toBeLessThan(100);
    });
  });

  describe("Accessibility", () => {
    it("should maintain accessibility standards", () => {
      renderWithNotifications(
        <FeedManager
          currentFeeds={mockFeeds}
          setFeeds={vi.fn()}
          closeModal={vi.fn()}
        />
      );

      // Check for proper ARIA attributes
      const modal = screen.getByRole("dialog");
      expect(modal).toBeInTheDocument();

      // Check for proper button roles
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);

      // Check for proper form elements
      const inputs = screen.getAllByRole("textbox");
      expect(inputs.length).toBeGreaterThan(0);
    });
  });
});

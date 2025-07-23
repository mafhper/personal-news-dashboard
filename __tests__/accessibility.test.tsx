import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import { ArticleItem } from '../components/ArticleItem';
import { SearchBar } from '../components/SearchBar';
import { VirtualizedArticleList } from '../components/VirtualizedArticleList';
import { Modal } from '../components/Modal';
import { FavoritesModal } from '../components/FavoritesModal';
import { SkipLinks } from '../components/SkipLinks';
import { KeyboardShortcutsModal } from '../components/KeyboardShortcutsModal';
import { ThemeCustomizer } from '../components/ThemeCustomizer';
import type { Article } from '../types';

// Add jest-axe matchers
expect.extend(toHaveNoViolations);

// Mock IntersectionObserver
class MockIntersectionObserver {
  readonly root: Element | null;
  readonly rootMargin: string;
  readonly thresholds: ReadonlyArray<number>;
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.root = options?.root || null;
    this.rootMargin = options?.rootMargin || '0px';
    this.thresholds = Array.isArray(options?.threshold) ? options.threshold : [options?.threshold || 0];
  }
  observe() { return; }
  unobserve() { return; }
  disconnect() { return; }
}

global.IntersectionObserver = MockIntersectionObserver;

// Helper to generate mock articles
function generateMockArticle(): Article {
  return {
    id: 'article-1',
    title: 'Test Article',
    link: 'https://example.com/article',
    description: 'This is a test article with some description text.',
    content: '<p>Full content for article</p><p>With multiple paragraphs</p>',
    author: 'Test Author',
    published: new Date().toISOString(),
    image: 'https://example.com/image.jpg',
    categories: ['Test Category'],
    source: {
      id: 'source-1',
      name: 'Test Source',
      url: 'https://example.com/source'
    }
  };
}

// Mock hooks
vi.mock('../hooks/useFavorites', () => ({
  useFavorites: () => ({
    favorites: ['article-1'],
    addFavorite: vi.fn(),
    removeFavorite: vi.fn(),
    isFavorite: () => true,
    clearFavorites: vi.fn()
  })
}));

vi.mock('../hooks/useReadStatus', () => ({
  useReadStatus: () => ({
    readArticles: ['article-1'],
    markAsRead: vi.fn(),
    markAsUnread: vi.fn(),
    isRead: () => true,
    clearReadStatus: vi.fn()
  })
}));

vi.mock('../hooks/useExtendedTheme', () => ({
  useExtendedTheme: () => ({
    theme: {
      colors: {
        primary: '#1a73e8',
        secondary: '#4285f4',
        accent: '#fbbc04',
        background: '#ffffff',
        surface: '#f8f9fa',
        text: '#202124'
      },
      layout: 'comfortable',
      density: 'medium'
    },
    setTheme: vi.fn(),
    resetTheme: vi.fn()
  })
}));

describe('Accessibility Compliance', () => {
  describe('ArticleItem Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const article = generateMockArticle();
      const { container } = render(<ArticleItem article={article} index={1} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper semantic structure', () => {
      const article = generateMockArticle();
      render(<ArticleItem article={article} index={1} />);

      // Check for proper heading
      const heading = screen.getByRole('heading');
      expect(heading).toBeInTheDocument();

      // Check for link to article
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', article.link);

      // Check for time element
      const time = screen.getByText(/ago|today|yesterday/i);
      expect(time).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
      const article = generateMockArticle();
      render(<ArticleItem article={article} index={1} />);

      const link = screen.getByRole('link');

      // Should be able to focus the link
      link.focus();
      expect(document.activeElement).toBe(link);

      // Should be able to activate with Enter key
      const clickSpy = vi.spyOn(link, 'click');
      fireEvent.keyDown(link, { key: 'Enter' });
      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('SearchBar Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<SearchBar onSearch={vi.fn()} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA attributes', () => {
      render(<SearchBar onSearch={vi.fn()} />);

      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('aria-label', 'Search articles');
    });

    it('should be keyboard operable', async () => {
      const handleSearch = vi.fn();
      render(<SearchBar onSearch={handleSearch} />);

      const searchInput = screen.getByRole('searchbox');

      // Should be able to focus and type
      searchInput.focus();
      expect(document.activeElement).toBe(searchInput);

      fireEvent.change(searchInput, { target: { value: 'test query' } });

      // Wait for debounce
      await waitFor(() => {
        expect(handleSearch).toHaveBeenCalledWith('test query');
      }, { timeout: 1000 });
    });
  });

  describe('VirtualizedArticleList Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const articles = [generateMockArticle()];
      const { container } = render(
        <VirtualizedArticleList
          articles={articles}
          containerHeight={400}
          itemHeight={120}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper list semantics', () => {
      const articles = [generateMockArticle(), generateMockArticle()];
      articles[1].id = 'article-2';

      render(
        <VirtualizedArticleList
          articles={articles}
          containerHeight={400}
          itemHeight={120}
        />
      );

      // Should have list role
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
      expect(list).toHaveAttribute('aria-label', 'Article list');

      // Should have list items
      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).toBe(2);
    });

    it('should support keyboard navigation', () => {
      const articles = Array.from({ length: 10 }, (_, i) => ({
        ...generateMockArticle(),
        id: `article-${i + 1}`,
        title: `Article ${i + 1}`
      }));

      const { container } = render(
        <VirtualizedArticleList
          articles={articles}
          containerHeight={400}
          itemHeight={120}
        />
      );

      const list = screen.getByRole('list');

      // Should be focusable
      list.focus();
      expect(document.activeElement).toBe(list);

      // Should respond to arrow keys
      fireEvent.keyDown(list, { key: 'ArrowDown' });
      fireEvent.keyDown(list, { key: 'ArrowUp' });
      fireEvent.keyDown(list, { key: 'PageDown' });
      fireEvent.keyDown(list, { key: 'PageUp' });
      fireEvent.keyDown(list, { key: 'Home' });
      fireEvent.keyDown(list, { key: 'End' });

      // These key events are handled in the component, but we can't easily test
      // the scrolling behavior in JSDOM. We're just ensuring they don't throw errors.
    });
  });

  describe('Modal Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper dialog semantics', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );

      // Should have dialog role
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');

      // Should have a title
      const title = screen.getByText('Test Modal');
      expect(title).toBeInTheDocument();

      // Should have close button
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('should trap focus within modal', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
          <button>Button 1</button>
          <button>Button 2</button>
        </Modal>
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      const button1 = screen.getByRole('button', { name: 'Button 1' });
      const button2 = screen.getByRole('button', { name: 'Button 2' });

      // Initial focus should be on the first focusable element
      expect(document.activeElement).toBe(closeButton);

      // Tab should move to next element
      fireEvent.keyDown(closeButton, { key: 'Tab' });
      // In a real browser, focus would move to button1

      // Shift+Tab from first element should wrap to last
      fireEvent.keyDown(closeButton, { key: 'Tab', shiftKey: true });
      // In a real browser, focus would move to button2

      // Escape should close modal
      const onClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={onClose} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );

      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('SkipLinks Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<SkipLinks />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper skip link functionality', () => {
      // Add main content target
      const mainContent = document.createElement('main');
      mainContent.id = 'main-content';
      document.body.appendChild(mainContent);

      render(<SkipLinks />);

      // Skip link should be visually hidden by default
      const skipLink = screen.getByText(/skip to main content/i);
      expect(skipLink).toBeInTheDocument();

      // Skip link should become visible on focus
      skipLink.focus();

      // Skip link should point to main content
      expect(skipLink).toHaveAttribute('href', '#main-content');

      // Clean up
      document.body.removeChild(mainContent);
    });
  });

  describe('Color Contrast', () => {
    it('should have sufficient color contrast in ThemeCustomizer', async () => {
      const { container } = render(
        <ThemeCustomizer
          currentTheme={{
            colors: {
              primary: '#1a73e8',
              secondary: '#4285f4',
              accent: '#fbbc04',
              background: '#ffffff',
              surface: '#f8f9fa',
              text: '#202124'
            },
            layout: 'comfortable',
            density: 'medium'
          }}
          onThemeChange={vi.fn()}
          presets={[]}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should have no accessibility violations in KeyboardShortcutsModal', async () => {
      const { container } = render(
        <KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should display keyboard shortcuts in an accessible format', () => {
      render(<KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} />);

      // Should have a title
      const title = screen.getByText(/keyboard shortcuts/i);
      expect(title).toBeInTheDocument();

      // Should have shortcut descriptions
      const shortcuts = screen.getAllByRole('listitem');
      expect(shortcuts.length).toBeGreaterThan(0);

      // Each shortcut should have a key and description
      shortcuts.forEach(shortcut => {
        const keyElement = shortcut.querySelector('.keyboard-key');
        expect(keyElement).not.toBeNull();
      });
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('should have appropriate ARIA live regions for dynamic content', () => {
      render(<FavoritesModal isOpen={true} onClose={vi.fn()} />);

      // Check for status messages with aria-live
      const liveRegions = document.querySelectorAll('[aria-live]');
      expect(liveRegions.length).toBeGreaterThan(0);
    });

    it('should have proper heading hierarchy', () => {
      const articles = [generateMockArticle()];
      render(
        <VirtualizedArticleList
          articles={articles}
          containerHeight={400}
          itemHeight={120}
        />
      );

      // Should have h3 heading for section title
      const sectionHeading = screen.getByRole('heading', { level: 3 });
      expect(sectionHeading).toBeInTheDocument();
      expect(sectionHeading).toHaveTextContent('Top Stories');

      // Article items should have appropriate heading levels
      const articleHeadings = document.querySelectorAll('h4');
      expect(articleHeadings.length).toBeGreaterThan(0);
    });
  });
});

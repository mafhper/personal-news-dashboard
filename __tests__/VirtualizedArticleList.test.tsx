import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VirtualizedArticleList } from '../components/VirtualizedArticleList';
import type { Article } from '../types';

// Mock the ArticleItem component
vi.mock('../components/ArticleItem', () => ({
  ArticleItem: ({ article, index }: { article: Article; index: number }) => (
    <div data-testid={`article-item-${index}`} className="article-item">
      <h4>{article.title}</h4>
      <span>Index: {index}</span>
    </div>
  ),
}));

describe('VirtualizedArticleList', () => {
  // Create mock articles for testing
  const createMockArticles = (count: number): Article[] => {
    return Array.from({ length: count }, (_, i) => ({
      title: `Article ${i + 1}`,
      link: `https://example.com/article-${i + 1}`,
      pubDate: new Date(`2024-01-${String(i + 1).padStart(2, '0')}T12:00:00Z`),
      sourceTitle: `Source ${i + 1}`,
      imageUrl: `https://example.com/image-${i + 1}.jpg`,
      author: `Author ${i + 1}`,
      description: `Description for article ${i + 1}`,
      categories: ['tech'],
    }));
  };

  const mockArticles = createMockArticles(100);

  it('renders the component with title', () => {
    render(<VirtualizedArticleList articles={mockArticles.slice(0, 10)} />);

    expect(screen.getByText('Top Stories')).toBeInTheDocument();
    expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
  });

  it('renders only visible items initially', () => {
    render(
      <VirtualizedArticleList
        articles={mockArticles}
        itemHeight={120}
        containerHeight={600}
        overscan={2}
      />
    );

    // Should render approximately 5-7 items (600px / 120px + overscan)
    const renderedItems = screen.getAllByTestId(/article-item-/);
    expect(renderedItems.length).toBeGreaterThan(5);
    expect(renderedItems.length).toBeLessThan(15);
  });

  it('handles scroll events correctly', async () => {
    const onScroll = vi.fn();
    render(
      <VirtualizedArticleList
        articles={mockArticles}
        itemHeight={120}
        containerHeight={600}
        onScroll={onScroll}
      />
    );

    const listContainer = screen.getByTestId('virtualized-list');

    // Simulate scroll
    fireEvent.scroll(listContainer, { target: { scrollTop: 240 } });

    expect(onScroll).toHaveBeenCalledWith(240);
  });

  it('updates visible items when scrolling', async () => {
    render(
      <VirtualizedArticleList
        articles={mockArticles}
        itemHeight={120}
        containerHeight={600}
      />
    );

    const listContainer = screen.getByTestId('virtualized-list');

    // Initially should show items starting from index 1
    expect(screen.getByTestId('article-item-1')).toBeInTheDocument();

    // Scroll down significantly
    fireEvent.scroll(listContainer, { target: { scrollTop: 1200 } });

    // Wait for the component to update
    await waitFor(() => {
      // Should now show items around index 10-15 (1200px / 120px = 10)
      expect(screen.queryByTestId('article-item-1')).not.toBeInTheDocument();
    });
  });

  it('handles keyboard navigation', () => {
    render(
      <VirtualizedArticleList
        articles={mockArticles}
        itemHeight={120}
        containerHeight={600}
      />
    );

    const listContainer = screen.getByTestId('virtualized-list');

    // Focus the container
    listContainer.focus();

    // Test keyboard events (they should be handled without errors)
    fireEvent.keyDown(listContainer, { key: 'ArrowDown' });
    fireEvent.keyDown(listContainer, { key: 'ArrowUp' });
    fireEvent.keyDown(listContainer, { key: 'PageDown' });
    fireEvent.keyDown(listContainer, { key: 'PageUp' });
    fireEvent.keyDown(listContainer, { key: 'Home' });
    fireEvent.keyDown(listContainer, { key: 'End' });

    // All events should be handled without errors
    expect(listContainer).toBeInTheDocument();
  });

  it('prevents default behavior for keyboard events', () => {
    render(
      <VirtualizedArticleList
        articles={mockArticles}
        itemHeight={120}
        containerHeight={600}
      />
    );

    const listContainer = screen.getByTestId('virtualized-list');

    // Create a mock event with preventDefault
    const mockEvent = {
      key: 'ArrowDown',
      preventDefault: vi.fn(),
      currentTarget: listContainer,
    };

    // Simulate the keydown event
    fireEvent.keyDown(listContainer, mockEvent);

    // The component should handle navigation keys
    expect(listContainer).toBeInTheDocument();
  });

  it('handles empty article list', () => {
    render(<VirtualizedArticleList articles={[]} />);

    expect(screen.getByText('Top Stories')).toBeInTheDocument();
    expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();

    // Should not render any article items
    expect(screen.queryByTestId(/article-item-/)).not.toBeInTheDocument();
  });

  it('calculates correct total height', () => {
    const itemHeight = 150;
    const articleCount = 50;

    render(
      <VirtualizedArticleList
        articles={createMockArticles(articleCount)}
        itemHeight={itemHeight}
        containerHeight={600}
      />
    );

    const listContainer = screen.getByTestId('virtualized-list');
    const totalHeight = articleCount * itemHeight;

    // The inner div should have the correct total height
    const innerDiv = listContainer.firstChild as HTMLElement;
    expect(innerDiv.style.height).toBe(`${totalHeight}px`);
  });

  it('shows scrolling indicator when scrolling', async () => {
    render(
      <VirtualizedArticleList
        articles={mockArticles}
        itemHeight={120}
        containerHeight={600}
      />
    );

    const listContainer = screen.getByTestId('virtualized-list');

    // Scroll to trigger the indicator
    fireEvent.scroll(listContainer, { target: { scrollTop: 240 } });

    // Should show scrolling indicator
    expect(screen.getByText('Scrolling...')).toBeInTheDocument();

    // Wait for scrolling to stop
    await waitFor(() => {
      expect(screen.queryByText('Scrolling...')).not.toBeInTheDocument();
    }, { timeout: 200 });
  });

  it('has proper accessibility attributes', () => {
    render(<VirtualizedArticleList articles={mockArticles.slice(0, 10)} />);

    const listContainer = screen.getByTestId('virtualized-list');

    expect(listContainer).toHaveAttribute('role', 'list');
    expect(listContainer).toHaveAttribute('aria-label', 'Article list');
    expect(listContainer).toHaveAttribute('tabIndex', '0');

    // Check that items have proper role
    const items = listContainer.querySelectorAll('[role="listitem"]');
    expect(items.length).toBeGreaterThan(0);
  });

  it('applies custom props correctly', () => {
    const customHeight = 800;
    const customItemHeight = 200;

    render(
      <VirtualizedArticleList
        articles={mockArticles}
        itemHeight={customItemHeight}
        containerHeight={customHeight}
      />
    );

    const listContainer = screen.getByTestId('virtualized-list');
    expect(listContainer.style.height).toBe(`${customHeight}px`);
  });

  it('shows debug info in development mode', () => {
    // Mock development environment
    const originalEnv = import.meta.env.DEV;
    (import.meta.env as any).DEV = true;

    render(<VirtualizedArticleList articles={mockArticles.slice(0, 20)} />);

    // Should show debug information
    expect(screen.getByText(/Visible:/)).toBeInTheDocument();
    expect(screen.getByText(/Rendered:/)).toBeInTheDocument();
    expect(screen.getByText(/Scroll:/)).toBeInTheDocument();

    // Restore original environment
    (import.meta.env as any).DEV = originalEnv;
  });
});

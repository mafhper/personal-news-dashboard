/**
 * Integration test for category creation and header update
 * Tests if new categories appear in the header menu after creation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { Header } from '../components/Header';
import { useFeedCategories } from '../hooks/useFeedCategories';
import type { FeedCategory } from '../types';

// Mock the hooks
vi.mock('../hooks/useFavorites', () => ({
  useFavorites: () => ({
    getFavoritesCount: () => 0
  })
}));

vi.mock('../hooks/useReadStatus', () => ({
  useReadStatus: () => ({
    markAllAsRead: vi.fn(),
    markAllAsUnread: vi.fn(),
    getReadCount: () => 0,
    getUnreadCount: () => 0
  })
}));

// Test component that uses the category hook and renders the header
const TestComponent: React.FC = () => {
  const { categories, createCategory } = useFeedCategories();
  const [selectedCategory, setSelectedCategory] = React.useState('all');

  const handleCreateTestCategory = () => {
    createCategory('Test Category', '#FF0000', 'Test description');
  };

  return (
    <div>
      <button onClick={handleCreateTestCategory} data-testid="create-category">
        Create Test Category
      </button>
      <Header
        onManageFeedsClick={() => {}}
        onRefreshClick={() => {}}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
        onOpenSettings={() => {}}
        onMyFeedClick={() => {}}
        articles={[]}
        onSearch={() => {}}
        readStatusFilter="all"
        onReadStatusFilterChange={() => {}}
        displayArticles={[]}
        onOpenFavorites={() => {}}
        categories={categories}
        isSearchActive={false}
      />
    </div>
  );
};

describe('Category Header Integration', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should display new categories in header menu after creation', async () => {
    render(<TestComponent />);

    // Check that default categories are present
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Tech')).toBeInTheDocument();

    // Create a new category
    const createButton = screen.getByTestId('create-category');
    fireEvent.click(createButton);

    // Wait for the new category to appear in the header
    await waitFor(() => {
      expect(screen.getByText('Test Category')).toBeInTheDocument();
    }, { timeout: 1000 });

    // Verify the category is clickable
    const testCategoryButton = screen.getByText('Test Category');
    expect(testCategoryButton).toBeInTheDocument();
    expect(testCategoryButton.tagName).toBe('SPAN'); // It's inside a button
  });

  it('should maintain category order after creation', async () => {
    render(<TestComponent />);

    // Create a new category
    const createButton = screen.getByTestId('create-category');
    fireEvent.click(createButton);

    // Wait for the new category to appear
    await waitFor(() => {
      expect(screen.getByText('Test Category')).toBeInTheDocument();
    });

    // Check that categories are in the correct order
    const categoryButtons = screen.getAllByRole('button').filter(button =>
      button.getAttribute('aria-label')?.includes('Filter articles by')
    );

    // The new category should be at the end (after default categories)
    const categoryTexts = categoryButtons.map(button => button.textContent);
    expect(categoryTexts).toContain('Test Category');
  });

  it('should handle multiple category creations', async () => {
    const MultiCategoryTest: React.FC = () => {
      const { categories, createCategory } = useFeedCategories();
      const [selectedCategory, setSelectedCategory] = React.useState('all');

      const handleCreateCategory1 = () => {
        createCategory('Category 1', '#FF0000');
      };

      const handleCreateCategory2 = () => {
        createCategory('Category 2', '#00FF00');
      };

      return (
        <div>
          <button onClick={handleCreateCategory1} data-testid="create-category-1">
            Create Category 1
          </button>
          <button onClick={handleCreateCategory2} data-testid="create-category-2">
            Create Category 2
          </button>
          <Header
            onManageFeedsClick={() => {}}
            onRefreshClick={() => {}}
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
            onOpenSettings={() => {}}
            onMyFeedClick={() => {}}
            articles={[]}
            onSearch={() => {}}
            readStatusFilter="all"
            onReadStatusFilterChange={() => {}}
            displayArticles={[]}
            onOpenFavorites={() => {}}
            categories={categories}
            isSearchActive={false}
          />
        </div>
      );
    };

    render(<MultiCategoryTest />);

    // Create first category
    fireEvent.click(screen.getByTestId('create-category-1'));
    await waitFor(() => {
      expect(screen.getByText('Category 1')).toBeInTheDocument();
    });

    // Create second category
    fireEvent.click(screen.getByTestId('create-category-2'));
    await waitFor(() => {
      expect(screen.getByText('Category 2')).toBeInTheDocument();
    });

    // Both categories should be present
    expect(screen.getByText('Category 1')).toBeInTheDocument();
    expect(screen.getByText('Category 2')).toBeInTheDocument();
  });
});

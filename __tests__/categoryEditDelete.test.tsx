/**
 * Tests for category editing and deletion functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { FeedCategoryManager } from '../components/FeedCategoryManager';
import { useFeedCategories } from '../hooks/useFeedCategories';
import type { FeedSource } from '../types';

// Mock the logger
vi.mock('../services/logger', () => ({
  useLogger: () => ({
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  })
}));

// Test component that uses the category manager
const TestCategoryManager: React.FC = () => {
  const [feeds, setFeeds] = React.useState<FeedSource[]>([
    { url: 'https://example.com/feed1.xml', customTitle: 'Feed 1', categoryId: 'tech' },
    { url: 'https://example.com/feed2.xml', customTitle: 'Feed 2', categoryId: 'custom-test' },
  ]);

  return (
    <FeedCategoryManager
      feeds={feeds}
      setFeeds={setFeeds}
      onClose={() => {}}
    />
  );
};

describe('Category Edit and Delete Functionality', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    // Mock window.confirm and window.alert
    global.confirm = vi.fn(() => true);
    global.alert = vi.fn();
  });

  it('should allow editing category name and color', async () => {
    render(<TestCategoryManager />);

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Tech')).toBeInTheDocument();
    });

    // Find the edit button for Tech category (should be visible since it's a default category with edit capability)
    const editButtons = screen.getAllByLabelText(/Edit .* category/);
    expect(editButtons.length).toBeGreaterThan(0);

    // Click the first edit button
    fireEvent.click(editButtons[0]);

    // Wait for edit form to appear
    await waitFor(() => {
      expect(screen.getByText('Edit Category')).toBeInTheDocument();
    });

    // Check that form fields are populated
    const nameInput = screen.getByDisplayValue('Tech');
    const colorInput = screen.getByDisplayValue('#3B82F6');

    expect(nameInput).toBeInTheDocument();
    expect(colorInput).toBeInTheDocument();

    // Change the name
    fireEvent.change(nameInput, { target: { value: 'Technology' } });
    fireEvent.change(colorInput, { target: { value: '#FF0000' } });

    // Save changes
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    // Wait for the category to be updated
    await waitFor(() => {
      expect(screen.getByText('Technology')).toBeInTheDocument();
    });

    // Edit form should be closed
    expect(screen.queryByText('Edit Category')).not.toBeInTheDocument();
  });

  it('should allow canceling category edit', async () => {
    render(<TestCategoryManager />);

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Tech')).toBeInTheDocument();
    });

    // Find and click edit button
    const editButtons = screen.getAllByLabelText(/Edit .* category/);
    fireEvent.click(editButtons[0]);

    // Wait for edit form to appear
    await waitFor(() => {
      expect(screen.getByText('Edit Category')).toBeInTheDocument();
    });

    // Change the name
    const nameInput = screen.getByDisplayValue('Tech');
    fireEvent.change(nameInput, { target: { value: 'Changed Name' } });

    // Cancel changes
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Edit form should be closed and original name should remain
    expect(screen.queryByText('Edit Category')).not.toBeInTheDocument();
    expect(screen.getByText('Tech')).toBeInTheDocument();
    expect(screen.queryByText('Changed Name')).not.toBeInTheDocument();
  });

  it('should allow deleting custom categories', async () => {
    // First create a custom category
    const TestWithCustomCategory: React.FC = () => {
      const { categories, createCategory, deleteCategory } = useFeedCategories();
      const [feeds, setFeeds] = React.useState<FeedSource[]>([]);

      React.useEffect(() => {
        // Create a custom category for testing
        createCategory('Custom Category', '#FF0000', 'Test description');
      }, [createCategory]);

      return (
        <FeedCategoryManager
          feeds={feeds}
          setFeeds={setFeeds}
          onClose={() => {}}
        />
      );
    };

    render(<TestWithCustomCategory />);

    // Wait for the custom category to appear
    await waitFor(() => {
      expect(screen.getByText('Custom Category')).toBeInTheDocument();
    });

    // Find the delete button for the custom category
    const deleteButtons = screen.getAllByLabelText(/Delete .* category/);
    expect(deleteButtons.length).toBeGreaterThan(0);

    // Click delete button
    fireEvent.click(deleteButtons[0]);

    // Verify confirm was called
    expect(global.confirm).toHaveBeenCalled();

    // Wait for category to be deleted
    await waitFor(() => {
      expect(screen.queryByText('Custom Category')).not.toBeInTheDocument();
    });
  });

  it('should not allow deleting default categories', async () => {
    render(<TestCategoryManager />);

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
    });

    // Default categories should not have delete buttons
    // The "All" category is default and should not be deletable
    const allCategoryContainer = screen.getByText('All').closest('[draggable]');

    // Look for delete button within the All category container
    const deleteButton = allCategoryContainer?.querySelector('[aria-label*="Delete"]');
    expect(deleteButton).toBeNull();
  });

  it('should show confirmation with feed count when deleting category with feeds', async () => {
    // Create a test with a category that has feeds
    const TestWithFeedsInCategory: React.FC = () => {
      const { createCategory } = useFeedCategories();
      const [feeds, setFeeds] = React.useState<FeedSource[]>([
        { url: 'https://example.com/feed1.xml', customTitle: 'Feed 1', categoryId: 'test-category' },
        { url: 'https://example.com/feed2.xml', customTitle: 'Feed 2', categoryId: 'test-category' },
      ]);

      React.useEffect(() => {
        // Create a custom category for testing
        const newCategory = createCategory('Test Category', '#FF0000');
        // Update feeds to use the new category ID
        setFeeds(prev => prev.map(feed => ({ ...feed, categoryId: newCategory.id })));
      }, [createCategory]);

      return (
        <FeedCategoryManager
          feeds={feeds}
          setFeeds={setFeeds}
          onClose={() => {}}
        />
      );
    };

    render(<TestWithFeedsInCategory />);

    // Wait for the test category to appear
    await waitFor(() => {
      expect(screen.getByText('Test Category')).toBeInTheDocument();
    });

    // Find and click delete button
    const deleteButtons = screen.getAllByLabelText(/Delete .* category/);
    fireEvent.click(deleteButtons[0]);

    // Verify confirm was called with message about feeds
    expect(global.confirm).toHaveBeenCalledWith(
      expect.stringContaining('2 feeds')
    );
  });

  it('should handle category description editing', async () => {
    render(<TestCategoryManager />);

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Tech')).toBeInTheDocument();
    });

    // Find and click edit button
    const editButtons = screen.getAllByLabelText(/Edit .* category/);
    fireEvent.click(editButtons[0]);

    // Wait for edit form to appear
    await waitFor(() => {
      expect(screen.getByText('Edit Category')).toBeInTheDocument();
    });

    // Find description textarea
    const descriptionTextarea = screen.getByPlaceholderText('Enter a description for this category...');
    expect(descriptionTextarea).toBeInTheDocument();

    // Add description
    fireEvent.change(descriptionTextarea, { target: { value: 'Technology related articles' } });

    // Save changes
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    // Form should close
    await waitFor(() => {
      expect(screen.queryByText('Edit Category')).not.toBeInTheDocument();
    });
  });
});

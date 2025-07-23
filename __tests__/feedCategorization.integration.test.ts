import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFeedCategories } from '../hooks/useFeedCategories';
import type { FeedSource } from '../types';

// Mock localStorage for integration tests
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock useLocalStorage hook to use our mock localStorage
vi.mock('../hooks/useLocalStorage', () => ({
  useLocalStorage: vi.fn((key: string, defaultValue: any) => {
    const [value, setValue] = require('react').useState(() => {
      const stored = mockLocalStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    });

    const setStoredValue = (newValue: any) => {
      setValue(newValue);
      mockLocalStorage.setItem(key, JSON.stringify(newValue));
    };

    return [value, setStoredValue];
  }),
}));

describe('Feed Categorization Integration', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  it('should provide complete categorization workflow', () => {
    const { result } = renderHook(() => useFeedCategories());

    // Initial state should have default categories
    expect(result.current.categories).toHaveLength(6);
    expect(result.current.categories[0].name).toBe('All');
    expect(result.current.categories[0].isDefault).toBe(true);

    // Create a custom category
    act(() => {
      const newCategory = result.current.createCategory('News', '#FF5722', 'News feeds');
      expect(newCategory.name).toBe('News');
      expect(newCategory.isDefault).toBe(false);
    });

    expect(result.current.categories).toHaveLength(7);

    // Test feed categorization
    const feeds: FeedSource[] = [
      { url: 'https://example.com/tech.xml', categoryId: 'tech' },
      { url: 'https://example.com/news.xml', categoryId: result.current.categories.find(c => c.name === 'News')?.id },
      { url: 'https://example.com/uncategorized.xml' },
    ];

    const categorizedFeeds = result.current.getCategorizedFeeds(feeds);

    expect(categorizedFeeds['tech']).toHaveLength(1);
    expect(categorizedFeeds['all']).toHaveLength(3);
    expect(categorizedFeeds['uncategorized']).toHaveLength(1);

    // Test moving feeds between categories
    const mockSetFeeds = vi.fn();
    act(() => {
      result.current.moveFeedToCategory(
        'https://example.com/uncategorized.xml',
        'tech',
        feeds,
        mockSetFeeds
      );
    });

    expect(mockSetFeeds).toHaveBeenCalledWith([
      { url: 'https://example.com/tech.xml', categoryId: 'tech' },
      { url: 'https://example.com/news.xml', categoryId: result.current.categories.find(c => c.name === 'News')?.id },
      { url: 'https://example.com/uncategorized.xml', categoryId: 'tech' },
    ]);

    // Test export functionality
    const exportData = result.current.exportCategories();
    const parsed = JSON.parse(exportData);

    expect(parsed.categories).toHaveLength(1); // Only custom categories are exported
    expect(parsed.categories[0].name).toBe('News');
    expect(parsed.version).toBe('1.0');

    // Test import functionality
    const importData = {
      categories: [
        {
          id: 'imported-sports',
          name: 'Sports',
          color: '#4CAF50',
          order: 10,
          description: 'Sports news',
        },
      ],
      version: '1.0',
      exportDate: new Date().toISOString(),
    };

    act(() => {
      const success = result.current.importCategories(JSON.stringify(importData));
      expect(success).toBe(true);
    });

    expect(result.current.categories).toHaveLength(8);
    const importedCategory = result.current.categories.find(c => c.name === 'Sports');
    expect(importedCategory).toBeDefined();
    expect(importedCategory?.isDefault).toBe(false);

    // Test category reordering
    const originalOrder = result.current.categories.map(c => c.id);
    const newOrder = [originalOrder[1], originalOrder[0], ...originalOrder.slice(2)];

    act(() => {
      result.current.reorderCategories(newOrder);
    });

    const reorderedIds = result.current.categories.map(c => c.id);
    expect(reorderedIds.slice(0, 2)).toEqual([newOrder[0], newOrder[1]]);

    // Test category update
    const customCategory = result.current.categories.find(c => c.name === 'News');
    expect(customCategory).toBeDefined();

    act(() => {
      result.current.updateCategory(customCategory!.id, {
        name: 'Updated News',
        color: '#9C27B0'
      });
    });

    const updatedCategory = result.current.categories.find(c => c.id === customCategory!.id);
    expect(updatedCategory?.name).toBe('Updated News');
    expect(updatedCategory?.color).toBe('#9C27B0');

    // Test category deletion
    act(() => {
      result.current.deleteCategory(customCategory!.id);
    });

    expect(result.current.categories.find(c => c.id === customCategory!.id)).toBeUndefined();

    // Test reset to defaults
    act(() => {
      result.current.resetToDefaults();
    });

    expect(result.current.categories).toHaveLength(6);
    expect(result.current.categories.every(c => c.isDefault)).toBe(true);
  });

  it('should handle error cases properly', () => {
    const { result } = renderHook(() => useFeedCategories());

    // Test deleting default category (should throw)
    expect(() => {
      act(() => {
        result.current.deleteCategory('all');
      });
    }).toThrow('Cannot delete default categories');

    // Test invalid import data
    act(() => {
      const success1 = result.current.importCategories('invalid json');
      expect(success1).toBe(false);

      const success2 = result.current.importCategories('{"invalid": "data"}');
      expect(success2).toBe(false);
    });

    // Test getting non-existent category
    const nonExistent = result.current.getCategoryById('non-existent');
    expect(nonExistent).toBeUndefined();
  });

  it('should maintain data consistency across operations', () => {
    const { result } = renderHook(() => useFeedCategories());

    // Create multiple categories
    act(() => {
      result.current.createCategory('Category 1', '#FF0000');
      result.current.createCategory('Category 2', '#00FF00');
      result.current.createCategory('Category 3', '#0000FF');
    });

    expect(result.current.categories).toHaveLength(9);

    // Verify all categories have unique IDs
    const ids = result.current.categories.map(c => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);

    // Verify order is maintained
    const orders = result.current.categories.map(c => c.order);
    const sortedOrders = [...orders].sort((a, b) => a - b);
    expect(orders).toEqual(sortedOrders);

    // Test feed categorization with multiple categories
    const feeds: FeedSource[] = [
      { url: 'https://example.com/feed1.xml', categoryId: 'tech' },
      { url: 'https://example.com/feed2.xml', categoryId: result.current.categories.find(c => c.name === 'Category 1')?.id },
      { url: 'https://example.com/feed3.xml', categoryId: result.current.categories.find(c => c.name === 'Category 2')?.id },
      { url: 'https://example.com/feed4.xml' }, // uncategorized
    ];

    const categorizedFeeds = result.current.getCategorizedFeeds(feeds);

    // Verify all feeds are in 'all' category
    expect(categorizedFeeds['all']).toHaveLength(4);

    // Verify specific categorization
    expect(categorizedFeeds['tech']).toHaveLength(1);
    expect(categorizedFeeds['uncategorized']).toHaveLength(1);

    const category1Id = result.current.categories.find(c => c.name === 'Category 1')?.id;
    const category2Id = result.current.categories.find(c => c.name === 'Category 2')?.id;

    if (category1Id && category2Id) {
      expect(categorizedFeeds[category1Id]).toHaveLength(1);
      expect(categorizedFeeds[category2Id]).toHaveLength(1);
    }
  });
});

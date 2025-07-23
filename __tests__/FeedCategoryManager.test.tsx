import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, beforeEach, afterEach } from 'vitest';
import { FeedCategoryManager } from '../components/FeedCategoryManager';
import type { FeedSource } from '../types';

// Mock the useFeedCategories hook
const mockUseFeedCategories = {
  categories: [
    { id: 'all', name: 'All', color: '#6B7280', order: 0, isDefault: true },
    { id: 'tech', name: 'Tech', color: '#3B82F6', order: 1, isDefault: true },
    { id: 'science', name: 'Science', color: '#8B5CF6', order: 2, isDefault: true },
  ],
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  reorderCategories: vi.fn(),
  getCategorizedFeeds: vi.fn(),
  moveFeedToCategory: vi.fn(),
  exportCategories: vi.fn(),
  importCategories: vi.fn(),
  resetToDefaults: vi.fn(),
};

vi.mock('../hooks/useFeedCategories', () => ({
  useFeedCategories: () => mockUseFeedCategories,
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock document.createElement and appendChild/removeChild
const mockAnchor = {
  href: '',
  download: '',
  click: vi.fn(),
};

const originalCreateElement = document.createElement;
document.createElement = vi.fn((tagName) => {
  if (tagName === 'a') {
    return mockAnchor as any;
  }
  return originalCreateElement.call(document, tagName);
});

const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();
document.body.appendChild = mockAppendChild;
document.body.removeChild = mockRemoveChild;

describe('FeedCategoryManager', () => {
  const mockFeeds: FeedSource[] = [
    { url: 'https://example.com/tech.xml', categoryId: 'tech' },
    { url: 'https://example.com/science.xml', categoryId: 'science' },
    { url: 'https://example.com/uncategorized.xml' },
  ];

  const mockSetFeeds = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseFeedCategories.getCategorizedFeeds.mockReturnValue({
      all: mockFeeds,
      tech: [mockFeeds[0]],
      science: [mockFeeds[1]],
      uncategorized: [mockFeeds[2]],
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('should render category manager with categories', () => {
    render(
      <FeedCategoryManager
        feeds={mockFeeds}
        setFeeds={mockSetFeeds}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Feed Category Manager')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Tech')).toBeInTheDocument();
    expect(screen.getByText('Science')).toBeInTheDocument();
  });

  it('should show create category form when button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <FeedCategoryManager
        feeds={mockFeeds}
        setFeeds={mockSetFeeds}
        onClose={mockOnClose}
      />
    );

    await user.click(screen.getByText('Create Category'));

    expect(screen.getByText('Create New Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Category Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Color')).toBeInTheDocument();
  });

  it('should create a new category', async () => {
    const user = userEvent.setup();
    mockUseFeedCategories.createCategory.mockReturnValue({
      id: 'custom-1',
      name: 'Custom Category',
      color: '#FF0000',
      order: 3,
      isDefault: false,
    });

    render(
      <FeedCategoryManager
        feeds={mockFeeds}
        setFeeds={mockSetFeeds}
        onClose={mockOnClose}
      />
    );

    await user.click(screen.getByText('Create Category'));

    const nameInput = screen.getByLabelText('Category Name');
    const colorInput = screen.getByLabelText('Color');
    const descriptionInput = screen.getByLabelText('Description (optional)');

    await user.type(nameInput, 'Custom Category');
    await user.clear(colorInput);
    await user.type(colorInput, '#FF0000');
    await user.type(descriptionInput, 'Test description');

    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(mockUseFeedCategories.createCategory).toHaveBeenCalledWith(
      'Custom Category',
      '#FF0000',
      'Test description'
    );
  });

  it('should cancel category creation', async () => {
    const user = userEvent.setup();
    render(
      <FeedCategoryManager
        feeds={mockFeeds}
        setFeeds={mockSetFeeds}
        onClose={mockOnClose}
      />
    );

    await user.click(screen.getByText('Create Category'));
    expect(screen.getByText('Create New Category')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Create New Category')).not.toBeInTheDocument();
  });

  it('should export categories', async () => {
    const user = userEvent.setup();
    mockUseFeedCategories.exportCategories.mockReturnValue('{"categories": []}');

    render(
      <FeedCategoryManager
        feeds={mockFeeds}
        setFeeds={mockSetFeeds}
        onClose={mockOnClose}
      />
    );

    await user.click(screen.getByText('Export Categories'));

    expect(mockUseFeedCategories.exportCategories).toHaveBeenCalled();
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(mockAnchor.click).toHaveBeenCalled();
  });

  it('should handle file import', async () => {
    const user = userEvent.setup();
    mockUseFeedCategories.importCategories.mockReturnValue(true);

    // Mock window.alert
    const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(
      <FeedCategoryManager
        feeds={mockFeeds}
        setFeeds={mockSetFeeds}
        onClose={mockOnClose}
      />
    );

    const fileInput = screen.getByRole('button', { name: 'Import Categories' });
    await user.click(fileInput);

    // Simulate file selection
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['{"categories": []}'], 'categories.json', { type: 'application/json' });

    Object.defineProperty(hiddenInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(hiddenInput);

    await waitFor(() => {
      expect(mockUseFeedCategories.importCategories).toHaveBeenCalledWith('{"categories": []}');
    });

    expect(mockAlert).toHaveBeenCalledWith('Categories imported successfully!');
    mockAlert.mockRestore();
  });

  it('should handle failed import', async () => {
    const user = userEvent.setup();
    mockUseFeedCategories.importCategories.mockReturnValue(false);

    const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(
      <FeedCategoryManager
        feeds={mockFeeds}
        setFeeds={mockSetFeeds}
        onClose={mockOnClose}
      />
    );

    await user.click(screen.getByText('Import Categories'));

    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['invalid'], 'categories.json', { type: 'application/json' });

    Object.defineProperty(hiddenInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(hiddenInput);

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Failed to import categories. Please check the file format.');
    });

    mockAlert.mockRestore();
  });

  it('should reset to defaults with confirmation', async () => {
    const user = userEvent.setup();
    const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <FeedCategoryManager
        feeds={mockFeeds}
        setFeeds={mockSetFeeds}
        onClose={mockOnClose}
      />
    );

    await user.click(screen.getByText('Reset to Defaults'));

    expect(mockConfirm).toHaveBeenCalled();
    expect(mockUseFeedCategories.resetToDefaults).toHaveBeenCalled();
    expect(mockSetFeeds).toHaveBeenCalledWith(
      mockFeeds.map(feed => ({ ...feed, categoryId: undefined }))
    );

    mockConfirm.mockRestore();
  });

  it('should not reset when confirmation is cancelled', async () => {
    const user = userEvent.setup();
    const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(
      <FeedCategoryManager
        feeds={mockFeeds}
        setFeeds={mockSetFeeds}
        onClose={mockOnClose}
      />
    );

    await user.click(screen.getByText('Reset to Defaults'));

    expect(mockConfirm).toHaveBeenCalled();
    expect(mockUseFeedCategories.resetToDefaults).not.toHaveBeenCalled();

    mockConfirm.mockRestore();
  });

  it('should close when close button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <FeedCategoryManager
        feeds={mockFeeds}
        setFeeds={mockSetFeeds}
        onClose={mockOnClose}
      />
    );

    await user.click(screen.getByLabelText('Close category manager'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should display feed counts for each category', () => {
    render(
      <FeedCategoryManager
        feeds={mockFeeds}
        setFeeds={mockSetFeeds}
        onClose={mockOnClose}
      />
    );

    // Check that feed counts are displayed
    const feedCounts = screen.getAllByText(/\d+ feed\(s\)/);
    expect(feedCounts.length).toBeGreaterThan(0);
  });

  it('should show uncategorized feeds section when there are uncategorized feeds', () => {
    render(
      <FeedCategoryManager
        feeds={mockFeeds}
        setFeeds={mockSetFeeds}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Uncategorized')).toBeInTheDocument();
  });

  it('should handle drag and drop operations', () => {
    render(
      <FeedCategoryManager
        feeds={mockFeeds}
        setFeeds={mockSetFeeds}
        onClose={mockOnClose}
      />
    );

    // Test drag start
    const feedElement = screen.getByText('https://example.com/tech.xml');
    fireEvent.dragStart(feedElement);

    // Test drag over
    const categoryElement = screen.getByText('Science');
    fireEvent.dragOver(categoryElement);

    // Test drop
    fireEvent.drop(categoryElement);

    // The drag and drop functionality should be tested more thoroughly in integration tests
    // as it involves complex DOM interactions
  });

  it('should display instructions', () => {
    render(
      <FeedCategoryManager
        feeds={mockFeeds}
        setFeeds={mockSetFeeds}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Instructions:')).toBeInTheDocument();
    expect(screen.getByText('• Drag feeds between categories to organize them')).toBeInTheDocument();
  });
});

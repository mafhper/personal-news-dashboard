import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { KeyboardShortcutsModal } from '../components/KeyboardShortcutsModal';
import App from '../App';

// Mock the RSS parser and other services
vi.mock('../services/rssParser', () => ({
  parseRssUrl: vi.fn().mockResolvedValue({
    articles: [],
    title: 'Test Feed'
  })
}));

vi.mock('../services/performanceUtils', () => ({
  performanceUtils: {
    mark: vi.fn(),
    measureBetween: vi.fn(),
    getMemoryUsage: vi.fn().mockReturnValue({
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000
    })
  }
}));

describe('Keyboard Navigation Tests', () => {
  describe('useKeyboardNavigation Hook', () => {
    const TestComponent: React.FC<{ shortcuts?: any[]; enableArrowNavigation?: boolean }> = ({
      shortcuts = [],
      enableArrowNavigation = false
    }) => {
      const mockOnArrowNavigation = vi.fn();

      useKeyboardNavigation({
        shortcuts,
        enableArrowNavigation,
        onArrowNavigation: mockOnArrowNavigation
      });

      return (
        <div data-testid="test-container">
          <button data-testid="button1">Button 1</button>
          <button data-testid="button2">Button 2</button>
          <input data-testid="input1" />
        </div>
      );
    };

    it('should execute keyboard shortcuts', async () => {
      const user = userEvent.setup();
      const mockAction = vi.fn();

      const shortcuts = [
        {
          key: 'k',
          ctrlKey: true,
          action: mockAction,
          description: 'Test shortcut'
        }
      ];

      render(<TestComponent shortcuts={shortcuts} />);

      await user.keyboard('{Control>}k{/Control}');
      expect(mockAction).toHaveBeenCalled();
    });

    it('should handle multiple modifier keys', async () => {
      const user = userEvent.setup();
      const mockAction = vi.fn();

      const shortcuts = [
        {
          key: 's',
          ctrlKey: true,
          shiftKey: true,
          action: mockAction,
          description: 'Test shortcut with multiple modifiers'
        }
      ];

      render(<TestComponent shortcuts={shortcuts} />);

      await user.keyboard('{Control>}{Shift>}s{/Shift}{/Control}');
      expect(mockAction).toHaveBeenCalled();
    });

    it('should not execute shortcuts without proper modifiers', async () => {
      const user = userEvent.setup();
      const mockAction = vi.fn();

      const shortcuts = [
        {
          key: 'k',
          ctrlKey: true,
          action: mockAction,
          description: 'Test shortcut'
        }
      ];

      render(<TestComponent shortcuts={shortcuts} />);

      // Press 'k' without Ctrl
      await user.keyboard('k');
      expect(mockAction).not.toHaveBeenCalled();
    });

    it('should handle arrow navigation when enabled', async () => {
      const user = userEvent.setup();
      const mockOnArrowNavigation = vi.fn();

      const TestArrowComponent: React.FC = () => {
        useKeyboardNavigation({
          enableArrowNavigation: true,
          onArrowNavigation: mockOnArrowNavigation
        });

        return <div data-testid="arrow-container">Test</div>;
      };

      render(<TestArrowComponent />);

      await user.keyboard('{ArrowUp}');
      expect(mockOnArrowNavigation).toHaveBeenCalledWith('up');

      await user.keyboard('{ArrowDown}');
      expect(mockOnArrowNavigation).toHaveBeenCalledWith('down');

      await user.keyboard('{ArrowLeft}');
      expect(mockOnArrowNavigation).toHaveBeenCalledWith('left');

      await user.keyboard('{ArrowRight}');
      expect(mockOnArrowNavigation).toHaveBeenCalledWith('right');
    });
  });

  describe('KeyboardShortcutsModal Component', () => {
    it('should render keyboard shortcuts help', () => {
      render(<KeyboardShortcutsModal isOpen={true} onClose={() => {}} />);

      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
      expect(screen.getByText('Navigation')).toBeInTheDocument();
      expect(screen.getByText('Articles')).toBeInTheDocument();
      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('Accessibility')).toBeInTheDocument();
    });

    it('should display shortcut keys and descriptions', () => {
      render(<KeyboardShortcutsModal isOpen={true} onClose={() => {}} />);

      expect(screen.getByText('Open search')).toBeInTheDocument();
      expect(screen.getByText('Ctrl + K')).toBeInTheDocument();
      expect(screen.getByText('Refresh articles')).toBeInTheDocument();
      expect(screen.getByText('Ctrl + R')).toBeInTheDocument();
    });

    it('should close when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<KeyboardShortcutsModal isOpen={true} onClose={onClose} />);

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should not render when closed', () => {
      render(<KeyboardShortcutsModal isOpen={false} onClose={() => {}} />);

      expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
    });
  });

  describe('App Integration Tests', () => {
    beforeEach(() => {
      // Mock localStorage
      const localStorageMock = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock
      });
    });

    it('should open search with Ctrl+K', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Wait for app to load
      await waitFor(() => {
        expect(screen.getByText('MyFeed')).toBeInTheDocument();
      });

      await user.keyboard('{Control>}k{/Control}');

      // Check if search input is focused
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Search articles/i);
        expect(searchInput).toHaveFocus();
      });
    });

    it('should open keyboard shortcuts with Ctrl+H', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.keyboard('{Control>}h{/Control}');

      await waitFor(() => {
        expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
      });
    });

    it('should open keyboard shortcuts with ?', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.keyboard('?');

      await waitFor(() => {
        expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
      });
    });

    it('should open settings with Ctrl+S', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.keyboard('{Control>}s{/Control}');

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });
    });

    it('should open feed manager with Ctrl+M', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.keyboard('{Control>}m{/Control}');

      await waitFor(() => {
        expect(screen.getByText('Manage Feeds')).toBeInTheDocument();
      });
    });

    it('should navigate categories with number keys', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('All')).toBeInTheDocument();
      });

      // Press '2' to select Tech category
      await user.keyboard('2');

      await waitFor(() => {
        const techButton = screen.getByRole('button', { name: /Filter articles by Tech category/ });
        expect(techButton).toHaveAttribute('aria-current', 'page');
      });
    });

    it('should support Enter and Space for interactive elements', async () => {
      const user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('All')).toBeInTheDocument();
      });

      const settingsButton = screen.getByLabelText('Open settings');
      settingsButton.focus();

      // Test Enter key
      await user.keyboard('{Enter}');
      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Close modal
      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      // Test Space key
      settingsButton.focus();
      await user.keyboard(' ');
      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });
    });

    it('should close modals with Escape key', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Open settings modal
      await user.keyboard('{Control>}s{/Control}');

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Close with Escape
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByText('Settings')).not.toBeInTheDocument();
      });
    });
  });

  describe('Focus Management Integration', () => {
    it('should maintain proper focus order when navigating with Tab', async () => {
      const user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('MyFeed')).toBeInTheDocument();
      });

      // Start tabbing through elements
      await user.tab();

      // Should focus on first interactive element
      const firstFocusable = document.activeElement;
      expect(firstFocusable).toBeInstanceOf(HTMLElement);
      expect(firstFocusable?.tagName.toLowerCase()).toMatch(/button|input|a/);
    });

    it('should support Shift+Tab for backward navigation', async () => {
      const user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('MyFeed')).toBeInTheDocument();
      });

      // Tab forward a few times
      await user.tab();
      await user.tab();
      const forwardElement = document.activeElement;

      // Tab backward
      await user.tab({ shift: true });
      const backwardElement = document.activeElement;

      expect(backwardElement).not.toBe(forwardElement);
    });
  });
});

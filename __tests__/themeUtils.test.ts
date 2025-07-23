import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateTheme,
  migrateTheme,
  createThemeFromAccentColor,
  applyThemeToDOM,
  getSystemThemePreference,
  exportTheme,
  importTheme,
  defaultThemePresets,
} from '../services/themeUtils';
import type { ExtendedTheme } from '../types';

// Mock DOM methods
const mockSetProperty = vi.fn();
Object.defineProperty(document, 'documentElement', {
  value: {
    style: {
      setProperty: mockSetProperty,
    },
  },
  writable: true,
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: query.includes('dark'),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('themeUtils', () => {
  beforeEach(() => {
    mockSetProperty.mockClear();
  });

  describe('validateTheme', () => {
    it('should validate a complete theme', () => {
      const validTheme = defaultThemePresets[0].theme;
      expect(validateTheme(validTheme)).toBe(true);
    });

    it('should reject theme missing required fields', () => {
      const invalidTheme = {
        id: 'test',
        name: 'Test Theme',
        // missing colors, layout, density, borderRadius
      };
      expect(validateTheme(invalidTheme)).toBe(false);
    });

    it('should reject theme with invalid RGB colors', () => {
      const invalidTheme = {
        id: 'test',
        name: 'Test Theme',
        colors: {
          primary: 'invalid-color',
          secondary: '45 55 72',
          accent: '20 184 166',
          background: '26 32 44',
          surface: '45 55 72',
          text: '247 250 252',
          textSecondary: '160 174 192',
          border: '75 85 99',
          success: '16 185 129',
          warning: '245 158 11',
          error: '239 68 68',
        },
        layout: 'comfortable',
        density: 'medium',
        borderRadius: 'medium',
        shadows: true,
        animations: true,
      };
      expect(validateTheme(invalidTheme)).toBe(false);
    });

    it('should validate RGB color format correctly', () => {
      const validTheme = {
        id: 'test',
        name: 'Test Theme',
        colors: {
          primary: '255 255 255',
          secondary: '0 0 0',
          accent: '128 128 128',
          background: '26 32 44',
          surface: '45 55 72',
          text: '247 250 252',
          textSecondary: '160 174 192',
          border: '75 85 99',
          success: '16 185 129',
          warning: '245 158 11',
          error: '239 68 68',
        },
        layout: 'comfortable',
        density: 'medium',
        borderRadius: 'medium',
        shadows: true,
        animations: true,
      };
      expect(validateTheme(validTheme)).toBe(true);
    });
  });

  describe('createThemeFromAccentColor', () => {
    it('should create a dark theme from dark accent color', () => {
      const theme = createThemeFromAccentColor('20 20 20', 'Dark Test');
      expect(theme.name).toBe('Dark Test');
      expect(theme.colors.accent).toBe('20 20 20');
      expect(theme.colors.background).toBe('26 32 44'); // Dark background
    });

    it('should create a light theme from light accent color', () => {
      const theme = createThemeFromAccentColor('200 200 200', 'Light Test');
      expect(theme.name).toBe('Light Test');
      expect(theme.colors.accent).toBe('200 200 200');
      expect(theme.colors.background).toBe('255 255 255'); // Light background
    });

    it('should generate unique IDs', async () => {
      const theme1 = createThemeFromAccentColor('100 100 100', 'Test 1');
      // Add small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1));
      const theme2 = createThemeFromAccentColor('100 100 100', 'Test 2');
      expect(theme1.id).not.toBe(theme2.id);
    });
  });

  describe('migrateTheme', () => {
    it('should migrate string theme to ExtendedTheme', () => {
      const oldTheme = '20 184 166';
      const migratedTheme = migrateTheme(oldTheme);
      expect(migratedTheme).toBeTruthy();
      expect(migratedTheme?.colors.accent).toBe('20 184 166');
      expect(migratedTheme?.name).toBe('Migrated Theme');
    });

    it('should return valid theme unchanged', () => {
      const validTheme = defaultThemePresets[0].theme;
      const result = migrateTheme(validTheme);
      expect(result).toEqual(validTheme);
    });

    it('should return null for invalid theme', () => {
      const invalidTheme = { invalid: 'data' };
      const result = migrateTheme(invalidTheme);
      expect(result).toBeNull();
    });
  });

  describe('applyThemeToDOM', () => {
    it('should apply theme colors to CSS custom properties', () => {
      const theme = defaultThemePresets[0].theme;
      applyThemeToDOM(theme);

      // Check that CSS custom properties were set
      expect(mockSetProperty).toHaveBeenCalledWith('--color-primary', theme.colors.primary);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-accent', theme.colors.accent);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-background', theme.colors.background);
    });

    it('should apply layout and density settings', () => {
      const theme: ExtendedTheme = {
        ...defaultThemePresets[0].theme,
        layout: 'spacious',
        density: 'high',
      };
      applyThemeToDOM(theme);

      expect(mockSetProperty).toHaveBeenCalledWith('--layout-padding', '1.5rem');
      expect(mockSetProperty).toHaveBeenCalledWith('--layout-gap', '1.5rem');
      expect(mockSetProperty).toHaveBeenCalledWith('--density-font-size', '1.125rem');
    });

    it('should apply border radius and feature toggles', () => {
      const theme: ExtendedTheme = {
        ...defaultThemePresets[0].theme,
        borderRadius: 'large',
        shadows: false,
        animations: false,
      };
      applyThemeToDOM(theme);

      expect(mockSetProperty).toHaveBeenCalledWith('--border-radius', '1rem');
      expect(mockSetProperty).toHaveBeenCalledWith('--shadows-enabled', '0');
      expect(mockSetProperty).toHaveBeenCalledWith('--animations-enabled', '0');
      expect(mockSetProperty).toHaveBeenCalledWith('--transition-duration', '0s');
    });
  });

  describe('getSystemThemePreference', () => {
    it('should return dark for dark system preference', () => {
      const preference = getSystemThemePreference();
      expect(preference).toBe('dark'); // Based on our mock
    });
  });

  describe('exportTheme and importTheme', () => {
    it('should export and import theme correctly', () => {
      const originalTheme = defaultThemePresets[0].theme;
      const exported = exportTheme(originalTheme);
      const imported = importTheme(exported);

      expect(imported).toEqual(originalTheme);
    });

    it('should return null for invalid JSON', () => {
      const result = importTheme('invalid json');
      expect(result).toBeNull();
    });

    it('should return null for invalid theme structure', () => {
      const invalidThemeJson = JSON.stringify({ invalid: 'theme' });
      const result = importTheme(invalidThemeJson);
      expect(result).toBeNull();
    });
  });

  describe('defaultThemePresets', () => {
    it('should have valid theme presets', () => {
      defaultThemePresets.forEach(preset => {
        expect(validateTheme(preset.theme)).toBe(true);
        expect(preset.id).toBeTruthy();
        expect(preset.name).toBeTruthy();
        expect(preset.description).toBeTruthy();
        expect(['light', 'dark', 'colorful', 'minimal']).toContain(preset.category);
      });
    });

    it('should have unique preset IDs', () => {
      const ids = defaultThemePresets.map(preset => preset.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});

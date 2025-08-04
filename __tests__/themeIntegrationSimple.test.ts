import { describe, it, expect, beforeEach, vi } from 'vitest';
import { applyThemeToDOM, defaultThemePresets } from '../services/themeUtils';
import type { ExtendedTheme } from '../types';

// Mock document.documentElement
const mockSetProperty = vi.fn();
const mockGetPropertyValue = vi.fn();

Object.defineProperty(document, 'documentElement', {
  value: {
    style: {
      setProperty: mockSetProperty,
      getPropertyValue: mockGetPropertyValue,
    },
  },
  writable: true,
});

describe('Theme Integration - Real World Scenarios', () => {
  beforeEach(() => {
    mockSetProperty.mockClear();
    mockGetPropertyValue.mockClear();
  });

  describe('Theme Switching Scenarios', () => {
    it('should handle switching from light to dark theme correctly', () => {
      // Start with Solar Clean (light theme)
      const solarCleanTheme = defaultThemePresets.find(p => p.id === 'solar-clean')?.theme;
      expect(solarCleanTheme).toBeDefined();

      applyThemeToDOM(solarCleanTheme!);

      // Verify light theme colors are applied
      expect(mockSetProperty).toHaveBeenCalledWith('--color-background', '255 255 255');
      expect(mockSetProperty).toHaveBeenCalledWith('--color-text', '33 33 33');
      expect(mockSetProperty).toHaveBeenCalledWith('--color-surface', '245 245 245');

      mockSetProperty.mockClear();

      // Switch to Noite Urbana (dark theme)
      const noiteUrbanaTheme = defaultThemePresets.find(p => p.id === 'noite-urbana')?.theme;
      expect(noiteUrbanaTheme).toBeDefined();

      applyThemeToDOM(noiteUrbanaTheme!);

      // Verify dark theme colors are applied
      expect(mockSetProperty).toHaveBeenCalledWith('--color-background', '18 18 18');
      expect(mockSetProperty).toHaveBeenCalledWith('--color-text', '255 255 255');
      expect(mockSetProperty).toHaveBeenCalledWith('--color-surface', '30 30 30');
    });

    it('should handle switching between different dark themes', () => {
      const darkThemes = [
        { id: 'noite-urbana', expectedPrimary: '18 102 204', expectedAccent: '138 101 8' },
        { id: 'verde-noturno', expectedPrimary: '52 125 54', expectedAccent: '122 105 17' },
        { id: 'roxo-nebuloso', expectedPrimary: '173 46 207', expectedAccent: '204 51 102' },
      ];

      darkThemes.forEach(({ id, expectedPrimary, expectedAccent }) => {
        const theme = defaultThemePresets.find(p => p.id === id)?.theme;
        expect(theme).toBeDefined();

        mockSetProperty.mockClear();
        applyThemeToDOM(theme!);

        expect(mockSetProperty).toHaveBeenCalledWith('--color-primary', expectedPrimary);
        expect(mockSetProperty).toHaveBeenCalledWith('--color-accent', expectedAccent);
      });
    });

    it('should handle switching between different light themes', () => {
      const lightThemes = [
        { id: 'solar-clean', expectedPrimary: '25 118 210', expectedAccent: '184 61 23' },
        { id: 'verao-pastel', expectedPrimary: '178 48 92', expectedAccent: '126 87 194' },
        { id: 'minimal-ice', expectedPrimary: '0 129 145', expectedAccent: '184 81 49' },
      ];

      lightThemes.forEach(({ id, expectedPrimary, expectedAccent }) => {
        const theme = defaultThemePresets.find(p => p.id === id)?.theme;
        expect(theme).toBeDefined();

        mockSetProperty.mockClear();
        applyThemeToDOM(theme!);

        expect(mockSetProperty).toHaveBeenCalledWith('--color-primary', expectedPrimary);
        expect(mockSetProperty).toHaveBeenCalledWith('--color-accent', expectedAccent);
      });
    });
  });

  describe('Performance and Consistency', () => {
    it('should apply themes consistently across multiple calls', () => {
      const theme = defaultThemePresets.find(p => p.id === 'solar-clean')?.theme;
      expect(theme).toBeDefined();

      // Apply theme multiple times
      for (let i = 0; i < 5; i++) {
        mockSetProperty.mockClear();
        applyThemeToDOM(theme!);

        // Each call should set the same values
        expect(mockSetProperty).toHaveBeenCalledWith('--color-primary', '25 118 210');
        expect(mockSetProperty).toHaveBeenCalledWith('--color-background', '255 255 255');
        expect(mockSetProperty).toHaveBeenCalledWith('--color-accent', '184 61 23');
      }
    });

    it('should handle rapid theme switching without errors', () => {
      const themes = defaultThemePresets.map(p => p.theme);

      // Simulate rapid switching
      for (let i = 0; i < 10; i++) {
        const randomTheme = themes[i % themes.length];
        expect(() => applyThemeToDOM(randomTheme)).not.toThrow();
      }

      // Verify the last theme was applied correctly
      const lastTheme = themes[9 % themes.length];
      expect(mockSetProperty).toHaveBeenCalledWith('--color-primary', lastTheme.colors.primary);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-background', lastTheme.colors.background);
    });
  });

  describe('CSS Custom Properties Verification', () => {
    it('should verify all themes have correct RGB format colors', () => {
      defaultThemePresets.forEach(preset => {
        const theme = preset.theme;

        // Apply theme
        mockSetProperty.mockClear();
        applyThemeToDOM(theme);

        // Verify all color properties are set with valid RGB values
        const colorProperties = [
          'primary', 'secondary', 'accent', 'background', 'surface',
          'text', 'textSecondary', 'border', 'success', 'warning', 'error'
        ];

        colorProperties.forEach(colorName => {
          const expectedValue = theme.colors[colorName as keyof typeof theme.colors];
          expect(mockSetProperty).toHaveBeenCalledWith(`--color-${colorName}`, expectedValue);

          // Verify RGB format
          const rgbPattern = /^\d{1,3}\s+\d{1,3}\s+\d{1,3}$/;
          expect(expectedValue).toMatch(rgbPattern);

          // Verify RGB values are in valid range
          const [r, g, b] = expectedValue.split(/\s+/).map(Number);
          expect(r).toBeGreaterThanOrEqual(0);
          expect(r).toBeLessThanOrEqual(255);
          expect(g).toBeGreaterThanOrEqual(0);
          expect(g).toBeLessThanOrEqual(255);
          expect(b).toBeGreaterThanOrEqual(0);
          expect(b).toBeLessThanOrEqual(255);
        });
      });
    });

    it('should apply transition properties correctly for smooth theme changes', () => {
      // Test theme with animations enabled
      const animatedTheme: ExtendedTheme = {
        ...defaultThemePresets[0].theme,
        animations: true,
      };

      applyThemeToDOM(animatedTheme);
      expect(mockSetProperty).toHaveBeenCalledWith('--transition-duration', '0.2s');
      expect(mockSetProperty).toHaveBeenCalledWith('--animations-enabled', '1');

      mockSetProperty.mockClear();

      // Test theme with animations disabled
      const staticTheme: ExtendedTheme = {
        ...defaultThemePresets[0].theme,
        animations: false,
      };

      applyThemeToDOM(staticTheme);
      expect(mockSetProperty).toHaveBeenCalledWith('--transition-duration', '0s');
      expect(mockSetProperty).toHaveBeenCalledWith('--animations-enabled', '0');
    });
  });

  describe('Theme Completeness', () => {
    it('should verify all 6 new themes are properly defined', () => {
      const expectedThemeIds = [
        'noite-urbana',
        'verde-noturno',
        'roxo-nebuloso',
        'solar-clean',
        'verao-pastel',
        'minimal-ice'
      ];

      expectedThemeIds.forEach(themeId => {
        const preset = defaultThemePresets.find(p => p.id === themeId);
        expect(preset).toBeDefined();
        expect(preset!.theme.id).toBe(themeId);

        // Verify theme has all required properties
        expect(preset!.theme.colors).toBeDefined();
        expect(preset!.theme.layout).toBeDefined();
        expect(preset!.theme.density).toBeDefined();
        expect(preset!.theme.borderRadius).toBeDefined();
        expect(typeof preset!.theme.shadows).toBe('boolean');
        expect(typeof preset!.theme.animations).toBe('boolean');
      });

      // Verify we have exactly 6 themes
      expect(defaultThemePresets).toHaveLength(6);
    });

    it('should verify theme categories are correctly assigned', () => {
      const darkThemes = defaultThemePresets.filter(p => p.category === 'dark');
      const lightThemes = defaultThemePresets.filter(p => p.category === 'light');

      expect(darkThemes).toHaveLength(3);
      expect(lightThemes).toHaveLength(3);

      // Verify dark theme IDs
      const darkThemeIds = darkThemes.map(t => t.id);
      expect(darkThemeIds).toContain('noite-urbana');
      expect(darkThemeIds).toContain('verde-noturno');
      expect(darkThemeIds).toContain('roxo-nebuloso');

      // Verify light theme IDs
      const lightThemeIds = lightThemes.map(t => t.id);
      expect(lightThemeIds).toContain('solar-clean');
      expect(lightThemeIds).toContain('verao-pastel');
      expect(lightThemeIds).toContain('minimal-ice');
    });
  });
});

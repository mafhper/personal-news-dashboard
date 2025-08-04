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

describe('CSS Custom Properties Integration', () => {
  beforeEach(() => {
    mockSetProperty.mockClear();
    mockGetPropertyValue.mockClear();
  });

  describe('applyThemeToDOM - New Theme Colors', () => {
    it('should apply all required color properties for Noite Urbana theme', () => {
      const noiteUrbanaTheme = defaultThemePresets.find(p => p.id === 'noite-urbana')?.theme;
      expect(noiteUrbanaTheme).toBeDefined();

      applyThemeToDOM(noiteUrbanaTheme!);

      // Verify all color properties are set
      expect(mockSetProperty).toHaveBeenCalledWith('--color-primary', noiteUrbanaTheme!.colors.primary);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-secondary', noiteUrbanaTheme!.colors.secondary);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-accent', noiteUrbanaTheme!.colors.accent);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-background', noiteUrbanaTheme!.colors.background);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-surface', noiteUrbanaTheme!.colors.surface);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-text', noiteUrbanaTheme!.colors.text);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-textSecondary', noiteUrbanaTheme!.colors.textSecondary);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-border', noiteUrbanaTheme!.colors.border);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-success', noiteUrbanaTheme!.colors.success);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-warning', noiteUrbanaTheme!.colors.warning);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-error', noiteUrbanaTheme!.colors.error);
    });

    it('should apply all required color properties for Verde Noturno theme', () => {
      const verdeNoturnoTheme = defaultThemePresets.find(p => p.id === 'verde-noturno')?.theme;
      expect(verdeNoturnoTheme).toBeDefined();

      applyThemeToDOM(verdeNoturnoTheme!);

      // Verify all color properties are set
      expect(mockSetProperty).toHaveBeenCalledWith('--color-primary', verdeNoturnoTheme!.colors.primary);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-secondary', verdeNoturnoTheme!.colors.secondary);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-accent', verdeNoturnoTheme!.colors.accent);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-background', verdeNoturnoTheme!.colors.background);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-surface', verdeNoturnoTheme!.colors.surface);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-text', verdeNoturnoTheme!.colors.text);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-textSecondary', verdeNoturnoTheme!.colors.textSecondary);
    });

    it('should apply all required color properties for Roxo Nebuloso theme', () => {
      const roxoNebulosoTheme = defaultThemePresets.find(p => p.id === 'roxo-nebuloso')?.theme;
      expect(roxoNebulosoTheme).toBeDefined();

      applyThemeToDOM(roxoNebulosoTheme!);

      // Verify all color properties are set
      expect(mockSetProperty).toHaveBeenCalledWith('--color-primary', roxoNebulosoTheme!.colors.primary);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-secondary', roxoNebulosoTheme!.colors.secondary);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-accent', roxoNebulosoTheme!.colors.accent);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-background', roxoNebulosoTheme!.colors.background);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-surface', roxoNebulosoTheme!.colors.surface);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-text', roxoNebulosoTheme!.colors.text);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-textSecondary', roxoNebulosoTheme!.colors.textSecondary);
    });

    it('should apply all required color properties for Solar Clean theme', () => {
      const solarCleanTheme = defaultThemePresets.find(p => p.id === 'solar-clean')?.theme;
      expect(solarCleanTheme).toBeDefined();

      applyThemeToDOM(solarCleanTheme!);

      // Verify all color properties are set
      expect(mockSetProperty).toHaveBeenCalledWith('--color-primary', solarCleanTheme!.colors.primary);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-secondary', solarCleanTheme!.colors.secondary);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-accent', solarCleanTheme!.colors.accent);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-background', solarCleanTheme!.colors.background);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-surface', solarCleanTheme!.colors.surface);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-text', solarCleanTheme!.colors.text);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-textSecondary', solarCleanTheme!.colors.textSecondary);
    });

    it('should apply all required color properties for Verão Pastel theme', () => {
      const veraoPastelTheme = defaultThemePresets.find(p => p.id === 'verao-pastel')?.theme;
      expect(veraoPastelTheme).toBeDefined();

      applyThemeToDOM(veraoPastelTheme!);

      // Verify all color properties are set
      expect(mockSetProperty).toHaveBeenCalledWith('--color-primary', veraoPastelTheme!.colors.primary);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-secondary', veraoPastelTheme!.colors.secondary);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-accent', veraoPastelTheme!.colors.accent);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-background', veraoPastelTheme!.colors.background);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-surface', veraoPastelTheme!.colors.surface);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-text', veraoPastelTheme!.colors.text);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-textSecondary', veraoPastelTheme!.colors.textSecondary);
    });

    it('should apply all required color properties for Minimal Ice theme', () => {
      const minimalIceTheme = defaultThemePresets.find(p => p.id === 'minimal-ice')?.theme;
      expect(minimalIceTheme).toBeDefined();

      applyThemeToDOM(minimalIceTheme!);

      // Verify all color properties are set
      expect(mockSetProperty).toHaveBeenCalledWith('--color-primary', minimalIceTheme!.colors.primary);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-secondary', minimalIceTheme!.colors.secondary);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-accent', minimalIceTheme!.colors.accent);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-background', minimalIceTheme!.colors.background);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-surface', minimalIceTheme!.colors.surface);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-text', minimalIceTheme!.colors.text);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-textSecondary', minimalIceTheme!.colors.textSecondary);
    });
  });

  describe('Theme Transition Support', () => {
    it('should apply transition duration based on animations setting', () => {
      const themeWithAnimations: ExtendedTheme = {
        ...defaultThemePresets[0].theme,
        animations: true,
      };

      const themeWithoutAnimations: ExtendedTheme = {
        ...defaultThemePresets[0].theme,
        animations: false,
      };

      // Test with animations enabled
      applyThemeToDOM(themeWithAnimations);
      expect(mockSetProperty).toHaveBeenCalledWith('--transition-duration', '0.2s');
      expect(mockSetProperty).toHaveBeenCalledWith('--animations-enabled', '1');

      mockSetProperty.mockClear();

      // Test with animations disabled
      applyThemeToDOM(themeWithoutAnimations);
      expect(mockSetProperty).toHaveBeenCalledWith('--transition-duration', '0s');
      expect(mockSetProperty).toHaveBeenCalledWith('--animations-enabled', '0');
    });

    it('should apply all layout and density properties correctly', () => {
      const customTheme: ExtendedTheme = {
        ...defaultThemePresets[0].theme,
        layout: 'spacious',
        density: 'high',
        borderRadius: 'large',
        shadows: true,
      };

      applyThemeToDOM(customTheme);

      // Verify layout properties
      expect(mockSetProperty).toHaveBeenCalledWith('--layout-padding', '1.5rem');
      expect(mockSetProperty).toHaveBeenCalledWith('--layout-gap', '1.5rem');

      // Verify density properties
      expect(mockSetProperty).toHaveBeenCalledWith('--density-font-size', '1.125rem');
      expect(mockSetProperty).toHaveBeenCalledWith('--density-line-height', '1.75rem');

      // Verify border radius
      expect(mockSetProperty).toHaveBeenCalledWith('--border-radius', '1rem');

      // Verify shadows
      expect(mockSetProperty).toHaveBeenCalledWith('--shadows-enabled', '1');
    });
  });

  describe('RGB Color Format Validation', () => {
    it('should verify all theme colors are in correct RGB string format', () => {
      defaultThemePresets.forEach(preset => {
        const theme = preset.theme;

        // Test each color property
        Object.entries(theme.colors).forEach(([colorName, colorValue]) => {
          // RGB format should be "R G B" where R, G, B are numbers 0-255
          const rgbPattern = /^\d{1,3}\s+\d{1,3}\s+\d{1,3}$/;
          expect(colorValue).toMatch(rgbPattern,
            `Color ${colorName} in theme ${theme.name} should be in RGB format "R G B"`);

          // Verify RGB values are in valid range
          const [r, g, b] = colorValue.split(/\s+/).map(Number);
          expect(r).toBeGreaterThanOrEqual(0);
          expect(r).toBeLessThanOrEqual(255);
          expect(g).toBeGreaterThanOrEqual(0);
          expect(g).toBeLessThanOrEqual(255);
          expect(b).toBeGreaterThanOrEqual(0);
          expect(b).toBeLessThanOrEqual(255);
        });
      });
    });
  });

  describe('Complete Theme Application', () => {
    it('should apply all theme properties in a single call', () => {
      const theme = defaultThemePresets[0].theme;
      applyThemeToDOM(theme);

      // Verify all color properties were called
      const colorProperties = [
        '--color-primary', '--color-secondary', '--color-accent',
        '--color-background', '--color-surface', '--color-text',
        '--color-textSecondary', '--color-border', '--color-success',
        '--color-warning', '--color-error'
      ];

      colorProperties.forEach(property => {
        expect(mockSetProperty).toHaveBeenCalledWith(property, expect.any(String));
      });

      // Verify layout properties were called
      const layoutProperties = [
        '--layout-padding', '--layout-gap', '--density-font-size',
        '--density-line-height', '--border-radius', '--shadows-enabled',
        '--animations-enabled', '--transition-duration'
      ];

      layoutProperties.forEach(property => {
        expect(mockSetProperty).toHaveBeenCalledWith(property, expect.any(String));
      });

      // Verify minimum expected calls (11 colors + 8 layout properties)
      expect(mockSetProperty.mock.calls.length).toBeGreaterThanOrEqual(19);
    });
  });
});

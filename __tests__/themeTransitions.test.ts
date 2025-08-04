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

describe('Theme Transition Integration', () => {
  beforeEach(() => {
    mockSetProperty.mockClear();
    mockGetPropertyValue.mockClear();
  });

  describe('Smooth Theme Changes', () => {
    it('should apply transition duration correctly when switching between themes', () => {
      // Start with a theme that has animations enabled
      const themeWithAnimations = defaultThemePresets.find(p => p.id === 'solar-clean')?.theme;
      expect(themeWithAnimations).toBeDefined();

      const animatedTheme: ExtendedTheme = {
        ...themeWithAnimations!,
        animations: true,
      };

      applyThemeToDOM(animatedTheme);

      // Verify transition duration is set for smooth changes
      expect(mockSetProperty).toHaveBeenCalledWith('--transition-duration', '0.2s');
      expect(mockSetProperty).toHaveBeenCalledWith('--animations-enabled', '1');

      mockSetProperty.mockClear();

      // Switch to a theme without animations
      const themeWithoutAnimations: ExtendedTheme = {
        ...themeWithAnimations!,
        animations: false,
      };

      applyThemeToDOM(themeWithoutAnimations);

      // Verify transition duration is disabled for instant changes
      expect(mockSetProperty).toHaveBeenCalledWith('--transition-duration', '0s');
      expect(mockSetProperty).toHaveBeenCalledWith('--animations-enabled', '0');
    });

    it('should maintain consistent property application across all theme switches', () => {
      const themes = [
        defaultThemePresets.find(p => p.id === 'noite-urbana')?.theme,
        defaultThemePresets.find(p => p.id === 'verde-noturno')?.theme,
        defaultThemePresets.find(p => p.id === 'roxo-nebuloso')?.theme,
        defaultThemePresets.find(p => p.id === 'solar-clean')?.theme,
        defaultThemePresets.find(p => p.id === 'verao-pastel')?.theme,
        defaultThemePresets.find(p => p.id === 'minimal-ice')?.theme,
      ].filter(Boolean) as ExtendedTheme[];

      expect(themes).toHaveLength(6);

      themes.forEach((theme, index) => {
        mockSetProperty.mockClear();
        applyThemeToDOM(theme);

        // Verify all essential color properties are set for each theme
        const essentialProperties = [
          '--color-primary',
          '--color-accent',
          '--color-background',
          '--color-surface',
          '--color-text',
          '--color-textSecondary'
        ];

        essentialProperties.forEach(property => {
          expect(mockSetProperty).toHaveBeenCalledWith(property, expect.any(String));
        });

        // Verify transition properties are consistently applied
        expect(mockSetProperty).toHaveBeenCalledWith('--transition-duration', expect.any(String));
        expect(mockSetProperty).toHaveBeenCalledWith('--animations-enabled', expect.any(String));
      });
    });

    it('should handle rapid theme switching without errors', () => {
      const themes = defaultThemePresets.map(p => p.theme);

      // Simulate rapid theme switching
      themes.forEach(theme => {
        expect(() => applyThemeToDOM(theme)).not.toThrow();
      });

      // Verify the last theme was applied correctly
      const lastTheme = themes[themes.length - 1];
      expect(mockSetProperty).toHaveBeenCalledWith('--color-primary', lastTheme.colors.primary);
      expect(mockSetProperty).toHaveBeenCalledWith('--color-background', lastTheme.colors.background);
    });
  });

  describe('CSS Variable Updates', () => {
    it('should update all primary color variations correctly', () => {
      const themes = [
        { id: 'noite-urbana', expectedPrimary: '18 102 204' },
        { id: 'verde-noturno', expectedPrimary: '52 125 54' },
        { id: 'roxo-nebuloso', expectedPrimary: '173 46 207' },
        { id: 'solar-clean', expectedPrimary: '25 118 210' },
        { id: 'verao-pastel', expectedPrimary: '178 48 92' },
        { id: 'minimal-ice', expectedPrimary: '0 129 145' },
      ];

      themes.forEach(({ id, expectedPrimary }) => {
        const theme = defaultThemePresets.find(p => p.id === id)?.theme;
        expect(theme).toBeDefined();

        mockSetProperty.mockClear();
        applyThemeToDOM(theme!);

        expect(mockSetProperty).toHaveBeenCalledWith('--color-primary', expectedPrimary);
      });
    });

    it('should update all accent color variations correctly', () => {
      const themes = [
        { id: 'noite-urbana', expectedAccent: '138 101 8' },
        { id: 'verde-noturno', expectedAccent: '122 105 17' },
        { id: 'roxo-nebuloso', expectedAccent: '204 51 102' },
        { id: 'solar-clean', expectedAccent: '184 61 23' },
        { id: 'verao-pastel', expectedAccent: '126 87 194' },
        { id: 'minimal-ice', expectedAccent: '184 81 49' },
      ];

      themes.forEach(({ id, expectedAccent }) => {
        const theme = defaultThemePresets.find(p => p.id === id)?.theme;
        expect(theme).toBeDefined();

        mockSetProperty.mockClear();
        applyThemeToDOM(theme!);

        expect(mockSetProperty).toHaveBeenCalledWith('--color-accent', expectedAccent);
      });
    });

    it('should update all background color variations correctly', () => {
      const themes = [
        { id: 'noite-urbana', expectedBackground: '18 18 18' },
        { id: 'verde-noturno', expectedBackground: '13 13 13' },
        { id: 'roxo-nebuloso', expectedBackground: '16 16 20' },
        { id: 'solar-clean', expectedBackground: '255 255 255' },
        { id: 'verao-pastel', expectedBackground: '255 248 240' },
        { id: 'minimal-ice', expectedBackground: '240 244 248' },
      ];

      themes.forEach(({ id, expectedBackground }) => {
        const theme = defaultThemePresets.find(p => p.id === id)?.theme;
        expect(theme).toBeDefined();

        mockSetProperty.mockClear();
        applyThemeToDOM(theme!);

        expect(mockSetProperty).toHaveBeenCalledWith('--color-background', expectedBackground);
      });
    });

    it('should update all surface color variations correctly', () => {
      const themes = [
        { id: 'noite-urbana', expectedSurface: '30 30 30' },
        { id: 'verde-noturno', expectedSurface: '27 31 29' },
        { id: 'roxo-nebuloso', expectedSurface: '26 26 35' },
        { id: 'solar-clean', expectedSurface: '245 245 245' },
        { id: 'verao-pastel', expectedSurface: '255 255 255' },
        { id: 'minimal-ice', expectedSurface: '255 255 255' },
      ];

      themes.forEach(({ id, expectedSurface }) => {
        const theme = defaultThemePresets.find(p => p.id === id)?.theme;
        expect(theme).toBeDefined();

        mockSetProperty.mockClear();
        applyThemeToDOM(theme!);

        expect(mockSetProperty).toHaveBeenCalledWith('--color-surface', expectedSurface);
      });
    });

    it('should update all text color variations correctly', () => {
      const themes = [
        { id: 'noite-urbana', expectedText: '255 255 255' },
        { id: 'verde-noturno', expectedText: '241 241 241' },
        { id: 'roxo-nebuloso', expectedText: '224 224 224' },
        { id: 'solar-clean', expectedText: '33 33 33' },
        { id: 'verao-pastel', expectedText: '33 33 33' },
        { id: 'minimal-ice', expectedText: '28 28 28' },
      ];

      themes.forEach(({ id, expectedText }) => {
        const theme = defaultThemePresets.find(p => p.id === id)?.theme;
        expect(theme).toBeDefined();

        mockSetProperty.mockClear();
        applyThemeToDOM(theme!);

        expect(mockSetProperty).toHaveBeenCalledWith('--color-text', expectedText);
      });
    });

    it('should update all secondary text color variations correctly', () => {
      const themes = [
        { id: 'noite-urbana', expectedTextSecondary: '176 176 176' },
        { id: 'verde-noturno', expectedTextSecondary: '168 168 168' },
        { id: 'roxo-nebuloso', expectedTextSecondary: '156 156 156' },
        { id: 'solar-clean', expectedTextSecondary: '97 97 97' },
        { id: 'verao-pastel', expectedTextSecondary: '97 97 97' },
        { id: 'minimal-ice', expectedTextSecondary: '94 94 94' },
      ];

      themes.forEach(({ id, expectedTextSecondary }) => {
        const theme = defaultThemePresets.find(p => p.id === id)?.theme;
        expect(theme).toBeDefined();

        mockSetProperty.mockClear();
        applyThemeToDOM(theme!);

        expect(mockSetProperty).toHaveBeenCalledWith('--color-textSecondary', expectedTextSecondary);
      });
    });
  });

  describe('Layout and Feature Properties', () => {
    it('should correctly apply layout properties for different configurations', () => {
      const layoutConfigurations = [
        { layout: 'compact' as const, expectedPadding: '0.5rem', expectedGap: '0.5rem' },
        { layout: 'comfortable' as const, expectedPadding: '1rem', expectedGap: '1rem' },
        { layout: 'spacious' as const, expectedPadding: '1.5rem', expectedGap: '1.5rem' },
      ];

      layoutConfigurations.forEach(({ layout, expectedPadding, expectedGap }) => {
        const theme: ExtendedTheme = {
          ...defaultThemePresets[0].theme,
          layout,
        };

        mockSetProperty.mockClear();
        applyThemeToDOM(theme);

        expect(mockSetProperty).toHaveBeenCalledWith('--layout-padding', expectedPadding);
        expect(mockSetProperty).toHaveBeenCalledWith('--layout-gap', expectedGap);
      });
    });

    it('should correctly apply density properties for different configurations', () => {
      const densityConfigurations = [
        { density: 'low' as const, expectedFontSize: '0.875rem', expectedLineHeight: '1.25rem' },
        { density: 'medium' as const, expectedFontSize: '1rem', expectedLineHeight: '1.5rem' },
        { density: 'high' as const, expectedFontSize: '1.125rem', expectedLineHeight: '1.75rem' },
      ];

      densityConfigurations.forEach(({ density, expectedFontSize, expectedLineHeight }) => {
        const theme: ExtendedTheme = {
          ...defaultThemePresets[0].theme,
          density,
        };

        mockSetProperty.mockClear();
        applyThemeToDOM(theme);

        expect(mockSetProperty).toHaveBeenCalledWith('--density-font-size', expectedFontSize);
        expect(mockSetProperty).toHaveBeenCalledWith('--density-line-height', expectedLineHeight);
      });
    });

    it('should correctly apply border radius properties for different configurations', () => {
      const borderRadiusConfigurations = [
        { borderRadius: 'none' as const, expected: '0' },
        { borderRadius: 'small' as const, expected: '0.25rem' },
        { borderRadius: 'medium' as const, expected: '0.5rem' },
        { borderRadius: 'large' as const, expected: '1rem' },
      ];

      borderRadiusConfigurations.forEach(({ borderRadius, expected }) => {
        const theme: ExtendedTheme = {
          ...defaultThemePresets[0].theme,
          borderRadius,
        };

        mockSetProperty.mockClear();
        applyThemeToDOM(theme);

        expect(mockSetProperty).toHaveBeenCalledWith('--border-radius', expected);
      });
    });

    it('should correctly apply shadow and animation toggles', () => {
      const featureConfigurations = [
        { shadows: true, animations: true, expectedShadows: '1', expectedAnimations: '1', expectedTransition: '0.2s' },
        { shadows: false, animations: true, expectedShadows: '0', expectedAnimations: '1', expectedTransition: '0.2s' },
        { shadows: true, animations: false, expectedShadows: '1', expectedAnimations: '0', expectedTransition: '0s' },
        { shadows: false, animations: false, expectedShadows: '0', expectedAnimations: '0', expectedTransition: '0s' },
      ];

      featureConfigurations.forEach(({ shadows, animations, expectedShadows, expectedAnimations, expectedTransition }) => {
        const theme: ExtendedTheme = {
          ...defaultThemePresets[0].theme,
          shadows,
          animations,
        };

        mockSetProperty.mockClear();
        applyThemeToDOM(theme);

        expect(mockSetProperty).toHaveBeenCalledWith('--shadows-enabled', expectedShadows);
        expect(mockSetProperty).toHaveBeenCalledWith('--animations-enabled', expectedAnimations);
        expect(mockSetProperty).toHaveBeenCalledWith('--transition-duration', expectedTransition);
      });
    });
  });
});

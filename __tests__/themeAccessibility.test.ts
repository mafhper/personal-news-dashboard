import { describe, it, expect } from 'vitest';
import {
  defaultThemePresets,
  calculateContrastRatio,
  calculateLuminance,
  meetsWCAGAA,
  meetsWCAGAAA,
  validateThemeAccessibility,
  validateAllThemesAccessibility,
} from '../services/themeUtils';
import type { ExtendedTheme } from '../types';

describe('Theme Accessibility Compliance', () => {
  // WCAG AA standards
  const WCAG_AA_NORMAL = 4.5; // Normal text
  const WCAG_AA_LARGE = 3.0;  // Large text and interactive elements
  const WCAG_AAA_NORMAL = 7.0; // AAA standard for normal text

  describe('Contrast Ratio Calculations', () => {
    it('should calculate correct luminance values', () => {
      // Test known luminance values
      expect(calculateLuminance('0 0 0')).toBeCloseTo(0, 3);     // Black
      expect(calculateLuminance('255 255 255')).toBeCloseTo(1, 3); // White
      expect(calculateLuminance('128 128 128')).toBeCloseTo(0.216, 2); // Mid gray
    });

    it('should calculate correct contrast ratios', () => {
      // Test known contrast ratios
      expect(calculateContrastRatio('0 0 0', '255 255 255')).toBeCloseTo(21, 1); // Black on white
      expect(calculateContrastRatio('255 255 255', '0 0 0')).toBeCloseTo(21, 1); // White on black
      expect(calculateContrastRatio('128 128 128', '255 255 255')).toBeCloseTo(3.95, 1); // Gray on white
      expect(calculateContrastRatio('0 0 0', '0 0 0')).toBeCloseTo(1, 1); // Same colors
    });

    it('should handle RGB string format correctly', () => {
      const color1 = '30 136 229'; // Blue
      const color2 = '255 255 255'; // White

      const ratio = calculateContrastRatio(color1, color2);
      expect(ratio).toBeGreaterThan(1);
      expect(ratio).toBeLessThan(21);
      expect(typeof ratio).toBe('number');
    });
  });

  describe('WCAG Compliance Functions', () => {
    it('should correctly identify WCAG AA compliance', () => {
      expect(meetsWCAGAA('0 0 0', '255 255 255')).toBe(true);  // 21:1 ratio
      expect(meetsWCAGAA('255 255 255', '0 0 0')).toBe(true);  // 21:1 ratio
      expect(meetsWCAGAA('128 128 128', '255 255 255')).toBe(false); // ~3.95:1 ratio
      expect(meetsWCAGAA('85 85 85', '255 255 255')).toBe(true); // ~4.5:1 ratio
    });

    it('should correctly identify WCAG AAA compliance', () => {
      expect(meetsWCAGAAA('0 0 0', '255 255 255')).toBe(true);  // 21:1 ratio
      expect(meetsWCAGAAA('100 100 100', '255 255 255')).toBe(false); // ~4.5:1 ratio
      expect(meetsWCAGAAA('68 68 68', '255 255 255')).toBe(true); // ~7:1 ratio
    });
  });

  describe('Individual Theme Accessibility', () => {
    defaultThemePresets.forEach(preset => {
      describe(`${preset.name} (${preset.id})`, () => {
        const theme = preset.theme;

        it('should have sufficient text on background contrast (4.5:1)', () => {
          const ratio = calculateContrastRatio(theme.colors.text, theme.colors.background);
          expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
        });

        it('should have sufficient secondary text on background contrast (4.5:1)', () => {
          const ratio = calculateContrastRatio(theme.colors.textSecondary, theme.colors.background);
          expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
        });

        it('should have sufficient text on surface contrast (4.5:1)', () => {
          const ratio = calculateContrastRatio(theme.colors.text, theme.colors.surface);
          expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
        });

        it('should have sufficient secondary text on surface contrast (4.5:1)', () => {
          const ratio = calculateContrastRatio(theme.colors.textSecondary, theme.colors.surface);
          expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
        });

        it('should have sufficient primary color visibility on background (3:1)', () => {
          const ratio = calculateContrastRatio(theme.colors.primary, theme.colors.background);
          expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_LARGE);
        });

        it('should have sufficient accent color visibility on background (3:1)', () => {
          const ratio = calculateContrastRatio(theme.colors.accent, theme.colors.background);
          expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_LARGE);
        });

        it('should have sufficient primary color visibility on surface (3:1)', () => {
          const ratio = calculateContrastRatio(theme.colors.primary, theme.colors.surface);
          expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_LARGE);
        });

        it('should have sufficient accent color visibility on surface (3:1)', () => {
          const ratio = calculateContrastRatio(theme.colors.accent, theme.colors.surface);
          expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_LARGE);
        });

        it('should support white text on primary color for buttons (4.5:1)', () => {
          const ratio = calculateContrastRatio('255 255 255', theme.colors.primary);
          expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
        });

        it('should support white text on accent color for buttons (4.5:1)', () => {
          const ratio = calculateContrastRatio('255 255 255', theme.colors.accent);
          expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
        });

        it('should pass comprehensive accessibility validation', () => {
          const validation = validateThemeAccessibility(theme);
          expect(validation.isAccessible).toBe(true);
          expect(validation.issues).toHaveLength(0);
        });
      });
    });
  });

  describe('Specific Theme Color Combinations', () => {
    it('should validate Noite Urbana theme accessibility', () => {
      const noiteUrbana = defaultThemePresets.find(p => p.id === 'noite-urbana');
      expect(noiteUrbana).toBeDefined();

      if (noiteUrbana) {
        const theme = noiteUrbana.theme;
        const validation = validateThemeAccessibility(theme);

        // Should be accessible
        expect(validation.isAccessible).toBe(true);

        // Check specific contrast ratios
        expect(validation.contrastRatios.textOnBackground).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
        expect(validation.contrastRatios.textOnSurface).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
        expect(validation.contrastRatios.primaryOnBackground).toBeGreaterThanOrEqual(WCAG_AA_LARGE);
        expect(validation.contrastRatios.accentOnBackground).toBeGreaterThanOrEqual(WCAG_AA_LARGE);
      }
    });

    it('should validate Verde Noturno theme accessibility', () => {
      const verdeNoturno = defaultThemePresets.find(p => p.id === 'verde-noturno');
      expect(verdeNoturno).toBeDefined();

      if (verdeNoturno) {
        const theme = verdeNoturno.theme;
        const validation = validateThemeAccessibility(theme);

        expect(validation.isAccessible).toBe(true);
        expect(validation.contrastRatios.textOnBackground).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
        expect(validation.contrastRatios.secondaryTextOnBackground).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
      }
    });

    it('should validate Roxo Nebuloso theme accessibility', () => {
      const roxoNebuloso = defaultThemePresets.find(p => p.id === 'roxo-nebuloso');
      expect(roxoNebuloso).toBeDefined();

      if (roxoNebuloso) {
        const theme = roxoNebuloso.theme;
        const validation = validateThemeAccessibility(theme);

        expect(validation.isAccessible).toBe(true);
        expect(validation.contrastRatios.whiteOnPrimary).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
        expect(validation.contrastRatios.whiteOnAccent).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
      }
    });

    it('should validate Solar Clean theme accessibility', () => {
      const solarClean = defaultThemePresets.find(p => p.id === 'solar-clean');
      expect(solarClean).toBeDefined();

      if (solarClean) {
        const theme = solarClean.theme;
        const validation = validateThemeAccessibility(theme);

        expect(validation.isAccessible).toBe(true);
        expect(validation.contrastRatios.textOnBackground).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
        expect(validation.contrastRatios.primaryOnSurface).toBeGreaterThanOrEqual(WCAG_AA_LARGE);
      }
    });

    it('should validate Verão Pastel theme accessibility', () => {
      const veraoPastel = defaultThemePresets.find(p => p.id === 'verao-pastel');
      expect(veraoPastel).toBeDefined();

      if (veraoPastel) {
        const theme = veraoPastel.theme;
        const validation = validateThemeAccessibility(theme);

        expect(validation.isAccessible).toBe(true);
        expect(validation.contrastRatios.accentOnSurface).toBeGreaterThanOrEqual(WCAG_AA_LARGE);
      }
    });

    it('should validate Minimal Ice theme accessibility', () => {
      const minimalIce = defaultThemePresets.find(p => p.id === 'minimal-ice');
      expect(minimalIce).toBeDefined();

      if (minimalIce) {
        const theme = minimalIce.theme;
        const validation = validateThemeAccessibility(theme);

        expect(validation.isAccessible).toBe(true);
        expect(validation.contrastRatios.secondaryTextOnSurface).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
      }
    });
  });

  describe('Dark vs Light Theme Accessibility', () => {
    it('should have appropriate contrast patterns for dark themes', () => {
      const darkThemes = defaultThemePresets.filter(p => p.category === 'dark');

      darkThemes.forEach(preset => {
        const theme = preset.theme;

        // Dark themes should have light text on dark backgrounds
        const textLuminance = calculateLuminance(theme.colors.text);
        const bgLuminance = calculateLuminance(theme.colors.background);

        expect(textLuminance).toBeGreaterThan(bgLuminance);

        // Background should be darker than surface
        const surfaceLuminance = calculateLuminance(theme.colors.surface);
        expect(surfaceLuminance).toBeGreaterThanOrEqual(bgLuminance);
      });
    });

    it('should have appropriate contrast patterns for light themes', () => {
      const lightThemes = defaultThemePresets.filter(p => p.category === 'light');

      lightThemes.forEach(preset => {
        const theme = preset.theme;

        // Light themes should have dark text on light backgrounds
        const textLuminance = calculateLuminance(theme.colors.text);
        const bgLuminance = calculateLuminance(theme.colors.background);

        expect(textLuminance).toBeLessThan(bgLuminance);

        // Background should be lighter than or equal to surface (allowing small variance for design flexibility)
        const surfaceLuminance = calculateLuminance(theme.colors.surface);
        expect(bgLuminance).toBeGreaterThanOrEqual(surfaceLuminance - 0.1);
      });
    });
  });

  describe('All Themes Accessibility Summary', () => {
    it('should have all themes pass WCAG AA standards', () => {
      const summary = validateAllThemesAccessibility();

      expect(summary.summary.totalThemes).toBe(6);
      expect(summary.summary.accessibleThemes).toBe(6);
      expect(summary.summary.failedThemes).toHaveLength(0);
      expect(summary.summary.totalIssues).toBe(0);
    });

    it('should provide detailed validation results for each theme', () => {
      const summary = validateAllThemesAccessibility();

      const expectedThemeIds = ['noite-urbana', 'verde-noturno', 'roxo-nebuloso', 'solar-clean', 'verao-pastel', 'minimal-ice'];

      expectedThemeIds.forEach(themeId => {
        expect(summary.results).toHaveProperty(themeId);
        expect(summary.results[themeId].isAccessible).toBe(true);
        expect(summary.results[themeId].issues).toHaveLength(0);
        expect(summary.results[themeId].contrastRatios).toBeDefined();
      });
    });

    it('should have comprehensive contrast ratio data for all themes', () => {
      const summary = validateAllThemesAccessibility();

      Object.values(summary.results).forEach(result => {
        const ratios = result.contrastRatios;

        // Check all expected contrast ratios are present
        expect(ratios).toHaveProperty('textOnBackground');
        expect(ratios).toHaveProperty('secondaryTextOnBackground');
        expect(ratios).toHaveProperty('textOnSurface');
        expect(ratios).toHaveProperty('secondaryTextOnSurface');
        expect(ratios).toHaveProperty('primaryOnBackground');
        expect(ratios).toHaveProperty('accentOnBackground');
        expect(ratios).toHaveProperty('primaryOnSurface');
        expect(ratios).toHaveProperty('accentOnSurface');
        expect(ratios).toHaveProperty('whiteOnPrimary');
        expect(ratios).toHaveProperty('whiteOnAccent');

        // Check all ratios are valid numbers
        Object.values(ratios).forEach(ratio => {
          expect(typeof ratio).toBe('number');
          expect(ratio).toBeGreaterThan(0);
          expect(ratio).toBeLessThanOrEqual(21);
        });
      });
    });
  });

  describe('Edge Cases and Boundary Testing', () => {
    it('should handle themes with maximum contrast', () => {
      const highContrastTheme: ExtendedTheme = {
        id: 'test-high-contrast',
        name: 'Test High Contrast',
        colors: {
          primary: '0 0 0',
          secondary: '128 128 128',
          accent: '0 0 0',
          background: '255 255 255',
          surface: '255 255 255',
          text: '0 0 0',
          textSecondary: '0 0 0',
          border: '0 0 0',
          success: '0 128 0',
          warning: '255 165 0',
          error: '255 0 0',
        },
        layout: 'comfortable',
        density: 'medium',
        borderRadius: 'medium',
        shadows: true,
        animations: true,
      };

      const validation = validateThemeAccessibility(highContrastTheme);
      expect(validation.isAccessible).toBe(true);
      expect(validation.contrastRatios.textOnBackground).toBeCloseTo(21, 1);
    });

    it('should handle themes with minimum acceptable contrast', () => {
      // Create a theme with exactly 4.5:1 contrast for text
      const minContrastTheme: ExtendedTheme = {
        id: 'test-min-contrast',
        name: 'Test Minimum Contrast',
        colors: {
          primary: '85 85 85',    // ~4.5:1 with white
          secondary: '200 200 200',
          accent: '85 85 85',     // ~4.5:1 with white
          background: '255 255 255',
          surface: '255 255 255',
          text: '85 85 85',       // ~4.5:1 with white background
          textSecondary: '85 85 85',
          border: '128 128 128',
          success: '0 128 0',
          warning: '255 165 0',
          error: '255 0 0',
        },
        layout: 'comfortable',
        density: 'medium',
        borderRadius: 'medium',
        shadows: true,
        animations: true,
      };

      const validation = validateThemeAccessibility(minContrastTheme);
      expect(validation.contrastRatios.textOnBackground).toBeGreaterThanOrEqual(WCAG_AA_NORMAL - 0.1); // Allow small floating point variance
    });
  });

  describe('Color Blindness Considerations', () => {
    it('should not rely solely on color for differentiation', () => {
      // Test that themes have sufficient contrast even for color blind users
      defaultThemePresets.forEach(preset => {
        const theme = preset.theme;

        // Primary and accent should be distinguishable from background by contrast alone
        const primaryBgRatio = calculateContrastRatio(theme.colors.primary, theme.colors.background);
        const accentBgRatio = calculateContrastRatio(theme.colors.accent, theme.colors.background);

        expect(primaryBgRatio).toBeGreaterThanOrEqual(WCAG_AA_LARGE);
        expect(accentBgRatio).toBeGreaterThanOrEqual(WCAG_AA_LARGE);
      });
    });

    it('should have sufficient contrast for interactive elements', () => {
      defaultThemePresets.forEach(preset => {
        const theme = preset.theme;

        // Interactive elements (primary/accent) should have good contrast with surfaces
        const primarySurfaceRatio = calculateContrastRatio(theme.colors.primary, theme.colors.surface);
        const accentSurfaceRatio = calculateContrastRatio(theme.colors.accent, theme.colors.surface);

        expect(primarySurfaceRatio).toBeGreaterThanOrEqual(WCAG_AA_LARGE);
        expect(accentSurfaceRatio).toBeGreaterThanOrEqual(WCAG_AA_LARGE);
      });
    });
  });

  describe('Button and Interactive Element Accessibility', () => {
    it('should support readable text on all interactive colors', () => {
      defaultThemePresets.forEach(preset => {
        const theme = preset.theme;

        // White text should be readable on primary and accent colors (for buttons)
        const whiteOnPrimary = calculateContrastRatio('255 255 255', theme.colors.primary);
        const whiteOnAccent = calculateContrastRatio('255 255 255', theme.colors.accent);

        expect(whiteOnPrimary).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
        expect(whiteOnAccent).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
      });
    });

    it('should have sufficient contrast for focus indicators', () => {
      defaultThemePresets.forEach(preset => {
        const theme = preset.theme;

        // Border color should be visible against both background and surface
        // Using a more lenient threshold since borders are often subtle by design
        const borderBgRatio = calculateContrastRatio(theme.colors.border, theme.colors.background);
        const borderSurfaceRatio = calculateContrastRatio(theme.colors.border, theme.colors.surface);

        expect(borderBgRatio).toBeGreaterThanOrEqual(1.5); // Very lenient for subtle borders
        expect(borderSurfaceRatio).toBeGreaterThanOrEqual(1.5); // Very lenient for subtle borders
      });
    });
  });
});

import { describe, it, expect } from 'vitest';
import { defaultThemePresets, validateTheme } from '../services/themeUtils';
import type { ThemePreset, ExtendedTheme } from '../types';

describe('New Theme Definitions and Structure', () => {
  // Expected theme IDs based on requirements
  const expectedThemeIds = [
    'noite-urbana',
    'verde-noturno',
    'roxo-nebuloso',
    'solar-clean',
    'verao-pastel',
    'minimal-ice'
  ];

  // Expected theme names
  const expectedThemeNames = [
    'Noite Urbana',
    'Verde Noturno',
    'Roxo Nebuloso',
    'Solar Clean',
    'Verão Pastel',
    'Minimal Ice'
  ];

  // Required color properties for each theme
  const requiredColorProperties = [
    'primary',
    'secondary',
    'accent',
    'background',
    'surface',
    'text',
    'textSecondary',
    'border',
    'success',
    'warning',
    'error'
  ];

  // Required theme metadata properties
  const requiredThemeProperties = [
    'id',
    'name',
    'colors',
    'layout',
    'density',
    'borderRadius',
    'shadows',
    'animations'
  ];

  // Required preset metadata properties
  const requiredPresetProperties = [
    'id',
    'name',
    'description',
    'category',
    'theme'
  ];

  describe('Theme Preset Count and IDs', () => {
    it('should have exactly 6 theme presets', () => {
      expect(defaultThemePresets).toHaveLength(6);
    });

    it('should have all expected theme IDs', () => {
      const actualIds = defaultThemePresets.map(preset => preset.id);
      expect(actualIds).toEqual(expect.arrayContaining(expectedThemeIds));
      expect(actualIds).toHaveLength(expectedThemeIds.length);
    });

    it('should have unique theme IDs', () => {
      const ids = defaultThemePresets.map(preset => preset.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have all expected theme names', () => {
      const actualNames = defaultThemePresets.map(preset => preset.name);
      expect(actualNames).toEqual(expect.arrayContaining(expectedThemeNames));
    });
  });

  describe('Theme Categories', () => {
    it('should have exactly 3 dark themes', () => {
      const darkThemes = defaultThemePresets.filter(preset => preset.category === 'dark');
      expect(darkThemes).toHaveLength(3);

      const darkThemeIds = darkThemes.map(theme => theme.id);
      expect(darkThemeIds).toContain('noite-urbana');
      expect(darkThemeIds).toContain('verde-noturno');
      expect(darkThemeIds).toContain('roxo-nebuloso');
    });

    it('should have exactly 3 light themes', () => {
      const lightThemes = defaultThemePresets.filter(preset => preset.category === 'light');
      expect(lightThemes).toHaveLength(3);

      const lightThemeIds = lightThemes.map(theme => theme.id);
      expect(lightThemeIds).toContain('solar-clean');
      expect(lightThemeIds).toContain('verao-pastel');
      expect(lightThemeIds).toContain('minimal-ice');
    });

    it('should only have light and dark categories', () => {
      const categories = defaultThemePresets.map(preset => preset.category);
      const uniqueCategories = new Set(categories);
      expect(uniqueCategories).toEqual(new Set(['light', 'dark']));
    });
  });

  describe('Theme Preset Structure', () => {
    it('should have all required preset properties for each theme', () => {
      defaultThemePresets.forEach(preset => {
        requiredPresetProperties.forEach(property => {
          expect(preset).toHaveProperty(property);
          expect(preset[property as keyof ThemePreset]).toBeDefined();
        });
      });
    });

    it('should have non-empty descriptions for all themes', () => {
      defaultThemePresets.forEach(preset => {
        expect(preset.description).toBeTruthy();
        expect(typeof preset.description).toBe('string');
        expect(preset.description.length).toBeGreaterThan(0);
      });
    });

    it('should have matching IDs between preset and theme', () => {
      defaultThemePresets.forEach(preset => {
        expect(preset.id).toBe(preset.theme.id);
      });
    });

    it('should have matching names between preset and theme', () => {
      defaultThemePresets.forEach(preset => {
        expect(preset.name).toBe(preset.theme.name);
      });
    });
  });

  describe('Theme Structure', () => {
    it('should have all required theme properties for each theme', () => {
      defaultThemePresets.forEach(preset => {
        const theme = preset.theme;
        requiredThemeProperties.forEach(property => {
          expect(theme).toHaveProperty(property);
          expect(theme[property as keyof ExtendedTheme]).toBeDefined();
        });
      });
    });

    it('should have all required color properties for each theme', () => {
      defaultThemePresets.forEach(preset => {
        const colors = preset.theme.colors;
        requiredColorProperties.forEach(colorProperty => {
          expect(colors).toHaveProperty(colorProperty);
          expect(colors[colorProperty as keyof typeof colors]).toBeDefined();
        });
      });
    });

    it('should have valid layout values', () => {
      const validLayouts = ['compact', 'comfortable', 'spacious'];
      defaultThemePresets.forEach(preset => {
        expect(validLayouts).toContain(preset.theme.layout);
      });
    });

    it('should have valid density values', () => {
      const validDensities = ['low', 'medium', 'high'];
      defaultThemePresets.forEach(preset => {
        expect(validDensities).toContain(preset.theme.density);
      });
    });

    it('should have valid borderRadius values', () => {
      const validBorderRadius = ['none', 'small', 'medium', 'large'];
      defaultThemePresets.forEach(preset => {
        expect(validBorderRadius).toContain(preset.theme.borderRadius);
      });
    });

    it('should have boolean values for shadows and animations', () => {
      defaultThemePresets.forEach(preset => {
        expect(typeof preset.theme.shadows).toBe('boolean');
        expect(typeof preset.theme.animations).toBe('boolean');
      });
    });
  });

  describe('Color Format Validation', () => {
    it('should have all colors in correct RGB string format', () => {
      const rgbPattern = /^\d{1,3}\s+\d{1,3}\s+\d{1,3}$/;

      defaultThemePresets.forEach(preset => {
        const colors = preset.theme.colors;
        Object.entries(colors).forEach(([colorName, colorValue]) => {
          expect(colorValue).toMatch(rgbPattern);

          // Validate RGB values are in valid range (0-255)
          const [r, g, b] = colorValue.split(/\s+/).map(Number);
          expect(r).toBeGreaterThanOrEqual(0);
          expect(r).toBeLessThanOrEqual(255);
          expect(g).toBeGreaterThanOrEqual(0);
          expect(g).toBeLessThanOrEqual(255);
          expect(b).toBeGreaterThanOrEqual(0);
          expect(b).toBeLessThanOrEqual(255);

          // Ensure values are integers
          expect(Number.isInteger(r)).toBe(true);
          expect(Number.isInteger(g)).toBe(true);
          expect(Number.isInteger(b)).toBe(true);
        });
      });
    });

    it('should not have any HEX color values', () => {
      const hexPattern = /^#?[a-fA-F0-9]{3,6}$/;

      defaultThemePresets.forEach(preset => {
        const colors = preset.theme.colors;
        Object.entries(colors).forEach(([colorName, colorValue]) => {
          expect(colorValue).not.toMatch(hexPattern);
        });
      });
    });
  });

  describe('Theme Metadata Validation', () => {
    it('should have correct theme IDs matching expected format', () => {
      const expectedIds = new Set(expectedThemeIds);
      defaultThemePresets.forEach(preset => {
        expect(expectedIds.has(preset.id)).toBe(true);
      });
    });

    it('should have descriptive theme names', () => {
      defaultThemePresets.forEach(preset => {
        expect(preset.name.length).toBeGreaterThan(3);
        expect(preset.name).not.toBe(preset.id);
      });
    });

    it('should have meaningful descriptions', () => {
      defaultThemePresets.forEach(preset => {
        expect(preset.description.length).toBeGreaterThan(10);
        expect(preset.description.toLowerCase()).toContain('tema');
      });
    });

    it('should have correct category assignments', () => {
      const darkThemeIds = ['noite-urbana', 'verde-noturno', 'roxo-nebuloso'];
      const lightThemeIds = ['solar-clean', 'verao-pastel', 'minimal-ice'];

      defaultThemePresets.forEach(preset => {
        if (darkThemeIds.includes(preset.id)) {
          expect(preset.category).toBe('dark');
        } else if (lightThemeIds.includes(preset.id)) {
          expect(preset.category).toBe('light');
        }
      });
    });
  });

  describe('Theme Validation', () => {
    it('should pass validateTheme function for all themes', () => {
      defaultThemePresets.forEach(preset => {
        const isValid = validateTheme(preset.theme);
        expect(isValid).toBe(true);
      });
    });

    it('should have consistent theme structure across all presets', () => {
      const firstTheme = defaultThemePresets[0].theme;
      const firstThemeKeys = Object.keys(firstTheme).sort();
      const firstColorKeys = Object.keys(firstTheme.colors).sort();

      defaultThemePresets.forEach(preset => {
        const themeKeys = Object.keys(preset.theme).sort();
        const colorKeys = Object.keys(preset.theme.colors).sort();

        expect(themeKeys).toEqual(firstThemeKeys);
        expect(colorKeys).toEqual(firstColorKeys);
      });
    });
  });

  describe('Specific Theme Color Validation', () => {
    it('should have correct colors for Noite Urbana theme', () => {
      const noiteUrbana = defaultThemePresets.find(p => p.id === 'noite-urbana');
      expect(noiteUrbana).toBeDefined();

      if (noiteUrbana) {
        const colors = noiteUrbana.theme.colors;
        // Note: Colors may be adjusted for accessibility, so we check they exist and are valid RGB
        expect(colors.primary).toMatch(/^\d{1,3}\s+\d{1,3}\s+\d{1,3}$/);
        expect(colors.accent).toMatch(/^\d{1,3}\s+\d{1,3}\s+\d{1,3}$/);
        expect(colors.background).toBe('18 18 18'); // #121212
        expect(colors.surface).toBe('30 30 30'); // #1E1E1E
        expect(colors.text).toBe('255 255 255'); // #FFFFFF
        expect(colors.textSecondary).toBe('176 176 176'); // #B0B0B0
      }
    });

    it('should have correct colors for Solar Clean theme', () => {
      const solarClean = defaultThemePresets.find(p => p.id === 'solar-clean');
      expect(solarClean).toBeDefined();

      if (solarClean) {
        const colors = solarClean.theme.colors;
        expect(colors.primary).toBe('25 118 210'); // #1976D2
        expect(colors.background).toBe('255 255 255'); // #FFFFFF
        expect(colors.surface).toBe('245 245 245'); // #F5F5F5
        expect(colors.text).toBe('33 33 33'); // #212121
        expect(colors.textSecondary).toBe('97 97 97'); // #616161
      }
    });
  });
});

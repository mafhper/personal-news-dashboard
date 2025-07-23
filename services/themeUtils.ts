import type { ExtendedTheme, ThemePreset, ThemeSettings } from '../types';

// Default theme presets
export const defaultThemePresets: ThemePreset[] = [
  {
    id: 'dark-default',
    name: 'Dark Default',
    description: 'Classic dark theme with teal accents',
    category: 'dark',
    theme: {
      id: 'dark-default',
      name: 'Dark Default',
      colors: {
        primary: '20 184 166', // teal-500
        secondary: '45 55 72', // gray-700
        accent: '20 184 166', // teal-500
        background: '26 32 44', // gray-800
        surface: '45 55 72', // gray-700
        text: '247 250 252', // gray-100
        textSecondary: '160 174 192', // gray-400
        border: '75 85 99', // gray-600
        success: '16 185 129', // emerald-500
        warning: '245 158 11', // amber-500
        error: '239 68 68', // red-500
      },
      layout: 'comfortable',
      density: 'medium',
      borderRadius: 'medium',
      shadows: true,
      animations: true,
    },
  },
  {
    id: 'light-clean',
    name: 'Light Clean',
    description: 'Clean light theme with blue accents',
    category: 'light',
    theme: {
      id: 'light-clean',
      name: 'Light Clean',
      colors: {
        primary: '59 130 246', // blue-500
        secondary: '229 231 235', // gray-200
        accent: '59 130 246', // blue-500
        background: '255 255 255', // white
        surface: '249 250 251', // gray-50
        text: '17 24 39', // gray-900
        textSecondary: '107 114 128', // gray-500
        border: '209 213 219', // gray-300
        success: '34 197 94', // green-500
        warning: '251 191 36', // yellow-400
        error: '239 68 68', // red-500
      },
      layout: 'comfortable',
      density: 'medium',
      borderRadius: 'medium',
      shadows: true,
      animations: true,
    },
  },
  {
    id: 'purple-vibrant',
    name: 'Purple Vibrant',
    description: 'Vibrant dark theme with purple accents',
    category: 'colorful',
    theme: {
      id: 'purple-vibrant',
      name: 'Purple Vibrant',
      colors: {
        primary: '168 85 247', // purple-500
        secondary: '55 48 163', // indigo-700
        accent: '168 85 247', // purple-500
        background: '30 27 75', // indigo-900
        surface: '55 48 163', // indigo-700
        text: '255 255 255', // white
        textSecondary: '196 181 253', // purple-200
        border: '124 58 237', // purple-600
        success: '34 197 94', // green-500
        warning: '251 191 36', // yellow-400
        error: '248 113 113', // red-400
      },
      layout: 'comfortable',
      density: 'medium',
      borderRadius: 'large',
      shadows: true,
      animations: true,
    },
  },
  {
    id: 'minimal-mono',
    name: 'Minimal Mono',
    description: 'Minimalist monochrome theme',
    category: 'minimal',
    theme: {
      id: 'minimal-mono',
      name: 'Minimal Mono',
      colors: {
        primary: '75 85 99', // gray-600
        secondary: '229 231 235', // gray-200
        accent: '17 24 39', // gray-900
        background: '255 255 255', // white
        surface: '255 255 255', // white
        text: '17 24 39', // gray-900
        textSecondary: '107 114 128', // gray-500
        border: '229 231 235', // gray-200
        success: '75 85 99', // gray-600
        warning: '75 85 99', // gray-600
        error: '75 85 99', // gray-600
      },
      layout: 'compact',
      density: 'low',
      borderRadius: 'none',
      shadows: false,
      animations: false,
    },
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    description: 'Deep ocean theme with blue gradients',
    category: 'colorful',
    theme: {
      id: 'ocean-blue',
      name: 'Ocean Blue',
      colors: {
        primary: '59 130 246', // blue-500
        secondary: '30 58 138', // blue-800
        accent: '147 197 253', // blue-300
        background: '15 23 42', // slate-900
        surface: '30 41 59', // slate-800
        text: '248 250 252', // slate-50
        textSecondary: '148 163 184', // slate-400
        border: '71 85 105', // slate-600
        success: '6 182 212', // cyan-500
        warning: '251 191 36', // yellow-400
        error: '239 68 68', // red-500
      },
      layout: 'comfortable',
      density: 'medium',
      borderRadius: 'medium',
      shadows: true,
      animations: true,
    },
  },
  {
    id: 'forest-green',
    name: 'Forest Green',
    description: 'Natural forest theme with green tones',
    category: 'colorful',
    theme: {
      id: 'forest-green',
      name: 'Forest Green',
      colors: {
        primary: '34 197 94', // green-500
        secondary: '22 101 52', // green-800
        accent: '74 222 128', // green-400
        background: '20 83 45', // green-900
        surface: '22 101 52', // green-800
        text: '240 253 244', // green-50
        textSecondary: '134 239 172', // green-300
        border: '34 197 94', // green-500
        success: '74 222 128', // green-400
        warning: '251 191 36', // yellow-400
        error: '248 113 113', // red-400
      },
      layout: 'comfortable',
      density: 'medium',
      borderRadius: 'medium',
      shadows: true,
      animations: true,
    },
  },
];

// Default theme settings
export const defaultThemeSettings: ThemeSettings = {
  currentTheme: defaultThemePresets[0].theme,
  customThemes: [],
  autoDetectSystemTheme: true,
  systemThemeOverride: null,
  themeTransitions: true,
};

// Theme validation utilities
export const validateTheme = (theme: Partial<ExtendedTheme>): boolean => {
  const requiredFields = ['id', 'name', 'colors', 'layout', 'density', 'borderRadius'];
  const requiredColors = [
    'primary', 'secondary', 'accent', 'background', 'surface',
    'text', 'textSecondary', 'border', 'success', 'warning', 'error'
  ];

  // Check required fields
  for (const field of requiredFields) {
    if (!(field in theme)) {
      console.warn(`Theme validation failed: missing field "${field}"`);
      return false;
    }
  }

  // Check required colors
  if (theme.colors) {
    for (const color of requiredColors) {
      if (!(color in theme.colors)) {
        console.warn(`Theme validation failed: missing color "${color}"`);
        return false;
      }
    }
  }

  // Validate RGB color format
  if (theme.colors) {
    for (const [colorName, colorValue] of Object.entries(theme.colors)) {
      if (!isValidRGBString(colorValue)) {
        console.warn(`Theme validation failed: invalid RGB format for color "${colorName}": "${colorValue}"`);
        return false;
      }
    }
  }

  return true;
};

// Check if a string is a valid RGB format (e.g., "255 255 255")
const isValidRGBString = (rgb: string): boolean => {
  const rgbPattern = /^\d{1,3}\s+\d{1,3}\s+\d{1,3}$/;
  if (!rgbPattern.test(rgb)) return false;

  const values = rgb.split(/\s+/).map(Number);
  return values.every(val => val >= 0 && val <= 255);
};

// Theme migration utilities
export const migrateTheme = (oldTheme: any, _version: string = '1.0'): ExtendedTheme | null => {
  try {
    // Handle migration from old theme format
    if (typeof oldTheme === 'string') {
      // Old format was just RGB string
      return createThemeFromAccentColor(oldTheme, 'Migrated Theme');
    }

    // If it's already in new format, validate and return
    if (validateTheme(oldTheme)) {
      return oldTheme as ExtendedTheme;
    }

    // Try to extract accent color and create new theme
    if (oldTheme.colors?.accent || oldTheme.accent) {
      const accentColor = oldTheme.colors?.accent || oldTheme.accent;
      return createThemeFromAccentColor(accentColor, oldTheme.name || 'Migrated Theme');
    }

    return null;
  } catch (error) {
    console.error('Theme migration failed:', error);
    return null;
  }
};

// Create a theme from a single accent color
export const createThemeFromAccentColor = (accentColor: string, name: string): ExtendedTheme => {
  // Parse RGB values
  const rgbValues = accentColor.split(/\s+/).map(Number);
  const [r, g, b] = rgbValues;

  // Generate complementary colors based on accent
  const isDark = (r * 0.299 + g * 0.587 + b * 0.114) < 128;

  return {
    id: `custom-${Date.now()}`,
    name,
    colors: {
      primary: accentColor,
      secondary: isDark ? '45 55 72' : '229 231 235',
      accent: accentColor,
      background: isDark ? '26 32 44' : '255 255 255',
      surface: isDark ? '45 55 72' : '249 250 251',
      text: isDark ? '247 250 252' : '17 24 39',
      textSecondary: isDark ? '160 174 192' : '107 114 128',
      border: isDark ? '75 85 99' : '209 213 219',
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
};

// Apply theme to CSS custom properties
export const applyThemeToDOM = (theme: ExtendedTheme): void => {
  const root = document.documentElement;

  // Apply color variables
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });

  // Apply layout variables
  const layoutSpacing = {
    compact: { padding: '0.5rem', gap: '0.5rem' },
    comfortable: { padding: '1rem', gap: '1rem' },
    spacious: { padding: '1.5rem', gap: '1.5rem' },
  };

  const spacing = layoutSpacing[theme.layout];
  root.style.setProperty('--layout-padding', spacing.padding);
  root.style.setProperty('--layout-gap', spacing.gap);

  // Apply density variables
  const densityValues = {
    low: { fontSize: '0.875rem', lineHeight: '1.25rem' },
    medium: { fontSize: '1rem', lineHeight: '1.5rem' },
    high: { fontSize: '1.125rem', lineHeight: '1.75rem' },
  };

  const density = densityValues[theme.density];
  root.style.setProperty('--density-font-size', density.fontSize);
  root.style.setProperty('--density-line-height', density.lineHeight);

  // Apply border radius
  const borderRadiusValues = {
    none: '0',
    small: '0.25rem',
    medium: '0.5rem',
    large: '1rem',
  };

  root.style.setProperty('--border-radius', borderRadiusValues[theme.borderRadius]);

  // Apply shadow and animation preferences
  root.style.setProperty('--shadows-enabled', theme.shadows ? '1' : '0');
  root.style.setProperty('--animations-enabled', theme.animations ? '1' : '0');

  // Set transition duration based on animation preference
  root.style.setProperty('--transition-duration', theme.animations ? '0.2s' : '0s');
};

// Get system theme preference
export const getSystemThemePreference = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark'; // Default fallback
};

// Find best matching preset for system preference
export const getSystemMatchingTheme = (preference: 'light' | 'dark'): ExtendedTheme => {
  const matchingPresets = defaultThemePresets.filter(preset =>
    preset.category === preference ||
    (preference === 'dark' && preset.category === 'colorful')
  );

  return matchingPresets.length > 0
    ? matchingPresets[0].theme
    : defaultThemePresets[0].theme;
};

// Export/Import utilities
export const exportTheme = (theme: ExtendedTheme): string => {
  return JSON.stringify(theme, null, 2);
};

export const importTheme = (themeJson: string): ExtendedTheme | null => {
  try {
    const theme = JSON.parse(themeJson);
    if (validateTheme(theme)) {
      return theme as ExtendedTheme;
    }
    return null;
  } catch (error) {
    console.error('Failed to import theme:', error);
    return null;
  }
};

# Implementation Plan

- [x] 1. Create color conversion utility function

  - Implement hexToRgb function to convert HEX colors to RGB string format
  - Add validation for HEX color format
  - Create unit tests for color conversion accuracy
  - _Requirements: 1.2, 2.2, 2.3, 2.4_

- [x] 2. Define the 6 new theme presets with exact colors

  - [x] 2.1 Create dark theme definitions

    - Implement Noite Urbana theme with Primary #1E88E5, Accent #FFC107, Background #121212, Surface #1E1E1E, Text #FFFFFF, Secondary Text #B0B0B0
    - Implement Verde Noturno theme with Primary #43A047, Accent #FDD835, Background #0D0D0D, Surface #1B1F1D, Text #F1F1F1, Secondary Text #A8A8A8
    - Implement Roxo Nebuloso theme with Primary #8E24AA, Accent #FF4081, Background #101014, Surface #1A1A23, Text #E0E0E0, Secondary Text #9C9C9C
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 2.2 Create light theme definitions
    - Implement Solar Clean theme with Primary #1976D2, Accent #F4511E, Background #FFFFFF, Surface #F5F5F5, Text #212121, Secondary Text #616161
    - Implement Verão Pastel theme with Primary #EC407A, Accent #7E57C2, Background #FFF8F0, Surface #FFFFFF, Text #212121, Secondary Text #757575
    - Implement Minimal Ice theme with Primary #00ACC1, Accent #FF7043, Background #F0F4F8, Surface #FFFFFF, Text #1C1C1C, Secondary Text #5E5E5E
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 3. Update themeUtils.ts with new theme presets

  - Replace existing defaultThemePresets array with the 6 new themes
  - Set Solar Clean as the default theme in defaultThemeSettings
  - Ensure all themes include standard success, warning, and error colors
  - _Requirements: 1.1, 2.1, 5.1, 5.2_

- [x] 4. Update ThemeCustomizer component for new theme selection

  - Remove custom color picker functionality to focus on presets only
  - Organize theme options by category (dark themes and light themes)
  - Add theme descriptions and color previews for better user experience
  - Update theme selection UI to display the 6 new theme options
  - _Requirements: 1.1, 2.1, 3.1, 5.1_

- [x] 5. Implement theme validation and accessibility checks

  - Add contrast ratio validation for all 6 themes against WCAG AA standards
  - Implement automatic accessibility fixes if contrast ratios are insufficient
  - Create validation tests to ensure all themes meet 4.5:1 contrast for text and 3:1 for interactive elements
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 6. Update CSS custom properties integration

  - Verify that applyThemeToDOM function correctly applies all new theme colors
  - Test CSS variable updates for primary, accent, background, surface, text, and textSecondary colors
  - Ensure smooth transitions between theme changes
  - _Requirements: 3.1, 3.2, 5.1, 5.3_

- [-] 7. Create comprehensive unit tests for new themes

  - [x] 7.1 Test theme definitions and structure

    - Write tests to validate each theme has all required color properties
    - Test that all colors are in correct RGB string format
    - Verify theme metadata (id, name, category) is correct
    - _Requirements: 6.1_

  - [x] 7.2 Test color conversion functionality

    - Test hexToRgb function with all theme colors
    - Validate RGB output format and value ranges
    - Test error handling for invalid HEX inputs
    - _Requirements: 6.1_

  - [x] 7.3 Test accessibility compliance
    - Test contrast ratios for text on background for all 6 themes
    - Test contrast ratios for text on surface for all 6 themes
    - Test accent color visibility against backgrounds
    - Verify all themes meet WCAG AA standards
    - _Requirements: 4.1, 4.2, 6.2_

- [ ] 8. Create integration tests for theme application

  - Test theme switching functionality between all 6 themes
  - Test localStorage persistence of theme selection
  - Test that theme changes apply to all components (Header, ArticleList, Modal, etc.)
  - Verify CSS custom properties are updated correctly on theme change
  - _Requirements: 3.1, 3.2, 3.3, 5.1, 5.2, 6.3_

- [ ] 9. Update existing tests to work with new themes

  - Update any hardcoded theme references in existing tests
  - Modify theme-related test expectations to match new theme structure
  - Ensure all existing functionality continues to work with new themes
  - _Requirements: 5.2, 6.1, 6.3_

- [ ] 10. Verify component compatibility and visual consistency
  - Test all UI components render correctly with each of the 6 themes
  - Verify button styles, link colors, and interactive elements use theme colors properly
  - Test modal dialogs, form inputs, and other UI elements maintain consistency
  - Ensure responsive design works correctly with all themes
  - _Requirements: 5.1, 5.2, 5.3_

import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { AdaptiveLayoutConfig, LayoutBreakpoint } from '../types';

// Default breakpoint configurations
const defaultBreakpoints: LayoutBreakpoint[] = [
  {
    name: 'mobile',
    minWidth: 0,
    maxWidth: 767,
    columns: 1,
    gap: '1rem',
    padding: '0.75rem',
    fontSize: '0.875rem',
    lineHeight: '1.25rem'
  },
  {
    name: 'tablet',
    minWidth: 768,
    maxWidth: 1023,
    columns: 2,
    gap: '1.5rem',
    padding: '1rem',
    fontSize: '1rem',
    lineHeight: '1.5rem'
  },
  {
    name: 'desktop',
    minWidth: 1024,
    maxWidth: 1279,
    columns: 3,
    gap: '2rem',
    padding: '1.5rem',
    fontSize: '1rem',
    lineHeight: '1.5rem'
  },
  {
    name: 'large',
    minWidth: 1280,
    maxWidth: 1535,
    columns: 3,
    gap: '2.5rem',
    padding: '2rem',
    fontSize: '1.125rem',
    lineHeight: '1.75rem'
  },
  {
    name: 'xlarge',
    minWidth: 1536,
    columns: 4,
    gap: '3rem',
    padding: '2.5rem',
    fontSize: '1.125rem',
    lineHeight: '1.75rem'
  }
];

const defaultAdaptiveLayoutConfig: AdaptiveLayoutConfig = {
  breakpoints: defaultBreakpoints,
  containerQueries: true,
  fluidTypography: true,
  responsiveImages: true,
  adaptiveGrid: true
};

export const useAdaptiveLayout = () => {
  const [layoutConfig, setLayoutConfig] = useLocalStorage<AdaptiveLayoutConfig>(
    'adaptive-layout-config',
    defaultAdaptiveLayoutConfig
  );

  const [currentBreakpoint, setCurrentBreakpoint] = useState<LayoutBreakpoint>(
    defaultBreakpoints[0]
  );
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  // Update window width and current breakpoint
  const updateBreakpoint = useCallback(() => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    setWindowWidth(width);

    const matchingBreakpoint = layoutConfig.breakpoints.find(bp => {
      if (bp.maxWidth) {
        return width >= bp.minWidth && width <= bp.maxWidth;
      }
      return width >= bp.minWidth;
    });

    if (matchingBreakpoint) {
      setCurrentBreakpoint(matchingBreakpoint);
    }
  }, [layoutConfig.breakpoints]);

  // Listen for window resize
  useEffect(() => {
    if (typeof window === 'undefined') return;

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, [updateBreakpoint]);

  // Apply CSS custom properties for current breakpoint
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    root.style.setProperty('--adaptive-columns', currentBreakpoint.columns.toString());
    root.style.setProperty('--adaptive-gap', currentBreakpoint.gap);
    root.style.setProperty('--adaptive-padding', currentBreakpoint.padding);
    root.style.setProperty('--adaptive-font-size', currentBreakpoint.fontSize);
    root.style.setProperty('--adaptive-line-height', currentBreakpoint.lineHeight);
  }, [currentBreakpoint]);

  // Layout preset functions
  const applyLayoutPreset = useCallback((preset: 'compact' | 'comfortable' | 'spacious') => {
    const presetConfigs = {
      compact: {
        ...layoutConfig,
        breakpoints: layoutConfig.breakpoints.map(bp => ({
          ...bp,
          gap: `${parseFloat(bp.gap) * 0.75}rem`,
          padding: `${parseFloat(bp.padding) * 0.75}rem`,
          fontSize: `${parseFloat(bp.fontSize) * 0.9}rem`
        }))
      },
      comfortable: {
        ...layoutConfig,
        breakpoints: defaultBreakpoints
      },
      spacious: {
        ...layoutConfig,
        breakpoints: layoutConfig.breakpoints.map(bp => ({
          ...bp,
          gap: `${parseFloat(bp.gap) * 1.25}rem`,
          padding: `${parseFloat(bp.padding) * 1.25}rem`,
          fontSize: `${parseFloat(bp.fontSize) * 1.1}rem`
        }))
      }
    };

    setLayoutConfig(presetConfigs[preset]);
  }, [layoutConfig, setLayoutConfig]);

  // Container query support
  const getContainerQueryClasses = useCallback((element: 'article' | 'sidebar' | 'header') => {
    if (!layoutConfig.containerQueries) return '';

    const baseClasses = {
      article: 'container-article',
      sidebar: 'container-sidebar',
      header: 'container-header'
    };

    return `${baseClasses[element]} adaptive-container`;
  }, [layoutConfig.containerQueries]);

  // Responsive grid classes
  const getGridClasses = useCallback(() => {
    if (!layoutConfig.adaptiveGrid) return 'grid';

    return `grid adaptive-grid grid-cols-1 md:grid-cols-${Math.min(currentBreakpoint.columns, 2)} xl:grid-cols-${currentBreakpoint.columns}`;
  }, [layoutConfig.adaptiveGrid, currentBreakpoint.columns]);

  // Fluid typography classes
  const getTypographyClasses = useCallback((variant: 'body' | 'heading' | 'caption') => {
    if (!layoutConfig.fluidTypography) return '';

    const variants = {
      body: 'text-adaptive-body',
      heading: 'text-adaptive-heading',
      caption: 'text-adaptive-caption'
    };

    return variants[variant];
  }, [layoutConfig.fluidTypography]);

  // Responsive image classes
  const getImageClasses = useCallback(() => {
    if (!layoutConfig.responsiveImages) return '';
    return 'responsive-image adaptive-image';
  }, [layoutConfig.responsiveImages]);

  // Update layout configuration
  const updateLayoutConfig = useCallback((updates: Partial<AdaptiveLayoutConfig>) => {
    setLayoutConfig(prev => ({ ...prev, ...updates }));
  }, [setLayoutConfig]);

  // Reset to defaults
  const resetLayoutConfig = useCallback(() => {
    setLayoutConfig(defaultAdaptiveLayoutConfig);
  }, [setLayoutConfig]);

  // Get layout info for debugging
  const getLayoutInfo = useCallback(() => {
    return {
      currentBreakpoint: currentBreakpoint.name,
      windowWidth,
      columns: currentBreakpoint.columns,
      gap: currentBreakpoint.gap,
      padding: currentBreakpoint.padding,
      fontSize: currentBreakpoint.fontSize
    };
  }, [currentBreakpoint, windowWidth]);

  return {
    // Current state
    layoutConfig,
    currentBreakpoint,
    windowWidth,

    // Layout utilities
    applyLayoutPreset,
    getContainerQueryClasses,
    getGridClasses,
    getTypographyClasses,
    getImageClasses,

    // Configuration management
    updateLayoutConfig,
    resetLayoutConfig,

    // Debug utilities
    getLayoutInfo
  };
};

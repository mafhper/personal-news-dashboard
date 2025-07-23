# Technology Stack

## Core Technologies

- **React 19.1.0**: UI framework with modern hooks and functional components
- **TypeScript 5.8.3**: Type-safe JavaScript with strict configuration
- **Vite 7.0.0**: Build tool and dev server
- **Tailwind CSS 4.1.11**: Utility-first CSS framework with PostCSS integration

## Build System

### Development Commands

```bash
npm start          # Start development server with hot reload
npm run build      # Production build (TypeScript compilation + Vite build)
npm run preview    # Serve production build locally
```

### Build Process

1. TypeScript compilation with strict type checking
2. Vite bundling with ES2020 target
3. Tailwind CSS processing via PostCSS
4. Output to `dist/` directory

## Key Dependencies

- **External APIs**:
  - RSS2JSON API for RSS feed parsing (handles CORS)
  - Open-Meteo API for weather data
- **No state management libraries**: Uses React hooks and localStorage
- **No routing**: Single-page application

## Environment Configuration

- **Gemini API Key**: Configured via environment variables in Vite config
- **Path Aliases**: `@/*` maps to project root
- **Module System**: ES modules with bundler resolution

## Browser Compatibility

- **Target**: Modern browsers supporting ES2020
- **PWA Features**: Service worker ready for offline capabilities
- **Local Storage**: Primary data persistence mechanism

## Development Notes

- **CORS Handling**: RSS feeds accessed via RSS2JSON proxy service
- **Error Handling**: Graceful degradation for failed feed fetches
- **Caching**: 15-minute cache duration for RSS articles
- **Performance**: Pagination (6 articles per page) for large feeds

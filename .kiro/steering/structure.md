# Project Structure

## Root Level Organization

```
├── App.tsx              # Main application component with state management
├── index.tsx            # React app entry point
├── types.ts             # Global TypeScript type definitions
├── index.css            # Global styles and CSS custom properties
├── index.html           # HTML template
└── dist/                # Production build output
```

## Component Architecture

```
components/
├── Header.tsx           # Top navigation with pagination and controls
├── FeedContent.tsx      # Main content area for articles
├── ArticleList.tsx      # Article grid/list display
├── ArticleItem.tsx      # Individual article card
├── FeaturedArticle.tsx  # Highlighted article component
├── FeedManager.tsx      # RSS feed management interface
├── SettingsModal.tsx    # User preferences modal
├── Modal.tsx            # Reusable modal wrapper
├── Clock.tsx            # Time display widget
├── WeatherWidget.tsx    # Weather information display
├── ThemeSelector.tsx    # Theme color picker
└── BackgroundSelector.tsx # Background image selector
```

## Services Layer

```
services/
├── rssParser.ts         # RSS feed fetching and parsing logic
└── weatherService.ts    # Weather API integration
```

## Hooks

```
hooks/
└── useLocalStorage.ts   # Custom hook for localStorage persistence
```

## Configuration Files

- **package.json**: Dependencies and npm scripts
- **tsconfig.json**: TypeScript configuration with strict settings
- **vite.config.ts**: Build tool configuration with aliases
- **service-worker.js**: PWA offline capabilities

## Architectural Patterns

### State Management

- **Local State**: React useState for component-specific state
- **Persistent State**: useLocalStorage hook for data that survives page reloads
- **No Global State**: All state managed at component level or via props

### Component Patterns

- **Functional Components**: All components use function syntax with hooks
- **Props Interface**: Each component has typed props interface
- **Event Handlers**: Callback props for parent-child communication

### Data Flow

- **Top-Down**: State flows from App.tsx to child components
- **Event Bubbling**: User actions bubble up via callback props
- **Local Persistence**: Critical data automatically synced to localStorage

### File Naming

- **Components**: PascalCase (e.g., `ArticleItem.tsx`)
- **Services**: camelCase (e.g., `rssParser.ts`)
- **Types**: Defined in `types.ts` with descriptive interface names
- **Hooks**: Prefixed with `use` (e.g., `useLocalStorage.ts`)

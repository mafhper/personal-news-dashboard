# Development Setup Guide

## Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- Git

## Environment Setup

### 1. Clone and Install

```bash
git clone https://github.com/mafhper/personal-news-dashboard.git
cd personal-news-dashboard
npm install
```

### 2. Development Scripts

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Preview production build
npm run preview
```

### 3. Environment Variables

The application uses Vite for environment variable management. Create a `.env.local` file for local development:

```env
# Optional: Gemini API key for enhanced features
VITE_GEMINI_API_KEY=your_api_key_here
```

### 4. IDE Configuration

#### VS Code (Recommended)

Install recommended extensions:

- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- ES7+ React/Redux/React-Native snippets
- Auto Rename Tag
- Bracket Pair Colorizer

#### Settings

The project includes `.vscode/settings.json` with recommended settings.

## Development Workflow

### 1. Code Style

- Use TypeScript strict mode
- Follow React functional component patterns
- Use Tailwind CSS for styling
- Implement proper error boundaries
- Write comprehensive tests

### 2. Component Structure

```typescript
// Component template
import React from 'react';
import { ComponentProps } from './types';

interface Props extends ComponentProps {
  // Component-specific props
}

export const ComponentName: React.FC<Props> = ({
  // Props destructuring
}) => {
  // Component logic

  return (
    // JSX
  );
};
```

### 3. Testing

- Write unit tests for utilities and hooks
- Write integration tests for components
- Use React Testing Library for component testing
- Maintain high test coverage

### 4. Performance

- Use React.memo for expensive components
- Implement lazy loading for large lists
- Use proper dependency arrays in hooks
- Monitor bundle size

## Architecture Overview

### State Management

- Local component state with useState
- Global state with React Context
- Persistent state with localStorage hooks

### Data Flow

- Props down, events up pattern
- Context for global state
- Custom hooks for business logic

### Error Handling

- Error boundaries for component errors
- Try-catch for async operations
- User-friendly error messages
- Automatic error recovery

## Common Issues

### CORS Issues

The application uses RSS2JSON proxy to handle CORS issues with RSS feeds.

### Build Issues

- Clear node_modules and reinstall if build fails
- Check TypeScript errors in the console
- Ensure all dependencies are up to date

### Performance Issues

- Use React DevTools Profiler
- Check for unnecessary re-renders
- Monitor network requests

## Debugging

### Browser DevTools

- Use React Developer Tools
- Monitor network requests
- Check console for errors

### VS Code Debugging

- Use built-in debugger for Node.js scripts
- Set breakpoints in TypeScript files
- Use debug console for testing

## Deployment

### Production Build

```bash
npm run build
```

### Static Hosting

The built application can be deployed to any static hosting service:

- Vercel
- Netlify
- GitHub Pages
- AWS S3

### PWA Features

The application includes service worker for offline functionality.

## Contributing

1. Create feature branch from main
2. Make changes with proper tests
3. Ensure all tests pass
4. Submit pull request with description

### Commit Messages

Use conventional commit format:

- `feat:` new features
- `fix:` bug fixes
- `docs:` documentation changes
- `style:` formatting changes
- `refactor:` code refactoring
- `test:` test changes
- `chore:` maintenance tasks

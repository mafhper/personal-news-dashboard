# Design Document

## Overview

Este documento descreve o design para corrigir os problemas de paginação e otimizar o desempenho de primeira carga do Personal News Dashboard. A análise do código atual revelou problemas específicos na lógica de paginação e oportunidades de melhoria no carregamento inicial dos feeds RSS.

## Architecture

### Current System Analysis

#### Pagination Issues Identified

1. **State Management**: O estado `currentPage` é resetado desnecessariamente em múltiplos useEffect
2. **Event Handling**: Logs mostram que `onPageChange` é chamado mas o estado não atualiza consistentemente
3. **URL Persistence**: Não há persistência da página atual na URL
4. **Component Re-renders**: Múltiplos re-renders causam perda de estado

#### Performance Issues Identified

1. **Sequential Feed Loading**: Feeds são carregados sequencialmente via Promise.all sem timeout individual
2. **Cache Strategy**: Cache atual é muito simples e não otimiza primeira carga
3. **No Progressive Loading**: Usuário espera todos os feeds carregarem antes de ver qualquer conteúdo
4. **No Error Resilience**: Se um feed falha, pode afetar o carregamento de outros

### New Architecture Design

#### Enhanced Pagination System

```typescript
interface PaginationState {
  currentPage: number;
  totalPages: number;
  articlesPerPage: number;
  isNavigating: boolean;
}

interface PaginationContext {
  state: PaginationState;
  actions: {
    setPage: (page: number) => void;
    nextPage: () => void;
    prevPage: () => void;
    resetPagination: () => void;
  };
}
```

#### Optimized Feed Loading System

```typescript
interface FeedLoadingState {
  status: "idle" | "loading" | "success" | "error";
  progress: number;
  loadedFeeds: number;
  totalFeeds: number;
  errors: FeedError[];
}

interface FeedError {
  url: string;
  error: string;
  timestamp: number;
}
```

## Components and Interfaces

### Enhanced Pagination Hook

```typescript
// hooks/usePagination.ts
export const usePagination = (
  totalItems: number,
  itemsPerPage: number = 12,
  options: {
    persistInUrl?: boolean;
    resetTriggers?: any[];
  } = {}
) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const setPage = useCallback(
    (page: number) => {
      if (page >= 0 && page < totalPages && page !== currentPage) {
        setIsNavigating(true);
        setCurrentPage(page);

        // Update URL if enabled
        if (options.persistInUrl) {
          const url = new URL(window.location.href);
          url.searchParams.set("page", (page + 1).toString());
          window.history.replaceState({}, "", url.toString());
        }

        // Reset navigation state after a brief delay
        setTimeout(() => setIsNavigating(false), 100);
      }
    },
    [currentPage, totalPages, options.persistInUrl]
  );

  const nextPage = useCallback(() => {
    setPage(currentPage + 1);
  }, [currentPage, setPage]);

  const prevPage = useCallback(() => {
    setPage(currentPage - 1);
  }, [currentPage, setPage]);

  const resetPagination = useCallback(() => {
    setPage(0);
  }, [setPage]);

  // Reset pagination when triggers change
  useEffect(() => {
    if (options.resetTriggers) {
      resetPagination();
    }
  }, options.resetTriggers);

  // Initialize from URL on mount
  useEffect(() => {
    if (options.persistInUrl) {
      const urlParams = new URLSearchParams(window.location.search);
      const pageParam = urlParams.get("page");
      if (pageParam) {
        const page = parseInt(pageParam, 10) - 1; // Convert to 0-based
        if (page >= 0 && page < totalPages) {
          setCurrentPage(page);
        }
      }
    }
  }, []);

  return {
    currentPage,
    totalPages,
    isNavigating,
    canGoNext: currentPage < totalPages - 1,
    canGoPrev: currentPage > 0,
    setPage,
    nextPage,
    prevPage,
    resetPagination,
  };
};
```

### Progressive Feed Loading Hook

```typescript
// hooks/useProgressiveFeedLoading.ts
export const useProgressiveFeedLoading = (feeds: FeedSource[]) => {
  const [loadingState, setLoadingState] = useState<FeedLoadingState>({
    status: "idle",
    progress: 0,
    loadedFeeds: 0,
    totalFeeds: feeds.length,
    errors: [],
  });

  const [articles, setArticles] = useState<Article[]>([]);
  const [feedResults, setFeedResults] = useState<Map<string, Article[]>>(
    new Map()
  );

  const loadFeedsProgressively = useCallback(
    async (forceRefresh = false) => {
      if (feeds.length === 0) {
        setArticles([]);
        return;
      }

      setLoadingState((prev) => ({ ...prev, status: "loading", progress: 0 }));

      // Check cache first
      if (!forceRefresh) {
        const cachedArticles = getCachedArticles();
        if (cachedArticles.length > 0) {
          setArticles(cachedArticles);
          setLoadingState((prev) => ({
            ...prev,
            status: "success",
            progress: 100,
          }));
          // Continue loading in background for fresh data
          loadFeedsInBackground();
          return;
        }
      }

      // Load feeds with individual timeouts and error handling
      const feedPromises = feeds.map((feed, index) =>
        loadSingleFeedWithTimeout(feed, 5000)
          .then((result) => {
            // Update progress immediately when each feed completes
            setLoadingState((prev) => ({
              ...prev,
              loadedFeeds: prev.loadedFeeds + 1,
              progress: ((prev.loadedFeeds + 1) / feeds.length) * 100,
            }));

            // Add articles to state immediately
            if (result.articles.length > 0) {
              setFeedResults(
                (prev) => new Map(prev.set(feed.url, result.articles))
              );
              updateArticlesFromFeedResults(
                (prev) => new Map(prev.set(feed.url, result.articles))
              );
            }

            return result;
          })
          .catch((error) => {
            setLoadingState((prev) => ({
              ...prev,
              loadedFeeds: prev.loadedFeeds + 1,
              progress: ((prev.loadedFeeds + 1) / feeds.length) * 100,
              errors: [
                ...prev.errors,
                { url: feed.url, error: error.message, timestamp: Date.now() },
              ],
            }));
            return { articles: [], title: feed.url };
          })
      );

      // Wait for all feeds to complete (or timeout)
      await Promise.allSettled(feedPromises);

      setLoadingState((prev) => ({ ...prev, status: "success" }));
    },
    [feeds]
  );

  const updateArticlesFromFeedResults = useCallback(
    (feedResults: Map<string, Article[]>) => {
      const allArticles = Array.from(feedResults.values())
        .flat()
        .sort(
          (a, b) =>
            new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
        );

      setArticles(allArticles);
      cacheArticles(allArticles);
    },
    []
  );

  return {
    articles,
    loadingState,
    loadFeeds: loadFeedsProgressively,
    retryFailedFeeds: () => {
      const failedUrls = loadingState.errors.map((e) => e.url);
      const failedFeeds = feeds.filter((f) => failedUrls.includes(f.url));
      // Retry logic here
    },
  };
};
```

### Enhanced RSS Parser with Timeout

```typescript
// services/enhancedRssParser.ts
export const loadSingleFeedWithTimeout = async (
  feed: FeedSource,
  timeoutMs: number = 5000
): Promise<{ articles: Article[]; title: string }> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await parseRssUrl(feed.url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error(`Feed timeout after ${timeoutMs}ms: ${feed.url}`);
    }
    throw error;
  }
};
```

### Smart Caching Strategy

```typescript
// services/smartCache.ts
interface CacheEntry {
  articles: Article[];
  timestamp: number;
  feedUrl: string;
  etag?: string;
  lastModified?: string;
}

class SmartCache {
  private cache = new Map<string, CacheEntry>();
  private readonly TTL = 15 * 60 * 1000; // 15 minutes

  get(feedUrl: string): Article[] | null {
    const entry = this.cache.get(feedUrl);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(feedUrl);
      return null;
    }

    return entry.articles;
  }

  set(feedUrl: string, articles: Article[], headers?: Headers): void {
    const entry: CacheEntry = {
      articles,
      timestamp: Date.now(),
      feedUrl,
      etag: headers?.get("etag") || undefined,
      lastModified: headers?.get("last-modified") || undefined,
    };

    this.cache.set(feedUrl, entry);
    this.persistToStorage();
  }

  getStaleWhileRevalidate(feedUrl: string): Article[] | null {
    const entry = this.cache.get(feedUrl);
    return entry ? entry.articles : null;
  }

  private persistToStorage(): void {
    try {
      const serializable = Array.from(this.cache.entries()).map(
        ([key, value]) => [
          key,
          {
            ...value,
            articles: value.articles.map((article) => ({
              ...article,
              pubDate: article.pubDate.toISOString(),
            })),
          },
        ]
      );
      localStorage.setItem("smart-feed-cache", JSON.stringify(serializable));
    } catch (error) {
      console.warn("Failed to persist cache to localStorage:", error);
    }
  }
}

export const smartCache = new SmartCache();
```

## Data Models

### Enhanced Article Interface

```typescript
interface Article {
  title: string;
  link: string;
  pubDate: Date;
  description: string;
  imageUrl?: string;
  author?: string;
  categories: string[];
  sourceTitle: string;
  // New fields for performance
  loadedAt: number;
  feedUrl: string;
  priority?: "high" | "medium" | "low";
}
```

### Feed Loading Priority System

```typescript
interface FeedSource {
  url: string;
  customTitle?: string;
  categoryId?: string;
  // New fields
  priority?: "high" | "medium" | "low";
  timeout?: number;
  retryCount?: number;
  lastSuccessful?: number;
  averageLoadTime?: number;
}
```

## Error Handling

### Resilient Feed Loading

```typescript
class FeedLoadingManager {
  private failedFeeds = new Set<string>();
  private retryAttempts = new Map<string, number>();
  private readonly maxRetries = 3;

  async loadFeedWithRetry(
    feed: FeedSource
  ): Promise<{ articles: Article[]; title: string }> {
    const attempts = this.retryAttempts.get(feed.url) || 0;

    try {
      const result = await loadSingleFeedWithTimeout(feed);

      // Reset on success
      this.failedFeeds.delete(feed.url);
      this.retryAttempts.delete(feed.url);

      return result;
    } catch (error) {
      this.retryAttempts.set(feed.url, attempts + 1);

      if (attempts < this.maxRetries) {
        // Exponential backoff
        const delay = Math.pow(2, attempts) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.loadFeedWithRetry(feed);
      } else {
        this.failedFeeds.add(feed.url);
        throw error;
      }
    }
  }
}
```

### User-Friendly Error Messages

```typescript
const getErrorMessage = (error: FeedError): string => {
  if (error.error.includes("timeout")) {
    return `Feed is taking too long to respond. This might be a temporary issue.`;
  }
  if (error.error.includes("network")) {
    return `Network connection issue. Please check your internet connection.`;
  }
  if (error.error.includes("parse")) {
    return `Feed format is invalid or corrupted.`;
  }
  return `Unable to load feed. Please try again later.`;
};
```

## Performance Optimizations

### Lazy Loading Strategy

1. **Immediate Cache Display**: Show cached content instantly
2. **Progressive Loading**: Load feeds one by one with immediate display
3. **Background Refresh**: Update cache in background for next visit
4. **Priority Loading**: Load high-priority feeds first

### Memory Management

```typescript
class ArticleMemoryManager {
  private readonly maxArticles = 1000;
  private articles: Article[] = [];

  addArticles(newArticles: Article[]): void {
    this.articles = [...this.articles, ...newArticles]
      .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
      .slice(0, this.maxArticles);
  }

  cleanup(): void {
    // Remove articles older than 7 days
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    this.articles = this.articles.filter(
      (article) => article.pubDate.getTime() > weekAgo
    );
  }
}
```

### Network Optimization

```typescript
const optimizedFetch = async (url: string, options: RequestInit = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml",
        "Cache-Control": "max-age=300", // 5 minutes
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};
```

## User Experience Improvements

### Loading States

```typescript
interface LoadingState {
  type: "skeleton" | "spinner" | "progress" | "none";
  message?: string;
  progress?: number;
  canCancel?: boolean;
}
```

### Pagination UX

1. **Smooth Transitions**: Add loading state during page changes
2. **Keyboard Navigation**: Arrow keys for page navigation
3. **URL Persistence**: Maintain page state in URL
4. **Mobile Optimization**: Touch-friendly controls

### Error Recovery

```typescript
const ErrorRecoveryComponent: React.FC<{ errors: FeedError[] }> = ({
  errors,
}) => {
  return (
    <div className="error-recovery">
      <h3>Some feeds couldn't be loaded</h3>
      <ul>
        {errors.map((error) => (
          <li key={error.url}>
            <strong>{error.url}</strong>: {getErrorMessage(error)}
            <button onClick={() => retryFeed(error.url)}>Retry</button>
          </li>
        ))}
      </ul>
    </div>
  );
};
```

## Implementation Strategy

### Phase 1: Fix Pagination

1. Implement `usePagination` hook
2. Fix state management issues
3. Add URL persistence
4. Improve mobile controls

### Phase 2: Optimize Loading

1. Implement progressive feed loading
2. Add smart caching
3. Implement timeout handling
4. Add error resilience

### Phase 3: Enhance UX

1. Add loading indicators
2. Implement error recovery UI
3. Add performance metrics
4. Optimize for mobile

This design ensures a robust, fast, and user-friendly experience while maintaining the existing functionality and improving upon the identified issues.

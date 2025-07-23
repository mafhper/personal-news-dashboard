/**
 * App.tsx
 *
 * Componente principal do Personal News Dashboard.
 * Gerencia o estado global da aplicação, incluindo artigos, feeds, pesquisa,
 * paginação, categorias e preferências do usuário.
 *
 * @author Matheus Pereira
 * @version 2.0.0
 */

import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { Header } from './components/Header';
import { FeedContent } from './components/FeedContent';
import { Modal } from './components/Modal';
import { FeedManager } from './components/FeedManager';
import { SettingsModal } from './components/SettingsModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { FavoritesModal } from './components/FavoritesModal';
import { SkipLinks } from './components/SkipLinks';
import { SearchFilters } from './components/SearchBar';
import { useLocalStorage } from './hooks/useLocalStorage';
import { usePerformance } from './hooks/usePerformance';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { useExtendedTheme } from './hooks/useExtendedTheme';
import { useReadStatus } from './hooks/useReadStatus';
import { useFeedCategories } from './hooks/useFeedCategories';
import { parseRssUrl } from './services/rssParser';
import { performanceUtils, withPerformanceMonitoring } from './services/performanceUtils';
// import { articleCache } from './services/articleCache';
import type { Article, FeedSource } from './types';

// Lazy load non-critical components
const PerformanceDebugger = lazy(() => import('./components/PerformanceDebugger'));



const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ARTICLES_PER_PAGE = 21; // 1 featured + 5 recent + 15 top stories

const App: React.FC = () => {
  // Performance monitoring
  const {
    startRenderTiming,
    endRenderTiming,
    trackNetworkRequest,
    trackCacheHit,
    trackCacheMiss
  } = usePerformance();

  const [feeds, setFeeds] = useLocalStorage<FeedSource[]>('rss-feeds', [
    { url: 'https://www.theverge.com/rss/index.xml' },
    { url: 'https://www.wired.com/feed/rss' },
  ]);
  const [cachedData, setCachedData] = useLocalStorage<{ articles: Article[]; timestamp: number }>('rss-articles-cache', {
    articles: [],
    timestamp: 0,
  });
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false); // New state for settings modal
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState<boolean>(false); // New state for favorites modal
  const [isKeyboardShortcutsOpen, setIsKeyboardShortcutsOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(0);
  // Extended theme system
  const { currentTheme, themeSettings } = useExtendedTheme();

  // Read status functionality
  const { isArticleRead } = useReadStatus();

  // Legacy settings for backward compatibility
  const [backgroundImage, setBackgroundImage] = useLocalStorage<string | null>('background-image', null);
  const [timeFormat, setTimeFormat] = useLocalStorage<'12h' | '24h'>('time-format', '24h'); // Default to 24h format

  // Search state
  const [searchResults, setSearchResults] = useState<Article[]>([]);
  const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});

  // Read status filtering
  const [readStatusFilter, setReadStatusFilter] = useState<'all' | 'read' | 'unread'>('all');

  // Theme change animation
  const [isThemeChanging, setIsThemeChanging] = useState<boolean>(false);

  // Handle theme changes with animation
  useEffect(() => {
    if (themeSettings.themeTransitions) {
      setIsThemeChanging(true);
      const timer = setTimeout(() => setIsThemeChanging(false), 300);
      return () => clearTimeout(timer);
    }
  }, [currentTheme.id, themeSettings.themeTransitions]);

  const fetchFeeds = useCallback(async (forceRefresh = false) => {
    startRenderTiming();
    performanceUtils.mark('fetchFeeds-start');

    setCurrentPage(0); // Reset to first page on refresh
    const now = Date.now();

    if (!forceRefresh && cachedData.articles.length > 0 && now - cachedData.timestamp < CACHE_DURATION_MS) {
      try {
        // Attempt to load from cache, but wrap in try...catch
        const articlesWithDateObjects = cachedData.articles.map(article => ({
          ...article,
          pubDate: new Date(article.pubDate),
        }));
        // Validate that dates are not invalid
        if (articlesWithDateObjects.some(a => isNaN(a.pubDate.getTime()))) {
          throw new Error("Invalid date found in cache");
        }
        setArticles(articlesWithDateObjects);
        setIsLoading(false);
        trackCacheHit();
        performanceUtils.mark('fetchFeeds-end');
        endRenderTiming();
        return;
      } catch (error) {
        console.warn("Failed to load from cache, fetching fresh data.", error);
        trackCacheMiss();
        // If cache is invalid, proceed to fetch fresh data
      }
    } else {
      trackCacheMiss();
    }

    if (feeds.length === 0) {
      setArticles([]);
      setCachedData({ articles: [], timestamp: 0 });
      setIsLoading(false);
      performanceUtils.mark('fetchFeeds-end');
      endRenderTiming();
      return;
    }

    setIsLoading(true);

    try {
      // Track network requests
      feeds.forEach(() => trackNetworkRequest());

      const allArticles = await Promise.all(
        feeds.map(feed => parseRssUrl(feed.url).catch(e => {
            console.error(`Failed to fetch or parse feed: ${feed.url}`, e);
            return { articles: [], title: feed.url };
        }))
      );

      const flattenedArticles = allArticles
        .flatMap(feedResult => feedResult.articles.map(article => ({ ...article, sourceTitle: feedResult.title })));

      flattenedArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

      setArticles(flattenedArticles);
      setCachedData({ articles: flattenedArticles, timestamp: now });
    } catch (e) {
      console.error("Error fetching feeds:", e);
    } finally {
      setIsLoading(false);
      performanceUtils.mark('fetchFeeds-end');
      performanceUtils.measureBetween('fetchFeeds-duration', 'fetchFeeds-start', 'fetchFeeds-end');
      endRenderTiming();
    }
  }, [feeds, cachedData, setCachedData, startRenderTiming, endRenderTiming, trackNetworkRequest, trackCacheHit, trackCacheMiss]);

  useEffect(() => {
    fetchFeeds();
  }, [fetchFeeds]);

  const handleRefresh = () => {
    fetchFeeds(true);
  };

  // Search handlers
  const handleSearch = useCallback((query: string, filters: SearchFilters) => {
    setSearchQuery(query);
    setSearchFilters(filters);
    setIsSearchActive(!!query.trim());
    setCurrentPage(0); // Reset to first page when searching
  }, []);

  const handleSearchResultsChange = useCallback((results: Article[]) => {
    setSearchResults(results);
    setCurrentPage(0); // Reset to first page when search results change
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchFilters({});
    setIsSearchActive(false);
    setSearchResults([]);
    setCurrentPage(0);
  }, []);

  // Feed categories system
  const { categories, getCategorizedFeeds } = useFeedCategories();
  const categorizedFeeds = getCategorizedFeeds(feeds);

  const handleCategoryNavigation = useCallback((categoryIndex: number) => {
    if (categoryIndex >= 0 && categoryIndex < categories.length) {
      setSelectedCategory(categories[categoryIndex].id);
    }
  }, [categories]);

  // Focus search input
  const focusSearch = useCallback(() => {
    const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
  }, []);

  // Determine which articles to display based on search state and read status filter
  const displayArticles = useMemo(() => {
    let filteredArticles: Article[];

    if (isSearchActive && searchResults.length >= 0) {
      // When search is active, show search results
      filteredArticles = searchResults;
    } else {
      // When search is not active, show filtered articles by category
      if (selectedCategory === 'all' || selectedCategory === 'All') {
        filteredArticles = articles;
      } else {
        // Filter articles based on feed category or article categories
        const selectedCategoryObj = categories.find(cat => cat.id === selectedCategory);
        if (selectedCategoryObj) {
          // First try to filter by feed category
          const feedsInCategory = categorizedFeeds[selectedCategory] || [];


          filteredArticles = articles.filter(article => {
            // Check if article is from a feed in this category
            const isFromCategorizedFeed = feedsInCategory.some(feed =>
              article.sourceTitle === feed.customTitle ||
              article.link?.includes(new URL(feed.url).hostname)
            );

            // Also check article's own categories (legacy support)
            const hasMatchingCategory = article.categories?.some(cat =>
              cat.toLowerCase() === selectedCategoryObj.name.toLowerCase()
            );

            return isFromCategorizedFeed || hasMatchingCategory;
          });
        } else {
          // Fallback to legacy category filtering
          filteredArticles = articles.filter(article =>
            article.categories?.some(cat => cat.toLowerCase() === selectedCategory.toLowerCase())
          );
        }
      }
    }

    // Apply read status filter
    if (readStatusFilter === 'read') {
      return filteredArticles.filter(article => isArticleRead(article));
    } else if (readStatusFilter === 'unread') {
      return filteredArticles.filter(article => !isArticleRead(article));
    }

    return filteredArticles;
  }, [isSearchActive, searchResults, articles, selectedCategory, readStatusFilter, isArticleRead, categories, categorizedFeeds]);

  const totalPages = Math.ceil(displayArticles.length / ARTICLES_PER_PAGE);

  // Keyboard shortcuts configuration
  const keyboardShortcuts = useMemo(() => [
    {
      key: 'k',
      ctrlKey: true,
      action: focusSearch,
      description: 'Open search'
    },
    {
      key: 'r',
      ctrlKey: true,
      action: handleRefresh,
      description: 'Refresh articles'
    },
    {
      key: 'm',
      ctrlKey: true,
      action: () => setIsModalOpen(true),
      description: 'Manage feeds'
    },
    {
      key: 's',
      ctrlKey: true,
      action: () => setIsSettingsModalOpen(true),
      description: 'Open settings'
    },
    {
      key: 'f',
      ctrlKey: true,
      action: () => setIsFavoritesModalOpen(true),
      description: 'Open favorites'
    },
    {
      key: 'h',
      ctrlKey: true,
      action: () => setIsKeyboardShortcutsOpen(true),
      description: 'Show keyboard shortcuts'
    },
    {
      key: '?',
      action: () => setIsKeyboardShortcutsOpen(true),
      description: 'Show keyboard shortcuts'
    },
    // Number keys for category selection
    {
      key: '1',
      action: () => handleCategoryNavigation(0),
      description: 'Select All category'
    },
    {
      key: '2',
      action: () => handleCategoryNavigation(1),
      description: 'Select Tech category'
    },
    {
      key: '3',
      action: () => handleCategoryNavigation(2),
      description: 'Select Reviews category'
    },
    {
      key: '4',
      action: () => handleCategoryNavigation(3),
      description: 'Select Science category'
    },
    {
      key: '5',
      action: () => handleCategoryNavigation(4),
      description: 'Select Entertainment category'
    },
    {
      key: '6',
      action: () => handleCategoryNavigation(5),
      description: 'Select AI category'
    },
    // Page navigation
    {
      key: 'ArrowLeft',
      action: () => currentPage > 0 && setCurrentPage(currentPage - 1),
      description: 'Previous page'
    },
    {
      key: 'ArrowRight',
      action: () => currentPage < totalPages - 1 && setCurrentPage(currentPage + 1),
      description: 'Next page'
    }
  ], [focusSearch, handleRefresh, handleCategoryNavigation, currentPage, totalPages]);

  // Set up keyboard navigation
  useKeyboardNavigation({
    shortcuts: keyboardShortcuts,
    enableArrowNavigation: true,
    onArrowNavigation: (direction) => {
      // Handle arrow navigation for articles
      if (direction === 'up' || direction === 'down') {
        const articles = document.querySelectorAll('article a, [role="article"] a');
        const currentFocused = document.activeElement;
        const currentIndex = Array.from(articles).findIndex(article => article === currentFocused);

        let nextIndex: number;
        if (direction === 'down') {
          nextIndex = currentIndex < articles.length - 1 ? currentIndex + 1 : 0;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : articles.length - 1;
        }

        if (articles[nextIndex]) {
          (articles[nextIndex] as HTMLElement).focus();
        }
      }
    }
  });

  useEffect(() => {
    setCurrentPage(0); // Reset to first page when category changes or search state changes
  }, [selectedCategory, isSearchActive]);

  // Page navigation functions
  // const goToNextPage = useCallback(() => {
  //   if (currentPage < totalPages - 1) {
  //     setCurrentPage(currentPage + 1);
  //   }
  // }, [currentPage, totalPages]);

  // const goToPrevPage = useCallback(() => {
  //   if (currentPage > 0) {
  //     setCurrentPage(currentPage - 1);
  //   }
  // }, [currentPage]);

  // Get the current page of articles
  const paginatedArticles = displayArticles.slice(
    currentPage * ARTICLES_PER_PAGE,
    (currentPage + 1) * ARTICLES_PER_PAGE
  );

  return (
    <div
      className={`text-gray-100 h-screen font-sans antialiased relative flex flex-col theme-transition-all ${
        isThemeChanging ? 'theme-change-animation' : ''
      } ${backgroundImage ? '' : 'bg-[rgb(var(--color-background))]'}`}
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
    >
      <SkipLinks />
      {backgroundImage && <div className="absolute inset-0 bg-black opacity-50 z-0"></div>}
      <Header
        onManageFeedsClick={() => setIsModalOpen(true)}
        onRefreshClick={handleRefresh}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenFavorites={() => setIsFavoritesModalOpen(true)}
        onMyFeedClick={handleRefresh}
        articles={articles}
        onSearch={handleSearch}
        onSearchResultsChange={handleSearchResultsChange}
        isSearchActive={isSearchActive}
        readStatusFilter={readStatusFilter}
        onReadStatusFilterChange={setReadStatusFilter}
        displayArticles={displayArticles}
        categories={categories}
      />
      <main id="main-content" className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-8 xl:py-10 relative z-10 flex-grow pt-16" tabIndex={-1}>
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[rgb(var(--color-accent))] hover:border-[rgb(var(--color-accent-dark))] "></div>
          </div>
        )}
        {/* Search active indicator */}
        {isSearchActive && (
          <div className="mb-6 flex items-center justify-between bg-gray-800 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="text-[rgb(var(--color-accent))]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">
                  Search results for "{searchQuery}"
                </p>
                <p className="text-gray-400 text-sm">
                  {displayArticles.length} article{displayArticles.length !== 1 ? 's' : ''} found
                  {Object.keys(searchFilters).length > 0 && ' with filters applied'}
                </p>
              </div>
            </div>
            <button
              onClick={clearSearch}
              className="text-gray-400 hover:text-white transition-colors px-3 py-1 rounded border border-gray-600 hover:border-gray-500"
            >
              Clear Search
            </button>
          </div>
        )}

        {!isLoading && paginatedArticles.length > 0 && (
            <FeedContent
              articles={paginatedArticles}
              timeFormat={timeFormat}
              onNextPage={currentPage < totalPages - 1 ? () => setCurrentPage(currentPage + 1) : undefined}
              onPrevPage={currentPage > 0 ? () => setCurrentPage(currentPage - 1) : undefined}
            />
        )}

        {/* No results messaging */}
        {!isLoading && paginatedArticles.length === 0 && displayArticles.length === 0 && (
          <>
            {isSearchActive ? (
              <div className="text-center text-gray-400 py-20">
                <div className="mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">No search results found</h3>
                <p className="mb-4">No articles match your search for "{searchQuery}"</p>
                <button
                  onClick={clearSearch}
                  className="bg-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-accent-dark))] text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Clear Search
                </button>
              </div>
            ) : articles.length > 0 ? (
              <p className="text-center text-gray-400">No articles found for the category "{selectedCategory}".</p>
            ) : feeds.length > 0 ? (
              <p className="text-center text-gray-400">No articles found from the provided feeds. Check your network or the feed URLs.</p>
            ) : (
              <div className="text-center text-gray-400 py-20">
                <h2 className="text-2xl font-bold mb-4">Welcome to your News Dashboard!</h2>
                <p className="mb-6">You don't have any RSS feeds yet.</p>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-accent-dark))] text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    Add Your First Feed
                </button>
              </div>
            )}
          </>
        )}
      </main>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <FeedManager currentFeeds={feeds} setFeeds={setFeeds} closeModal={() => setIsModalOpen(false)} />
      </Modal>
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        setBackgroundImage={setBackgroundImage}
        timeFormat={timeFormat}
        setTimeFormat={setTimeFormat}
      />
      <FavoritesModal
        isOpen={isFavoritesModalOpen}
        onClose={() => setIsFavoritesModalOpen(false)}
      />
      <KeyboardShortcutsModal
        isOpen={isKeyboardShortcutsOpen}
        onClose={() => setIsKeyboardShortcutsOpen(false)}
      />
      <Suspense fallback={null}>
        <PerformanceDebugger />
      </Suspense>
    </div>
  );
};

// Wrap the App component with performance monitoring
export default withPerformanceMonitoring(App, 'App');

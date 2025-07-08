import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { FeedContent } from './components/FeedContent';
import { Modal } from './components/Modal';
import { FeedManager } from './components/FeedManager';
import { SettingsModal } from './components/SettingsModal'; // Import the new SettingsModal
import { useLocalStorage } from './hooks/useLocalStorage';
import { parseRssUrl } from './services/rssParser';
import type { Article, FeedSource } from './types';



const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ARTICLES_PER_PAGE = 6;

const App: React.FC = () => {
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
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(0);
  const [themeColor, setThemeColor] = useLocalStorage<string>('theme-color', '20 184 166'); // Default to teal-500 (RGB values)
  const [backgroundImage, setBackgroundImage] = useLocalStorage<string | null>('background-image', null);
  const [timeFormat, setTimeFormat] = useLocalStorage<'12h' | '24h'>('time-format', '24h'); // Default to 24h format

  

  useEffect(() => {
    document.documentElement.style.setProperty('--color-accent', themeColor);
  }, [themeColor]);

  const fetchFeeds = useCallback(async (forceRefresh = false) => {
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
        return;
      } catch (error) {
        console.warn("Failed to load from cache, fetching fresh data.", error);
        // If cache is invalid, proceed to fetch fresh data
      }
    }

    if (feeds.length === 0) {
      setArticles([]);
      setCachedData({ articles: [], timestamp: 0 });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    try {
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
    }
  }, [feeds, cachedData, setCachedData]);

  useEffect(() => {
    fetchFeeds();
  }, [fetchFeeds]);

  const handleRefresh = () => {
    fetchFeeds(true);
  };

  const filteredArticles = useMemo(() => {
    if (selectedCategory === 'All') {
      return articles;
    }
    return articles.filter(article => 
      article.categories?.some(cat => cat.toLowerCase() === selectedCategory.toLowerCase())
    );
  }, [articles, selectedCategory]);

  useEffect(() => {
    setCurrentPage(0); // Reset to first page when category changes
  }, [selectedCategory]);

  const totalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE);
  const paginatedArticles = filteredArticles.slice(
    currentPage * ARTICLES_PER_PAGE,
    (currentPage + 1) * ARTICLES_PER_PAGE
  );

  return (
    <div 
      className={`text-gray-100 h-screen font-sans antialiased relative flex flex-col ${backgroundImage ? '' : 'bg-[rgb(var(--color-background))]'}`}
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
    >
      {backgroundImage && <div className="absolute inset-0 bg-black opacity-50 z-0"></div>}
      <Header 
        onManageFeedsClick={() => setIsModalOpen(true)}
        onRefreshClick={handleRefresh}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onOpenSettings={() => setIsSettingsModalOpen(true)} // New prop for opening settings
        onMyFeedClick={handleRefresh} // Pass handleRefresh to MyFeed button
      />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 flex-grow overflow-y-hidden pt-16">
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[rgb(var(--color-accent))] hover:border-[rgb(var(--color-accent-dark))] "></div>
          </div>
        )}
        {!isLoading && paginatedArticles.length > 0 && (
            <FeedContent articles={paginatedArticles} timeFormat={timeFormat} />
        )}
        {!isLoading && paginatedArticles.length === 0 && articles.length > 0 && (
          <p className="text-center text-gray-400">No articles found for the category "{selectedCategory}".</p>
        )}
        {!isLoading && articles.length === 0 && feeds.length > 0 && (
          <p className="text-center text-gray-400">No articles found from the provided feeds. Check your network or the feed URLs.</p>
        )}
         {!isLoading && articles.length === 0 && feeds.length === 0 && (
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
      </main>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <FeedManager currentFeeds={feeds} setFeeds={setFeeds} closeModal={() => setIsModalOpen(false)} />
      </Modal>
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        setThemeColor={setThemeColor}
        setBackgroundImage={setBackgroundImage}
        timeFormat={timeFormat}
        setTimeFormat={setTimeFormat}
      />
    </div>
  );
};

export default App;
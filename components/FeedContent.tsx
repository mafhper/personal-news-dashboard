
/**
 * FeedContent.tsx
 *
 * Componente principal para exibição de artigos no Personal News Dashboard.
 * Organiza os artigos em seções: artigo em destaque, notícias recentes e top stories.
 * Suporta múltiplos layouts e paginação.
 *
 * @author Matheus Pereira
 * @version 2.0.0
 */

import React, { useMemo } from 'react';
import type { Article } from '../types';
import { FeaturedArticle } from './FeaturedArticle';
import { ArticleItem } from './ArticleItem';
import { withPerformanceMonitoring } from '../services/performanceUtils';

interface FeedContentProps {
    articles: Article[];
    timeFormat: '12h' | '24h';
    onNextPage?: () => void;
    onPrevPage?: () => void;
}

const FeedContentComponent: React.FC<FeedContentProps> = ({ articles, onNextPage, onPrevPage }) => {
    const [topStoriesLayout, setTopStoriesLayout] = React.useState<'grid' | 'list'>('grid');

    if (articles.length === 0) {
        return null;
    }

    // Memoize the featured article and other articles to prevent unnecessary re-renders
    const featuredArticle = useMemo(() => articles[0], [articles]);
    const otherArticles = useMemo(() => articles.slice(1), [articles]);
    const recentArticles = useMemo(() => otherArticles.slice(0, 5), [otherArticles]); // 5 artigos para o resumo (posições 1-5)
    const topStoriesArticles = useMemo(() => otherArticles.slice(5, 20), [otherArticles]); // 15 artigos para Top Stories (posições 6-20)

    return (
        <div className="space-y-8 lg:space-y-12" role="main" aria-label="News articles">
            {/* Main content section - Featured article + Recent news summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12">
                {/* Featured Article - Half width */}
                <section aria-labelledby="featured-article-heading">
                    <h2 id="featured-article-heading" className="sr-only">Featured Article</h2>
                    <div className="h-[50vh] lg:h-[60vh] xl:h-[65vh] min-h-[350px] max-h-[600px]">
                        <FeaturedArticle article={featuredArticle} />
                    </div>
                </section>

                {/* Recent News Summary - Right side */}
                <aside className="space-y-6" role="complementary" aria-labelledby="recent-news-heading">
                    <div className="flex items-center justify-between">
                        <h2 id="recent-news-heading" className="text-xl lg:text-2xl font-bold text-[rgb(var(--color-accent))] uppercase tracking-wider">
                            Últimas Notícias
                        </h2>
                        <div className="text-sm text-gray-400">
                            {recentArticles.length} artigos
                        </div>
                    </div>

                    <div className="space-y-4">
                        {recentArticles.map((article, index) => (
                            <article key={article.link + index} className="border-b border-gray-700/50 pb-4 last:border-b-0 last:pb-0">
                                <a
                                    href={article.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group block"
                                    aria-label={`Read article: ${article.title}`}
                                >
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-[rgb(var(--color-accent))] mt-2"></div>
                                        <img
                                            src={article.imageUrl || `https://picsum.photos/seed/${article.link}/120/80`}
                                            alt={`Thumbnail for ${article.title}`}
                                            className="w-12 h-12 lg:w-16 lg:h-16 object-cover rounded-md flex-shrink-0 group-hover:opacity-90 transition-opacity"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="mb-1">
                                                <span className="inline-block bg-[rgb(var(--color-accent))]/20 text-[rgb(var(--color-accent))] px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide">
                                                    {article.sourceTitle}
                                                </span>
                                            </div>
                                            <h3 className="text-sm lg:text-base font-medium text-gray-200 group-hover:text-white line-clamp-2 leading-tight">
                                                {article.title}
                                            </h3>
                                            <div className="mt-2 flex items-center space-x-2 text-xs text-gray-400">
                                                <time dateTime={article.pubDate.toISOString()}>
                                                    {article.pubDate.toLocaleDateString()}
                                                </time>
                                                {article.author && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="truncate max-w-[100px]">
                                                            {article.author}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            </article>
                        ))}
                    </div>
                </aside>
            </div>

            {/* Top Stories section - Below main content with layout options */}
            <section aria-labelledby="top-stories-heading" className="w-full">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center justify-between sm:justify-start">
                        <h2 id="top-stories-heading" className="text-xl sm:text-2xl lg:text-3xl font-bold text-[rgb(var(--color-accent))] uppercase tracking-wider">
                            Top Stories
                        </h2>
                        <div className="text-sm text-gray-400 sm:hidden">
                            {topStoriesArticles.length} artigos
                        </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end space-x-4">
                        <div className="hidden sm:block text-sm text-gray-400">
                            {topStoriesArticles.length} artigos
                        </div>
                        {/* Layout toggle buttons */}
                        <div className="flex bg-gray-800 rounded-md overflow-hidden">
                            <button
                                onClick={() => setTopStoriesLayout('grid')}
                                className={`px-2 sm:px-3 py-2 text-xs font-medium transition-colors touch-target ${
                                    topStoriesLayout === 'grid'
                                        ? 'bg-[rgb(var(--color-accent))] text-white'
                                        : 'text-gray-300 hover:text-white hover:bg-gray-700'
                                }`}
                                style={{ minHeight: '44px', minWidth: '44px' }}
                                aria-label="Grid layout"
                                title="Exibição em grade"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setTopStoriesLayout('list')}
                                className={`px-2 sm:px-3 py-2 text-xs font-medium transition-colors touch-target ${
                                    topStoriesLayout === 'list'
                                        ? 'bg-[rgb(var(--color-accent))] text-white'
                                        : 'text-gray-300 hover:text-white hover:bg-gray-700'
                                }`}
                                style={{ minHeight: '44px', minWidth: '44px' }}
                                aria-label="List layout"
                                title="Exibição em lista"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Top Stories content with layout switching */}
                {topStoriesLayout === 'grid' ? (
                    /* Grid layout */
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
                        {topStoriesArticles.map((article, index) => (
                            <div key={article.link + index} className="bg-gray-800/50 rounded-lg p-4 lg:p-6 border border-gray-700/50 hover:border-gray-600/50 grid-card group">
                                <ArticleItem article={article} index={index + 2} />
                            </div>
                        ))}
                    </div>
                ) : (
                    /* List layout */
                    <div className="space-y-4">
                        {topStoriesArticles.map((article, index) => (
                            <article key={article.link + index} className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/30 hover:bg-gray-800/50 hover:border-gray-600/50 transition-all duration-200">
                                <a
                                    href={article.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-4 group"
                                    aria-label={`Read article: ${article.title}`}
                                >
                                    <div className="flex-shrink-0 w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-sm font-bold text-gray-300 group-hover:bg-[rgb(var(--color-accent))] group-hover:text-white transition-colors">
                                        {index + 2}
                                    </div>
                                    <img
                                        src={article.imageUrl || `https://picsum.photos/seed/${article.link}/100/100`}
                                        alt={`Thumbnail for ${article.title}`}
                                        className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="mb-1">
                                            <span className="inline-block bg-[rgb(var(--color-accent))]/20 text-[rgb(var(--color-accent))] px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide">
                                                {article.sourceTitle}
                                            </span>
                                        </div>
                                        <h3 className="text-base lg:text-lg font-medium text-gray-200 group-hover:text-white line-clamp-2 leading-tight">
                                            {article.title}
                                        </h3>
                                        <div className="mt-2 flex items-center space-x-3 text-xs text-gray-400">
                                            <time dateTime={article.pubDate.toISOString()}>
                                                {article.pubDate.toLocaleDateString()}
                                            </time>
                                            {article.author && (
                                                <>
                                                    <span>•</span>
                                                    <span className="truncate max-w-[120px]">
                                                        {article.author}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </a>
                            </article>
                        ))}
                    </div>
                )}

                {/* Pagination controls if needed */}
                {(onNextPage || onPrevPage) && (
                    <div className="mt-8 flex justify-center space-x-4">
                        {onPrevPage && (
                            <button
                                onClick={onPrevPage}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                            >
                                Anterior
                            </button>
                        )}
                        {onNextPage && (
                            <button
                                onClick={onNextPage}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                            >
                                Próximo
                            </button>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
};

// Export the component wrapped with performance monitoring
export const FeedContent = withPerformanceMonitoring(FeedContentComponent, 'FeedContent');

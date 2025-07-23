
/**
 * Header.tsx
 *
 * Componente de cabeçalho responsivo para o Personal News Dashboard.
 * Gerencia a navegação principal, pesquisa, filtros de categoria e controles de usuário.
 * Implementa design responsivo com menu hambúrguer para dispositivos móveis.
 *
 * @author Matheus Pereira
 * @version 2.0.0
 */

import React, { useState } from 'react';
import { SearchBar, SearchFilters } from './SearchBar';
import { HeaderWeatherWidget } from './HeaderWeatherWidget';
import { Article, FeedCategory } from '../types';
import { useFavorites } from '../hooks/useFavorites';
import { useReadStatus } from '../hooks/useReadStatus';

interface HeaderProps {
    onManageFeedsClick: () => void;
    onRefreshClick: () => void;
    selectedCategory: string;
    onCategorySelect: (category: string) => void;
    onOpenSettings: () => void;
    onMyFeedClick: () => void;
    // Search-related props
    articles: Article[];
    onSearch: (query: string, filters: SearchFilters) => void;
    onSearchResultsChange?: (results: Article[]) => void;
    isSearchActive: boolean;
    // Read status filtering
    readStatusFilter: 'all' | 'read' | 'unread';
    onReadStatusFilterChange: (filter: 'all' | 'read' | 'unread') => void;
    displayArticles: Article[];
    // Favorites
    onOpenFavorites: () => void;
    // Categories
    categories: FeedCategory[];
}

const SettingsIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.942 3.331.83 2.295 2.296a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.942 1.543-.83 3.331-2.296 2.295a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.942-3.331-.83-2.295-2.296a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.942-1.543.83-3.331 2.296-2.295a1.724 1.724 0 002.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);


const MenuIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

const RefreshIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);



const HeartIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
);

export const Header: React.FC<HeaderProps> = ({
    onManageFeedsClick,
    onRefreshClick,
    selectedCategory,
    onCategorySelect,
    onOpenSettings,
    onMyFeedClick,
    articles,
    onSearch,
    onSearchResultsChange,
    readStatusFilter,
    onReadStatusFilterChange,
    displayArticles,
    onOpenFavorites,
    categories
}) => {
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { markAllAsRead, markAllAsUnread, getReadCount, getUnreadCount } = useReadStatus();
    const { getFavoritesCount } = useFavorites();

    const readCount = getReadCount(displayArticles);
    const unreadCount = getUnreadCount(displayArticles);

    const handleMarkAllAsRead = () => {
        markAllAsRead(displayArticles);
        setShowBulkActions(false);
    };

    const handleMarkAllAsUnread = () => {
        markAllAsUnread(displayArticles);
        setShowBulkActions(false);
    };

    return (
        <header className="border-b border-gray-700 sticky top-0 bg-[rgb(var(--color-background))] z-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Main header row */}
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-4 sm:space-x-8">
                        <button
                            onClick={onMyFeedClick}
                            className="text-2xl sm:text-3xl font-black tracking-tighter header-title"
                            style={{fontStyle: 'italic'}}
                            aria-label="MyFeed - Go to homepage"
                        >
                            MyFeed
                        </button>
                        <nav id="navigation" className="hidden lg:flex items-center space-x-6" role="navigation" aria-label="Category navigation">
                            {categories.map(category => (
                                <button
                                    key={category.id}
                                    onClick={() => onCategorySelect(category.id)}
                                    className={`text-sm font-medium transition-colors flex items-center space-x-1 touch-target ${selectedCategory === category.id ? 'text-[rgb(var(--color-accent))]' : 'text-gray-300 hover:text-white'}`}
                                    style={{ minHeight: '44px', padding: '8px 12px' }}
                                    aria-current={selectedCategory === category.id ? 'page' : undefined}
                                    aria-label={`Filter articles by ${category.name} category`}
                                >
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: category.color }}
                                    />
                                    <span>{category.name}</span>
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center space-x-2 sm:space-x-4">
                        {/* Search Bar - hidden on mobile, shown on larger screens */}
                        <div id="search" className="hidden lg:block w-64 xl:w-80">
                            <SearchBar
                                articles={articles}
                                onSearch={onSearch}
                                onResultsChange={onSearchResultsChange}
                                placeholder="Buscar artigos... (Ctrl+K)"
                                showFilters={true}
                                className="w-full"
                            />
                        </div>

                        {/* Compact actions for medium screens */}
                        <div className="hidden md:flex lg:hidden items-center space-x-2">
                            <button
                                onClick={onRefreshClick}
                                className="p-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors touch-target"
                                style={{ minWidth: '44px', minHeight: '44px' }}
                                aria-label="Refresh articles"
                                title="Refresh"
                            >
                                <RefreshIcon />
                            </button>
                            <button
                                onClick={onManageFeedsClick}
                                className="p-2 bg-[rgb(var(--color-accent))] text-white rounded-md hover:bg-[rgb(var(--color-accent-dark))] transition-colors touch-target"
                                style={{ minWidth: '44px', minHeight: '44px' }}
                                aria-label="Manage RSS feeds"
                                title="Manage Feeds"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </button>
                        </div>

                        {/* Full actions for large screens */}
                        <div className="hidden lg:flex items-center space-x-4">
                            <button
                                onClick={onRefreshClick}
                                className="flex items-center space-x-2 bg-gray-700 text-white px-3 py-1.5 text-sm font-bold rounded-sm hover:bg-gray-600 transition-colors"
                                aria-label="Refresh articles"
                            >
                                <RefreshIcon />
                            </button>
                            <button
                                onClick={onManageFeedsClick}
                                className="bg-[rgb(var(--color-accent))] text-white px-4 py-1.5 text-sm font-bold rounded-sm hover:bg-[rgb(var(--color-accent-dark))] transition-colors"
                                aria-label="Manage RSS feeds"
                            >
                                GERENCIAR FEEDS
                            </button>
                        </div>

                        {/* Always visible action buttons */}
                        <button
                            onClick={onOpenFavorites}
                            className="relative p-1.5 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors touch-target"
                            style={{ minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            aria-label={`Open favorites (${getFavoritesCount()})`}
                        >
                            <HeartIcon />
                            {getFavoritesCount() > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                                    {getFavoritesCount() > 99 ? '99+' : getFavoritesCount()}
                                </span>
                            )}
                        </button>

                        <button
                            id="settings"
                            onClick={onOpenSettings}
                            className="p-1.5 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors touch-target"
                            style={{ minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            aria-label="Open settings"
                        >
                            <SettingsIcon />
                        </button>

                        {/* Mobile menu button - only show when navigation is hidden */}
                        <div className="lg:hidden">
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="text-gray-300 hover:text-white touch-target"
                                style={{ minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                aria-label={mobileMenuOpen ? "Close mobile menu" : "Open mobile menu"}
                                aria-expanded={mobileMenuOpen}
                                aria-controls="mobile-menu"
                            >
                                {mobileMenuOpen ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                ) : (
                                    <MenuIcon />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile search bar - shown on smaller screens */}
                <div className="lg:hidden pb-4">
                    <SearchBar
                        articles={articles}
                        onSearch={onSearch}
                        onResultsChange={onSearchResultsChange}
                        placeholder="Buscar artigos..."
                        showFilters={true}
                        className="w-full"
                    />
                </div>

                {/* Read status controls with centered weather widget */}
                <div className="border-t border-gray-700 py-3 flex flex-wrap items-center justify-between gap-y-3">
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        {/* Read status filter */}
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-gray-400">Mostrar:</span>
                            <div className="flex bg-gray-800 rounded-md overflow-hidden">
                                <button
                                    onClick={() => onReadStatusFilterChange('all')}
                                    className={`px-2 sm:px-3 py-2 text-xs font-medium transition-colors touch-target ${
                                        readStatusFilter === 'all'
                                            ? 'bg-[rgb(var(--color-accent))] text-white'
                                            : 'text-gray-300 hover:text-white hover:bg-gray-700'
                                    }`}
                                    style={{ minHeight: '44px', minWidth: '44px' }}
                                >
                                    Todos ({displayArticles.length})
                                </button>
                                <button
                                    onClick={() => onReadStatusFilterChange('unread')}
                                    className={`px-2 sm:px-3 py-2 text-xs font-medium transition-colors touch-target ${
                                        readStatusFilter === 'unread'
                                            ? 'bg-[rgb(var(--color-accent))] text-white'
                                            : 'text-gray-300 hover:text-white hover:bg-gray-700'
                                    }`}
                                    style={{ minHeight: '44px', minWidth: '44px' }}
                                >
                                    Não lidos ({unreadCount})
                                </button>
                                <button
                                    onClick={() => onReadStatusFilterChange('read')}
                                    className={`px-2 sm:px-3 py-2 text-xs font-medium transition-colors touch-target ${
                                        readStatusFilter === 'read'
                                            ? 'bg-[rgb(var(--color-accent))] text-white'
                                            : 'text-gray-300 hover:text-white hover:bg-gray-700'
                                    }`}
                                    style={{ minHeight: '44px', minWidth: '44px' }}
                                >
                                    Lidos ({readCount})
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Centered Weather Widget - Compact Header Version */}
                    <div className="hidden md:flex items-center justify-center flex-1 max-w-md mx-4">
                        <HeaderWeatherWidget />
                    </div>

                    {/* Mobile Weather Widget - Smaller version for mobile */}
                    <div className="md:hidden flex items-center justify-center flex-1 mx-2">
                        <HeaderWeatherWidget />
                    </div>

                    {/* Bulk actions */}
                    <div className="flex items-center space-x-2">
                        <div className="relative">
                            <button
                                onClick={() => setShowBulkActions(!showBulkActions)}
                                className="flex items-center space-x-1 px-3 py-2 text-xs font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-md transition-colors touch-target"
                                style={{ minHeight: '44px', minWidth: '44px' }}
                                aria-expanded={showBulkActions}
                                aria-haspopup="true"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                                <span>Ações em Massa</span>
                            </button>

                            {showBulkActions && (
                                <div className="absolute right-0 mt-1 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-30">
                                    <div className="py-1">
                                        <button
                                            onClick={handleMarkAllAsRead}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                                        >
                                            Marcar todos como lidos
                                        </button>
                                        <button
                                            onClick={handleMarkAllAsUnread}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                                        >
                                            Marcar todos como não lidos
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile menu - collapsible navigation for smaller screens */}
            {mobileMenuOpen && (
                <div id="mobile-menu" className="lg:hidden border-t border-gray-700 bg-gray-800 shadow-lg">
                    <div className="px-4 py-3 space-y-4">
                        {/* Mobile category navigation */}
                        <nav className="mobile-nav flex flex-col space-y-2" role="navigation" aria-label="Mobile category navigation">
                            {categories.map(category => (
                                <button
                                    key={category.id}
                                    onClick={() => {
                                        onCategorySelect(category.id);
                                        setMobileMenuOpen(false);
                                    }}
                                    className={`text-sm font-medium transition-colors flex items-center space-x-2 p-3 rounded-md touch-target ${
                                        selectedCategory === category.id
                                            ? 'bg-[rgb(var(--color-accent))] text-white'
                                            : 'text-gray-300 hover:text-white hover:bg-gray-700'
                                    }`}
                                    aria-current={selectedCategory === category.id ? 'page' : undefined}
                                    aria-label={`Filter articles by ${category.name} category`}
                                >
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: category.color }}
                                    />
                                    <span>{category.name}</span>
                                </button>
                            ))}
                        </nav>

                        {/* Mobile action buttons */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => {
                                    onRefreshClick();
                                    setMobileMenuOpen(false);
                                }}
                                className="flex items-center justify-center space-x-2 bg-gray-700 text-white p-3 text-sm font-bold rounded-md hover:bg-gray-600 transition-colors"
                                aria-label="Refresh articles"
                            >
                                <RefreshIcon />
                                <span>Atualizar</span>
                            </button>
                            <button
                                onClick={() => {
                                    onManageFeedsClick();
                                    setMobileMenuOpen(false);
                                }}
                                className="flex items-center justify-center space-x-2 bg-[rgb(var(--color-accent))] text-white p-3 text-sm font-bold rounded-md hover:bg-[rgb(var(--color-accent-dark))] transition-colors"
                                aria-label="Manage RSS feeds"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                <span>Gerenciar Feeds</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

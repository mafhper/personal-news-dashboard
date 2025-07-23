import React, { useState, useMemo, useCallback } from 'react';
import { Modal } from './Modal';
import { LazyImage } from './LazyImage';
import { useFavorites, favoriteToArticle } from '../hooks/useFavorites';
// import type { Article } from '../types';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HeartIcon: React.FC<{ filled?: boolean }> = ({ filled = false }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const DownloadIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const UploadIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const TrashIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const SearchIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export const FavoritesModal: React.FC<FavoritesModalProps> = ({ isOpen, onClose }) => {
  const {
    favorites,
    removeFromFavorites,
    clearAllFavorites,
    exportFavorites,
    importFavorites,
    getFavoritesByCategory,
    getFavoritesBySource
  } = useFavorites();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'source'>('recent');
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Get unique categories and sources from favorites
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    favorites.forEach(fav => {
      fav.categories?.forEach(cat => categories.add(cat));
    });
    return ['All', ...Array.from(categories).sort()];
  }, [favorites]);

  const availableSources = useMemo(() => {
    const sources = new Set<string>();
    favorites.forEach(fav => {
      sources.add(fav.sourceTitle);
      if (fav.author) sources.add(fav.author);
    });
    return ['All', ...Array.from(sources).sort()];
  }, [favorites]);

  // Filter and sort favorites
  const filteredFavorites = useMemo(() => {
    let filtered = favorites;

    // Apply category filter
    if (selectedCategory !== 'All') {
      filtered = getFavoritesByCategory(selectedCategory);
    }

    // Apply source filter
    if (selectedSource && selectedSource !== 'All') {
      filtered = getFavoritesBySource(selectedSource);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(fav =>
        fav.title.toLowerCase().includes(query) ||
        fav.sourceTitle.toLowerCase().includes(query) ||
        fav.author?.toLowerCase().includes(query) ||
        fav.description?.toLowerCase().includes(query)
      );
    }

    // Sort results
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'source':
          return a.sourceTitle.localeCompare(b.sourceTitle);
        case 'recent':
        default:
          return new Date(b.favoritedAt).getTime() - new Date(a.favoritedAt).getTime();
      }
    });

    return sorted;
  }, [favorites, selectedCategory, selectedSource, searchQuery, sortBy, getFavoritesByCategory, getFavoritesBySource]);

  const handleExport = useCallback(() => {
    const data = exportFavorites();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `favorites-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportFavorites]);

  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const success = importFavorites(content);
      if (success) {
        alert('Favorites imported successfully!');
      } else {
        alert('Failed to import favorites. Please check the file format.');
      }
    };
    reader.readAsText(file);

    // Reset the input
    event.target.value = '';
  }, [importFavorites]);

  const handleRemoveFavorite = useCallback((favorite: any) => {
    const article = favoriteToArticle(favorite);
    removeFromFavorites(article);
  }, [removeFromFavorites]);

  const handleClearAll = useCallback(() => {
    clearAllFavorites();
    setShowConfirmClear(false);
  }, [clearAllFavorites]);

  const timeSince = (dateString: string): string => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <HeartIcon filled />
              <h2 className="text-2xl font-bold text-white">My Favorites</h2>
              <span className="bg-[rgb(var(--color-accent))] text-white px-2 py-1 rounded-full text-sm font-medium">
                {favorites.length}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors text-sm"
                title="Export favorites"
              >
                <DownloadIcon />
                <span>Export</span>
              </button>
              <label className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors text-sm cursor-pointer">
                <UploadIcon />
                <span>Import</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
              <button
                onClick={() => setShowConfirmClear(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors text-sm"
                title="Clear all favorites"
                disabled={favorites.length === 0}
              >
                <TrashIcon />
                <span>Clear All</span>
              </button>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <SearchIcon />
              <input
                type="text"
                placeholder="Search favorites..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))] focus:border-transparent"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <SearchIcon />
              </div>
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))] focus:border-transparent"
            >
              {availableCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Source Filter */}
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))] focus:border-transparent"
            >
              {availableSources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'title' | 'source')}
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))] focus:border-transparent"
            >
              <option value="recent">Most Recent</option>
              <option value="title">Title A-Z</option>
              <option value="source">Source A-Z</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {filteredFavorites.length === 0 ? (
            <div className="text-center py-12">
              <HeartIcon />
              <div className="mx-auto w-16 h-16 text-gray-600 mb-4">
                <HeartIcon />
              </div>
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                {favorites.length === 0 ? 'No favorites yet' : 'No matching favorites'}
              </h3>
              <p className="text-gray-500">
                {favorites.length === 0
                  ? 'Start favoriting articles to see them here'
                  : 'Try adjusting your search or filters'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFavorites.map((favorite) => (
                <div key={favorite.id} className="border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors">
                  <div className="flex items-start space-x-4">
                    <LazyImage
                      src={favorite.imageUrl || `https://picsum.photos/seed/${favorite.link}/80/80`}
                      alt={`Thumbnail for ${favorite.title}`}
                      className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <a
                            href={favorite.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white font-semibold hover:text-[rgb(var(--color-accent))] transition-colors line-clamp-2"
                          >
                            {favorite.title}
                          </a>
                          <div className="flex items-center space-x-3 mt-2 text-sm text-gray-400">
                            <span className="font-medium text-[rgb(var(--color-accent))]">
                              {favorite.author || favorite.sourceTitle}
                            </span>
                            <span>•</span>
                            <span>{timeSince(favorite.pubDate)}</span>
                            <span>•</span>
                            <span>Favorited {timeSince(favorite.favoritedAt)}</span>
                          </div>
                          {favorite.description && (
                            <p className="text-gray-500 text-sm mt-2 line-clamp-2">
                              {favorite.description}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveFavorite(favorite)}
                          className="ml-4 p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-md transition-colors flex-shrink-0"
                          title="Remove from favorites"
                        >
                          <HeartIcon filled />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Confirm Clear Dialog */}
        {showConfirmClear && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-white mb-4">Clear All Favorites?</h3>
              <p className="text-gray-400 mb-6">
                This will permanently remove all {favorites.length} favorites. This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleClearAll}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

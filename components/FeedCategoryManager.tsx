/**
 * FeedCategoryManager.tsx
 *
 * Componente para gerenciamento de categorias de feeds no Personal News Dashboard.
 * Permite criar, editar, excluir e reorganizar categorias, além de arrastar feeds entre categorias.
 * Suporta importação e exportação de configurações de categorias.
 *
 * @author Matheus Pereira
 * @version 2.0.0
 */

import React, { useState, useRef, useCallback } from 'react';
import { useFeedCategories } from '../hooks/useFeedCategories';
import type { FeedSource, FeedCategory } from '../types';

interface FeedCategoryManagerProps {
  feeds: FeedSource[];
  setFeeds: (feeds: FeedSource[]) => void;
  onClose: () => void;
}

interface DragState {
  draggedItem: { type: 'feed' | 'category'; id: string; data: any } | null;
  dragOverCategory: string | null;
}

export const FeedCategoryManager: React.FC<FeedCategoryManagerProps> = ({
  feeds,
  setFeeds,
  onClose
}) => {
  const {
    categories,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    getCategorizedFeeds,
    moveFeedToCategory,
    exportCategories,
    importCategories,
    resetToDefaults
  } = useFeedCategories();

  const [dragState, setDragState] = useState<DragState>({
    draggedItem: null,
    dragOverCategory: null
  });
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryForm, setNewCategoryForm] = useState({
    name: '',
    color: '#3B82F6',
    description: ''
  });
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categorizedFeeds = getCategorizedFeeds(feeds);

  const handleDragStart = useCallback((e: React.DragEvent, type: 'feed' | 'category', id: string, data: any) => {
    setDragState(prev => ({
      ...prev,
      draggedItem: { type, id, data }
    }));
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, categoryId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragState(prev => ({
      ...prev,
      dragOverCategory: categoryId
    }));
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragState(prev => ({
      ...prev,
      dragOverCategory: null
    }));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetCategoryId: string) => {
    e.preventDefault();

    if (!dragState.draggedItem) return;

    const { type, id, data } = dragState.draggedItem;

    if (type === 'feed') {
      moveFeedToCategory(data.url, targetCategoryId, feeds, setFeeds);
    } else if (type === 'category') {
      // Handle category reordering
      const targetCategory = categories.find(c => c.id === targetCategoryId);
      const draggedCategory = categories.find(c => c.id === id);

      if (targetCategory && draggedCategory) {
        const newOrder = [...categories]
          .sort((a, b) => a.order - b.order)
          .map(c => c.id);

        const draggedIndex = newOrder.indexOf(id);
        const targetIndex = newOrder.indexOf(targetCategoryId);

        newOrder.splice(draggedIndex, 1);
        newOrder.splice(targetIndex, 0, id);

        reorderCategories(newOrder);
      }
    }

    setDragState({
      draggedItem: null,
      dragOverCategory: null
    });
  }, [dragState.draggedItem, categories, feeds, setFeeds, moveFeedToCategory, reorderCategories]);

  const handleCreateCategory = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryForm.name.trim()) {
      createCategory(
        newCategoryForm.name.trim(),
        newCategoryForm.color,
        newCategoryForm.description.trim() || undefined
      );
      setNewCategoryForm({ name: '', color: '#3B82F6', description: '' });
      setShowNewCategoryForm(false);
    }
  }, [newCategoryForm, createCategory]);

  const handleUpdateCategory = useCallback((categoryId: string, updates: Partial<FeedCategory>) => {
    updateCategory(categoryId, updates);
    setEditingCategory(null);
  }, [updateCategory]);

  const handleDeleteCategory = useCallback((categoryId: string) => {
    if (confirm('Are you sure you want to delete this category? Feeds in this category will become uncategorized.')) {
      // Move feeds from deleted category to uncategorized
      const feedsInCategory = categorizedFeeds[categoryId] || [];
      feedsInCategory.forEach(feed => {
        moveFeedToCategory(feed.url, 'uncategorized', feeds, setFeeds);
      });

      deleteCategory(categoryId);
    }
  }, [categorizedFeeds, feeds, setFeeds, moveFeedToCategory, deleteCategory]);

  const handleExportCategories = useCallback(() => {
    const data = exportCategories();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feed-categories-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportCategories]);

  const handleImportCategories = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const content = await file.text();
        const success = importCategories(content);
        if (success) {
          alert('Categories imported successfully!');
        } else {
          alert('Failed to import categories. Please check the file format.');
        }
      } catch (error) {
        alert('Failed to read the file.');
        console.error(error);
      }
    }
  }, [importCategories]);

  const handleResetToDefaults = useCallback(() => {
    if (confirm('Are you sure you want to reset to default categories? This will remove all custom categories and reset feed assignments.')) {
      resetToDefaults();
      // Reset all feed categories
      const resetFeeds = feeds.map(feed => ({ ...feed, categoryId: undefined }));
      setFeeds(resetFeeds);
    }
  }, [resetToDefaults, feeds, setFeeds]);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6" role="dialog" aria-labelledby="category-manager-title">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 id="category-manager-title" className="text-xl sm:text-2xl font-bold text-white">
          Feed Category Manager
        </h2>
        <button
          onClick={onClose}
          className="self-end sm:self-auto text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-md"
          aria-label="Close category manager"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 mb-6">
        <button
          onClick={() => setShowNewCategoryForm(true)}
          className="bg-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-accent-dark))] text-white px-4 py-2 rounded-lg transition-colors"
        >
          Create Category
        </button>
        <button
          onClick={handleExportCategories}
          className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Export Categories
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Import Categories
        </button>
        <button
          onClick={handleResetToDefaults}
          className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Reset to Defaults
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportCategories}
        accept=".json"
        className="hidden"
      />

      {/* New category form */}
      {showNewCategoryForm && (
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Create New Category</h3>
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div>
              <label htmlFor="category-name" className="block text-sm font-medium text-gray-300 mb-1">
                Category Name
              </label>
              <input
                id="category-name"
                type="text"
                value={newCategoryForm.name}
                onChange={(e) => setNewCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-gray-700 text-white rounded-md px-3 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))]"
                required
              />
            </div>
            <div>
              <label htmlFor="category-color" className="block text-sm font-medium text-gray-300 mb-1">
                Color
              </label>
              <input
                id="category-color"
                type="color"
                value={newCategoryForm.color}
                onChange={(e) => setNewCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                className="w-16 h-10 bg-gray-700 rounded-md border border-gray-600"
              />
            </div>
            <div>
              <label htmlFor="category-description" className="block text-sm font-medium text-gray-300 mb-1">
                Description (optional)
              </label>
              <textarea
                id="category-description"
                value={newCategoryForm.description}
                onChange={(e) => setNewCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-gray-700 text-white rounded-md px-3 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))] resize-none"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-accent-dark))] text-white px-4 py-2 rounded-lg transition-colors"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowNewCategoryForm(false)}
                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories and feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {categories.map(category => (
          <div
            key={category.id}
            className={`bg-gray-800 rounded-lg p-4 transition-all ${
              dragState.dragOverCategory === category.id ? 'ring-2 ring-[rgb(var(--color-accent))] bg-gray-700' : ''
            }`}
            onDragOver={(e) => handleDragOver(e, category.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, category.id)}
          >
            {/* Category header */}
            <div
              className="flex items-center justify-between mb-3 cursor-move"
              draggable={!category.isDefault}
              onDragStart={(e) => handleDragStart(e, 'category', category.id, category)}
            >
              <div className="flex items-center space-x-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                {editingCategory === category.id ? (
                  <input
                    type="text"
                    defaultValue={category.name}
                    onBlur={(e) => handleUpdateCategory(category.id, { name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdateCategory(category.id, { name: e.currentTarget.value });
                      } else if (e.key === 'Escape') {
                        setEditingCategory(null);
                      }
                    }}
                    className="bg-gray-700 text-white px-2 py-1 rounded text-sm"
                    autoFocus
                  />
                ) : (
                  <h3 className="font-semibold text-white">{category.name}</h3>
                )}
              </div>

              {!category.isDefault && (
                <div className="flex space-x-1">
                  <button
                    onClick={() => setEditingCategory(category.id)}
                    className="text-gray-400 hover:text-white p-1"
                    aria-label={`Edit ${category.name} category`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="text-red-400 hover:text-red-300 p-1"
                    aria-label={`Delete ${category.name} category`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {category.description && (
              <p className="text-gray-400 text-sm mb-3">{category.description}</p>
            )}

            {/* Feeds in category */}
            <div className="space-y-2 min-h-[100px]">
              <div className="text-xs text-gray-500 mb-2">
                {categorizedFeeds[category.id]?.length || 0} feed(s)
              </div>

              {(categorizedFeeds[category.id] || []).map(feed => (
                <div
                  key={feed.url}
                  className="bg-gray-700 p-2 rounded cursor-move hover:bg-gray-600 transition-colors"
                  draggable
                  onDragStart={(e) => handleDragStart(e, 'feed', feed.url, feed)}
                >
                  <div className="text-sm text-white truncate" title={feed.url}>
                    {feed.customTitle || feed.url}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {feed.url}
                  </div>
                </div>
              ))}

              {category.id === 'uncategorized' && (categorizedFeeds.uncategorized || []).map(feed => (
                <div
                  key={feed.url}
                  className="bg-gray-700 p-2 rounded cursor-move hover:bg-gray-600 transition-colors border-l-4 border-yellow-500"
                  draggable
                  onDragStart={(e) => handleDragStart(e, 'feed', feed.url, feed)}
                >
                  <div className="text-sm text-white truncate" title={feed.url}>
                    {feed.customTitle || feed.url}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {feed.url}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Uncategorized feeds */}
        {(categorizedFeeds.uncategorized || []).length > 0 && (
          <div
            className={`bg-gray-800 rounded-lg p-4 border-2 border-dashed border-yellow-500 transition-all ${
              dragState.dragOverCategory === 'uncategorized' ? 'ring-2 ring-[rgb(var(--color-accent))] bg-gray-700' : ''
            }`}
            onDragOver={(e) => handleDragOver(e, 'uncategorized')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'uncategorized')}
          >
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-4 h-4 rounded-full bg-yellow-500" />
              <h3 className="font-semibold text-white">Uncategorized</h3>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-gray-500 mb-2">
                {categorizedFeeds.uncategorized?.length || 0} feed(s)
              </div>

              {(categorizedFeeds.uncategorized || []).map(feed => (
                <div
                  key={feed.url}
                  className="bg-gray-700 p-2 rounded cursor-move hover:bg-gray-600 transition-colors"
                  draggable
                  onDragStart={(e) => handleDragStart(e, 'feed', feed.url, feed)}
                >
                  <div className="text-sm text-white truncate" title={feed.url}>
                    {feed.customTitle || feed.url}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {feed.url}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-800 rounded-lg">
        <h4 className="font-semibold text-white mb-2">Instructions:</h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Drag feeds between categories to organize them</li>
          <li>• Drag categories to reorder them (custom categories only)</li>
          <li>• Click the edit icon to rename custom categories</li>
          <li>• Export/import categories to share configurations</li>
          <li>• Default categories cannot be deleted or reordered</li>
        </ul>
      </div>
    </div>
  );
};

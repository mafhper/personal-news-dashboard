/**
 * FeedManager.tsx
 *
 * Componente para gerenciamento de feeds RSS no Personal News Dashboard.
 * Permite adicionar, remover e importar feeds via OPML.
 * Integra-se com o gerenciador de categorias para organização de feeds.
 *
 * @author Matheus Pereira
 * @version 2.0.0
 */

import React, { useState, useRef } from "react";
import type { FeedSource } from "../types";
import { parseOpml } from "../services/rssParser";
import { FeedCategoryManager } from "./FeedCategoryManager";

interface FeedManagerProps {
  currentFeeds: FeedSource[];
  setFeeds: React.Dispatch<React.SetStateAction<FeedSource[]>>;
  closeModal: () => void;
}

export const FeedManager: React.FC<FeedManagerProps> = ({
  currentFeeds,
  setFeeds,
  closeModal,
}) => {
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [activeTab, setActiveTab] = useState<"feeds" | "categories">(
    "feeds" as "feeds" | "categories"
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddFeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFeedUrl && !currentFeeds.some((f) => f.url === newFeedUrl)) {
      setFeeds((prev) => [...prev, { url: newFeedUrl }]);
    }
    setNewFeedUrl("");
  };

  const handleRemoveFeed = (urlToRemove: string) => {
    setFeeds((prev) => prev.filter((f) => f.url !== urlToRemove));
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const content = await file.text();
      try {
        const urls = parseOpml(content);
        const newFeeds = urls
          .filter((url) => !currentFeeds.some((f) => f.url === url))
          .map((url) => ({ url }));
        if (newFeeds.length > 0) {
          setFeeds((prev) => [...prev, ...newFeeds]);
        }
        alert(`${newFeeds.length} new feeds imported successfully!`);
      } catch (error) {
        alert(
          "Failed to parse OPML file. Please ensure it's a valid XML file."
        );
        console.error(error);
      }
    }
  };

  if (activeTab === "categories") {
    return (
      <FeedCategoryManager
        feeds={currentFeeds}
        setFeeds={setFeeds}
        onClose={closeModal}
      />
    );
  }

  return (
    <div role="dialog" aria-labelledby="feed-manager-title">
      <div className="flex justify-between items-center mb-6">
        <h2 id="feed-manager-title" className="text-2xl font-bold text-white">
          Manage Feeds
        </h2>
        <button
          onClick={closeModal}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Close feed manager"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab("feeds")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "feeds"
              ? "bg-[rgb(var(--color-accent))] text-white"
              : "text-gray-300 hover:text-white hover:bg-gray-700"
          }`}
        >
          Feeds
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            (activeTab as string) === "categories"
              ? "bg-[rgb(var(--color-accent))] text-white"
              : "text-gray-300 hover:text-white hover:bg-gray-700"
          }`}
        >
          Categories
        </button>
      </div>

      <section aria-labelledby="add-feed-section">
        <h3 id="add-feed-section" className="sr-only">
          Add New Feed
        </h3>
        <form onSubmit={handleAddFeed} className="flex gap-2 mb-6">
          <label htmlFor="feed-url-input" className="sr-only">
            RSS Feed URL
          </label>
          <input
            id="feed-url-input"
            type="url"
            value={newFeedUrl}
            onChange={(e) => setNewFeedUrl(e.target.value)}
            placeholder="https://example.com/rss.xml"
            className="flex-grow bg-gray-700 text-white rounded-md px-4 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))]"
            required
            aria-label="Enter RSS feed URL"
            aria-describedby="feed-url-help"
          />
          <div id="feed-url-help" className="sr-only">
            Enter a valid RSS feed URL to add to your feed list
          </div>
          <button
            type="submit"
            className="bg-[rgb(var(--color-accent))] text-white font-bold px-4 py-2 rounded-md hover:bg-[rgb(var(--color-accent-dark))] transition-colors"
            aria-label="Add RSS feed to list"
          >
            Add
          </button>
        </form>
      </section>

      <section aria-labelledby="current-feeds-section">
        <h3 id="current-feeds-section" className="sr-only">
          Current Feeds
        </h3>
        <div
          className="space-y-3 max-h-60 overflow-y-auto pr-2 mb-6"
          role="list"
          aria-label={`Current RSS feeds (${currentFeeds.length} feeds)`}
        >
          {currentFeeds.length > 0 ? (
            currentFeeds.map((feed, index) => (
              <div
                key={feed.url}
                className="flex justify-between items-center bg-gray-800 p-3 rounded-md"
                role="listitem"
                aria-label={`Feed ${index + 1}: ${feed.url}`}
              >
                <div className="flex-grow">
                  <div
                    className="text-sm text-gray-300 truncate"
                    title={feed.url}
                  >
                    {feed.customTitle || feed.url}
                  </div>
                  {feed.customTitle && (
                    <div className="text-xs text-gray-500 truncate">
                      {feed.url}
                    </div>
                  )}
                  {feed.categoryId && (
                    <div className="text-xs text-[rgb(var(--color-accent))] mt-1">
                      Category: {feed.categoryId}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveFeed(feed.url)}
                  className="text-red-400 hover:text-red-300 font-semibold text-sm ml-2"
                  aria-label={`Remove feed: ${feed.url}`}
                >
                  Remove
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-center" role="status">
              No feeds added yet.
            </p>
          )}
        </div>
      </section>

      <footer className="flex justify-between items-center mt-6 pt-6 border-t border-gray-700">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-gray-600 text-white font-bold px-4 py-2 rounded-md hover:bg-gray-500 transition-colors"
          aria-label="Import feeds from OPML file"
        >
          Import OPML
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileImport}
          accept=".xml,.opml"
          className="hidden"
          aria-label="Select OPML file to import"
        />
        <div className="text-gray-400 text-sm">
          Switch to Categories tab to organize feeds
        </div>
      </footer>
    </div>
  );
};

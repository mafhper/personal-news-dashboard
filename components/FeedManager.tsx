
import React, { useState, useRef } from 'react';
import type { FeedSource } from '../types';
import { parseOpml } from '../services/rssParser';

interface FeedManagerProps {
    currentFeeds: FeedSource[];
    setFeeds: React.Dispatch<React.SetStateAction<FeedSource[]>>;
    closeModal: () => void;
}

export const FeedManager: React.FC<FeedManagerProps> = ({ currentFeeds, setFeeds, closeModal }) => {
    const [newFeedUrl, setNewFeedUrl] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAddFeed = (e: React.FormEvent) => {
        e.preventDefault();
        if (newFeedUrl && !currentFeeds.some(f => f.url === newFeedUrl)) {
            setFeeds(prev => [...prev, { url: newFeedUrl }]);
        }
        setNewFeedUrl('');
    };

    const handleRemoveFeed = (urlToRemove: string) => {
        setFeeds(prev => prev.filter(f => f.url !== urlToRemove));
    };

    const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const content = await file.text();
            try {
                const urls = parseOpml(content);
                const newFeeds = urls
                    .filter(url => !currentFeeds.some(f => f.url === url))
                    .map(url => ({ url }));
                if (newFeeds.length > 0) {
                    setFeeds(prev => [...prev, ...newFeeds]);
                }
                alert(`${newFeeds.length} new feeds imported successfully!`);
            } catch (error) {
                alert("Failed to parse OPML file. Please ensure it's a valid XML file.");
                console.error(error);
            }
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6 text-white">Manage Feeds</h2>

            <form onSubmit={handleAddFeed} className="flex gap-2 mb-6">
                <input
                    type="url"
                    value={newFeedUrl}
                    onChange={(e) => setNewFeedUrl(e.target.value)}
                    placeholder="https://example.com/rss.xml"
                    className="flex-grow bg-gray-700 text-white rounded-md px-4 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))]"
                    required
                />
                <button type="submit" className="bg-[rgb(var(--color-accent))] text-white font-bold px-4 py-2 rounded-md hover:bg-[rgb(var(--color-accent-dark))] transition-colors">
                    Add
                </button>
            </form>
            
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 mb-6">
                {currentFeeds.length > 0 ? currentFeeds.map(feed => (
                    <div key={feed.url} className="flex justify-between items-center bg-gray-800 p-3 rounded-md">
                        <span className="text-sm text-gray-300 truncate w-3/4">{feed.url}</span>
                        <button onClick={() => handleRemoveFeed(feed.url)} className="text-red-400 hover:text-red-300 font-semibold text-sm">
                            Remove
                        </button>
                    </div>
                )) : <p className="text-gray-400 text-center">No feeds added yet.</p>}
            </div>

            <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-700">
                <button onClick={() => fileInputRef.current?.click()} className="bg-gray-600 text-white font-bold px-4 py-2 rounded-md hover:bg-gray-500 transition-colors">
                    Import OPML
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".xml,.opml" className="hidden" />
                <button onClick={closeModal} className="text-gray-400 hover:text-white transition-colors">
                    Close
                </button>
            </div>
        </div>
    );
};


import React, { useState } from 'react';
import type { QuickLink } from '../types';

interface QuickLinksWidgetProps {
    links: QuickLink[];
    setLinks: (links: QuickLink[]) => void;
}

export const QuickLinksWidget: React.FC<QuickLinksWidgetProps> = ({ links, setLinks }) => {
    const [newLinkName, setNewLinkName] = useState('');
    const [newLinkUrl, setNewLinkUrl] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleAddLink = () => {
        if (newLinkName.trim() && newLinkUrl.trim()) {
            const urlWithProtocol = newLinkUrl.startsWith('http') ? newLinkUrl : `https://${newLinkUrl}`;
            setLinks([...links, { name: newLinkName, url: urlWithProtocol }]);
            setNewLinkName('');
            setNewLinkUrl('');
            setIsAdding(false);
        }
    };

    const handleRemoveLink = (urlToRemove: string) => {
        setLinks(links.filter(link => link.url !== urlToRemove));
    };

    const getFaviconUrl = (url: string) => {
        try {
            const urlObj = new URL(url);
            return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
        } catch (e) {
            return '#'; // Invalid URL
        }
    };

    return (
        <div className="bg-gray-800/50 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-3 text-gray-200">Quick Links</h3>
            <div className="space-y-2">
                {links.map(link => (
                    <div key={link.url} className="flex items-center justify-between group">
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 text-[rgb(var(--color-accent))] hover:text-[rgb(var(--color-accent-dark))] transition-colors truncate">
                            <img src={getFaviconUrl(link.url)} alt="" className="w-5 h-5 rounded-sm" />
                            <span className="truncate">{link.name}</span>
                        </a>
                        <button onClick={() => handleRemoveLink(link.url)} className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs">Remove</button>
                    </div>
                ))}
            </div>
            {isAdding ? (
                <div className="mt-4 space-y-2">
                    <input 
                        type="text" 
                        placeholder="Name" 
                        value={newLinkName} 
                        onChange={e => setNewLinkName(e.target.value)}
                        className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))]"
                    />
                    <input 
                        type="text" 
                        placeholder="URL" 
                        value={newLinkUrl} 
                        onChange={e => setNewLinkUrl(e.target.value)}
                        className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))]"
                        onKeyDown={e => e.key === 'Enter' && handleAddLink()}
                    />
                    <div className="flex justify-end space-x-2">
                        <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-white text-sm">Cancel</button>
                        <button onClick={handleAddLink} className="bg-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-accent-dark))] text-white font-bold py-1 px-3 rounded-lg text-sm">Add</button>
                    </div>
                </div>
            ) : (
                <div className="mt-4">
                    <button onClick={() => setIsAdding(true)} className="text-[rgb(var(--color-accent))] hover:text-[rgb(var(--color-accent-dark))] text-sm font-semibold">+ Add New Link</button>
                </div>
            )}
        </div>
    );
};

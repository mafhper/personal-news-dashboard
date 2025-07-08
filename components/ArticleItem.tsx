
import React from 'react';
import type { Article } from '../types';

const ChatBubbleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H9.828a1 1 0 00-.707.293l-2.828 2.828a1 1 0 01-1.414 0l-2.828-2.828A1 1 0 002.172 17H4a2 2 0 01-2-2V5z" />
    </svg>
);

interface ArticleItemProps {
    article: Article;
    index: number;
}

export const ArticleItem: React.FC<ArticleItemProps> = ({ article, index }) => {
    
    const timeSince = (date: Date): string => {
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
        <a href={article.link} target="_blank" rel="noopener noreferrer" className="flex items-start space-x-4 group border-b border-gray-800 pb-5">
            <span className="text-xl font-bold text-gray-600 group-hover:text-[rgb(var(--color-accent))] transition-colors">{index}</span>
            <div className="flex-1">
                <h4 className="font-bold text-base leading-tight text-gray-100 group-hover:underline overflow-hidden text-ellipsis">{article.title}</h4>
                <div className="mt-2 flex items-center space-x-3 text-xs text-gray-400 font-medium">
                    <span className="uppercase text-[rgb(var(--color-accent))] font-bold overflow-hidden text-ellipsis">{article.author || article.sourceTitle}</span>
                    <span className="text-gray-500">{timeSince(article.pubDate)}</span>
                    <span className="flex items-center gap-1 hover:text-white">
                        <ChatBubbleIcon />
                        {Math.floor(Math.random() * 100)}
                    </span>
                </div>
            </div>
            <img 
                src={article.imageUrl || `https://picsum.photos/seed/${article.link}/100/100`} 
                alt="" 
                className="w-20 h-20 object-cover rounded-md" 
            />
        </a>
    );
};

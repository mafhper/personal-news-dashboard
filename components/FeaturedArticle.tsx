
import React from 'react';
import type { Article } from '../types';

const ChatBubbleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
    </svg>
);


export const FeaturedArticle: React.FC<{ article: Article }> = ({ article }) => {
    return (
        <div className="flex h-full">
            <div className="hidden md:flex items-center justify-center mr-4">
                <h2 className="text-7xl font-black uppercase text-gray-200 overflow-hidden text-ellipsis" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', lineHeight: '0.8' }}>
                    {article.sourceTitle.split(' ')[0]}
                </h2>
            </div>
            <div className="relative group flex-1">
                 <a href={article.link} target="_blank" rel="noopener noreferrer" className="block relative h-full">
                    <img 
                        src={article.imageUrl || `https://picsum.photos/seed/${article.link}/800/600`} 
                        alt={article.title} 
                        className="w-full h-full object-cover rounded-md"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent rounded-md"></div>
                    <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                        <h3 className="text-3xl md:text-5xl font-extrabold leading-tight drop-shadow-lg group-hover:underline">
                            {article.title}
                        </h3>
                        <p className="mt-4 text-lg text-gray-200 drop-shadow-md hidden md:block">
                            {article.description}
                        </p>
                        <div className="mt-4 flex items-center space-x-4 text-xs font-bold uppercase text-gray-300">
                            <span>{article.author || article.sourceTitle}</span>
                            <span className="text-gray-500">|</span>
                            <span>{article.pubDate.toLocaleDateString()}</span>
                            <span className="flex items-center gap-1.5 hover:text-white">
                                <ChatBubbleIcon />
                                <span>{Math.floor(Math.random() * 200)}</span>
                            </span>
                        </div>
                    </div>
                </a>
            </div>
        </div>
    );
};

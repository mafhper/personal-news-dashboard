
import React from 'react';
import type { Article } from '../types';

const ChatBubbleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
    </svg>
);


export const FeaturedArticle: React.FC<{ article: Article }> = ({ article }) => {
    return (
        <article className="flex h-full" role="article" aria-labelledby="featured-article-title">
            <div className="hidden lg:flex items-center justify-center mr-4 xl:mr-6" aria-hidden="true">
                <div
                    className="text-6xl lg:text-7xl xl:text-8xl font-black uppercase text-gray-200 overflow-hidden text-ellipsis"
                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', lineHeight: '0.8' }}
                    role="presentation"
                >
                    {article.sourceTitle.split(' ')[0]}
                </div>
            </div>
            <div className="relative group flex-1">
                 <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative h-full"
                    aria-label={`Read featured article: ${article.title} from ${article.author || article.sourceTitle}`}
                >
                    <img
                        src={article.imageUrl || `https://picsum.photos/seed/${article.link}/1200/800`}
                        alt={`Featured image for article: ${article.title}`}
                        className="w-full h-full object-cover rounded-lg shadow-2xl"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent rounded-lg" aria-hidden="true"></div>

                    {/* Source badge */}
                    <div className="absolute top-4 left-4 bg-[rgb(var(--color-accent))]/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        {article.sourceTitle}
                    </div>

                    <div className="absolute inset-x-0 bottom-0 p-6 lg:p-8 xl:p-10 text-white">
                        <h3
                            id="featured-article-title"
                            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-tight drop-shadow-lg group-hover:underline transition-all duration-300"
                            style={{
                                lineHeight: '1.1',
                                textShadow: '0 4px 8px rgba(0,0,0,0.8)'
                            }}
                        >
                            {article.title}
                        </h3>
                        <p className="mt-4 lg:mt-6 text-base lg:text-lg xl:text-xl text-gray-200 drop-shadow-md hidden md:block leading-relaxed max-w-4xl">
                            {article.description}
                        </p>
                        <footer className="mt-4 lg:mt-6 flex items-center space-x-4 lg:space-x-6 text-xs lg:text-sm font-bold uppercase text-gray-300">
                            <span aria-label={`Author: ${article.author || article.sourceTitle}`}>
                                {article.author || article.sourceTitle}
                            </span>
                            <span className="text-gray-500" aria-hidden="true">|</span>
                            <time
                                dateTime={article.pubDate.toISOString()}
                                aria-label={`Published on ${article.pubDate.toLocaleDateString()}`}
                            >
                                {article.pubDate.toLocaleDateString()}
                            </time>
                            <span
                                className="flex items-center gap-1.5 hover:text-white transition-colors duration-200"
                                aria-label={`${Math.floor(Math.random() * 200)} comments`}
                                role="img"
                            >
                                <ChatBubbleIcon />
                                <span>{Math.floor(Math.random() * 200)}</span>
                            </span>
                        </footer>
                    </div>
                </a>
            </div>
        </article>
    );
};

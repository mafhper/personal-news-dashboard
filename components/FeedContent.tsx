
import React from 'react';
import type { Article } from '../types';
import { FeaturedArticle } from './FeaturedArticle';
import { ArticleList } from './ArticleList';



import { WeatherWidget } from './WeatherWidget';

interface FeedContentProps {
    articles: Article[];
    
    timeFormat: '12h' | '24h';
}

export const FeedContent: React.FC<FeedContentProps> = ({ articles, timeFormat }) => {
    if (articles.length === 0) {
        return null;
    }

    const featuredArticle = articles[0];
    const otherArticles = articles.slice(1, 6); // Show next 5 articles in sidebar

    return (
        <div className="grid grid-cols-12 gap-x-8 gap-y-12">
            {/* Featured Article */}
            <div className="col-span-12 lg:col-span-8">
                <FeaturedArticle article={featuredArticle} />
            </div>

            {/* Sidebar */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
                <WeatherWidget timeFormat={timeFormat} />
                
                <ArticleList articles={otherArticles} />
            </div>
        </div>
    );
};

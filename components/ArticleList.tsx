
import React from 'react';
import type { Article } from '../types';
import { ArticleItem } from './ArticleItem';

interface ArticleListProps {
    articles: Article[];
}

export const ArticleList: React.FC<ArticleListProps> = ({ articles }) => {
    return (
        <div>
            <h3 className="text-lg font-bold text-[rgb(var(--color-accent))] mb-4 uppercase tracking-wider">Top Stories</h3>
            <div className="space-y-5">
                {articles.map((article, index) => (
                    <ArticleItem key={article.link + index} article={article} index={index + 1} />
                ))}
            </div>
        </div>
    );
};

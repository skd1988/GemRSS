/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { Article } from '../types.js';
import ArticleCard from './ArticleCard.js';
import ArticleCardSkeleton from './ArticleCardSkeleton.js';

interface NewsCarouselProps {
    title: string;
    articles: Article[];
    isLoading?: boolean;
}

const NewsCarousel: React.FC<NewsCarouselProps> = ({ title, articles, isLoading }) => {
    return (
        <section className="w-full animate-fade-in">
            <h2 className="text-2xl font-bold text-orange-400 mb-4 border-b-2 border-orange-400/30 pb-2">
                {title}
            </h2>
            <div className="flex overflow-x-auto space-x-6 pb-4 ltr:-mx-4 ltr:px-4 rtl:-mx-4 rtl:px-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800/50">
                {isLoading ? (
                    Array.from({ length: 5 }).map((_, index) => <ArticleCardSkeleton key={index} />)
                ) : (
                    articles.map((article) => (
                        <div key={article.url} className="flex-shrink-0 w-80 md:w-96">
                             <ArticleCard article={article} />
                        </div>
                    ))
                )}
                 {/* Add a spacer at the end for better visual padding */}
                <div className="flex-shrink-0 w-1"></div>
            </div>
        </section>
    );
};

export default NewsCarousel;
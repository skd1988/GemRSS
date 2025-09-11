/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { Article } from '../types';
import { useLanguage } from '../hooks/useLanguage';

interface ArticleCardProps {
  article: Article;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  const { t } = useLanguage();
  const [isNew, setIsNew] = useState(article.isNew);

  useEffect(() => {
    // This allows the highlight to be re-triggered if the same article component
    // receives a new `isNew: true` prop in the future, although it's unlikely with the current logic.
    setIsNew(article.isNew);
  }, [article.isNew]);

  useEffect(() => {
    if (isNew) {
      const timer = setTimeout(() => {
        setIsNew(false);
      }, 2000); // Must match the animation duration
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  return (
    <div className={`bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden flex flex-col h-full transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-500/10 ${isNew ? 'animate-highlight-fade-out' : ''}`}>
      {article.imageUrl && (
        <a href={article.url} target="_blank" rel="noopener noreferrer" className="block aspect-video w-full overflow-hidden">
            <img 
                src={article.imageUrl} 
                alt={article.title} 
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" 
            />
        </a>
      )}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-gray-100 mb-2 leading-tight">
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition-colors">
            {article.title}
          </a>
        </h3>
        <p className="text-gray-400 text-sm flex-grow mb-4">{article.summary}</p>
        <div className="mt-auto flex justify-between items-center">
            <span className="text-xs font-semibold bg-orange-400/10 text-orange-300 px-2 py-1 rounded">
                {article.category}
            </span>
             <a 
                href={article.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-sm font-semibold text-orange-400 hover:text-orange-300 transition-colors"
            >
                {t('articleCard.readMore')}
            </a>
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;
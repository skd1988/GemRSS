/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// FIX: Implement the ArticleCard component, replacing placeholder content.
import React from 'react';
import { Article } from '../types';

interface ArticleCardProps {
  article: Article;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5 flex flex-col gap-3 transition-all duration-300 hover:bg-gray-800/80 hover:border-gray-600 hover:shadow-lg hover:-translate-y-1 h-full">
      <h3 className="text-xl font-bold text-gray-100">{article.title}</h3>
      <p className="text-gray-400 flex-grow">{article.summary}</p>
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-orange-400 hover:text-orange-300 font-semibold self-start transition-colors mt-2"
      >
        ادامه مطلب &larr;
      </a>
    </div>
  );
};

export default ArticleCard;
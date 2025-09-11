/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

const ArticleCardSkeleton: React.FC = () => {
  return (
    <div className="flex-shrink-0 w-80 md:w-96 bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
      <div className="animate-pulse flex flex-col">
        <div className="aspect-video w-full bg-gray-700"></div>
        <div className="p-5 space-y-4">
            <div className="h-6 bg-gray-700 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-700 rounded w-5/6"></div>
            </div>
            <div className="h-5 bg-gray-700 rounded w-1/3 mt-2"></div>
        </div>
      </div>
    </div>
  );
};

export default ArticleCardSkeleton;
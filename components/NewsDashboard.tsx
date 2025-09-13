/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import ChatPanel from './ChatPanel.tsx';
import ArticleCard from './ArticleCard.tsx';
import { CategorizedArticles, ChatMessage as ChatMessageType } from '../types.ts';

interface NewsDashboardProps {
    articles: CategorizedArticles;
    chatMessages: ChatMessageType[];
    isChatLoading: boolean;
    onSendMessage: (message: string) => void;
}

const NewsDashboard: React.FC<NewsDashboardProps> = ({ articles, chatMessages, isChatLoading, onSendMessage }) => {
    const categories = Object.keys(articles);

    return (
        <div className="w-full max-w-screen-2xl mx-auto grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-fade-in">
            {/* Chat Panel */}
            <aside className="lg:col-span-1 xl:col-span-1 h-[calc(100vh-150px)] lg:sticky lg:top-24">
                <ChatPanel 
                    messages={chatMessages}
                    isLoading={isChatLoading}
                    onSendMessage={onSendMessage}
                />
            </aside>

            {/* Articles Panel */}
            <div className="lg:col-span-2 xl:col-span-3">
                <div className="flex flex-col gap-12">
                    {categories.map((category) => (
                        <section key={category} id={`category-${category.replace(/\s+/g, '-')}`}>
                            <h2 className="text-3xl font-bold text-orange-400 mb-6 border-b-2 border-orange-400/30 pb-2 sticky top-[80px] bg-gray-900/80 backdrop-blur-sm z-10">
                                {category}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {articles[category].map((article) => (
                                    <ArticleCard key={article.url} article={article} />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default NewsDashboard;
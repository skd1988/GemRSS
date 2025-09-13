/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage as ChatMessageType } from '../types.ts';
import { RssIcon, CopyIcon, ThumbsUpIcon, ThumbsDownIcon, ShareIcon } from './icons.tsx';
import { useLanguage } from '../hooks/useLanguage.ts';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { t } = useLanguage();
  const isUser = message.role === 'user';
  const [isCopied, setIsCopied] = useState(false);
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('chat.shareTitle'),
          text: message.content,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that do not support the Web Share API
      handleCopy();
    }
  };

  return (
    <div className={`flex flex-col items-start gap-2 my-4 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`flex items-start gap-3 w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
          {!isUser && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-orange-600 to-orange-500 flex items-center justify-center">
              <RssIcon className="w-5 h-5 text-white" />
            </div>
          )}
          <div 
            className={`prose-styles max-w-md rounded-xl px-4 py-3 text-base break-words ${
              isUser 
              ? 'bg-blue-600 text-white ltr:rounded-br-none rtl:rounded-bl-none user-bubble' 
              : 'bg-gray-700 text-gray-200 ltr:rounded-bl-none rtl:rounded-br-none'
            }`}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
        </div>
        {!isUser && (
            <div className="flex items-center gap-2 ltr:ml-11 rtl:mr-11">
                <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-full text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition-colors"
                    title={isCopied ? t('chat.copied') : t('chat.copy')}
                    aria-label={isCopied ? t('chat.copied') : t('chat.copy')}
                >
                    <CopyIcon className="w-5 h-5" />
                </button>
                 <button
                    onClick={() => setFeedback(feedback === 'like' ? null : 'like')}
                    className={`p-1.5 rounded-full text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition-colors ${feedback === 'like' ? 'text-green-400 bg-gray-700' : ''}`}
                    title={t('chat.like')}
                    aria-label={t('chat.like')}
                >
                    <ThumbsUpIcon className="w-5 h-5" />
                </button>
                 <button
                    onClick={() => setFeedback(feedback === 'dislike' ? null : 'dislike')}
                    className={`p-1.5 rounded-full text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition-colors ${feedback === 'dislike' ? 'text-red-400 bg-gray-700' : ''}`}
                    title={t('chat.dislike')}
                    aria-label={t('chat.dislike')}
                >
                    <ThumbsDownIcon className="w-5 h-5" />
                </button>
                 <button
                    onClick={handleShare}
                    className="p-1.5 rounded-full text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition-colors"
                    title={t('chat.share')}
                    aria-label={t('chat.share')}
                >
                    <ShareIcon className="w-5 h-5" />
                </button>
            </div>
        )}
    </div>
  );
};

export default ChatMessage;
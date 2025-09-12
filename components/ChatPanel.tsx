/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage as ChatMessageType } from '../types.js';
import { useLanguage } from '../hooks/useLanguage.js';
import { SendIcon } from './icons.js';
import ChatMessage from './ChatMessage.js';
import Spinner from './Spinner.js';

interface ChatPanelProps {
  messages: ChatMessageType[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage, isLoading }) => {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
      <div className="flex-grow p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}
        {isLoading && messages.length > 0 && (
           <div className="flex items-start gap-3 my-4 justify-start">
               <div className="flex items-center gap-2 text-gray-400">
                  <Spinner className="w-6 h-6" />
                  <span>{t('chat.thinking')}</span>
               </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-700 bg-gray-800">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('chat.placeholder')}
            className="flex-grow bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:outline-none transition w-full text-base"
            disabled={isLoading}
            aria-label={t('chat.placeholder')}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex-shrink-0 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-full p-3 transition-colors"
            aria-label={t('chat.sendMessage')}
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;
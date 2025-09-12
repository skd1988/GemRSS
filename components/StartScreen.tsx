

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef } from 'react';
import { useLanguage } from '../hooks/useLanguage.js';

interface StartScreenProps {
  onSummarize: (urls: string[]) => void;
  onSummarizeOpml: (file: File) => void;
  isLoading: boolean;
}

const StartScreen: React.FC<StartScreenProps> = ({ onSummarize, onSummarizeOpml, isLoading }) => {
  const { t } = useLanguage();
  const [url, setUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const urls = url.split('\n').map(u => u.trim()).filter(Boolean);
    if (urls.length > 0) {
      onSummarize(urls);
    }
  };

  const handleExampleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const exampleUrl = 'https://www.theverge.com/rss/index.xml';
    setUrl(exampleUrl);
    onSummarize([exampleUrl]);
  };
  
  const handleOpmlClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSummarizeOpml(file);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto text-center mt-8 sm:mt-12 animate-fade-in">
      <h2 
          className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-100 mb-4"
          dangerouslySetInnerHTML={{ __html: t('startScreen.title') }}
      />
      <p className="text-lg text-gray-400 mb-8">
          {t('startScreen.subtitle')}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full flex-grow relative">
              <label htmlFor="rss-url" className="sr-only">{t('startScreen.rssUrlLabel')}</label>
              <textarea
                  id="rss-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={t('startScreen.placeholder')}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg p-4 text-lg focus:ring-2 focus:ring-orange-500 focus:outline-none transition resize-y min-h-[60px] h-24"
                  rows={3}
                  disabled={isLoading}
                  aria-label={t('startScreen.rssUrlLabel')}
              />
          </div>
          <button
              type="submit"
              className="w-full sm:w-auto bg-gradient-to-br from-orange-600 to-orange-500 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all duration-300 ease-in-out shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-px active:scale-95 disabled:from-gray-600 disabled:to-gray-700 disabled:shadow-none disabled:cursor-not-allowed"
              disabled={isLoading || !url.trim()}
          >
              {t('startScreen.submitButton')}
          </button>
      </form>

      <p className="text-sm text-gray-500 mt-4">
          {t('startScreen.examplePrompt')}{' '}
          <a href="#" onClick={handleExampleClick} className="text-orange-400 hover:underline">
              {t('startScreen.exampleLink')}
          </a>
      </p>

      <div className="flex items-center justify-center gap-4 my-8">
          <div className="h-px flex-grow bg-gray-700"></div>
          <span className="text-gray-500 font-semibold text-lg">{t('startScreen.opmlPrompt')}</span>
          <div className="h-px flex-grow bg-gray-700"></div>
      </div>
      
      <div className="text-center">
          <button 
              onClick={handleOpmlClick} 
              className="text-orange-400 font-semibold text-lg hover:underline"
              disabled={isLoading}
          >
              {t('startScreen.opmlLink')}
          </button>
          <p className="text-gray-500 text-sm mt-1">{t('startScreen.opmlHint')}</p>
          <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange}
              className="hidden" 
              accept=".opml, .xml"
              aria-label={t('startScreen.opmlLabel')}
          />
      </div>
    </div>
  );
};

export default StartScreen;
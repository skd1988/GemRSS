/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { GeopoliticalNews } from '../types';
import { processGeopoliticalFeeds } from '../services/geminiService';
import NewsCarousel from './NewsCarousel';
import ArticleCardSkeleton from './ArticleCardSkeleton';

interface StartScreenProps {
  onSummarize: (url: string) => void;
  onSummarizeOpml: (file: File) => void;
  isLoading: boolean;
}

const PREDEFINED_FEEDS = [
    'https://www.bbc.com/persian/rss.xml',
    'https://www.isna.ir/rss',
    'https://www.tasnimnews.com/fa/rss/feed/0/8/0',
    'https://www.mehrnews.com/rss',
    'https://www.aljazeera.com/xml/rss/all.xml',
    'https://apnews.com/rss/world-news.xml' // Replaced broken Reuters feed
];

const StartScreen: React.FC<StartScreenProps> = ({ onSummarize, onSummarizeOpml, isLoading }) => {
  const [url, setUrl] = useState('');
  const [predefinedNews, setPredefinedNews] = useState<GeopoliticalNews | null>(null);
  const [isPredefinedLoading, setIsPredefinedLoading] = useState(true);
  const [predefinedError, setPredefinedError] = useState<string | null>(null);

  const fetchPredefinedNews = async () => {
    setIsPredefinedLoading(true);
    setPredefinedError(null);
    try {
      const feedPromises = PREDEFINED_FEEDS.map(feedUrl =>
        fetch(`https://corsproxy.io/?${encodeURIComponent(feedUrl)}`)
          .then(res => {
            if (!res.ok) {
              // Log the warning but don't throw, to allow other feeds to process.
              console.warn(`Failed to fetch predefined feed: ${feedUrl}. Status: ${res.status}`);
              return null; // Return null for failed fetches.
            }
            return res.text();
          })
          .catch(err => {
            console.error(`Network error fetching predefined feed: ${feedUrl}`, err);
            return null; // Also return null on network errors.
          })
      );
      
      const feedsResults = await Promise.all(feedPromises);
      const successfulFeeds = feedsResults.filter((content): content is string => content !== null);

      if (successfulFeeds.length === 0) {
        throw new Error("All predefined RSS feeds failed to load.");
      }

      const allFeedsContent = successfulFeeds.join('\n\n---SEPARATOR---\n\n');
      const result = await processGeopoliticalFeeds(allFeedsContent);
      setPredefinedNews(result);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setPredefinedError(`Failed to load predefined news feeds: ${errorMessage}`);
      console.error(e);
    } finally {
      setIsPredefinedLoading(false);
    }
  };

  useEffect(() => {
    fetchPredefinedNews();
    const intervalId = setInterval(fetchPredefinedNews, 3600 * 1000); // Refresh every hour
    return () => clearInterval(intervalId);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSummarize(url.trim());
    }
  };

  const handleExampleClick = () => {
      setUrl('https://www.theverge.com/rss/index.xml');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        onSummarizeOpml(file);
    }
  };
  
  const renderPredefinedNews = () => {
    if (isPredefinedLoading) {
        return (
            <>
                <NewsCarousel title="در حال بارگذاری اخبار..." articles={[]} isLoading={true} />
                <NewsCarousel title="" articles={[]} isLoading={true} />
                <NewsCarousel title="" articles={[]} isLoading={true} />
            </>
        )
    }

    if (predefinedError) {
        return <div className="text-center my-8 bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg">{predefinedError}</div>
    }

    if (!predefinedNews) return null;

    return (
        <div className="flex flex-col gap-10">
            {predefinedNews.supporters_of_resistance?.length > 0 && (
                 <NewsCarousel title="اخبار حامیان مقاومت" articles={predefinedNews.supporters_of_resistance} />
            )}
            {predefinedNews.opponents_of_resistance?.length > 0 && (
                 <NewsCarousel title="اخبار مخالفان مقاومت" articles={predefinedNews.opponents_of_resistance} />
            )}
            {predefinedNews.countries?.map(countryNews =>
                countryNews.articles?.length > 0 && (
                    <NewsCarousel key={countryNews.countryName} title={`اخبار ${countryNews.countryName}`} articles={countryNews.articles} />
                )
            )}
        </div>
    )
  }

  return (
    <div 
      className="w-full max-w-7xl mx-auto text-center p-4 sm:p-8 transition-all duration-300 rounded-2xl"
    >
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-100 sm:text-6xl md:text-7xl">
          اخبار شما، <span className="text-orange-400">به صورت خلاصه</span>.
        </h1>
        <p className="max-w-2xl text-lg text-gray-400 md:text-xl">
          آدرس فید RSS را وارد کنید تا خلاصه‌های مبتنی بر هوش مصنوعی را دریافت کنید که به طور خودکار در دسته‌بندی‌های مختلف مرتب شده‌اند.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 w-full max-w-2xl flex flex-col sm:flex-row items-center gap-3">
            <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/rss"
                className="flex-grow bg-gray-800 border border-gray-700 text-gray-200 rounded-lg p-5 text-lg focus:ring-2 focus:ring-orange-500 focus:outline-none transition w-full"
                required
                disabled={isLoading}
                aria-label="آدرس فید RSS"
            />
            <button
                type="submit"
                className="w-full sm:w-auto bg-gradient-to-br from-orange-600 to-orange-500 text-white font-bold py-5 px-8 text-lg rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner disabled:from-orange-800 disabled:to-orange-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
                disabled={isLoading}
            >
                خلاصه کن
            </button>
        </form>
        <div className="flex flex-col items-center gap-2 mt-2">
            <p className="text-sm text-gray-500">
                به یک مثال نیاز دارید؟{' '}
                <button onClick={handleExampleClick} className="text-orange-400 hover:underline focus:outline-none font-medium">
                    فید RSS سایت The Verge را امتحان کنید.
                </button>
            </p>
            <p className="text-sm text-gray-500">
                یا{' '}
                <label htmlFor="opml-upload" className="text-orange-400 hover:underline focus:outline-none font-medium cursor-pointer">
                    یک فایل OPML آپلود کنید
                </label>
                {' '}
                تا چندین فید را همزمان خلاصه کنید.
                <input 
                    type="file" 
                    id="opml-upload" 
                    className="hidden" 
                    accept=".opml,.xml" 
                    onChange={handleFileChange}
                    disabled={isLoading}
                    aria-label="آپلود فایل OPML"
                />
            </p>
        </div>
      </div>

      <div className="mt-16 w-full text-right">
        <div className="h-px bg-gray-700 w-full my-8"></div>
        {renderPredefinedNews()}
      </div>
    </div>
  );
};

export default StartScreen;
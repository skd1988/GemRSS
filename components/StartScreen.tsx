
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { Article, CountryNews, GeopoliticalNews } from '../types';
import { processGeopoliticalFeeds } from '../services/geminiService';
import NewsCarousel from './NewsCarousel';

interface StartScreenProps {
  onSummarize: (urls: string[]) => void;
  onSummarizeOpml: (file: File) => void;
  isLoading: boolean;
}

const PREDEFINED_FEEDS: string[] = [
    'https://english.almayadeen.net/rss', // Supporters
    'https://english.alarabiya.net/.mrss/en/News.xml', // Opponents
    'https://www.aljazeera.com/xml/rss/all.xml', // Countries
    'https://www.presstv.ir/RSS/MRSS/listings/feed.xml', // Supporters
    'https://www.jpost.com/rss/rssroutes/newsrss.aspx', // Opponents
];

const getCacheKey = (lang: string) => `geopolitical-news-cache-${lang}`;
const getCacheTimestampKey = (lang: string) => `geopolitical-news-cache-timestamp-${lang}`;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

const StartScreen: React.FC<StartScreenProps> = ({ onSummarize, onSummarizeOpml, isLoading }) => {
  const { t, language } = useLanguage();
  const [url, setUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for predefined news
  const [isNewsLoading, setIsNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [supportersNews, setSupportersNews] = useState<Article[]>([]);
  const [opponentsNews, setOpponentsNews] = useState<Article[]>([]);
  const [countryNews, setCountryNews] = useState<CountryNews[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchAllFeeds = async (): Promise<string> => {
        const feedPromises = PREDEFINED_FEEDS.map(url =>
            fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`)
                .then(res => {
                    if (!res.ok) {
                        console.warn(`Failed to fetch predefined feed: ${url}. Status: ${res.status}`);
                        return null;
                    }
                    return res.text();
                })
                .catch(err => {
                    console.error(`Network error fetching predefined feed: ${url}`, err);
                    return null;
                })
        );
        const feedsResults = await Promise.all(feedPromises);
        return feedsResults.filter((content): content is string => content !== null && content.trim() !== '').join('\n\n---SEPARATOR---\n\n');
    };
  
    const mergeNews = (existing: Article[], incoming: Article[]): Article[] => {
        const existingUrls = new Set(existing.map(a => a.url));
        const newArticles = incoming.filter(a => !existingUrls.has(a.url)).map(a => ({...a, isNew: true}));
        
        if (newArticles.length === 0) {
          return existing.map(a => a.isNew ? {...a, isNew: false} : a);
        }
  
        const updatedArticles = [...newArticles, ...existing.map(a => ({...a, isNew: false}))];
        return updatedArticles.slice(0, 15);
    };

    const fetchAndSetNews = async (isBackgroundUpdate = false) => {
        if (!isBackgroundUpdate) {
            setIsNewsLoading(true);
            setNewsError(null);
        }
        try {
            const allFeedsContent = await fetchAllFeeds();
            if (!allFeedsContent || !isMounted) return;

            const processedNews = await processGeopoliticalFeeds(allFeedsContent, language);
            if (!isMounted) return;
            
            localStorage.setItem(getCacheKey(language), JSON.stringify(processedNews));
            localStorage.setItem(getCacheTimestampKey(language), Date.now().toString());
            
            if (isBackgroundUpdate) {
                setSupportersNews(prev => mergeNews(prev, processedNews.supporters_of_resistance));
                setOpponentsNews(prev => mergeNews(prev, processedNews.opponents_of_resistance));
            } else {
                setSupportersNews(processedNews.supporters_of_resistance);
                setOpponentsNews(processedNews.opponents_of_resistance);
            }
            setCountryNews(processedNews.countries);
  
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            console.error(e);
            if (isMounted && !isBackgroundUpdate) {
              setNewsError(t('startScreen.predefinedError', { error: errorMessage }));
            }
        } finally {
            if (isMounted) {
                setIsNewsLoading(false);
            }
        }
    };

    const initialLoad = () => {
        try {
            const cachedNewsRaw = localStorage.getItem(getCacheKey(language));
            const cachedTimestampRaw = localStorage.getItem(getCacheTimestampKey(language));

            if (cachedNewsRaw && cachedTimestampRaw) {
                const cachedTimestamp = parseInt(cachedTimestampRaw, 10);
                const isCacheValid = (Date.now() - cachedTimestamp) < CACHE_DURATION_MS;
                
                if (isCacheValid) {
                    const cachedNews: GeopoliticalNews = JSON.parse(cachedNewsRaw);
                    setSupportersNews(cachedNews.supporters_of_resistance);
                    setOpponentsNews(cachedNews.opponents_of_resistance);
                    setCountryNews(cachedNews.countries);
                    setIsNewsLoading(false);
                    return; // Exit after loading from valid cache
                }
            }
        } catch (error) {
            console.error("Failed to load news from cache:", error);
            localStorage.removeItem(getCacheKey(language));
            localStorage.removeItem(getCacheTimestampKey(language));
        }

        // Fetch fresh if cache is missing, invalid, or stale
        fetchAndSetNews(false);
    };
    
    initialLoad();

    const intervalId = setInterval(() => fetchAndSetNews(true), CACHE_DURATION_MS);

    return () => {
        isMounted = false;
        clearInterval(intervalId);
    };
  }, [language, t]);

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
    <div className="w-full max-w-7xl mx-auto animate-fade-in flex flex-col gap-12">
        {/* Form Section */}
        <div className="w-full max-w-2xl mx-auto text-center mt-8 sm:mt-12">
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

            <div className="mt-8 text-center">
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

        {/* Separator */}
        <div className="flex items-center justify-center gap-4">
            <div className="h-px flex-grow bg-gray-700"></div>
            <span className="text-gray-500 font-semibold text-lg">{t('startScreen.opmlPrompt')}</span>
            <div className="h-px flex-grow bg-gray-700"></div>
        </div>
        
        {/* News Section */}
        <div className="w-full flex flex-col gap-10">
            {newsError && (
                <div className="text-center bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg max-w-4xl mx-auto">
                    <p>{newsError}</p>
                </div>
            )}
            <NewsCarousel title={t('startScreen.supporters')} articles={supportersNews} isLoading={isNewsLoading} />
            <NewsCarousel title={t('startScreen.opponents')} articles={opponentsNews} isLoading={isNewsLoading} />
            {isNewsLoading && !countryNews.length ? (
                <NewsCarousel title={t('startScreen.predefinedLoading')} articles={[]} isLoading={true} />
            ) : (
                countryNews.map(country => (
                    <NewsCarousel 
                        key={country.countryName} 
                        title={t('startScreen.countryNews', { countryName: country.countryName })}
                        articles={country.articles} 
                    />
                ))
            )}
        </div>
    </div>
  );
};

export default StartScreen;
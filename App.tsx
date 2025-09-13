/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import Header from './components/Header.tsx';
import Spinner from './components/Spinner.tsx';
import SettingsModal from './components/SettingsModal.tsx';
import NewsDashboard from './components/NewsDashboard.tsx';
import { summarizeAndCategorize, startChatSession } from './services/geminiService.ts';
import { CategorizedArticles, InoreaderCredentials, ChatMessage, CachedData, InoreaderArticle } from './types.ts';
import { useLanguage } from './hooks/useLanguage.ts';
import type { Chat } from '@google/genai';

export const REDIRECT_URI = window.location.origin + window.location.pathname;

// Predefined list of RSS feeds
const PREDEFINED_FEEDS = [
  'https://www.inoreader.com/stream/user/1003884159/tag/%D8%A7%D9%81%D8%B1%DB%8C%D9%82%D8%A7',
  'https://www.inoreader.com/stream/user/1003884159/tag/%D9%84%D8%A8%D9%86%D8%A7%D9%86',
  'https://www.inoreader.com/stream/user/1003884159/tag/%D8%B9%D8%B1%D8%A8%D8%B3%D8%AA%D8%A7%D9%86',
  'https://www.inoreader.com/stream/user/1003884159/tag/%D8%B9%D8%B1%D8%A7%D9%82',
  'https://www.inoreader.com/stream/user/1003884159/tag/%D8%B9%D8%A8%D8%B1%DB%8C',
  'https://www.inoreader.com/stream/user/1003884159/tag/%D8%B3%D9%88%D8%B1%DB%8C%D9%87',
  'https://www.inoreader.com/stream/user/1003884159/tag/%D8%AE%D8%A8%D8%B1%20%DA%AF%D8%B2%D8%A7%D8%B1%DB%8C%20%D9%87%D8%A7%DB%8C%20%D8%A8%DB%8C%D9%86%20%D8%A7%D9%84%D9%85%D9%84%D9%84%DB%8C',
  'https://www.inoreader.com/stream/user/1003884159/tag/%D8%A7%D9%86%D8%AF%DB%8C%D8%B4%DA%A9%D8%AF%D9%87%20%D9%87%D8%A7'
];
const CACHE_KEY = 'news_cache_data';
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

function App() {
  const { language, t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [articles, setArticles] = useState<CategorizedArticles | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [inoreaderCredentials, setInoreaderCredentials] = useState<InoreaderCredentials | null>(null);
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);

  const handleSaveInoreaderCredentials = (credentials: InoreaderCredentials) => {
    localStorage.setItem('inoreader_credentials', JSON.stringify(credentials));
    setInoreaderCredentials(credentials);
  };
  
  const handleSaveGeminiApiKey = (apiKey: string) => {
    localStorage.setItem('gemini_api_key', apiKey);
    setGeminiApiKey(apiKey);
  };

  const exchangeCodeForToken = async (code: string) => {
    setIsLoading(true);
    setLoadingMessage(t('app.authMessage'));
    setError(null);

    const savedCredsString = localStorage.getItem('inoreader_temp_credentials');
    if (!savedCredsString) {
      setError(t('app.inoreaderCredsError'));
      setIsLoading(false);
      return;
    }

    try {
      const { clientId, clientSecret } = JSON.parse(savedCredsString);
      
      const tokenUrl = `https://corsproxy.io/?https://www.inoreader.com/oauth2/token`;
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: REDIRECT_URI,
          grant_type: 'authorization_code',
        }),
      });
      
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error_description || data.error || `Failed to exchange code for token. Status: ${response.status}`);
      }
      
      const expiresAt = Date.now() + ((data.expires_in || 3600) * 1000); // Default to 1 hour
      const newCredentials = { token: data.access_token, refreshToken: data.refresh_token, expiresAt, clientId, clientSecret };
      handleSaveInoreaderCredentials(newCredentials);
      localStorage.removeItem('inoreader_temp_credentials');
      setIsSettingsModalOpen(true);

    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        setError(t('app.inoreaderAuthFailed', { error: errorMessage }));
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleRedirectUrlSubmit = async (url: string) => {
    setError(null);
    if (!url.trim()){
        setError(t('settingsModal.pasteRedirectPrompt'));
        return;
    }

    try {
      const redirectUrl = new URL(url);
      const code = redirectUrl.searchParams.get('code');
      const state = redirectUrl.searchParams.get('state');
      const errorParam = redirectUrl.searchParams.get('error');

      if (errorParam) {
        const errorDescription = redirectUrl.searchParams.get('error_description');
        throw new Error(`Inoreader returned an error: ${errorParam} - ${errorDescription || 'No description provided.'}`);
      }
      
      const storedState = localStorage.getItem('inoreader_oauth_state');
      localStorage.removeItem('inoreader_oauth_state');

      if (!state || state !== storedState) {
        throw new Error("State mismatch. This could indicate a security issue. Please try generating the authentication link again.");
      }

      if (!code) {
        throw new Error("Could not find the authorization code in the provided URL.");
      }

      await exchangeCodeForToken(code);

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred while parsing the redirect URL.';
      setError(t('app.summarizeError', { error: errorMessage }));
      localStorage.removeItem('inoreader_oauth_state');
    }
  };
  
  const handleClearInoreaderCredentials = () => {
    localStorage.removeItem('inoreader_credentials');
    localStorage.removeItem('inoreader_temp_credentials');
    localStorage.removeItem('inoreader_oauth_state');
    setInoreaderCredentials(null);
  };

  const fetchInoreaderFeed = async (url: string, credentials: InoreaderCredentials): Promise<string> => {
    const getStreamId = (inoreaderUrl: string): string => {
        try {
            const urlObj = new URL(inoreaderUrl);
            const path = urlObj.pathname;
            const apiMatch = path.match(/\/reader\/api\/0\/stream\/contents\/(.*)/);
            if (apiMatch && apiMatch[1]) return decodeURIComponent(apiMatch[1]);
            const streamMatch = path.match(/^\/stream\/(.*)/);
            if (streamMatch && streamMatch[1]) return decodeURIComponent(streamMatch[1]);
            if (path.endsWith('/all_articles')) return 'user/-/state/com.google/reading-list';
            const folderMatch = path.match(/^\/(?:folder|tag)\/(.*)/);
            if (folderMatch && folderMatch[1]) return `user/-/label/${decodeURIComponent(folderMatch[1])}`;
            const feedMatch = path.match(/^\/feed\/(.*)/);
            if (feedMatch && feedMatch[1]) return `feed/${decodeURIComponent(feedMatch[1])}`;
        } catch(e) { console.error("Could not parse Inoreader URL:", inoreaderUrl, e); }
        throw new Error('Invalid or unsupported Inoreader URL format.');
    };

    const streamId = getStreamId(url);
    const encodedStreamId = encodeURIComponent(streamId);
    const apiUrl = `https://corsproxy.io/?https://www.inoreader.com/reader/api/0/stream/contents/${encodedStreamId}?n=50`;

    const response = await fetch(apiUrl, {
        headers: { 
          'Authorization': `Bearer ${credentials.token}`,
          'AppId': credentials.clientId,
          'AppKey': credentials.clientSecret,
        }
    });

    if (response.status === 401 || response.status === 403) {
        const authError = new Error(`Inoreader authentication failed (Status ${response.status}).`);
        authError.name = 'InoreaderAuthError';
        throw authError;
    }
    if (!response.ok) throw new Error(`Failed to fetch Inoreader feed. Status: ${response.status}`);
    const data = await response.json();
    if (!data || !Array.isArray(data.items)) throw new Error('Inoreader API returned an unexpected response format.');
    
    const feedContent = data.items.map((item: InoreaderArticle) => {
        const summaryText = new DOMParser().parseFromString(item.summary.content, 'text/html').body.textContent || '';
        const link = item.canonical?.[0]?.href || '#';
        return `<item><title><![CDATA[${item.title}]]></title><link>${link}</link><description><![CDATA[${summaryText}]]></description></item>`.trim();
    }).join('\n');
    
    return `<rss><channel>${feedContent}</channel></rss>`;
  };

  const refreshToken = async (creds: InoreaderCredentials): Promise<InoreaderCredentials> => {
    if (!creds.refreshToken) {
      handleClearInoreaderCredentials();
      throw new Error(t('app.sessionExpired'));
    }

    setLoadingMessage(t('app.refreshTokenMessage'));
    try {
      const tokenUrl = `https://corsproxy.io/?https://www.inoreader.com/oauth2/token`;
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: creds.clientId,
          client_secret: creds.clientSecret,
          refresh_token: creds.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error_description || data.error || `Failed to refresh token. Status: ${response.status}`);
      }

      const newCredentials: InoreaderCredentials = {
        ...creds,
        token: data.access_token,
        refreshToken: data.refresh_token || creds.refreshToken,
        expiresAt: Date.now() + ((data.expires_in || 3600) * 1000),
      };
      
      handleSaveInoreaderCredentials(newCredentials);
      return newCredentials;

    } catch (e) {
      handleClearInoreaderCredentials();
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      throw new Error(t('app.refreshTokenError', { error: errorMessage }));
    }
  };

  const loadAndSummarizeNews = async () => {
    setIsLoading(true);
    setError(null);
    setChatHistory([]);
    setLoadingMessage(t('app.loadingMessage'));
    
    try {
      if (!geminiApiKey) {
        throw new Error(t('app.geminiKeyNeeded'));
      }
      
      let currentCreds = inoreaderCredentials;
      if (!currentCreds || !currentCreds.token) {
        throw new Error(t('app.inoreaderCredsNeeded'));
      }

      // Proactive refresh if token is expired based on timestamp
      if (currentCreds.expiresAt && currentCreds.expiresAt < Date.now()) {
        currentCreds = await refreshToken(currentCreds);
      }

      const successfulFeeds: string[] = [];
      
      for (const url of PREDEFINED_FEEDS) {
          try {
              let feedContent = await fetchInoreaderFeed(url, currentCreds);
              successfulFeeds.push(feedContent);
          } catch (error) {
              if (error instanceof Error && error.name === 'InoreaderAuthError') {
                  console.warn(`Auth error for ${url}, attempting token refresh...`);
                  try {
                      currentCreds = await refreshToken(currentCreds);
                      // Retry fetching the same feed with the new token
                      let feedContent = await fetchInoreaderFeed(url, currentCreds);
                      successfulFeeds.push(feedContent);
                      console.log(`Successfully fetched ${url} after token refresh.`);
                  } catch (refreshError) {
                      console.error(`Failed to refresh token after auth error for ${url}:`, refreshError);
                      // If refresh fails, we can't continue. Throw the refresh error.
                      throw refreshError; 
                  }
              } else {
                  // For other non-auth errors, log it and continue to the next feed
                  console.error(`Failed to fetch feed ${url}:`, error);
              }
          }
      }
      
      if (successfulFeeds.length === 0) {
        throw new Error(t('app.allFeedsFetchError'));
      }
      
      setLoadingMessage(t('app.loadingMessage')); // Reset message after potential refresh
      const allFeedsContent = successfulFeeds.join('\n\n---SEPARATOR---\n\n');
      if (!allFeedsContent.trim()) {
        throw new Error(t('app.emptyFeedError'));
      }
      
      const categorizedArticles = await summarizeAndCategorize(geminiApiKey, allFeedsContent, language);
      setArticles(categorizedArticles);
      
      const cacheData: CachedData = { articles: categorizedArticles, timestamp: Date.now() };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      
      setIsChatLoading(true);
      const { chat, initialMessage } = await startChatSession(geminiApiKey, categorizedArticles, language);
      setChatSession(chat);
      setChatHistory([{ role: 'model', content: initialMessage }]);

    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(t('app.summarizeError', { error: errorMessage }));
      localStorage.removeItem(CACHE_KEY); // Clear cache on error
    } finally {
      setIsLoading(false);
      setIsChatLoading(false);
    }
  }

  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini_api_key');
    if (savedApiKey) {
      setGeminiApiKey(savedApiKey);
    }
    
    const savedCreds = localStorage.getItem('inoreader_credentials');
    if (savedCreds) {
      try {
        setInoreaderCredentials(JSON.parse(savedCreds));
      } catch (e) {
        console.error("Failed to parse Inoreader credentials from localStorage", e);
        localStorage.removeItem('inoreader_credentials');
      }
    }

    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      if (code) {
        window.history.replaceState({}, document.title, window.location.pathname);
        const storedState = localStorage.getItem('inoreader_oauth_state');
        localStorage.removeItem('inoreader_oauth_state');
        const state = urlParams.get('state');
        if (state !== storedState) {
          setError(t('app.authFailed', { error: "State mismatch." }));
          return;
        }
        await exchangeCodeForToken(code);
      }
    };
    handleOAuthCallback();
  }, [t]);

  useEffect(() => {
    if (!geminiApiKey || !inoreaderCredentials) {
        if (!geminiApiKey) setLoadingMessage(t('app.geminiKeyNeeded'));
        else if (!inoreaderCredentials) setLoadingMessage(t('app.inoreaderCredsNeeded'));
        setIsLoading(false); // Stop loading to show the message
        return;
    }
    
    const cachedDataString = localStorage.getItem(CACHE_KEY);
    if (cachedDataString) {
      try {
        const cachedData: CachedData = JSON.parse(cachedDataString);
        if (Date.now() - cachedData.timestamp < CACHE_DURATION_MS) {
          // Cache is fresh, load it
          setArticles(cachedData.articles);
          setIsLoading(false);
          setIsChatLoading(true);
          startChatSession(geminiApiKey, cachedData.articles, language)
            .then(({ chat, initialMessage }) => {
                setChatSession(chat);
                setChatHistory([{ role: 'model', content: initialMessage }]);
            })
            .catch(e => setError(t('app.chatError', { error: e.message })))
            .finally(() => setIsChatLoading(false));
          return;
        }
      } catch (e) {
        console.error("Failed to parse cached data", e);
        localStorage.removeItem(CACHE_KEY);
      }
    }

    // No fresh cache, fetch new data
    loadAndSummarizeNews();
  }, [geminiApiKey, inoreaderCredentials, language, t]);

  const handleSendMessage = async (message: string) => {
    if (!chatSession) {
      const errorBotMessage: ChatMessage = { role: 'model', content: t('app.chatError', { error: "Chat session not initialized." }) };
      setChatHistory(prev => [...prev, errorBotMessage]);
      return;
    }

    const newUserMessage: ChatMessage = { role: 'user', content: message };
    setChatHistory(prev => [...prev, newUserMessage]);
    setIsChatLoading(true);

    try {
      const response = await chatSession.sendMessage({ message });
      const newBotMessage: ChatMessage = { role: 'model', content: response.text };
      setChatHistory(prev => [...prev, newBotMessage]);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      const errorBotMessage: ChatMessage = { role: 'model', content: t('app.chatError', { error: errorMessage }) };
      setChatHistory(prev => [...prev, errorBotMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 text-center mt-12">
          <Spinner />
          <p className="text-gray-300 text-lg animate-pulse">{loadingMessage}</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="text-center mt-12 bg-red-900/50 border border-red-700 text-red-300 p-6 rounded-lg max-w-2xl mx-auto">
          <h2 className="text-xl font-bold mb-2">{t('app.error')}</h2>
          <p>{error}</p>
        </div>
      );
    }

    if (!geminiApiKey) {
       return (
        <div className="text-center mt-12 bg-yellow-900/50 border border-yellow-700 text-yellow-300 p-6 rounded-lg max-w-2xl mx-auto">
          <h2 className="text-xl font-bold mb-2">{t('app.geminiKeyNeededTitle')}</h2>
          <p>{t('app.geminiKeyNeeded')}</p>
        </div>
      );
    }

    if (!inoreaderCredentials) {
       return (
        <div className="text-center mt-12 bg-yellow-900/50 border border-yellow-700 text-yellow-300 p-6 rounded-lg max-w-2xl mx-auto">
          <h2 className="text-xl font-bold mb-2">{t('app.inoreaderCredsNeededTitle')}</h2>
          <p>{t('app.inoreaderCredsNeeded')}</p>
        </div>
      );
    }
    
    return (
      <NewsDashboard
          articles={articles || {}}
          chatMessages={chatHistory}
          isChatLoading={isChatLoading}
          onSendMessage={handleSendMessage}
      />
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <Header onToggleSettings={() => setIsSettingsModalOpen(true)} />
      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        inoreaderCredentials={inoreaderCredentials}
        geminiApiKey={geminiApiKey}
        onRedirectUrlSubmit={handleRedirectUrlSubmit}
        onClearInoreaderCredentials={handleClearInoreaderCredentials}
        onSaveGeminiApiKey={handleSaveGeminiApiKey}
      />
      <main className="container mx-auto px-4 py-8">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
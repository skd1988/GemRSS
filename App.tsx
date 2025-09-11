/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import StartScreen from './components/StartScreen';
import Spinner from './components/Spinner';
import ArticleCard from './components/ArticleCard';
import SettingsModal from './components/SettingsModal';
import { summarizeAndCategorize } from './services/geminiService';
import { CategorizedArticles, InoreaderArticle, InoreaderCredentials } from './types';

export const REDIRECT_URI = 'http://localhost:8999/callback';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Summarizing articles... this may take a moment.");
  const [error, setError] = useState<string | null>(null);
  const [articles, setArticles] = useState<CategorizedArticles | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [inoreaderCredentials, setInoreaderCredentials] = useState<InoreaderCredentials | null>(null);

  const handleSaveInoreaderCredentials = (credentials: InoreaderCredentials) => {
    localStorage.setItem('inoreader_credentials', JSON.stringify(credentials));
    setInoreaderCredentials(credentials);
  };

  const exchangeCodeForToken = async (code: string) => {
    setIsLoading(true);
    setLoadingMessage("Authenticating with Inoreader...");
    setError(null);

    const savedCredsString = localStorage.getItem('inoreader_temp_credentials');
    if (!savedCredsString) {
      setError("Authentication failed: Could not find temporary credentials. Please generate the authentication link again.");
      setIsLoading(false);
      return;
    }

    try {
      const { clientId, clientSecret } = JSON.parse(savedCredsString);
      
      const tokenUrl = `https://corsproxy.io/?https://www.inoreader.com/oauth2/token`;
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
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
      
      const newCredentials = { token: data.access_token, clientId, clientSecret };
      handleSaveInoreaderCredentials(newCredentials);
      localStorage.removeItem('inoreader_temp_credentials'); // Clean up on success
      setIsSettingsModalOpen(true); // Re-open settings to show success

    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        setError(`Inoreader authentication failed: ${errorMessage}`);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
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
      const state = urlParams.get('state');
      const errorParam = urlParams.get('error');

      if (code && state) {
        window.history.replaceState({}, document.title, window.location.pathname);
        const storedState = localStorage.getItem('inoreader_oauth_state');
        localStorage.removeItem('inoreader_oauth_state');
        
        if (state !== storedState) {
          setError("Authentication failed: State mismatch. Please try generating the auth link again.");
          return;
        }
        await exchangeCodeForToken(code);

      } else if (errorParam) {
        window.history.replaceState({}, document.title, window.location.pathname);
        const errorDescription = urlParams.get('error_description');
        setError(`Inoreader authentication failed: ${errorParam} - ${errorDescription || 'No description provided.'}`);
        localStorage.removeItem('inoreader_oauth_state');
      }
    };

    handleOAuthCallback();
  }, []);

  const handleRedirectUrlSubmit = async (url: string) => {
    setError(null);
    if (!url.trim()){
        setError("Please paste the full URL from the page you were redirected to.");
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
        throw new Error("Authentication failed: State mismatch. This could indicate a security issue. Please try generating the authentication link again.");
      }

      if (!code) {
        throw new Error("Authentication failed: Could not find the authorization code in the provided URL.");
      }

      await exchangeCodeForToken(code);

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred while parsing the redirect URL.';
      setError(`An error occurred: ${errorMessage}`);
      localStorage.removeItem('inoreader_oauth_state'); // Ensure cleanup on error
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

        } catch(e) {
            console.error("Could not parse Inoreader URL:", inoreaderUrl, e);
        }
        
        throw new Error('Invalid or unsupported Inoreader URL format. Could not determine stream ID. Supported formats include URLs for "All Articles", Folders, Tags, or specific Feeds.');
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
        localStorage.removeItem('inoreader_credentials');
        setInoreaderCredentials(null);
        throw new Error(`Inoreader authentication failed (Status ${response.status}). Your credentials (Token, Client ID, or Client Secret) may be invalid or expired. Please check them in Settings.`);
    }

    if (!response.ok) {
        throw new Error(`Failed to fetch Inoreader feed. Status: ${response.status}`);
    }

    const data = await response.json();

    if (!data || !Array.isArray(data.items)) {
        throw new Error('Inoreader API returned an unexpected response format. The feed might be empty or there was an issue with the request.');
    }
    
    const feedContent = data.items.map((item: InoreaderArticle) => {
        const summaryText = new DOMParser().parseFromString(item.summary.content, 'text/html').body.textContent || '';
        const link = item.canonical?.[0]?.href || '#';
        return `
<item>
  <title><![CDATA[${item.title}]]></title>
  <link>${link}</link>
  <description><![CDATA[${summaryText}]]></description>
</item>
        `.trim();
    }).join('\n');
    
    return `<rss><channel>${feedContent}</channel></rss>`;
  };

  const handleSummarize = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setArticles(null);
    setLoadingMessage("Summarizing articles... this may take a moment.");

    try {
      let rssContent = '';
      const hasAllCredentials = inoreaderCredentials && inoreaderCredentials.token && inoreaderCredentials.clientId && inoreaderCredentials.clientSecret;

      if (url.includes('inoreader.com') && hasAllCredentials) {
        rssContent = await fetchInoreaderFeed(url, inoreaderCredentials);
      } else {
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
        const rssResponse = await fetch(proxyUrl);
        
        if (!rssResponse.ok) {
           if (url.includes('inoreader.com')) {
            throw new Error(`Failed to fetch Inoreader feed. This might be a private feed requiring full credentials. Please add your Token, Client ID, and Client Secret in Settings. Status: ${rssResponse.status}`);
          }
          throw new Error(`Failed to fetch RSS feed. Status: ${rssResponse.status}`);
        }
        
        rssContent = await rssResponse.text();
      }

      if (!rssContent.trim()) {
        throw new Error('Feed is empty or could not be read.');
      }

      const categorizedArticles = await summarizeAndCategorize(rssContent);
      setArticles(categorizedArticles);

    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`An error occurred: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummarizeOpml = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setArticles(null);
    setLoadingMessage("Summarizing articles... this may take a moment.");

    try {
        const opmlContent = await file.text();
        const parser = new DOMParser();
        const opmlDoc = parser.parseFromString(opmlContent, 'text/xml');
        
        const outlines = opmlDoc.querySelectorAll('outline[xmlUrl]');
        const urls = Array.from(outlines).map(outline => outline.getAttribute('xmlUrl')).filter((url): url is string => url !== null);

        if (urls.length === 0) {
            throw new Error('No valid RSS feed URLs found in the OPML file.');
        }

        const hasAllCredentials = inoreaderCredentials && inoreaderCredentials.token && inoreaderCredentials.clientId && inoreaderCredentials.clientSecret;
        const feedPromises = urls.map(url => {
          if (url.includes('inoreader.com') && hasAllCredentials) {
            return fetchInoreaderFeed(url, inoreaderCredentials)
              .catch(err => {
                console.error(`Error fetching authenticated Inoreader feed from OPML: ${url}`, err);
                return null;
              });
          } else {
            return fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`)
              .then(res => {
                  if (!res.ok) {
                      console.warn(`Failed to fetch feed from OPML: ${url}. Status: ${res.status}`);
                      if (url.includes('inoreader.com')) {
                          console.warn(`Hint: The above Inoreader feed might be private. Add full credentials in Settings to access it.`);
                      }
                      return null;
                  }
                  return res.text();
              })
              .catch(err => {
                  console.error(`Network error fetching feed from OPML: ${url}`, err);
                  return null;
              });
          }
        });

        const feedsResults = await Promise.all(feedPromises);
        const successfulFeeds = feedsResults.filter((content): content is string => content !== null && content.trim() !== '');
        
        if (successfulFeeds.length === 0) {
            throw new Error("Could not fetch any of the feeds from the OPML file. This may be due to failed requests or private Inoreader feeds requiring credentials.");
        }
        
        const allFeedsContent = successfulFeeds.join('\n\n---SEPARATOR---\n\n');
        const categorizedArticles = await summarizeAndCategorize(allFeedsContent);
        setArticles(categorizedArticles);

    } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        setError(`An error occurred while processing the OPML file: ${errorMessage}`);
    } finally {
        setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 text-center mt-12">
          <Spinner />
          <p className="text-gray-300 text-lg animate-pulse">
            {loadingMessage}
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center mt-12 bg-red-900/50 border border-red-700 text-red-300 p-6 rounded-lg max-w-2xl mx-auto">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      );
    }
    
    if (articles) {
      const categories = Object.keys(articles);
      if (categories.length === 0) {
        return <p className="text-center text-gray-400 mt-12">No articles could be summarized from this feed.</p>
      }
      return (
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-12 animate-fade-in">
          {categories.map((category) => (
            <section key={category}>
              <h2 className="text-3xl font-bold text-orange-400 mb-6 border-b-2 border-orange-400/30 pb-2">
                {category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles[category].map((article) => (
                  <ArticleCard key={article.url} article={article} />
                ))}
              </div>
            </section>
          ))}
        </div>
      );
    }

    return <StartScreen onSummarize={handleSummarize} onSummarizeOpml={handleSummarizeOpml} isLoading={isLoading} />;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <Header onToggleSettings={() => setIsSettingsModalOpen(true)} />
      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentCredentials={inoreaderCredentials}
        onRedirectUrlSubmit={handleRedirectUrlSubmit}
        onClearCredentials={handleClearInoreaderCredentials}
      />
      <main className="container mx-auto px-4 py-8">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
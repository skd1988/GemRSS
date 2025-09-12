/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { InoreaderCredentials } from '../types.js';
import { REDIRECT_URI } from '../App.js';
import { useLanguage } from '../hooks/useLanguage.js';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  inoreaderCredentials: InoreaderCredentials | null;
  geminiApiKey: string | null;
  onRedirectUrlSubmit: (url: string) => void;
  onClearInoreaderCredentials: () => void;
  onSaveGeminiApiKey: (apiKey: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, 
    onClose, 
    inoreaderCredentials, 
    geminiApiKey,
    onRedirectUrlSubmit, 
    onClearInoreaderCredentials,
    onSaveGeminiApiKey
}) => {
  const { t } = useLanguage();
  // Inoreader state
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState('');
  // Gemini state
  const [currentGeminiKey, setCurrentGeminiKey] = useState('');

  useEffect(() => {
    if (isOpen) {
      setClientId(inoreaderCredentials?.clientId || '');
      setClientSecret(inoreaderCredentials?.clientSecret || '');
      setCurrentGeminiKey(geminiApiKey || '');
      setAuthUrl(null);
      setRedirectUrl('');
    }
  }, [inoreaderCredentials, geminiApiKey, isOpen]);

  if (!isOpen) return null;

  const handleGenerateLink = () => {
    if (clientId.trim() && clientSecret.trim()) {
      const state = crypto.randomUUID();
      localStorage.setItem('inoreader_oauth_state', state);
      localStorage.setItem('inoreader_temp_credentials', JSON.stringify({ clientId, clientSecret }));
      const generatedAuthUrl = `https://www.inoreader.com/oauth2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=read&state=${encodeURIComponent(state)}`;
      setAuthUrl(generatedAuthUrl);
    }
  };

  const handleCompleteConnection = () => {
    onRedirectUrlSubmit(redirectUrl);
  };
  
  const handleSaveGeminiKey = () => {
    if (currentGeminiKey.trim()) {
        onSaveGeminiApiKey(currentGeminiKey.trim());
        onClose();
    }
  };

  const handleClearInoreader = () => {
    onClearInoreaderCredentials();
    setAuthUrl(null);
    setRedirectUrl('');
  };

  const isInoreaderConnected = !!(inoreaderCredentials && inoreaderCredentials.token);

  const renderInoreaderConnectionForm = () => {
    if (!authUrl) {
        return (
            <div className="space-y-4">
                <div>
                  <label htmlFor="inoreader-clientid" className="block text-sm font-medium text-gray-300 mb-1">{t('settingsModal.clientIdLabel')}</label>
                  <input
                    id="inoreader-clientid"
                    type="text"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder={t('settingsModal.clientIdPlaceholder')}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
                    disabled={isInoreaderConnected}
                  />
                </div>
                <div>
                  <label htmlFor="inoreader-clientsecret" className="block text-sm font-medium text-gray-300 mb-1">{t('settingsModal.clientSecretLabel')}</label>
                  <input
                    id="inoreader-clientsecret"
                    type="text"
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    placeholder={t('settingsModal.clientSecretPlaceholder')}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
                    disabled={isInoreaderConnected}
                  />
                </div>
                <div className="pt-2">
                    <button
                        onClick={handleGenerateLink}
                        disabled={!clientId.trim() || !clientSecret.trim()}
                        className="w-full bg-gradient-to-br from-orange-600 to-orange-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-px active:scale-95 disabled:from-gray-600 disabled:to-gray-700 disabled:shadow-none disabled:cursor-not-allowed"
                    >
                        {t('settingsModal.generateLinkButton')}
                    </button>
                </div>
            </div>
        );
    } else {
        return (
            <div className="space-y-4 pt-2 animate-fade-in">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('settingsModal.authLinkStep1')}</label>
                    <input
                        type="text"
                        readOnly
                        value={authUrl}
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
                        onFocus={(e) => e.target.select()}
                        aria-label={t('settingsModal.authLinkLabel')}
                    />
                </div>
                 <div>
                    <label htmlFor="redirect-url" className="block text-sm font-medium text-gray-300 mb-2">{t('settingsModal.authLinkStep2')}</label>
                    <input
                        id="redirect-url"
                        type="text"
                        value={redirectUrl}
                        onChange={(e) => setRedirectUrl(e.target.value)}
                        placeholder={t('settingsModal.redirectUrlPlaceholder')}
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
                        aria-label={t('settingsModal.redirectUrlLabel')}
                    />
                </div>
                <div>
                    <button
                        onClick={handleCompleteConnection}
                        disabled={!redirectUrl.trim()}
                        className="w-full bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-px active:scale-95 disabled:from-gray-600 disabled:to-gray-700 disabled:shadow-none disabled:cursor-not-allowed"
                    >
                        {t('settingsModal.completeButton')}
                    </button>
                </div>
            </div>
        );
    }
  }


  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div 
        className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-lg m-4 text-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="settings-title" className="text-2xl font-bold text-white">{t('header.settings')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
        </div>
        
        {/* Gemini API Key Section */}
        <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-3">{t('settingsModal.geminiTitle')}</h3>
            <div className="space-y-3">
                <p className="text-sm text-gray-400" dangerouslySetInnerHTML={{ __html: t('settingsModal.geminiInstructions')}} />
                <div>
                  <label htmlFor="gemini-api-key" className="block text-sm font-medium text-gray-300 mb-1">{t('settingsModal.geminiApiKeyLabel')}</label>
                  <input
                    id="gemini-api-key"
                    type="password"
                    value={currentGeminiKey}
                    onChange={(e) => setCurrentGeminiKey(e.target.value)}
                    placeholder={t('settingsModal.geminiApiKeyPlaceholder')}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
                  />
                </div>
                <div>
                    <button
                        onClick={handleSaveGeminiKey}
                        disabled={!currentGeminiKey.trim()}
                        className="w-full bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 disabled:from-gray-600 disabled:to-gray-700 disabled:shadow-none disabled:cursor-not-allowed"
                    >
                        {t('settingsModal.saveButton')}
                    </button>
                </div>
            </div>
        </div>

        <div className="w-full h-px bg-gray-700 my-8"></div>

        {/* Inoreader Section */}
        <div>
            <h3 className="text-xl font-bold text-white mb-4">{t('settingsModal.title')}</h3>
            <div className="mb-6 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <h4 className="font-semibold mb-2 text-gray-200">{t('settingsModal.instructionsTitle')}</h4>
                <ol className="list-decimal list-inside text-gray-400 space-y-2 text-sm">
                    {t('settingsModal.instructions', {}).split('|').map((item, index) => {
                        if (index === 2) return ( // Special handling for the Redirect URI instruction
                             <li key={index}>
                                <span dangerouslySetInnerHTML={{ __html: item }} />
                                <input
                                  type="text"
                                  readOnly
                                  value={REDIRECT_URI}
                                  className="w-full bg-gray-700 text-gray-200 border border-gray-600 rounded mt-1 p-1 text-xs"
                                  onFocus={(e) => e.target.select()}
                                />
                            </li>
                        );
                        return <li key={index} dangerouslySetInnerHTML={{ __html: item }} />
                    })}
                </ol>
            </div>
            
            {isInoreaderConnected ? (
                <div className="pt-2 text-center">
                    <p className="text-green-400 font-semibold mb-3">{t('settingsModal.connectedMessage')}</p>
                    <button
                        onClick={handleClearInoreader}
                        type="button"
                        className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                    >
                        {t('settingsModal.disconnectButton')}
                    </button>
                </div>
            ) : (
                renderInoreaderConnectionForm()
            )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { InoreaderCredentials } from '../types';
import { REDIRECT_URI } from '../App';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCredentials: InoreaderCredentials | null;
  onRedirectUrlSubmit: (url: string) => void;
  onClearCredentials: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentCredentials, onRedirectUrlSubmit, onClearCredentials }) => {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      setClientId(currentCredentials?.clientId || '');
      setClientSecret(currentCredentials?.clientSecret || '');
      setAuthUrl(null);
      setRedirectUrl('');
    }
  }, [currentCredentials, isOpen]);

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

  const handleClear = () => {
    onClearCredentials();
    setAuthUrl(null);
    setRedirectUrl('');
  };

  const isConnected = !!(currentCredentials && currentCredentials.token);

  const renderConnectionForm = () => {
    if (!authUrl) {
        return (
            <div className="space-y-4">
                <div>
                  <label htmlFor="inoreader-clientid" className="block text-sm font-medium text-gray-300 mb-1">OAuth Client ID</label>
                  <input
                    id="inoreader-clientid"
                    type="text"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="شناسه کلاینت OAuth خود را وارد کنید"
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
                    disabled={isConnected}
                  />
                </div>
                <div>
                  <label htmlFor="inoreader-clientsecret" className="block text-sm font-medium text-gray-300 mb-1">OAuth Client Secret</label>
                  <input
                    id="inoreader-clientsecret"
                    type="text"
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    placeholder="کلید مخفی کلاینت OAuth خود را وارد کنید"
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
                    disabled={isConnected}
                  />
                </div>
                <div className="pt-2">
                    <button
                        onClick={handleGenerateLink}
                        disabled={!clientId.trim() || !clientSecret.trim()}
                        className="w-full bg-gradient-to-br from-orange-600 to-orange-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-px active:scale-95 disabled:from-gray-600 disabled:to-gray-700 disabled:shadow-none disabled:cursor-not-allowed"
                    >
                        ایجاد لینک احراز هویت
                    </button>
                </div>
            </div>
        );
    } else {
        return (
            <div className="space-y-4 pt-2 animate-fade-in">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">۱. این لینک را کپی کرده، در یک تب جدید باز کنید و به برنامه اجازه دسترسی دهید.</label>
                    <input
                        type="text"
                        readOnly
                        value={authUrl}
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
                        onFocus={(e) => e.target.select()}
                        aria-label="لینک احراز هویت"
                    />
                </div>
                 <div>
                    <label htmlFor="redirect-url" className="block text-sm font-medium text-gray-300 mb-2">۲. پس از تایید، به صفحه‌ای با خطا هدایت می‌شوید. این طبیعی است! آدرس کامل (URL) را از نوار آدرس مرورگر کپی و اینجا وارد کنید.</label>
                    <input
                        id="redirect-url"
                        type="text"
                        value={redirectUrl}
                        onChange={(e) => setRedirectUrl(e.target.value)}
                        placeholder="آدرس کامل را اینجا وارد کنید (مثال: http://localhost...)"
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
                        aria-label="آدرس URL بازگشتی"
                    />
                </div>
                <div>
                    <button
                        onClick={handleCompleteConnection}
                        disabled={!redirectUrl.trim()}
                        className="w-full bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-px active:scale-95 disabled:from-gray-600 disabled:to-gray-700 disabled:shadow-none disabled:cursor-not-allowed"
                    >
                        تکمیل اتصال
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
        <div className="flex justify-between items-center mb-4">
          <h2 id="settings-title" className="text-2xl font-bold text-white">تنظیمات Inoreader</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
        </div>
        
        <div className="mb-6 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
            <h3 className="font-semibold mb-2 text-gray-200">چگونه اطلاعات را دریافت کنیم؟</h3>
            <ol className="list-decimal list-inside text-gray-400 space-y-2 text-sm">
                <li>به بخش <a href="https://www.inoreader.com/preferences/developer" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">Developers</a> در تنظیمات Inoreader بروید.</li>
                <li>یک اپلیکیشن جدید بسازید.</li>
                <li className="font-semibold text-orange-300">
                    در قسمت "Redirect URIs"، مقدار زیر را <strong>دقیقا</strong> وارد کنید:
                    <input
                      type="text"
                      readOnly
                      value={REDIRECT_URI}
                      className="w-full bg-gray-700 text-gray-200 border border-gray-600 rounded mt-1 p-1 text-xs"
                      onFocus={(e) => e.target.select()}
                    />
                </li>
                <li><strong>OAuth Client ID</strong> و <strong>OAuth Client secret</strong> را کپی کرده و در کادرهای زیر وارد کنید.</li>
            </ol>
        </div>
        
        {isConnected ? (
            <div className="pt-2 text-center">
                <p className="text-green-400 font-semibold mb-3">✓ با موفقیت به Inoreader متصل شدید.</p>
                <button
                    onClick={handleClear}
                    type="button"
                    className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                    قطع اتصال و پاک کردن اطلاعات
                </button>
            </div>
        ) : (
            renderConnectionForm()
        )}
      </div>
    </div>
  );
};

export default SettingsModal;
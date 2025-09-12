/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { fa, TranslationKeys } from '../i18n/locales.js';
import { Language, LANGUAGES } from '../types.js';
import { translateStrings } from '../services/translationService.js';
import { get } from 'lodash-es';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  translations: TranslationKeys;
  t: (key: string, replacements?: Record<string, string>) => string;
  isLoading: boolean;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('fa');
  const [translations, setTranslations] = useState<TranslationKeys>(fa);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem('app-language') as Language | null;
    if (savedLang && LANGUAGES.some(l => l.code === savedLang)) {
      setLanguage(savedLang);
    } else {
      setLanguage('fa');
    }
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    if (lang === language && translations !== fa) return;

    const langConfig = LANGUAGES.find(l => l.code === lang);
    if (!langConfig) return;

    document.documentElement.lang = lang;
    document.documentElement.dir = langConfig.dir;
    localStorage.setItem('app-language', lang);
    setLanguageState(lang);

    if (lang === 'fa') {
      setTranslations(fa);
      return;
    }

    const cachedTranslations = localStorage.getItem(`translations-${lang}`);
    if (cachedTranslations) {
      setTranslations(JSON.parse(cachedTranslations));
      return;
    }
    
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
        console.error("Gemini API key not found for translation service.");
        // Fallback to Farsi if API key is not available
        setLanguage('fa');
        return;
    }

    setIsLoading(true);
    try {
      const fetchedTranslations = await translateStrings(apiKey, lang);
      setTranslations(fetchedTranslations);
      localStorage.setItem(`translations-${lang}`, JSON.stringify(fetchedTranslations));
    } catch (error) {
      console.error(`Failed to fetch translations for ${lang}:`, error);
      // Fallback to Farsi on error
      setLanguage('fa');
    } finally {
      setIsLoading(false);
    }
  }, [language, translations]);
  
  const t = useCallback((key: string, replacements: Record<string, string> = {}): string => {
    let translation = get(translations, key, key);
    if (typeof translation !== 'string') {
        console.warn(`Translation key '${key}' not found or not a string.`);
        return key;
    }
    Object.keys(replacements).forEach(placeholder => {
      translation = translation.replace(`{${placeholder}}`, replacements[placeholder]);
    });
    return translation;
  }, [translations]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translations, t, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
};
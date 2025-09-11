/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { LANGUAGES } from '../types';
import Spinner from './Spinner';

const LanguageSwitcher: React.FC = () => {
    const { language, setLanguage, isLoading } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentLanguage = LANGUAGES.find(lang => lang.code === language);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLanguageChange = (langCode: 'fa' | 'en' | 'ar') => {
        setLanguage(langCode);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-700/50 transition-colors"
                aria-haspopup="true"
                aria-expanded={isOpen}
                aria-label="Change language"
            >
                {isLoading ? (
                     <Spinner className="w-6 h-6 text-gray-300" />
                ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-gray-300">
                           <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                        </svg>
                        <span className="text-gray-300 font-semibold">{currentLanguage?.code.toUpperCase()}</span>
                    </>
                )}
            </button>
            {isOpen && (
                <div
                    className="absolute top-full mt-2 w-40 bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-lg shadow-lg py-1 z-50 ltr:right-0 rtl:left-0"
                    role="menu"
                    aria-orientation="vertical"
                >
                    {LANGUAGES.map(lang => (
                        <button
                            key={lang.code}
                            onClick={() => handleLanguageChange(lang.code)}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                language === lang.code
                                    ? 'bg-orange-500/20 text-orange-300'
                                    : 'text-gray-200 hover:bg-gray-700/50'
                            }`}
                             role="menuitem"
                        >
                            {lang.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LanguageSwitcher;

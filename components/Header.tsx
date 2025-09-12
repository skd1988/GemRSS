/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { RssIcon, SettingsIcon } from './icons.js';
import LanguageSwitcher from './LanguageSwitcher.js';
import { useLanguage } from '../hooks/useLanguage.js';

interface HeaderProps {
    onToggleSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSettings }) => {
  const { t } = useLanguage();

  return (
    <header className="w-full py-4 px-4 sm:px-8 border-b border-gray-700 bg-gray-800/30 backdrop-blur-sm sticky top-0 z-50">
      <div className="relative container mx-auto flex items-center justify-between">
          <div className="flex items-center justify-center gap-3">
              <RssIcon className="w-6 h-6 text-orange-400" />
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-gray-100">
                {t('header.title')}
              </h1>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button 
                onClick={onToggleSettings} 
                className="p-2 rounded-full hover:bg-gray-700/50 transition-colors"
                aria-label={t('header.settings')}
            >
                <SettingsIcon className="w-6 h-6 text-gray-300" />
            </button>
          </div>
      </div>
    </header>
  );
};

export default Header;
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export type Language = 'fa' | 'en' | 'ar';

export const LANGUAGES: { code: Language; name: string; dir: 'rtl' | 'ltr' }[] = [
  { code: 'fa', name: 'فارسی', dir: 'rtl' },
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'ar', name: 'العربية', dir: 'rtl' },
];

export interface Article {
  title: string;
  summary: string;
  url: string;
  category: string;
  imageUrl: string | null;
}

export type CategorizedArticles = Record<string, Article[]>;

export interface InoreaderArticle {
  title: string;
  summary: {
    content: string;
  };
  canonical?: {
    href: string;
  }[];
}

export interface InoreaderCredentials {
  token?: string;
  refreshToken?: string;
  expiresAt?: number;
  clientId: string;
  clientSecret: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface CachedData {
  articles: CategorizedArticles;
  timestamp: number;
}
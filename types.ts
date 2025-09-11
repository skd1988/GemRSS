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
  isNew?: boolean;
}

export type CategorizedArticles = Record<string, Article[]>;

export interface CountryNews {
    countryName: string;
    articles: Article[];
}

export interface GeopoliticalNews {
    supporters_of_resistance: Article[];
    opponents_of_resistance: Article[];
    countries: CountryNews[];
}

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
  clientId: string;
  clientSecret: string;
}
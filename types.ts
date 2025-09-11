/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface Article {
  title: string;
  summary: string;
  url: string;
  category: string;
}

export interface CategorizedArticles {
  [category: string]: Article[];
}

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
    canonical: { href: string }[];
}

export interface InoreaderCredentials {
  token: string;
  clientId: string;
  clientSecret: string;
}

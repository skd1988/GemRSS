/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, Type } from "@google/genai";
import { Article, CategorizedArticles, GeopoliticalNews, Language } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const MAX_INPUT_LENGTH = 250000; // Limit input size to prevent request payload errors.

const langInstructions: Record<Language, { name: string, nativeName: string }> = {
    fa: { name: 'Farsi', nativeName: "فارسی" },
    en: { name: 'English', nativeName: "انگلیسی" },
    ar: { name: 'Arabic', nativeName: "عربی" },
};

/**
 * Summarizes and categorizes articles from an RSS feed.
 * @param rssContent The string content of the RSS feed.
 * @param language The target language for the output.
 * @returns A promise that resolves to an object with articles grouped by category.
 */
export async function summarizeAndCategorize(rssContent: string, language: Language): Promise<CategorizedArticles> {
  const model = 'gemini-2.5-flash';

  const truncatedContent = rssContent.length > MAX_INPUT_LENGTH
    ? rssContent.substring(0, MAX_INPUT_LENGTH)
    : rssContent;

  const { name: langName, nativeName: langNativeName } = langInstructions[language];

  const prompt = `
You are an expert news analyst. Analyze the provided RSS feed content. For each article, extract the title, URL, and a relevant image URL (look for 'enclosure', 'media:content', or an 'img' tag in the description). Then, write a concise, unbiased summary of about 2-3 sentences in ${langName}. Also, assign a single, relevant category name for each article in ${langName} (e.g., 'Technology', 'Politics', 'Business', 'Science').
The final output must be a JSON array of articles. Each object in the array must have 'title', 'summary', 'url', 'category', and 'imageUrl' keys. If no image is found, the value for 'imageUrl' should be null.

Here are the instructions in the target language (${langNativeName}) for your reference:
شما یک تحلیلگر خبره اخبار هستید. محتوای فید RSS ارائه شده را تجزیه و تحلیل کنید. برای هر مقاله، عنوان، URL و یک URL تصویر مرتبط را استخراج کنید (به دنبال تگ‌های 'enclosure'، 'media:content' یا 'img' در توضیحات بگردید). سپس، یک خلاصه مختصر و بی‌طرفانه در حدود ۲-۳ جمله به زبان "${langNativeName}" بنویسید. همچنین، یک دسته‌بندی مناسب و مرتبط به زبان "${langNativeName}" برای هر مقاله تعیین کنید (مانند «فناوری»، «سیاسی»، «اقتصادی»، «علمی»).
خروجی نهایی باید یک آرایه JSON از مقالات باشد. هر مقاله در آرایه باید یک شیء با کلیدهای 'title'، 'summary'، 'url'، 'category' و 'imageUrl' باشد. اگر تصویری یافت نشد، مقدار 'imageUrl' باید null باشد.

RSS content is below:
${truncatedContent}
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: `The article title, in its original language.` },
            summary: { type: Type.STRING, description: `A brief summary of the article in ${langName}.` },
            url: { type: Type.STRING, description: 'The URL of the original article.' },
            category: { type: Type.STRING, description: `A relevant category for the article in ${langName}.` },
            imageUrl: { type: Type.STRING, description: `URL of a relevant image for the article. Can be null.` },
          }
        }
      }
    }
  });

  const jsonString = response.text;
  const articles: Article[] = JSON.parse(jsonString);

  // Group articles by category
  const categorized: CategorizedArticles = {};
  for (const article of articles) {
    const category = article.category?.trim() || 'Uncategorized';
    if (!categorized[category]) {
      categorized[category] = [];
    }
    categorized[category].push(article);
  }
  return categorized;
}


/**
 * Processes and categorizes geopolitical news from multiple RSS feeds.
 * @param feedsContent The combined string content of multiple RSS feeds.
 * @param language The target language for the output.
 * @returns A promise that resolves to a structured object of geopolitical news.
 */
export async function processGeopoliticalFeeds(feedsContent: string, language: Language): Promise<GeopoliticalNews> {
  const model = 'gemini-2.5-flash';

  const truncatedContent = feedsContent.length > MAX_INPUT_LENGTH
    ? feedsContent.substring(0, MAX_INPUT_LENGTH)
    : feedsContent;
  
  const { name: langName, nativeName: langNativeName } = langInstructions[language];

  const prompt = `You are a geopolitical news analyst specializing in the Middle East. You will be given a collection of RSS feed articles. Your task is to analyze and categorize these articles into the following groups, with all text output in ${langName}:
1.  **supporters_of_resistance**: News related to groups and countries generally considered part of the "Axis of Resistance".
2.  **opponents_of_resistance**: News related to groups and countries generally considered opponents of the "Axis of Resistance".
3.  **countries**: News that is primarily about a specific country's internal affairs or general news. Group these by the country name in ${langName}.

For each article, provide:
- The original article title.
- A concise, unbiased summary in ${langName} (2-3 sentences).
- The original article URL.
- A relevant image URL from the article content. If none is found, this should be null.
- The category name (must be 'supporters_of_resistance', 'opponents_of_resistance', or the country name in ${langName}).

Limit the results to a maximum of 5 most important articles per category.
Return the result as a single JSON object conforming to the schema. Your response should only contain the JSON.

RSS Content:
${truncatedContent}
`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          supporters_of_resistance: {
            type: Type.ARRAY,
            description: `News related to groups and countries supporting the "Axis of Resistance".`,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Article title." },
                summary: { type: Type.STRING, description: `Article summary in ${langName}.` },
                url: { type: Type.STRING, description: "Article URL." },
                imageUrl: { type: Type.STRING, description: "Image URL. Can be null." },
                category: { type: Type.STRING, description: "Must be 'supporters_of_resistance'." }
              }
            }
          },
          opponents_of_resistance: {
            type: Type.ARRAY,
            description: `News related to groups and countries opposing the "Axis of Resistance".`,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Article title." },
                summary: { type: Type.STRING, description: `Article summary in ${langName}.` },
                url: { type: Type.STRING, description: "Article URL." },
                imageUrl: { type: Type.STRING, description: "Image URL. Can be null." },
                category: { type: Type.STRING, description: "Must be 'opponents_of_resistance'." }
              }
            }
          },
          countries: {
            type: Type.ARRAY,
            description: `News grouped by specific countries.`,
            items: {
              type: Type.OBJECT,
              properties: {
                countryName: { type: Type.STRING, description: `The name of the country in ${langName}.` },
                articles: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING, description: "Article title." },
                      summary: { type: Type.STRING, description: `Article summary in ${langName}.` },
                      url: { type: Type.STRING, description: "Article URL." },
                      imageUrl: { type: Type.STRING, description: "Image URL. Can be null." },
                      category: { type: Type.STRING, description: `Must be the country name in ${langName}.` }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  const jsonString = response.text;
  return JSON.parse(jsonString);
}
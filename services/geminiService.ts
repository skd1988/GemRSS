/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, Type } from "@google/genai";
import { Article, CategorizedArticles, GeopoliticalNews } from '../types';

// FIX: Initialize the GoogleGenAI client according to coding guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const MAX_INPUT_LENGTH = 250000; // Limit input size to prevent request payload errors.

/**
 * Summarizes and categorizes articles from an RSS feed.
 * @param rssContent The string content of the RSS feed.
 * @returns A promise that resolves to an object with articles grouped by category.
 */
export async function summarizeAndCategorize(rssContent: string): Promise<CategorizedArticles> {
  const model = 'gemini-2.5-flash';

  const truncatedContent = rssContent.length > MAX_INPUT_LENGTH
    ? rssContent.substring(0, MAX_INPUT_LENGTH)
    : rssContent;

  const prompt = `
شما یک تحلیلگر خبره اخبار هستید. محتوای فید RSS ارائه شده را تجزیه و تحلیل کنید. برای هر مقاله، عنوان و URL را استخراج کرده و یک خلاصه مختصر و بی‌طرفانه در حدود ۲-۳ جمله به زبان فارسی بنویسید. همچنین، یک دسته‌بندی مناسب و مرتبط به زبان فارسی برای هر مقاله تعیین کنید (مانند «فناوری»، «سیاسی»، «اقتصادی»، «علمی»).
خروجی نهایی باید یک آرایه JSON از مقالات باشد. هر مقاله در آرایه باید یک شیء با کلیدهای 'title'، 'summary'، 'url' و 'category' باشد. مقالات غیرفارسی را نادیده بگیرید.

محتوای RSS در زیر آمده است:
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
            title: { type: Type.STRING, description: 'عنوان مقاله.' },
            summary: { type: Type.STRING, description: 'خلاصه‌ای مختصر از مقاله به زبان فارسی.' },
            url: { type: Type.STRING, description: 'آدرس URL مقاله اصلی.' },
            category: { type: Type.STRING, description: 'یک دسته‌بندی مرتبط برای مقاله به زبان فارسی.' },
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
    // Ensure category is a string and not empty
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
 * @returns A promise that resolves to a structured object of geopolitical news.
 */
export async function processGeopoliticalFeeds(feedsContent: string): Promise<GeopoliticalNews> {
  const model = 'gemini-2.5-flash';

  const truncatedContent = feedsContent.length > MAX_INPUT_LENGTH
    ? feedsContent.substring(0, MAX_INPUT_LENGTH)
    : feedsContent;

  const prompt = `شما یک تحلیلگر اخبار ژئوپلیتیک متخصص در خاورمیانه هستید. مجموعه‌ای از مقالات فید RSS، عمدتاً به زبان فارسی، به شما داده خواهد شد. وظیفه شما تحلیل و دسته‌بندی این مقالات است.

ابتدا، موضوع اصلی هر مقاله را مشخص کنید. سپس، مقالات را در دسته‌های زیر گروه‌بندی کنید:
1.  **supporters_of_resistance**: اخبار مربوط به گروه‌ها و کشورهایی که عموماً بخشی از «محور مقاومت» محسوب می‌شوند.
2.  **opponents_of_resistance**: اخبار مربوط به گروه‌ها و کشورهایی که عموماً مخالف «محور مقاومت» محسوب می‌شوند.
3.  **countries**: اخباری که عمدتاً در مورد امور داخلی یک کشور خاص یا اخبار عمومی آن کشور است. این‌ها را بر اساس نام کشور به فارسی گروه‌بندی کنید.

برای هر مقاله، موارد زیر را ارائه دهید:
- عنوان اصلی مقاله.
- یک خلاصه مختصر و بی‌طرفانه به زبان فارسی (در حد ۲-۳ جمله).
- URL اصلی مقاله.
- نام دسته (باید 'supporters_of_resistance'، 'opponents_of_resistance' یا نام کشور به فارسی باشد).

نتایج را به حداکثر ۵ مقاله مهم برای هر دسته محدود کنید.

نتیجه را به عنوان یک شیء JSON واحد مطابق با schema برگردانید. پاسخ شما باید فقط شامل JSON باشد و هیچ متن اضافی دیگری نداشته باشد.

محتوای RSS:
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
            description: "اخبار مربوط به گروه‌ها و کشورهای حامی «محور مقاومت».",
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "عنوان مقاله." },
                summary: { type: Type.STRING, description: "خلاصه مقاله." },
                url: { type: Type.STRING, description: "آدرس URL مقاله." },
                category: { type: Type.STRING, description: "باید 'supporters_of_resistance' باشد." }
              }
            }
          },
          opponents_of_resistance: {
            type: Type.ARRAY,
            description: "اخبار مربوط به گروه‌ها و کشورهای مخالف «محور مقاومت».",
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "عنوان مقاله." },
                summary: { type: Type.STRING, description: "خلاصه مقاله." },
                url: { type: Type.STRING, description: "آدرس URL مقاله." },
                category: { type: Type.STRING, description: "باید 'opponents_of_resistance' باشد." }
              }
            }
          },
          countries: {
            type: Type.ARRAY,
            description: 'اخبار گروه‌بندی شده بر اساس کشورهای خاص.',
            items: {
              type: Type.OBJECT,
              properties: {
                countryName: { type: Type.STRING, description: "نام کشور به زبان فارسی." },
                articles: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING, description: "عنوان مقاله." },
                      summary: { type: Type.STRING, description: "خلاصه مقاله." },
                      url: { type: Type.STRING, description: "آدرس URL مقاله." },
                      category: { type: Type.STRING, description: "باید نام کشور به فارسی باشد." }
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
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, Type, Chat } from "@google/genai";
import { Article, CategorizedArticles, Language } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
let chat: Chat | null = null;

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

function formatArticlesForContext(articles: CategorizedArticles): string {
  let context = "Here are the news articles:\n\n";
  for (const category in articles) {
    context += `## Category: ${category}\n\n`;
    for (const article of articles[category]) {
      context += `### Title: ${article.title}\n`;
      context += `Summary: ${article.summary}\n`;
      context += `URL: ${article.url}\n\n`;
    }
  }
  return context;
}

export async function startChatSession(articles: CategorizedArticles, language: Language): Promise<string> {
  const model = 'gemini-2.5-flash';
  const { name: langName } = langInstructions[language];
  const articlesContext = formatArticlesForContext(articles);

  const systemInstruction = `You are a helpful and friendly news assistant. Your knowledge is strictly limited to the news articles provided in the context.
- Answer user questions based *only* on the information in the articles.
- Do not make up information or answer questions about topics not covered in the articles.
- If you don't know the answer, say that the information is not available in the provided articles.
- Keep your answers concise and to the point.
- All your responses must be in ${langName}.`;

  chat = ai.chats.create({
    model,
    config: {
      systemInstruction,
    },
    history: [
      { role: 'user', parts: [{ text: articlesContext }] },
      { role: 'model', parts: [{ text: `Understood. I have read the provided articles and will only answer questions based on their content. I will respond in ${langName}.` }] }
    ],
  });

  const greetingMessage = language === 'fa' 
    ? "سلام! من مقالات را خوانده‌ام. چگونه می‌توانم به شما در درک اخبار امروز کمک کنم؟" 
    : "Hello! I've read the articles. How can I help you understand today's news?";
  
  return greetingMessage;
}

export async function sendMessageToChat(message: string): Promise<string> {
    if (!chat) {
        throw new Error("Chat session not started. Please summarize feeds first.");
    }
    const response = await chat.sendMessage({ message });
    return response.text;
}
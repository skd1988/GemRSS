/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI } from "@google/genai";
import { fa, TranslationKeys } from '../i18n/locales';
import { Language } from "../types";

const model = 'gemini-2.5-flash';

const languageMap: Record<Language, string> = {
    en: 'English',
    ar: 'Arabic',
    fa: 'Farsi',
};

export async function translateStrings(apiKey: string, targetLanguage: Language): Promise<TranslationKeys> {
    if (targetLanguage === 'fa') {
        return fa;
    }

    const ai = new GoogleGenAI({ apiKey });
    const targetLangName = languageMap[targetLanguage];

    const prompt = `Translate the string values in the following JSON object from Farsi to ${targetLangName}. 
- Maintain the exact same JSON structure and keys. 
- Only translate the string values. 
- Do not translate placeholders like '{variable}'. 
- Maintain any simple HTML tags like '<strong>' or '<a>' in the translated strings.
- Provide only the raw JSON in your response.

JSON to translate:
${JSON.stringify(fa, null, 2)}
`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
        }
    });
    
    const jsonString = response.text;
    try {
        const parsed = JSON.parse(jsonString);
        if (typeof parsed !== 'object' || parsed === null) {
            throw new Error("Translation did not return a valid object.");
        }
        return parsed as TranslationKeys;
    } catch (e) {
        console.error("Failed to parse translated JSON:", e);
        console.error("Received string:", jsonString);
        throw new Error(`Failed to get valid translation from AI. Error: ${e instanceof Error ? e.message : 'Unknown'}`);
    }
}

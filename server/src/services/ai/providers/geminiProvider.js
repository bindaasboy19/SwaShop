/**
 * Google Gemini AI Provider
 * 
 * Uses the modern @google/genai SDK to generate structured catalog content,
 * titles, descriptions, category suggestions, tags, and multilingual text.
 */

import { GoogleGenAI } from '@google/genai';

let geminiClient = null;

export const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
};

const DEFAULT_MODEL = process.env.AI_MODEL || 'gemini-2.5-flash';

const SYSTEM_INSTRUCTION = `You are the AI Catalog Assistant for SwaShop, a hyperlocal Indian artisan and local commerce platform.
CRITICAL RULES:
1. Generate concise, marketplace-appropriate, factual product content.
2. DO NOT hallucinate or invent unstated certifications, exact dimensions, or unsubstantiated claims (e.g., do NOT invent "100% certified organic" or "GI-tagged" unless the seller explicitly stated it).
3. If a detail (like dimensions or weight) is not provided, leave it empty or omit it.
4. Support both English and authentic Hindi (Devanagari script) seamlessly.
5. Always return clean, valid JSON matching the requested schema.`;

/**
 * Generate complete structured catalog from input
 */
export const geminiGenerateCatalog = async (input, options = {}) => {
  const ai = getGeminiClient();
  if (!ai) return null;

  const model = options.model || DEFAULT_MODEL;
  const language = options.language || 'en'; // 'en', 'hi', or 'both'
  const categoriesList = (options.categories || []).map((c) => `${c.name} (slug: ${c.slug})`).join(', ');

  const prompt = `Task: Create a structured product catalog for an artisan or local merchant product.
Seller Input: "${input.text || input.name || ''}"
Language Preference: ${language}
Available Platform Categories: [${categoriesList}]

Generate a JSON object with this EXACT structure:
{
  "title": "Concise product title",
  "titleHi": "हिंदी शीर्षक (if language is hi or both, otherwise null)",
  "description": "Engaging 2-3 paragraph marketplace description",
  "descriptionHi": "हिंदी विवरण (if language is hi or both, otherwise null)",
  "categorySlug": "One exact slug from available platform categories",
  "features": ["Bullet feature 1", "Bullet feature 2", "Bullet feature 3"],
  "attributes": {
    "material": "e.g., Bamboo / Terracotta / Cotton / null",
    "craftType": "e.g., Handloom / Pottery / Woodcarving / null",
    "useCase": "e.g., Home Decor / Kitchen / null",
    "color": "e.g., Natural / Brown / null"
  },
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "keywords": ["searchkeyword1", "searchkeyword2", "searchkeyword3"]
}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text);
    return parsed;
  } catch (err) {
    console.warn('[Gemini AI] Catalog generation error, falling back:', err.message);
    return null;
  }
};

/**
 * Generate single field: Title
 */
export const geminiGenerateTitle = async (input, options = {}) => {
  const ai = getGeminiClient();
  if (!ai) return null;

  const model = options.model || DEFAULT_MODEL;
  const prompt = `Suggest a clean, compelling, and concise marketplace product title (maximum 75 characters) for: "${input.name || input.text}". Do not invent unstated features. Return JSON: { "title": "..." }`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json'
      }
    });
    const parsed = JSON.parse(response.text);
    return parsed.title;
  } catch (err) {
    console.warn('[Gemini AI] Title generation error, falling back:', err.message);
    return null;
  }
};

/**
 * Generate single field: Description & Features
 */
export const geminiGenerateDescription = async (input, options = {}) => {
  const ai = getGeminiClient();
  if (!ai) return null;

  const model = options.model || DEFAULT_MODEL;
  const language = options.language || 'en';
  const prompt = `Generate a professional product description and 3-5 key bullet features for:
Product: "${input.name || ''}"
Details: "${input.details || input.text || ''}"
Language: ${language}

Return JSON:
{
  "description": "Engaging description text",
  "features": ["Feature 1", "Feature 2", "Feature 3"],
  "careInstructions": "Short care guideline or null"
}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json'
      }
    });
    return JSON.parse(response.text);
  } catch (err) {
    console.warn('[Gemini AI] Description generation error, falling back:', err.message);
    return null;
  }
};

"use strict";

const explanationCache = new Map();

function getGeminiConfig() {
  return {
    apiKey: process.env.GEMINI_API_KEY || "",
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash"
  };
}

function isGeminiConfigured() {
  return Boolean(getGeminiConfig().apiKey);
}

function extractTextFromGemini(data) {
  return data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();
}

function parseJsonResponse(text) {
  if (!text) {
    throw new Error("Gemini returned empty text.");
  }

  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
}

async function callGeminiJson(prompt, generationConfig = {}) {
  const { apiKey, model } = getGeminiConfig();

  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 900,
          responseMimeType: "application/json",
          ...generationConfig
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return parseJsonResponse(extractTextFromGemini(data));
}

function buildLocalExplanation(item) {
  return {
    sourceMode: "local",
    english: item.simple?.english || item.summary,
    hinglish: item.simple?.hinglish || item.summary,
    marathi: item.simple?.marathi || item.summary,
    highLevel: item.highLevel || item.summary,
    whyItMatters:
      item.whyItMatters || "This update may affect market understanding, money decisions, or sector expectations.",
    glossary: (item.glossary || []).slice(0, 3)
  };
}

async function getStoryExplanation(item) {
  const cacheKey = `${item.id}|${item.title}|${item.publishedAt || ""}`;

  if (explanationCache.has(cacheKey)) {
    return explanationCache.get(cacheKey);
  }

  if (!isGeminiConfigured()) {
    const fallback = buildLocalExplanation(item);
    explanationCache.set(cacheKey, fallback);
    return fallback;
  }

  try {
    const result = await callGeminiJson(`
You are an education-focused finance explainer for students.
Take the factual news item below and rewrite it in a very simple, short, child-friendly way.
Do not invent facts. Stay grounded in the provided news.
Keep finance terms in English but explain them simply.

Return strict JSON with this shape:
{
  "english": "string",
  "hinglish": "string",
  "marathi": "string",
  "highLevel": "string",
  "whyItMatters": "string",
  "glossary": [
    { "term": "string", "meaning": "string" }
  ]
}

Rules:
- english: 2 to 3 short sentences
- hinglish: easy Hindi + English finance words, 2 to 3 short sentences
- marathi: easy Marathi + English finance words, 2 to 3 short sentences
- highLevel: one short sentence only
- whyItMatters: one or two short sentences only
- glossary: up to 3 important finance words only
- avoid tables, bullets, HTML, and legal wording
- if the source text is very formal, simplify the meaning instead of copying it

News item:
${JSON.stringify({
      title: item.title,
      summary: item.summary,
      source: item.source,
      sourceUrl: item.sourceUrl,
      sector: item.sector,
      company: item.company,
      region: item.region,
      trustedType: item.trustedType,
      publishedAt: item.publishedAt
    })}
    `);

    const normalized = {
      sourceMode: "gemini",
      english: String(result.english || "").trim(),
      hinglish: String(result.hinglish || "").trim(),
      marathi: String(result.marathi || "").trim(),
      highLevel: String(result.highLevel || "").trim(),
      whyItMatters: String(result.whyItMatters || "").trim(),
      glossary: Array.isArray(result.glossary)
        ? result.glossary
            .slice(0, 3)
            .map((entry) => ({
              term: String(entry.term || "").trim(),
              meaning: String(entry.meaning || "").trim()
            }))
            .filter((entry) => entry.term && entry.meaning)
        : []
    };

    if (!normalized.english || !normalized.hinglish || !normalized.marathi) {
      throw new Error("Gemini response missing required explanation fields.");
    }

    explanationCache.set(cacheKey, normalized);
    return normalized;
  } catch (error) {
    const fallback = {
      ...buildLocalExplanation(item),
      sourceMode: "local",
      fallbackReason: error.message
    };
    explanationCache.set(cacheKey, fallback);
    return fallback;
  }
}

async function getChatCompletion({ message, language, items, glossary }) {
  if (!isGeminiConfigured()) {
    throw new Error("Gemini API key is not configured.");
  }

  const result = await callGeminiJson(`
You are a finance learning assistant for students.
Answer only from the supplied context.
Be simple, factual, and short.
If the context is insufficient, say that clearly.

Return strict JSON:
{
  "answer": "string"
}

Language mode: ${language}
User question: ${message}
Relevant news: ${JSON.stringify(items)}
Glossary: ${JSON.stringify(glossary)}
  `, {
    temperature: 0.3,
    maxOutputTokens: 500
  });

  return {
    mode: "gemini",
    answer: String(result.answer || "").trim()
  };
}

module.exports = {
  getStoryExplanation,
  getChatCompletion,
  isGeminiConfigured
};

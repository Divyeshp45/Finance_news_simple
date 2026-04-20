"use strict";

const { liveSources } = require("../data/live-sources");

const cache = {
  expiresAt: 0,
  value: null
};

function stripHtmlTags(value) {
  return String(value || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, ". ")
    .replace(/<\/p>/gi, ". ")
    .replace(/<\/div>/gi, ". ")
    .replace(/<li>/gi, " ")
    .replace(/<\/li>/gi, ". ")
    .replace(/<[^>]+>/g, " ");
}

function stripCdata(value) {
  return String(value || "")
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .trim();
}

function decodeXml(value) {
  return stripCdata(value)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function extractTag(block, tagName) {
  const match = block.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match ? decodeXml(match[1]) : "";
}

function inferSector(text, fallbackSector) {
  const lower = text.toLowerCase();

  if (lower.includes("bank") || lower.includes("repo") || lower.includes("liquidity")) {
    return "Banking";
  }
  if (lower.includes("oil") || lower.includes("energy") || lower.includes("gas")) {
    return "Energy";
  }
  if (lower.includes("inflation") || lower.includes("growth") || lower.includes("gdp")) {
    return "Macro Economy";
  }
  if (lower.includes("technology") || lower.includes("ai") || lower.includes("chip")) {
    return "Technology";
  }
  if (lower.includes("regulation") || lower.includes("circular") || lower.includes("compliance")) {
    return "Regulation";
  }

  return fallbackSector || "General Finance";
}

function cleanupText(value) {
  return decodeXml(stripHtmlTags(value))
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/\(\s*\)/g, " ")
    .replace(/\[\s*\]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\.\s*\./g, ".")
    .trim();
}

function limitSentences(text, maxSentences = 2, maxChars = 240) {
  const normalized = cleanupText(text);
  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (!sentences.length) {
    return normalized.slice(0, maxChars).trim();
  }

  let picked = "";
  for (const sentence of sentences.slice(0, maxSentences)) {
    const candidate = picked ? `${picked} ${sentence}` : sentence;
    if (candidate.length > maxChars) {
      break;
    }
    picked = candidate;
  }

  return (picked || sentences[0]).slice(0, maxChars).trim();
}

function getSimpleMeaning(title, description, sector) {
  const text = `${title} ${description}`.toLowerCase();

  if (text.includes("auction") || text.includes("bond") || text.includes("security")) {
    return {
      english: "the government or an institution is trying to raise money from the market",
      hinglish: "sarkar ya institution market se paisa uthana chah raha hai",
      marathi: "sarkar kiwa institution market madhun paisa ubaraycha prayatna karat aahe"
    };
  }

  if (text.includes("repo") || text.includes("rate")) {
    return {
      english: "borrowing cost guidance may change for banks and the economy",
      hinglish: "banks aur economy ke liye borrowing cost ka signal important hai",
      marathi: "banks ani economy sathi borrowing cost cha signal mahatvacha aahe"
    };
  }

  if (text.includes("inflation") || text.includes("price")) {
    return {
      english: "it is about whether prices are rising too fast",
      hinglish: "yeh prices kitni fast badh rahi hain uske baare mein hai",
      marathi: "he prices khup vegane vadhat aahet ka tyabaddal aahe"
    };
  }

  if (text.includes("guideline") || text.includes("circular") || text.includes("regulation")) {
    return {
      english: "new rules or instructions may affect how companies or markets operate",
      hinglish: "naye rules companies ya market ke kaam karne ka tareeka badal sakte hain",
      marathi: "navin niyam companies kiwa market kase chalel te badlu shaktat"
    };
  }

  if (sector === "Technology") {
    return {
      english: "it may affect tech companies, digital services, or future investment plans",
      hinglish: "yeh tech companies, digital services ya future investment plans ko affect kar sakta hai",
      marathi: "he tech companies, digital services kiwa pudhchya investment plans var parinam karu shakate"
    };
  }

  if (sector === "Macro Economy") {
    return {
      english: "it gives a signal about the bigger economy and money conditions",
      hinglish: "yeh badi economy aur money conditions ka signal deta hai",
      marathi: "he mothya economy ani money conditions cha signal deto"
    };
  }

  return {
    english: "this update can affect money decisions, markets, or business expectations",
    hinglish: "yeh update money decisions, market ya business expectations ko affect kar sakta hai",
    marathi: "ha update money decisions, market kiwa business expectations var parinam karu shakto"
  };
}

function buildSimpleSummary(title, description, sector) {
  const cleanTitle = cleanupText(title) || "There is a new finance update";
  const meaning = getSimpleMeaning(cleanTitle, description, sector);

  return {
    english: `${cleanTitle}. In simple words, ${meaning.english}.`,
    hinglish: `Simple mein: ${cleanTitle}. Matlab ${meaning.hinglish}.`,
    marathi: `Sopya shabdat: ${cleanTitle}. Mhanje ${meaning.marathi}.`
  };
}

function parseRssItems(xml, sourceConfig) {
  const matches = xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];

  return matches.slice(0, 8).map((itemBlock, index) => {
    const title = extractTag(itemBlock, "title");
    const link = extractTag(itemBlock, "link");
    const description = extractTag(itemBlock, "description");
    const pubDate = extractTag(itemBlock, "pubDate");
    const cleanTitle = cleanupText(title);
    const cleanDescription = limitSentences(description || title, 2, 260);
    const combinedText = `${cleanTitle} ${cleanDescription}`;
    const sector = inferSector(combinedText, sourceConfig.sector);

    return {
      id: `${sourceConfig.id}-${index}-${Buffer.from(link || title).toString("base64").slice(0, 12)}`,
      title: cleanTitle,
      region: sourceConfig.region,
      sector,
      company: sourceConfig.company,
      source: sourceConfig.source,
      sourceUrl: link || sourceConfig.homepageUrl,
      trustedType: sourceConfig.trustedType,
      publishedAt: pubDate || "",
      tags: [sourceConfig.region === "india" ? "India" : "Global", sourceConfig.company, sector],
      summary: cleanDescription,
      simple: buildSimpleSummary(cleanTitle, cleanDescription, sector),
      highLevel: `High level: ${cleanTitle}.`,
      whyItMatters:
        "This update may affect market understanding, policy awareness, investor mood, or company and sector expectations.",
      glossary: [],
      isLive: true
    };
  });
}

async function fetchSource(sourceConfig, fetchImpl, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(sourceConfig.feedUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "FinNewsSimple/1.0"
      }
    });

    if (!response.ok) {
      throw new Error(`Source responded with status ${response.status}`);
    }

    const xml = await response.text();
    const items = parseRssItems(xml, sourceConfig);

    return {
      sourceId: sourceConfig.id,
      sourceName: sourceConfig.name,
      ok: true,
      itemCount: items.length,
      items
    };
  } catch (error) {
    return {
      sourceId: sourceConfig.id,
      sourceName: sourceConfig.name,
      ok: false,
      itemCount: 0,
      items: [],
      error: error.message
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function getLiveNews(options = {}) {
  const enabled = options.enabled ?? process.env.LIVE_NEWS_ENABLED === "true";
  const now = Date.now();

  if (!enabled) {
    return {
      enabled: false,
      fetchedAt: null,
      items: [],
      sourceStatuses: liveSources.map((source) => ({
        sourceId: source.id,
        sourceName: source.name,
        ok: false,
        itemCount: 0,
        skipped: true
      }))
    };
  }

  if (!options.forceRefresh && cache.value && cache.expiresAt > now) {
    return cache.value;
  }

  const fetchImpl = options.fetchImpl || fetch;
  const timeoutMs = Number(options.timeoutMs || process.env.LIVE_NEWS_TIMEOUT_MS || 7000);
  const ttlMs = Number(options.cacheTtlMs || process.env.LIVE_NEWS_CACHE_MS || 300000);

  const sourceResults = await Promise.all(
    liveSources.map((source) => fetchSource(source, fetchImpl, timeoutMs))
  );

  const liveItems = sourceResults.flatMap((result) => result.items);
  const payload = {
    enabled: true,
    fetchedAt: new Date().toISOString(),
    items: liveItems,
    sourceStatuses: sourceResults
  };

  cache.value = payload;
  cache.expiresAt = now + ttlMs;

  return payload;
}

module.exports = {
  getLiveNews,
  parseRssItems
};

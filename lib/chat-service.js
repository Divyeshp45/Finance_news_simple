"use strict";

const { newsItems } = require("../data/news");
const { getNewsContent, getGlossary } = require("./content-service");
const { getChatCompletion } = require("./gemini-service");

function getLanguageKey(language) {
  if (language === "hinglish" || language === "marathi") {
    return language;
  }

  return "english";
}

function buildLocalChatReply(message, language = "english") {
  return buildLocalChatReplyFromItems(newsItems, message, language);
}

function buildLocalChatReplyFromItems(items, message, language = "english") {
  const question = String(message || "").trim().toLowerCase();
  const languageKey = getLanguageKey(language);
  const questionTokens = question
    .split(/[^a-z0-9]+/i)
    .filter((token) => token && !["explain", "what", "is", "the", "a", "an", "news", "about"].includes(token));
  const glossary = getGlossary(items);
  const glossaryMatch = glossary.find((entry) => question.includes(entry.term.toLowerCase()));

  if (glossaryMatch) {
    return {
      mode: "local",
      answer: `${glossaryMatch.term}: ${glossaryMatch.meaning}`,
      relatedNewsId: null
    };
  }

  const filteredNews = items.length
    ? items.filter((item) => {
        const itemText = `${item.title} ${item.company} ${item.sector} ${item.tags.join(" ")}`.toLowerCase();
        return (
          itemText.includes(question) ||
          question.includes(String(item.company || "").toLowerCase()) ||
          question.includes(String(item.sector || "").toLowerCase()) ||
          String(item.company || "").toLowerCase().includes(question) ||
          String(item.sector || "").toLowerCase().includes(question) ||
          questionTokens.some((token) => itemText.includes(token))
        );
      })
    : [];

  if (filteredNews.length > 0) {
    const item = filteredNews[0];
    return {
      mode: "local",
      answer: `${item.simple[languageKey]} High level: ${item.highLevel} Why it matters: ${item.whyItMatters}`,
      relatedNewsId: item.id
    };
  }

  if (question.includes("trusted") || question.includes("source")) {
    return {
      mode: "local",
      answer:
        "Trusted source means the information is coming from official institutions, company filings, exchanges, central banks, or well-known financial data providers.",
      relatedNewsId: null
    };
  }

  if (question.includes("hindi")) {
    return {
      mode: "local",
      answer:
        "Select Hindi + English in the language filter. The simple explanations will then mix easy Hindi with English finance terms.",
      relatedNewsId: null
    };
  }

  if (question.includes("marathi")) {
    return {
      mode: "local",
      answer:
        "Select Marathi + English in the language filter. The simple explanations will then mix easy Marathi with English finance terms.",
      relatedNewsId: null
    };
  }

  return {
    mode: "local",
    answer:
      "I can explain a finance word, summarize a news topic, or tell you why a story matters. Try asking about repo rate, inflation, banking, oil, AI, or a company name.",
    relatedNewsId: null
  };
}

async function buildGeminiChatReply(message, language = "english") {
  const content = await getNewsContent({ search: message });

  const languageKey = getLanguageKey(language);
  const relevantNews = content.items.slice(0, 4);
  const glossary = getGlossary(relevantNews.length ? relevantNews : content.items).slice(0, 10);
  const response = await getChatCompletion({
    message,
    language: languageKey,
    items: relevantNews,
    glossary
  });

  return {
    ...response,
    relatedNewsId: relevantNews[0] ? relevantNews[0].id : null
  };
}

async function getChatReply(message, language) {
  try {
    return await buildGeminiChatReply(message, language);
  } catch (error) {
    const content = await getNewsContent({ search: message });
    return {
      ...buildLocalChatReplyFromItems(content.items, message, language),
      fallbackReason: error.message
    };
  }
}

module.exports = {
  getChatReply,
  buildLocalChatReply,
  buildLocalChatReplyFromItems
};

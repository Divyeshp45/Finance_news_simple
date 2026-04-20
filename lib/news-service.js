"use strict";

const { newsItems } = require("../data/news");

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function matchSearch(item, search) {
  if (!search) {
    return true;
  }

  const haystack = [
    item.title,
    item.company,
    item.sector,
    item.source,
    item.trustedType,
    item.summary,
    item.highLevel,
    item.whyItMatters,
    ...item.tags,
    ...item.glossary.map((entry) => `${entry.term} ${entry.meaning}`)
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(search);
}

function getNews(filters = {}) {
  const search = normalize(filters.search);
  const region = normalize(filters.region);
  const sector = normalize(filters.sector);

  return newsItems.filter((item) => {
    const matchesRegion = !region || region === "all" || item.region === region;
    const matchesSector = !sector || sector === "all" || normalize(item.sector) === sector;

    return matchesRegion && matchesSector && matchSearch(item, search);
  });
}

function getSectors() {
  return [...new Set(newsItems.map((item) => item.sector))].sort();
}

function getGlossary(items = newsItems) {
  const glossaryMap = new Map();

  items.forEach((item) => {
    item.glossary.forEach((entry) => {
      if (!glossaryMap.has(entry.term)) {
        glossaryMap.set(entry.term, entry.meaning);
      }
    });
  });

  return [...glossaryMap.entries()].map(([term, meaning]) => ({ term, meaning }));
}

module.exports = {
  getNews,
  getSectors,
  getGlossary
};

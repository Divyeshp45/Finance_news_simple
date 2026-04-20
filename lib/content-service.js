"use strict";

const { newsItems } = require("../data/news");
const { getLiveNews } = require("./live-news-service");
const MAX_NEWS_AGE_DAYS = 30;

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function parseDate(value) {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : new Date(timestamp);
}

function isRecentEnough(item) {
  const publishedDate = parseDate(item.publishedAt);
  if (!publishedDate) {
    return true;
  }

  const ageMs = Date.now() - publishedDate.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return ageDays <= MAX_NEWS_AGE_DAYS;
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

function applyFilters(items, filters = {}) {
  const search = normalize(filters.search);
  const region = normalize(filters.region);
  const sector = normalize(filters.sector);

  return items.filter((item) => {
    const matchesRegion = !region || region === "all" || item.region === region;
    const matchesSector = !sector || sector === "all" || normalize(item.sector) === sector;

    return matchesRegion && matchesSector && matchSearch(item, search);
  });
}

function dedupeByTitleAndSource(items) {
  const seen = new Set();

  return items.filter((item) => {
    const key = `${normalize(item.title)}|${normalize(item.source)}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function getGlossary(items) {
  const glossaryMap = new Map();

  items.forEach((item) => {
    (item.glossary || []).forEach((entry) => {
      if (!glossaryMap.has(entry.term)) {
        glossaryMap.set(entry.term, entry.meaning);
      }
    });
  });

  return [...glossaryMap.entries()].map(([term, meaning]) => ({ term, meaning }));
}

async function getNewsContent(filters = {}, options = {}) {
  const live = await getLiveNews({
    enabled: options.liveEnabled,
    forceRefresh: options.forceRefresh,
    fetchImpl: options.fetchImpl
  });

  const combined = dedupeByTitleAndSource([...live.items, ...newsItems])
    .filter(isRecentEnough)
    .sort((left, right) => {
      if (Boolean(left.isLive) !== Boolean(right.isLive)) {
        return left.isLive ? -1 : 1;
      }

      const rightDate = parseDate(right.publishedAt)?.getTime() || 0;
      const leftDate = parseDate(left.publishedAt)?.getTime() || 0;
      return rightDate - leftDate;
    });
  const items = applyFilters(combined, filters);
  const sectors = [...new Set(combined.map((item) => item.sector))].sort();

  return {
    items,
    sectors,
    glossary: getGlossary(items),
    live
  };
}

module.exports = {
  getNewsContent,
  applyFilters,
  getGlossary
};

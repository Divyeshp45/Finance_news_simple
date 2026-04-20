"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { getNews, getGlossary } = require("../lib/news-service");
const { buildLocalChatReply, buildLocalChatReplyFromItems } = require("../lib/chat-service");
const { parseRssItems, getLiveNews } = require("../lib/live-news-service");
const { getNewsContent } = require("../lib/content-service");
const { createServer } = require("../server");

test("getNews filters by region and search", () => {
  const items = getNews({ region: "india", search: "rbi" });
  assert.equal(items.length, 1);
  assert.equal(items[0].company, "Reserve Bank of India");
});

test("getGlossary collects unique finance terms", () => {
  const glossary = getGlossary();
  const repoRate = glossary.find((entry) => entry.term === "Repo Rate");
  assert.ok(repoRate);
  assert.match(repoRate.meaning, /interest rate/i);
});

test("local chat can explain glossary terms", () => {
  const reply = buildLocalChatReply("What is repo rate?", "english");
  assert.equal(reply.mode, "local");
  assert.match(reply.answer, /Repo Rate/i);
});

test("local chat can explain a matching news item from provided items", () => {
  const reply = buildLocalChatReplyFromItems(
    [
      {
        id: "demo-1",
        title: "RBI announces liquidity step",
        company: "Reserve Bank of India",
        sector: "Banking",
        tags: ["RBI"],
        simple: {
          english: "RBI is helping banks with money flow.",
          hinglish: "RBI banks ko money flow mein help kar raha hai.",
          marathi: "RBI banksna paise flow madhye madat karat aahe."
        },
        highLevel: "Money flow support",
        whyItMatters: "Banks may find it easier to manage liquidity.",
        glossary: []
      }
    ],
    "Explain RBI",
    "english"
  );

  assert.match(reply.answer, /money flow/i);
});

test("RSS parser extracts finance stories from XML", () => {
  const xml = `
    <rss>
      <channel>
        <item>
          <title>RBI keeps rate unchanged</title>
          <link>https://example.com/rbi-rate</link>
          <description>Policy stayed stable for this review.</description>
          <pubDate>Mon, 20 Apr 2026 10:00:00 GMT</pubDate>
        </item>
      </channel>
    </rss>
  `;

  const items = parseRssItems(xml, {
    id: "rbi-press",
    region: "india",
    sector: "Banking",
    company: "Reserve Bank of India",
    trustedType: "Official release",
    homepageUrl: "https://example.com",
    source: "Reserve Bank of India"
  });

  assert.equal(items.length, 1);
  assert.equal(items[0].title, "RBI keeps rate unchanged");
  assert.equal(items[0].isLive, true);
});

test("RSS parser strips HTML-heavy descriptions into simple readable text", () => {
  const xml = `
    <rss>
      <channel>
        <item>
          <title>Government security auction scheduled</title>
          <link>https://example.com/auction</link>
          <description><![CDATA[
            <table><tr><td>State</td><td>Amount</td></tr></table>
            <p>The auction will be conducted on the Reserve Bank platform.</p>
            <p>Investors may submit bids on Tuesday.</p>
          ]]></description>
          <pubDate>Mon, 20 Apr 2026 10:00:00 GMT</pubDate>
        </item>
      </channel>
    </rss>
  `;

  const items = parseRssItems(xml, {
    id: "rbi-press",
    region: "india",
    sector: "Banking",
    company: "Reserve Bank of India",
    trustedType: "Official release",
    homepageUrl: "https://example.com",
    source: "Reserve Bank of India"
  });

  assert.equal(items.length, 1);
  assert.doesNotMatch(items[0].summary, /<table>|<p>/i);
  assert.match(items[0].simple.hinglish, /Simple mein:/i);
});

test("live news service returns fetched feed items with source status", async () => {
  const xml = `
    <rss>
      <channel>
        <item>
          <title>SEBI issues new market circular</title>
          <link>https://example.com/sebi-circular</link>
          <description>New compliance guidance released.</description>
          <pubDate>Mon, 20 Apr 2026 10:00:00 GMT</pubDate>
        </item>
      </channel>
    </rss>
  `;

  const response = await getLiveNews({
    enabled: true,
    forceRefresh: true,
    cacheTtlMs: 1,
    fetchImpl: async () => ({
      ok: true,
      text: async () => xml
    })
  });

  assert.ok(response.sourceStatuses.length >= 1);
  assert.ok(response.items.length >= 1);
});

test("content service merges live and seeded items", async () => {
  const xml = `
    <rss>
      <channel>
        <item>
          <title>IMF comments on global growth</title>
          <link>https://example.com/imf-growth</link>
          <description>Growth outlook remains under watch.</description>
          <pubDate>Mon, 20 Apr 2026 10:00:00 GMT</pubDate>
        </item>
      </channel>
    </rss>
  `;

  const content = await getNewsContent(
    { search: "growth" },
    {
      liveEnabled: true,
      forceRefresh: true,
      fetchImpl: async () => ({
        ok: true,
        text: async () => xml
      })
    }
  );

  assert.ok(content.items.length >= 1);
  assert.ok(content.sectors.length >= 1);
});

test("health endpoint returns app status", async () => {
  const server = createServer();

  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/health`);
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.status, "ok");
    assert.equal(data.aiProvider, "local");
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

test("news endpoint returns filtered data", async () => {
  const server = createServer();

  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/news?region=global&search=oil`);
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.items.length, 1);
    assert.equal(data.items[0].sector, "Energy");
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

test("explain endpoint returns local explanation when no Gemini key is set", async () => {
  const server = createServer();

  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/explain?id=1`);
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.explanation.sourceMode, "local");
    assert.match(data.explanation.english, /RBI/i);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

"use strict";

const liveSources = [
  {
    id: "rbi-press",
    name: "RBI Press Releases",
    region: "india",
    sector: "Banking",
    company: "Reserve Bank of India",
    trustedType: "Official release",
    homepageUrl: "https://www.rbi.org.in/Scripts/rss.aspx",
    feedUrl: "https://rbi.org.in/pressreleases_rss.xml",
    source: "Reserve Bank of India"
  },
  {
    id: "sebi-rss",
    name: "SEBI Updates",
    region: "india",
    sector: "Regulation",
    company: "SEBI",
    trustedType: "Official release",
    homepageUrl: "https://www.sebi.gov.in/rss.html",
    feedUrl: "https://www.sebi.gov.in/sebirss.xml",
    source: "SEBI"
  },
  {
    id: "imf-news",
    name: "IMF News RSS",
    region: "global",
    sector: "Macro Economy",
    company: "International Monetary Fund",
    trustedType: "Official release",
    homepageUrl: "https://www.imf.org/en/news/rss",
    feedUrl: "https://www.imf.org/en/News/RSS?TemplateID=%7B2FA3421A-F179-46B6-B8D9-5C65CB4A6584%7D",
    source: "IMF"
  }
];

module.exports = {
  liveSources
};

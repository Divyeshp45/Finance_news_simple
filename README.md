# FinNews Simple

FinNews Simple is a finance-awareness website for students and early learners. It shows Indian and global finance news in a simple style, supports multilingual summaries, includes finance word meanings, and offers a chatbot for help.

## Features

- Light and dark theme
- Indian and global finance news cards
- Search by company, sector, and keyword
- English, Hindi-English, and Marathi-English explanations
- Glossary of finance terms
- Server APIs for news, glossary, health, and chat
- Optional Gemini-powered chatbot and story explanation with local fallback

## Run locally

```bash
node server.js
```

Open [http://localhost:3000](http://localhost:3000)

## Environment variables

Copy `.env.example` into `.env` and add your settings.

- `PORT`: local server port
- `GEMINI_API_KEY`: enables Gemini chat replies and AI story explanations
- `GEMINI_MODEL`: defaults to `gemini-2.5-flash`
- `LIVE_NEWS_ENABLED`: turns official live feed ingestion on or off
- `LIVE_NEWS_TIMEOUT_MS`: timeout per live source request
- `LIVE_NEWS_CACHE_MS`: cache duration for live source fetches

## Test

```bash
npm test
```

## Deploy

This app can be deployed on Render, Railway, Azure App Service, or any Node hosting platform.

### Render

- Push this project to GitHub
- Create a new Render Web Service
- Render can use [render.yaml](/D:/Fin_news/render.yaml)
- Set `GEMINI_API_KEY` in the Render environment dashboard

### Railway

- Push this project to GitHub
- Create a new Railway project from the repo
- Railway can use [railway.json](/D:/Fin_news/railway.json)
- Set `GEMINI_API_KEY` in Railway variables

### Notes

- [Dockerfile](/D:/Fin_news/Dockerfile) is included for container-based deployment
- [Procfile](/D:/Fin_news/Procfile) is included for platforms that detect process types
- Live news uses official source feeds where available and falls back safely to seeded learning content if a source is unavailable

"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { URL } = require("node:url");
const { loadEnvFile } = require("./lib/config");
const { getNewsContent } = require("./lib/content-service");
const { getChatReply } = require("./lib/chat-service");
const { getStoryExplanation, isGeminiConfigured } = require("./lib/gemini-service");

loadEnvFile();

const publicDir = path.join(__dirname, "public");
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon"
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, text) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8"
  });
  response.end(text);
}

async function readRequestBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (!chunks.length) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return JSON.parse(raw);
}

function serveStatic(requestPath, response) {
  const safePath = requestPath === "/" ? "/index.html" : requestPath;
  const resolvedPath = path.normalize(path.join(publicDir, safePath));

  if (!resolvedPath.startsWith(publicDir)) {
    sendText(response, 403, "Forbidden");
    return;
  }

  fs.readFile(resolvedPath, (error, file) => {
    if (error) {
      sendText(response, 404, "Not found");
      return;
    }

    const ext = path.extname(resolvedPath);
    response.writeHead(200, {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream"
    });
    response.end(file);
  });
}

function createServer() {
  return http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);

      if (request.method === "GET" && url.pathname === "/api/health") {
        sendJson(response, 200, {
          status: "ok",
          app: "finnews-simple",
          aiConfigured: isGeminiConfigured(),
          aiProvider: isGeminiConfigured() ? "gemini" : "local",
          liveNewsEnabled: process.env.LIVE_NEWS_ENABLED === "true"
        });
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/news") {
        const filters = {
          search: url.searchParams.get("search"),
          region: url.searchParams.get("region"),
          sector: url.searchParams.get("sector")
        };
        const forceRefresh = url.searchParams.get("refresh") === "1";
        const content = await getNewsContent(filters, { forceRefresh });

        sendJson(response, 200, {
          items: content.items,
          sectors: content.sectors,
          glossary: content.glossary,
          live: content.live,
          filters
        });
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/sources") {
        const content = await getNewsContent({});
        sendJson(response, 200, content.live);
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/explain") {
        const storyId = url.searchParams.get("id");
        if (!storyId) {
          sendJson(response, 400, { error: "Story id is required." });
          return;
        }

        const content = await getNewsContent({});
        const item = content.items.find((entry) => String(entry.id) === String(storyId));
        if (!item) {
          sendJson(response, 404, { error: "Story not found." });
          return;
        }

        const explanation = await getStoryExplanation(item);
        sendJson(response, 200, {
          id: item.id,
          explanation
        });
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/chat") {
        const body = await readRequestBody(request);

        if (!body.message || !String(body.message).trim()) {
          sendJson(response, 400, {
            error: "Message is required."
          });
          return;
        }

        const reply = await getChatReply(body.message, body.language);
        sendJson(response, 200, reply);
        return;
      }

      if (request.method === "GET") {
        serveStatic(url.pathname, response);
        return;
      }

      sendJson(response, 404, { error: "Route not found." });
    } catch (error) {
      sendJson(response, 500, {
        error: "Internal server error.",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  });
}

function startServer(port = process.env.PORT || 3000) {
  const server = createServer();
  server.listen(port, () => {
    console.log(`FinNews Simple is running at http://localhost:${port}`);
  });
  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = {
  createServer,
  startServer
};

const themeToggle = document.getElementById("themeToggle");
const themeLabel = document.getElementById("themeLabel");
const newsGrid = document.getElementById("newsGrid");
const glossaryList = document.getElementById("glossaryList");
const searchInput = document.getElementById("searchInput");
const regionFilter = document.getElementById("regionFilter");
const languageFilter = document.getElementById("languageFilter");
const sectorFilter = document.getElementById("sectorFilter");
const resultsMeta = document.getElementById("resultsMeta");
const chatWindow = document.getElementById("chatWindow");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const assistantStatus = document.getElementById("assistantStatus");
const sourceStatusList = document.getElementById("sourceStatusList");

const state = {
  sectorsLoaded: false,
  explanationCache: new Map(),
  openExplanationId: null
};

const storedTheme = localStorage.getItem("finnews-theme");
if (storedTheme === "dark") {
  document.body.classList.add("dark");
}
updateThemeLabel();

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "finnews-theme",
    document.body.classList.contains("dark") ? "dark" : "light"
  );
  updateThemeLabel();
});

function updateThemeLabel() {
  themeLabel.textContent = document.body.classList.contains("dark") ? "Light Mode" : "Dark Mode";
}

function appendMessage(text, sender) {
  const message = document.createElement("div");
  message.className = sender === "user" ? "user-message" : "bot-message";
  message.textContent = text;
  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function renderGlossary(glossary) {
  glossaryList.innerHTML = "";

  if (!glossary.length) {
    glossaryList.innerHTML = '<div class="empty-state">No glossary matches for this filter.</div>';
    return;
  }

  glossary.forEach((entry) => {
    const card = document.createElement("article");
    card.className = "glossary-item";
    card.innerHTML = `
      <h4>${entry.term}</h4>
      <p>${entry.meaning}</p>
    `;
    glossaryList.appendChild(card);
  });
}

function renderSourceStatuses(live) {
  sourceStatusList.innerHTML = "";

  if (!live || !live.sourceStatuses) {
    sourceStatusList.innerHTML = '<div class="assistant-status">Source status unavailable.</div>';
    return;
  }

  live.sourceStatuses.forEach((status) => {
    const item = document.createElement("div");
    item.className = "assistant-status";
    const state = status.skipped
      ? "disabled"
      : status.ok
        ? `live (${status.itemCount} items)`
        : "fallback";
    item.textContent = `${status.sourceName}: ${state}`;
    sourceStatusList.appendChild(item);
  });
}

function renderNews(items) {
  const language = languageFilter.value;
  newsGrid.innerHTML = "";

  if (!items.length) {
    newsGrid.innerHTML = `
      <div class="empty-state">
        No matching stories found. Try another company name, sector, or broader keyword.
      </div>
    `;
    return;
  }

  items.forEach((item) => {
    const article = document.createElement("article");
    article.className = "news-card";
    const explanation = state.explanationCache.get(String(item.id));
    const isOpen = state.openExplanationId === String(item.id);
    const languageText = explanation ? explanation[language] || explanation.english : "";
    const glossaryMarkup = explanation?.glossary?.length
      ? `
        <div class="glossary-inline">
          ${explanation.glossary
            .map(
              (entry) => `
                <div class="glossary-inline-item">
                  <strong>${entry.term}</strong>
                  <p>${entry.meaning}</p>
                </div>
              `
            )
            .join("")}
        </div>
      `
      : "";
    article.innerHTML = `
      <div class="card-topline">
        <span class="source-badge">${item.source}</span>
        <span class="trust-pill">${item.trustedType}</span>
      </div>
      <h3>${item.title}</h3>
      <p class="meta-line">${item.sector} | ${item.company} | ${item.region === "india" ? "India" : "Global"}</p>
      <p>${item.summary}</p>
      <div class="meaning-box">
        <strong>High level in short</strong>
        <p>${item.highLevel}</p>
      </div>
      <div class="tag-row">
        ${item.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
      </div>
      <button class="secondary-btn explain-btn" type="button" data-story-id="${item.id}">
        ${isOpen ? "Hide Simple Explanation" : "Simple Explanation"}
      </button>
      ${
        isOpen
          ? `
            <div class="explanation-panel">
              <div class="simple-box">
                <strong>${language === "english" ? "Simple English" : language === "hinglish" ? "Hindi + English" : "Marathi + English"}</strong>
                <p>${languageText || "Loading explanation..."}</p>
              </div>
              ${
                explanation
                  ? `
                    <div class="meaning-box">
                      <strong>What it means in short</strong>
                      <p>${explanation.highLevel}</p>
                    </div>
                    <div class="meaning-box">
                      <strong>Why this matters</strong>
                      <p>${explanation.whyItMatters}</p>
                    </div>
                    ${glossaryMarkup}
                    <p class="explanation-note">Explanation source: ${explanation.sourceMode === "gemini" ? "AI generated with Gemini" : "local fallback"}</p>
                  `
                  : `<p class="explanation-note">Generating a simple explanation...</p>`
              }
            </div>
          `
          : ""
      }
      <a class="news-link" href="${item.sourceUrl}" target="_blank" rel="noreferrer">Visit source</a>
    `;
    newsGrid.appendChild(article);
  });

  newsGrid.querySelectorAll(".explain-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const storyId = String(button.dataset.storyId);
      toggleExplanation(storyId, items);
    });
  });
}

function populateSectors(sectors) {
  if (state.sectorsLoaded) {
    return;
  }

  sectors.forEach((sector) => {
    const option = document.createElement("option");
    option.value = sector;
    option.textContent = sector;
    sectorFilter.appendChild(option);
  });

  state.sectorsLoaded = true;
}

async function loadNews() {
  const params = new URLSearchParams({
    search: searchInput.value.trim(),
    region: regionFilter.value,
    sector: sectorFilter.value
  });

  const response = await fetch(`/api/news?${params.toString()}`);
  const data = await response.json();
  populateSectors(data.sectors);
  renderNews(data.items);
  renderGlossary(data.glossary);
  renderSourceStatuses(data.live);
  resultsMeta.textContent = `${data.items.length} story${data.items.length === 1 ? "" : "ies"} matched your filters.`;
}

async function loadHealth() {
  const response = await fetch("/api/health");
  const data = await response.json();
  assistantStatus.textContent = data.aiConfigured
    ? "Assistant mode: Gemini enabled"
    : "Assistant mode: local fallback enabled";
}

async function toggleExplanation(storyId) {
  if (state.openExplanationId === storyId) {
    state.openExplanationId = null;
    await loadNews();
    return;
  }

  state.openExplanationId = storyId;

  if (!state.explanationCache.has(storyId)) {
    await loadNews();
    try {
      const response = await fetch(`/api/explain?id=${encodeURIComponent(storyId)}`);
      const data = await response.json();
      if (data.explanation) {
        state.explanationCache.set(storyId, data.explanation);
      }
    } catch (error) {
      state.explanationCache.set(storyId, {
        sourceMode: "local",
        english: "The explanation is not available right now.",
        hinglish: "Simple explanation abhi available nahi hai.",
        marathi: "Simple explanation atta available nahi aahe.",
        highLevel: "Explanation unavailable.",
        whyItMatters: "Please try again later.",
        glossary: []
      });
    }
  }

  await loadNews();
}

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const question = chatInput.value.trim();

  if (!question) {
    return;
  }

  appendMessage(question, "user");
  chatInput.value = "";

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: question,
        language: languageFilter.value
      })
    });

    const data = await response.json();
    appendMessage(data.answer || "I could not answer that right now.", "bot");
    assistantStatus.textContent =
      data.mode === "gemini" ? "Assistant mode: Gemini enabled" : "Assistant mode: local fallback enabled";
  } catch (error) {
    appendMessage("The assistant is having trouble right now. Please try again.", "bot");
  }
});

[searchInput, regionFilter, languageFilter, sectorFilter].forEach((element) => {
  element.addEventListener("input", () => {
    loadNews().catch(() => {
      resultsMeta.textContent = "Unable to load stories right now.";
    });
  });
  element.addEventListener("change", () => {
    loadNews().catch(() => {
      resultsMeta.textContent = "Unable to load stories right now.";
    });
  });
});

Promise.all([loadNews(), loadHealth()]).catch(() => {
  resultsMeta.textContent = "Unable to load stories right now.";
  assistantStatus.textContent = "Assistant mode: unavailable";
});

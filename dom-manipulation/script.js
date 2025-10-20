// =======================
// Dynamic Quote Generator (with Server Sync)
// =======================
// Features:
// - Local Storage persistence (quotes)
// - Session Storage (last viewed quote index)
// - JSON import/export (with dynamic filename)
// - Accessible modal for confirmations
// - Category filter with persistence
// - Simulated server sync (mock API)
// - Conflict resolution (server wins)
// - Update notifications

// ----- Initial data (fallback if no saved data) -----
const DEFAULT_QUOTES = [
  { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Motivation" },
  { text: "In the middle of difficulty lies opportunity.", category: "Inspiration" },
  { text: "Simplicity is the soul of efficiency.", category: "Productivity" },
];

// ----- DOM references -----
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const addQuoteBtn = document.getElementById("addQuote");
const exportBtn = document.getElementById("exportQuotes");
const importFileInput = document.getElementById("importFile");
const addQuoteForm = document.getElementById("addQuoteForm");
const modal = document.getElementById("confirmationModal");
const modalMessage = document.getElementById("modalMessage");
const closeModalBtn = document.getElementById("closeModal");

// ----- Storage keys -----
const LOCAL_KEY = "alx_quotes_v1";
const SESSION_LAST_INDEX = "alx_quotes_last_index";

// ----- App state -----
let quotes = [];
let lastShownIndex = -1;

// =====================
// Storage helpers
// =====================
function saveQuotes() {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(quotes));
  } catch (err) {
    showModal("Unable to save to local storage.");
  }
}

function loadQuotes() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) {
      quotes = DEFAULT_QUOTES.slice();
      saveQuotes();
      return;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) quotes = parsed;
    else throw new Error("Invalid format");
  } catch {
    quotes = DEFAULT_QUOTES.slice();
    saveQuotes();
  }
}

function saveLastIndexToSession(index) {
  sessionStorage.setItem(SESSION_LAST_INDEX, String(index));
}

function readLastIndexFromSession() {
  const v = sessionStorage.getItem(SESSION_LAST_INDEX);
  return v !== null ? Number(v) : null;
}

// =====================
// Modal / Focus helpers
// =====================
function showModal(message) {
  modalMessage.textContent = message;
  modal.setAttribute("aria-hidden", "false");
  modalMessage.focus();
  setTimeout(() => closeModalBtn.focus(), 200);
}

function closeModal() {
  modal.setAttribute("aria-hidden", "true");
  addQuoteBtn.focus();
}

closeModalBtn.addEventListener("click", closeModal);
document.addEventListener("keydown", (evt) => {
  if (evt.key === "Escape" && modal.getAttribute("aria-hidden") === "false") closeModal();
});

// =====================
// Quote display logic
// =====================
function showRandomQuote(index = null) {
  if (!quotes.length) {
    quoteDisplay.innerHTML = "<p>No quotes available. Please add one!</p>";
    return;
  }

  const chosen = index ?? Math.floor(Math.random() * quotes.length);
  lastShownIndex = chosen;
  saveLastIndexToSession(chosen);

  const { text, category } = quotes[chosen];
  quoteDisplay.innerHTML = `
    <div role="article" aria-label="Quote in category ${category}">
      <p>"${text}"</p>
      <p class="quote-category">— Category: ${category}</p>
    </div>`;
}

// =====================
// Add / Import / Export
// =====================
function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (!text || !category) {
    showModal("⚠ Please enter both a quote and a category.");
    return;
  }

  quotes.push({ text, category });
  saveQuotes();
  postQuoteToServer({ text, category }); // sync immediately
  showModal("✅ Quote added successfully and synced!");
  document.getElementById("addQuoteForm").reset();
  showRandomQuote(quotes.length - 1);
}

function exportQuotes() {
  const date = new Date().toISOString().split("T")[0];
  const filename = `quotes_${date}.json`;

  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

function importQuotes(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        quotes = imported;
        saveQuotes();
        showModal("✅ Quotes imported successfully!");
        showRandomQuote();
      } else throw new Error();
    } catch {
      showModal("⚠ Invalid JSON file format.");
    }
  };
  reader.readAsText(file);
}

// =====================
// Simulated Server Sync
// =====================

/**
 * Simulate fetching quotes from a mock API (e.g., JSONPlaceholder).
 * In real apps, you'd use your backend endpoint.
 */
async function fetchQuotesFromServer() {
  try {
    const res = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=5");
    const data = await res.json();
    // Convert mock data into quote-like format
    return data.map((item) => ({
      text: item.title,
      category: "Server",
    }));
  } catch (err) {
    console.error("Server fetch failed:", err);
    return [];
  }
}

/**
 * Simulate posting a new quote to the server.
 */
async function postQuoteToServer(quote) {
  try {
    await fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quote),
    });
    console.log("Quote synced with server:", quote);
  } catch (err) {
    console.warn("Failed to sync quote:", err);
  }
}

/**
 * Periodically sync local quotes with the server.
 * Conflict rule: Server data overrides local if texts differ.
 */
async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();
  if (!serverQuotes.length) return;

  let conflictDetected = false;

  // Compare local vs server data
  const serverTexts = serverQuotes.map((q) => q.text);
  const localTexts = quotes.map((q) => q.text);

  // Detect mismatches
  if (JSON.stringify(serverTexts) !== JSON.stringify(localTexts)) {
    conflictDetected = true;
    // Server wins: overwrite local
    quotes = [...serverQuotes];
    saveQuotes();
  }

  if (conflictDetected) {
    showModal("⚠ Conflict detected — local data replaced with server data!");
    showRandomQuote();
  } else {
    console.log("✅ Quotes are already in sync.");
  }
}

// Start auto-sync every 30 seconds
setInterval(syncQuotes, 30000);

// =====================
// Event bindings
// =====================
newQuoteBtn.addEventListener("click", () => showRandomQuote());
addQuoteBtn.addEventListener("click", addQuote);
exportBtn.addEventListener("click", exportQuotes);
importFileInput.addEventListener("change", importQuotes);

// =====================
// Initialize App
// =====================
loadQuotes();
const lastIdx = readLastIndexFromSession();
if (lastIdx !== null) showRandomQuote(lastIdx);
else showRandomQuote();

// Perform initial sync on load
syncQuotes();

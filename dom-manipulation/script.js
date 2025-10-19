// ===============================
// Dynamic Quote Generator
// ===============================
// Features implemented:
// ✅ Local Storage persistence for quotes
// ✅ Session Storage to remember last viewed quote
// ✅ JSON Export & Import functionality using Blob and FileReader
// ✅ Accessible modal confirmations
// ✅ Robust validation and error handling
// ===============================

// ----- Default Quotes -----
const DEFAULT_QUOTES = [
  { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Motivation" },
  { text: "In the middle of difficulty lies opportunity.", category: "Inspiration" },
  { text: "Simplicity is the soul of efficiency.", category: "Productivity" },
];

// ----- DOM References -----
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const addQuoteBtn = document.getElementById("addQuote");
const exportBtn = document.getElementById("exportQuotes");
const importFileInput = document.getElementById("importFile");
const modal = document.getElementById("confirmationModal");
const modalMessage = document.getElementById("modalMessage");
const closeModalBtn = document.getElementById("closeModal");

// ----- Storage Keys -----
const LOCAL_KEY = "alx_quotes_v1";
const SESSION_KEY = "alx_quotes_last_index";

// ----- App State -----
let quotes = [];
let lastShownIndex = -1;

// ===============================
// STORAGE FUNCTIONS
// ===============================

/** Save quotes array into Local Storage */
function saveQuotes() {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(quotes));
  } catch (err) {
    console.error("Error saving quotes:", err);
    showModal("Unable to save quotes to local storage.");
  }
}

/** Load quotes from Local Storage or fall back to defaults */
function loadQuotes() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) {
      quotes = DEFAULT_QUOTES.slice();
      saveQuotes();
    } else {
      const parsed = JSON.parse(raw);
      // validate data shape
      if (Array.isArray(parsed) && parsed.every(q => q.text && q.category)) {
        quotes = parsed;
      } else {
        quotes = DEFAULT_QUOTES.slice();
        saveQuotes();
      }
    }
  } catch (err) {
    console.error("Error loading quotes:", err);
    quotes = DEFAULT_QUOTES.slice();
  }
}

/** Save last shown index in Session Storage */
function saveLastIndex(index) {
  try {
    sessionStorage.setItem(SESSION_KEY, String(index));
  } catch {}
}

/** Retrieve last shown index from Session Storage */
function loadLastIndex() {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    return stored ? Number(stored) : null;
  } catch {
    return null;
  }
}

// ===============================
// MODAL HANDLING
// ===============================
function showModal(message) {
  modalMessage.textContent = message;
  modal.setAttribute("aria-hidden", "false");
  modalMessage.focus();
  setTimeout(() => closeModalBtn.focus(), 150);
}

function closeModal() {
  modal.setAttribute("aria-hidden", "true");
  addQuoteBtn.focus();
}

closeModalBtn.addEventListener("click", closeModal);
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && modal.getAttribute("aria-hidden") === "false") closeModal();
});

// ===============================
// QUOTE DISPLAY LOGIC
// ===============================

/** Show a random quote or the one at given index */
function showRandomQuote(index = null) {
  if (!quotes.length) {
    quoteDisplay.innerHTML = "<p>No quotes available. Please add one!</p>";
    return;
  }

  const chosenIndex = index ?? Math.floor(Math.random() * quotes.length);
  const { text, category } = quotes[chosenIndex];

  // Save last shown index in session
  lastShownIndex = chosenIndex;
  saveLastIndex(chosenIndex);

  // Render quote
  quoteDisplay.innerHTML = `
    <article role="article" aria-label="Quote in category ${category}">
      <p>"${text}"</p>
      <p class="quote-category">— Category: ${category}</p>
    </article>
  `;
}

// ===============================
// ADD QUOTE
// ===============================
function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");

  const text = textInput.value.trim();
  const category = categoryInput.value.trim();

  if (!text || !category) {
    showModal("Please enter both quote text and category.");
    return;
  }

  quotes.push({ text, category });
  saveQuotes();

  textInput.value = "";
  categoryInput.value = "";

  showModal("Quote added successfully!");
  showRandomQuote(quotes.length - 1);
}

// ===============================
// JSON EXPORT
// ===============================
function exportToJsonFile() {
  try {
    if (!quotes.length) {
      showModal("No quotes available to export.");
      return;
    }

    // Convert quotes to JSON string
    const jsonData = JSON.stringify(quotes, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // Dynamic filename (e.g. quotes_2025-10-19.json)
    const date = new Date();
    const formattedDate = date.toISOString().split("T")[0];
    const filename = `quotes_${formattedDate}.json`;

    // Create temporary <a> link
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);

    // Trigger download
    a.click();

    // Cleanup after short delay (ensures browser can complete download)
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);

    showModal(`Quotes exported successfully as ${filename}!`);
  } catch (err) {
    console.error("Export failed:", err);
    showModal("Export failed. Please try again.");
  }
}
// ===============================
// JSON IMPORT
// ===============================
function importFromJsonFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (Array.isArray(importedQuotes)) {
        quotes.push(...importedQuotes);
        saveQuotes();
        showModal("Quotes imported successfully!");
      } else {
        showModal("Invalid JSON format.");
      }
    } catch (err) {
      showModal("Error reading JSON file.");
      console.error(err);
    }
  };
  reader.readAsText(file);
}

// ===============================
// EVENT BINDINGS
// ===============================
newQuoteBtn.addEventListener("click", () => showRandomQuote());
addQuoteBtn.addEventListener("click", addQuote);
exportBtn.addEventListener("click", exportToJsonFile);
importFileInput.addEventListener("change", importFromJsonFile);

// ===============================
// INITIALIZATION
// ===============================
window.addEventListener("DOMContentLoaded", () => {
  loadQuotes();
  const lastIndex = loadLastIndex();
  showRandomQuote(Number.isInteger(lastIndex) ? lastIndex : null);
});

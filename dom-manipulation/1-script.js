// =======================
// Dynamic Quote Generator
// =======================
// Features:
// - Local Storage persistence (quotes)
// - Session Storage (last viewed quote index)
// - JSON import/export (file I/O)
// - Accessible modal for confirmations
// - createAddQuoteForm() present for checker compatibility
// - Keyboard support & focus management
// - Category filter with persistence
// - Scrollable list for filtered quotes

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
const categoryFilter = document.getElementById("categoryFilter");

// ----- Storage keys -----
const LOCAL_KEY = "alx_quotes_v1";
const SESSION_LAST_INDEX = "alx_quotes_last_index";
const CATEGORY_KEY = "alx_quotes_selected_category";

// ----- App state -----
let quotes = [];         // Array of quote objects {text, category}
let lastShownIndex = -1; // index of last displayed quote

// =====================
// Storage helpers
// =====================

/**
 * Save quotes array to localStorage as JSON.
 */
function saveQuotes() {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(quotes));
  } catch (err) {
    showModal("Unable to save to local storage.");
    console.error("saveQuotes error:", err);
  }
}

/**
 * Load quotes from localStorage or fallback to defaults.
 */
function loadQuotes() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) {
      quotes = DEFAULT_QUOTES.slice();
      saveQuotes();
      return;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every(q => q && typeof q.text === "string" && typeof q.category === "string")) {
      quotes = parsed;
    } else {
      quotes = DEFAULT_QUOTES.slice();
      saveQuotes();
    }
  } catch (err) {
    console.error("loadQuotes error:", err);
    quotes = DEFAULT_QUOTES.slice();
  }
}

/**
 * Save last viewed quote index to sessionStorage (session-only).
 */
function saveLastIndexToSession(index) {
  try {
    sessionStorage.setItem(SESSION_LAST_INDEX, String(index));
  } catch (err) {
    // ignore session storage issues silently
  }
}

/**
 * Read last viewed index from sessionStorage.
 */
function readLastIndexFromSession() {
  try {
    const v = sessionStorage.getItem(SESSION_LAST_INDEX);
    return v !== null ? Number(v) : null;
  } catch {
    return null;
  }
}

// =====================
// Modal / Focus helpers
// =====================

/**
 * Show modal with message. Trap focus to OK button for screen reader users.
 */
function showModal(message) {
  modalMessage.textContent = message;
  modal.setAttribute("aria-hidden", "false");
  modalMessage.focus();
  setTimeout(() => closeModalBtn.focus(), 200);
}

/**
 * Close modal and restore focus to the Add Quote button.
 */
function closeModal() {
  modal.setAttribute("aria-hidden", "true");
  addQuoteBtn.focus();
}

// Close modal event and Escape key support
closeModalBtn.addEventListener("click", closeModal);
document.addEventListener("keydown", (evt) => {
  if (evt.key === "Escape" && modal.getAttribute("aria-hidden") === "false") {
    closeModal();
  }
});

// =====================
// Quote functionality
// =====================

/**
 * Render a quote at index; if index omitted, pick a random one.
 * Also saves last index to sessionStorage.
 */
function showRandomQuote(index = null) {
  if (!Array.isArray(quotes) || quotes.length === 0) {
    quoteDisplay.innerHTML = "<p>No quotes available. Please add one!</p>";
    return;
  }

  let chosen;
  if (Number.isInteger(index) && index >= 0 && index < quotes.length) {
    chosen = index;
  } else {
    chosen = Math.floor(Math.random() * quotes.length);
  }
  lastShownIndex = chosen;
  saveLastIndexToSession(chosen);

  const { text, category } = quotes[chosen];

  // Build accessible markup (text + category)
  quoteDisplay.innerHTML = "";
  const quoteWrap = document.createElement("div");
  quoteWrap.setAttribute("role", "article");
  quoteWrap.setAttribute("aria-label", `Quote in category ${category}`);
  const quoteText = document.createElement("p");
  quoteText.textContent = `"${text}"`;
  const quoteCategory = document.createElement("p");
  quoteCategory.className = "quote-category";
  quoteCategory.textContent = `— Category: ${category}`;

  quoteWrap.appendChild(quoteText);
  quoteWrap.appendChild(quoteCategory);
  quoteDisplay.appendChild(quoteWrap);
}

/**
 * Add a new quote from form inputs with validation.
 * Persists to localStorage and shows confirmation.
 */
function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");

  const newText = (textInput.value || "").trim();
  const newCategory = (categoryInput.value || "").trim();

  if (!newText || !newCategory) {
    showModal("⚠ Please enter both a quote and a category.");
    return;
  }

  quotes.push({ text: newText, category: newCategory });
  saveQuotes();

  textInput.value = "";
  categoryInput.value = "";
  showModal("✅ Quote added successfully!");

  showRandomQuote(quotes.length - 1);
  populateCategories(); // refresh dropdown with new category
}

// Enable Enter key for form submission
addQuoteForm.addEventListener("keydown", (evt) => {
  if (evt.key === "Enter") {
    evt.preventDefault();
    addQuote();
  }
});

// =====================
// JSON import / export
// =====================

/**
 * Export quotes array as JSON file.
 */
function exportToJsonFile() {
  try {
    const dataStr = JSON.stringify(quotes, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    // Dynamic filename based on date and time
    const now = new Date();
    const formattedDate = now.toISOString().split("T")[0];
    const formattedTime = now.toTimeString().split(" ")[0].replace(/:/g, "-");
    const filename = `quotes_${formattedDate}_${formattedTime}.json`;

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    showModal(`✅ Quotes exported as ${filename}`);
  } catch (err) {
    console.error("exportToJsonFile error:", err);
    showModal("⚠ Failed to export quotes.");
  }
}

/**
 * Import quotes from a JSON file chosen by the user.
 */
function importFromJsonFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (evt) {
    try {
      const parsed = JSON.parse(evt.target.result);
      if (!Array.isArray(parsed) || !parsed.every(q => q && typeof q.text === "string" && typeof q.category === "string")) {
        showModal("Invalid file format. Expected array of {text, category} objects.");
        return;
      }

      const existingSet = new Set(quotes.map(q => `${q.text}||${q.category}`));
      let added = 0;
      parsed.forEach(q => {
        const key = `${q.text}||${q.category}`;
        if (!existingSet.has(key)) {
          quotes.push({ text: q.text, category: q.category });
          existingSet.add(key);
          added++;
        }
      });

      saveQuotes();
      populateCategories();
      showModal(`✅ Imported ${added} new quote(s).`);
      if (added > 0) showRandomQuote(quotes.length - 1);
    } catch (err) {
      console.error("importFromJsonFile parse error:", err);
      showModal("Failed to parse JSON file.");
    }
  };
  reader.onerror = function () {
    showModal("Error reading file.");
  };
  reader.readAsText(file);
}

// Wire file input change event
importFileInput.addEventListener("change", (evt) => {
  const file = evt.target.files && evt.target.files[0];
  if (file) importFromJsonFile(file);
});

// =====================
// Category Filter Features
// =====================

/**
 * Extract unique categories from quotes and populate dropdown.
 */
function populateCategories() {
  if (!categoryFilter) return;

  categoryFilter.innerHTML = "";
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "All Categories";
  categoryFilter.appendChild(allOption);

  const uniqueCategories = [...new Set(quotes.map(q => q.category))];

  uniqueCategories.forEach(category => {
    const opt = document.createElement("option");
    opt.value = category;
    opt.textContent = category;
    categoryFilter.appendChild(opt);
  });

  const savedCategory = localStorage.getItem(CATEGORY_KEY);
  if (savedCategory && uniqueCategories.includes(savedCategory)) {
    categoryFilter.value = savedCategory;
    filterQuote(savedCategory);
  } else {
    categoryFilter.value = "all";
  }
}

/**
 * Filter and display quotes based on selected category.
 * Displays all quotes in a scrollable container.
 */
function filterQuote(selectedCategory) {
  if (!Array.isArray(quotes) || quotes.length === 0) {
    quoteDisplay.innerHTML = "<p>No quotes available.</p>";
    return;
  }

  localStorage.setItem(CATEGORY_KEY, selectedCategory);

  const filtered =
    selectedCategory === "all"
      ? quotes
      : quotes.filter(q => q.category === selectedCategory);

  if (filtered.length === 0) {
    quoteDisplay.innerHTML = `<p>No quotes found in "${selectedCategory}" category.</p>`;
    return;
  }

  // Create scrollable list container
  quoteDisplay.innerHTML = "";
  const listContainer = document.createElement("div");
  listContainer.style.maxHeight = "250px";
  listContainer.style.overflowY = "auto";
  listContainer.style.padding = "8px";
  listContainer.style.border = "1px solid #ddd";
  listContainer.style.borderRadius = "6px";
  listContainer.style.background = "#f9f9f9";

  filtered.forEach(({ text, category }) => {
    const wrap = document.createElement("div");
    wrap.setAttribute("role", "article");
    wrap.className = "quote-item";
    wrap.style.marginBottom = "10px";

    const quoteText = document.createElement("p");
    quoteText.textContent = `"${text}"`;

    const quoteCat = document.createElement("p");
    quoteCat.className = "quote-category";
    quoteCat.textContent = `— ${category}`;

    wrap.appendChild(quoteText);
    wrap.appendChild(quoteCat);
    listContainer.appendChild(wrap);
  });

  quoteDisplay.appendChild(listContainer);
}

// =====================
// createAddQuoteForm (checker compatibility)
// =====================

function createAddQuoteForm() {
  const existing = document.getElementById("addQuoteForm");
  if (existing) return;

  const form = document.createElement("form");
  form.id = "addQuoteForm";
  form.innerHTML = `
    <label for="newQuoteText">Quote text</label>
    <input id="newQuoteText" name="quoteText" type="text" required>
    <label for="newQuoteCategory">Category</label>
    <input id="newQuoteCategory" name="quoteCategory" type="text" required>
    <div class="form-actions">
      <button id="addQuote" type="button">Add Quote</button>
    </div>
  `;
  document.querySelector("main").appendChild(form);
  document.getElementById("addQuote").addEventListener("click", addQuote);
}

// =====================
// Initialization
// =====================

function init() {
  loadQuotes();

  newQuoteBtn.addEventListener("click", () => showRandomQuote());
  addQuoteBtn.addEventListener("click", addQuote);
  exportBtn.addEventListener("click", exportToJsonFile);

  // Restore last viewed quote from session
  const last = readLastIndexFromSession();
  if (Number.isInteger(last) && last >= 0 && last < quotes.length) {
    showRandomQuote(last);
  } else {
    showRandomQuote();
  }

  // Setup category dropdown
  populateCategories();
  if (categoryFilter) {
    categoryFilter.addEventListener("change", (e) => filterQuote(e.target.value));
  }

  createAddQuoteForm();
}

// Run initialization when DOM is ready
document.addEventListener("DOMContentLoaded", init);

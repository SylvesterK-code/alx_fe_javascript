// =======================
// Dynamic Quote Generator
// =======================

// Array of quote objects (each with text and category)
const quotes = [
  { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Motivation" },
  { text: "In the middle of difficulty lies opportunity.", category: "Inspiration" },
  { text: "Simplicity is the soul of efficiency.", category: "Productivity" },
];

// ===== Select Key DOM Elements =====
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const addQuoteBtn = document.getElementById("addQuote");
const modal = document.getElementById("confirmationModal");
const modalMessage = document.getElementById("modalMessage");
const closeModalBtn = document.getElementById("closeModal");

// ====================
// Utility Modal System
// ====================

// Function to show custom confirmation modal
function showModal(message) {
  modalMessage.textContent = message;
  modal.style.display = "block";
}

// Close the modal when the OK button is clicked
closeModalBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

// ====================
// Quote Functionality
// ====================

// Function to display a random quote
function showRandomQuote() {
  if (quotes.length === 0) {
    quoteDisplay.innerHTML = "<p>No quotes available. Please add one!</p>";
    return;
  }

  // Select a random quote index
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const { text, category } = quotes[randomIndex];

  // Clear previous content
  quoteDisplay.innerHTML = "";

  // Create and populate new DOM elements
  const quoteText = document.createElement("p");
  quoteText.textContent = `"${text}"`;

  const quoteCategory = document.createElement("p");
  quoteCategory.classList.add("quote-category");
  quoteCategory.textContent = `— Category: ${category}`;

  // Append new elements to the quote display container
  quoteDisplay.appendChild(quoteText);
  quoteDisplay.appendChild(quoteCategory);
}

// Function to add a new quote dynamically
function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");

  const newText = textInput.value.trim();
  const newCategory = categoryInput.value.trim();

  // Validate input fields
  if (newText === "" || newCategory === "") {
    showModal("Please enter both a quote and a category.");
    return;
  }

  // Add the new quote object to the array
  quotes.push({ text: newText, category: newCategory });

  // Clear the input fields after adding
  textInput.value = "";
  categoryInput.value = "";

  // Show success message using custom modal
  showModal("✅ Quote added successfully!");

  // Display the newly added quote
  showRandomQuote();
}

// ====================
// Event Listeners
// ====================
newQuoteBtn.addEventListener("click", showRandomQuote);
addQuoteBtn.addEventListener("click", addQuote);
document.addEventListener("DOMContentLoaded", showRandomQuote);

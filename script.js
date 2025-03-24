const urlInput = document.getElementById("urlInput");
const suggestionsList = document.getElementById("suggestionsList");
let validTLDs = null;
let selectedIndex = -1;

// Fetch TLDs and store in memory
async function fetchValidTLDs() {
  if (validTLDs) return validTLDs;
  try {
    const response = await fetch("https://data.iana.org/TLD/tlds-alpha-by-domain.txt");
    if (!response.ok) throw new Error("Failed to fetch TLDs");
    validTLDs = (await response.text())
      .split("\n")
      .filter(tld => tld.startsWith("#"))
      .map(tld => tld.trim().toLowerCase());
    return validTLDs;
  } catch (error) {
    console.error("Error fetching TLDs:", error);
    return [];
  }
}

// Extract TLD from a URL
function extractTLD(url) {
  try {
    const hostname = new URL(url.includes("://") ? url : `https://${url}`).hostname;
    return hostname.split(".").pop().toLowerCase();
  } catch {
    return null;
  }
}

// Check if the input is a valid IP address
function checkIp(input) {
  return /^(\d{1,3}\.){3}\d{1,3}$|^([a-fA-F0-9:]+:+)+[a-fA-F0-9]+$/.test(input);
}

// Fetch word suggestions
async function fetchDatamuseSuggestions(query) {
  try {
    const response = await fetch(`https://api.datamuse.com/sug?s=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error("Failed to fetch suggestions");
    return (await response.json()).map(item => item.word);
  } catch (error) {
    console.warn("Datamuse API error:", error);
    return [];
  }
}

// Generate suggestions
async function fetchSuggestions(query) {
  if (!query) return;
  
  const [wordSuggestions, tlds] = await Promise.all([
    fetchDatamuseSuggestions(query),
    fetchValidTLDs()
  ]);
  
  const suggestions = new Set(wordSuggestions);
  
  // Check if input is a domain
  if (query.includes(".")) {
    const tld = extractTLD(query);
    if (tlds.includes(tld)) {
      suggestions.add(query);
    }
  }
  
  updateSuggestionsList(Array.from(suggestions));
}

// Update UI for suggestions
function updateSuggestionsList(suggestions) {
  suggestionsList.innerHTML = "";
  selectedIndex = -1;
  if (!suggestions.length) return;
  
  const fragment = document.createDocumentFragment();
  suggestions.forEach((suggestion, index) => {
    const item = document.createElement("li");
    item.textContent = suggestion;
    item.addEventListener("click", () => {
      urlInput.value = suggestion;
      navigateToURL();
    });
    fragment.appendChild(item);
  });
  suggestionsList.appendChild(fragment);
}

// Navigate to a URL or search
function navigateToURL() {
  const query = urlInput.value.trim();
  if (!query) return;
  
  if (query.includes(".") || checkIp(query)) {
    window.location.href = `https://${query}`;
  } else {
    window.location.href = `https://www.ecosia.org/search?q=${encodeURIComponent(query)}`;
  }
}

// Debounce input event
function debounce(func, delay) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

const debouncedFetchSuggestions = debounce(fetchSuggestions, 300);

// Event Listeners
urlInput.addEventListener("input", () => debouncedFetchSuggestions(urlInput.value));

urlInput.addEventListener("keydown", (e) => {
  const items = suggestionsList.querySelectorAll("li");
  if (!items.length) return;

  if (e.key === "ArrowDown") {
    selectedIndex = (selectedIndex + 1) % items.length;
  } else if (e.key === "ArrowUp") {
    selectedIndex = (selectedIndex - 1 + items.length) % items.length;
  } else if (e.key === "Enter") {
    if (selectedIndex >= 0) {
      urlInput.value = items[selectedIndex].textContent;
    }
    navigateToURL();
  }

  items.forEach((item, index) => {
    item.classList.toggle("selected", index === selectedIndex);
  });
});

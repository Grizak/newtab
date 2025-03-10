const urlInput = document.getElementById("urlinput");
const goButton = document.getElementById("goButton");
const messageElement = document.getElementById("message");

function checkIp(query) {
  const ipv4regex =
    /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)?(:\d{1,5})?$/;
  const ipv6regex =
    /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}(:\d{1,5})?$|^([0-9a-fA-F]{1,4}:){1,7}:(:\d{1,5})?$|^([0-9a-fA-F]{1,4}:){1,6}([0-9a-fA-F]{1,4})?(:\d{1,5})?$|^([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}(:\d{1,5})?$|^([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}(:\d{1,5})?$|^([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}(:\d{1,5})?$|^([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}(:\d{1,5})?$|^([0-9a-fA-F]{1,4}:){1}(:[0-9a-fA-F]{1,4}){1,6}(:\d{1,5})?$|^:((:[0-9a-fA-F]{1,4}){1,7}|:)(:\d{1,5})?$/;
  return ipv4regex.test(query) || ipv6regex.test(query);
}

async function fetchValidTLDs() {
  const cachedData = localStorage.getItem("validTLDs");
  if (cachedData) {
    const { tlds, expiry } = JSON.parse(cachedData);
    if (Date.now() < expiry) {
      return tlds;
    }
  }

  try {
    const response = await fetch(
      "https://data.iana.org/TLD/tlds-alpha-by-domain.txt"
    );
    if (!response.ok) throw new Error("Failed to fetch TLDs");

    const text = await response.text();
    const tlds = text
      .split("\n")
      .filter((line) => line && !line.startsWith("#"))
      .map((tld) => tld.toLowerCase());

    localStorage.setItem(
      "validTLDs",
      JSON.stringify({ tlds, expiry: Date.now() + 24 * 60 * 60 * 1000 })
    );
    return tlds;
  } catch (error) {
    console.error("Error fetching valid TLDs:", error);
    return [];
  }
}

function extractTLD(url) {
  try {
    const parsedUrl = new URL(url.includes("://") ? url : `https://${url}`);
    const hostnameParts = parsedUrl.hostname.split(".");
    return hostnameParts.length > 1
      ? hostnameParts[hostnameParts.length - 1]
      : null;
  } catch (e) {
    return null;
  }
}

function storeQuery(query) {
  let storedQueries = JSON.parse(localStorage.getItem("storedQueries")) || [];
  if (!storedQueries.includes(query)) {
    storedQueries.unshift(query);
    if (storedQueries.length > 10) storedQueries.pop();
    localStorage.setItem("storedQueries", JSON.stringify(storedQueries));
  }
}

function getStoredQueries() {
  return JSON.parse(localStorage.getItem("storedQueries")) || [];
}

async function fetchDatamuseSuggestions(query) {
  try {
    const response = await fetch(
      `https://api.datamuse.com/sug?s=${encodeURIComponent(query)}`
    );
    if (!response.ok) throw new Error("Failed to fetch suggestions");
    const data = await response.json();
    return data.map((item) => item.word);
  } catch (error) {
    console.error("Error fetching suggestions from Datamuse:", error);
    return [];
  }
}

async function fetchSuggestions() {
  const query = urlInput.value;
  const suggestionsList = document.getElementById("suggestionsList");
  suggestionsList.innerHTML = "";

  // Add the current query as the first item in the list
  const firstItem = document.createElement("li");
  firstItem.textContent = query;
  firstItem.classList.add("current-query");
  firstItem.classList.add("selected");
  firstItem.addEventListener("click", function () {
    urlInput.value = firstItem.textContent;
    suggestionsList.innerHTML = ""; // Clear suggestions after selection
    navigateToURL();
  });
  await fetchValidTLDs().then((validTLDs) => {
    if (
      validTLDs.includes(extractTLD(query)) ||
      query.includes("localhost") ||
      checkIp(query)
    ) {
      firstItem.classList.add("valid");
    }
  });
  suggestionsList.appendChild(firstItem);

  if (query.length >= 2) {
    let storedQueries = getStoredQueries();
    let suggestions = [...storedQueries];

    if (suggestions.length < 15) {
      const extraSuggestions = await fetchDatamuseSuggestions(query);
      suggestions = [...new Set([...suggestions, ...extraSuggestions])].slice(
        0,
        15
      );
    }

    suggestions.forEach((suggestion) => {
      const li = document.createElement("li");
      li.textContent = suggestion;
      li.addEventListener("click", function () {
        urlInput.value = suggestion;
        clearSL();
        navigateToURL();
      });
      suggestionsList.appendChild(li);
    });
  }
}

function displayMessage(message, classToAdd) {
  if (messageElement) {
    messageElement.textContent = message;
    messageElement.classList.add(classToAdd);
  } else {
    alert(message);
  }
}

function clearMessage() {
  messageElement.textContent = "";
  messageElement.className = "";
}

function clearSL() {
  document.getElementById("suggestionsList").innerHTML = "";
}

function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

let selectedIndex = 0;

urlInput.addEventListener("input", debounce(fetchSuggestions, 100));

urlInput.addEventListener("keydown", (event) => {
  const suggestionsList = document.getElementById("suggestionsList");
  const items = suggestionsList.getElementsByTagName("li");

  if (event.key === "ArrowDown") {
    if (selectedIndex < items.length - 1) {
      selectedIndex++;
      updateSelectedItem(items);
      event.preventDefault();
    }
  } else if (event.key === "ArrowUp") {
    if (selectedIndex > 0) {
      selectedIndex--;
      updateSelectedItem(items);
      event.preventDefault();
    }
  } else if (event.key === "Enter") {
    if (selectedIndex >= 0) {
      event.preventDefault();
      urlInput.value = items[selectedIndex].textContent;
      clearSL();
      navigateToURL();
    }
  }
});

function updateSelectedItem(items) {
  Array.from(items).forEach((item) => item.classList.remove("selected"));
  if (selectedIndex >= 0 && selectedIndex < items.length) {
    items[selectedIndex].classList.add("selected");
  }
}

async function navigateToURL() {
  let inputValue = urlInput.value.trim();
  clearMessage();

  if (!inputValue) {
    displayMessage("Please enter a URL or search term!", "error");
    return;
  }

  storeQuery(inputValue);

  if (checkIp(inputValue) || inputValue.startsWith("localhost")) {
    if (!inputValue.includes("://")) {
      inputValue = `http://${inputValue}`;
    }
    window.open(inputValue, "_blank");
    return;
  }

  const validTLDs = await fetchValidTLDs();
  const tld = extractTLD(inputValue);

  if (tld && validTLDs.includes(tld)) {
    let validUrl =
      inputValue.startsWith("http://") || inputValue.startsWith("https://")
        ? inputValue
        : `https://${inputValue}`;
    window.open(validUrl, "_blank");
  } else {
    window.open(
      `https://www.ecosia.org/search?q=${encodeURIComponent(inputValue)}`,
      "_blank"
    );
  }

  clearMessage();
  clearSL();
  urlInput.focus();
}

window.addEventListener("DOMContentLoaded", () => {
  urlInput.focus();
  fetchValidTLDs();
});

goButton.addEventListener("click", navigateToURL);

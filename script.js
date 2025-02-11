const urlInput = document.getElementById("urlinput");
const goButton = document.getElementById("goButton");
const messageElement = document.getElementById("message");

function checkIp(query) {
  const ipv4regex =
    /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6regex =
    /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,7}:$|^([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}$|^([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}$|^([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}$|^([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}$|^([0-9a-fA-F]{1,4}:){1}(:[0-9a-fA-F]{1,4}){1,6}$|^:((:[0-9a-fA-F]{1,4}){1,7}|:)$/;

  return ipv4regex.test(query) || ipv6regex.test(query);
}

// Function to fetch the list of valid TLDs from the IANA database
async function fetchValidTLDs() {
  const cachedData = localStorage.getItem("validTLDs");
  if (cachedData) {
    const { tlds, expiry } = JSON.parse(cachedData);
    if (Date.now() < expiry) {
      return tlds; // Return cached TLDs if they haven't expired
    }
  }

  // Fetch fresh data from IANA
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

    // Store TLDs in localStorage with an expiration time of 1 day
    localStorage.setItem(
      "validTLDs",
      JSON.stringify({
        tlds,
        expiry: Date.now() + 24 * 60 * 60 * 1000, // Expiry set to 24 hours from now
      })
    );

    return tlds;
  } catch (error) {
    console.error("Error fetching valid TLDs:", error);
    return [];
  }
}

// Function to extract the TLD from a URL
function extractTLD(url) {
  try {
    const parsedUrl = new URL(url.includes("://") ? url : `https://${url}`);
    const hostnameParts = parsedUrl.hostname.split(".");

    // If there are at least two parts (e.g., 'example.com'), return the last part as the TLD
    if (hostnameParts.length > 1) {
      return hostnameParts[hostnameParts.length - 1];
    }
  } catch (e) {
    return null; // If the URL is invalid, return null
  }
  return null; // If no TLD found, return null
}

// Function to display a message
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
  const sl = document.getElementById("suggestionsList");
  sl.innerHTML = "";
}

// Debounce function to limit the rate at which a function is called
function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

let selectedIndex = 0; // Keeps track of the currently selected item in the list

const fetchSuggestions = debounce(function () {
  const query = urlInput.value;
  const suggestionsList = document.getElementById("suggestionsList");

  // Clear the previous suggestions
  suggestionsList.innerHTML = "";

  if (query.length >= 2) {
    fetch(
      `https://api.datamuse.com/sug?s=${encodeURIComponent(query)}&max=10`,
      {
        method: "GET",
      }
    )
      .then((response) => response.json())
      .then((data) => {
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
        fetchValidTLDs().then((validTLDs) => {
          if (
            validTLDs.includes(extractTLD(query)) ||
            query.includes("localhost") ||
            checkIp(query)
          ) {
            firstItem.classList.add("valid");
          }
        });
        suggestionsList.appendChild(firstItem);

        // Add the rest of the suggestions below the current query
        data.forEach((item, index) => {
          const li = document.createElement("li");
          li.textContent = item.word;
          li.addEventListener("click", function () {
            urlInput.value = this.textContent;
            suggestionsList.innerHTML = ""; // Clear suggestions after selection
            navigateToURL();
          });
          suggestionsList.appendChild(li);
        });

        // Set focus on the first item after suggestions are added
        selectedIndex = 0; // Reset selected index
      })
      .catch((error) => {
        console.error("Error fetching suggestions:", error);
      });
  } else {
    suggestionsList.innerHTML = ""; // Clear suggestions if the query is too short
  }
  clearMessage();
}, 100);

urlInput.addEventListener("input", fetchSuggestions);

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
    event.preventDefault();
    if (selectedIndex > 0) {
      selectedIndex--;
      updateSelectedItem(items);
    }
  } else if (event.key === "Enter") {
    if (selectedIndex >= 0) {
      event.preventDefault();
      urlInput.value = items[selectedIndex].textContent;
      suggestionsList.innerHTML = ""; // Clear suggestions after selection
      navigateToURL();
    }
  } else if (event.key === "Escape") {
    event.preventDefault();
    suggestionsList.innerHTML = ""; // Close suggestions list without selecting anything
  } else if (event.key === "Tab") {
    // If tab key pressed, select the item and put it in the input, but don't navigate
    event.preventDefault();
    urlInput.value = items[selectedIndex].textContent;
    clearSL();
    fetchSuggestions();
  }
});

function updateSelectedItem(items) {
  // Remove the 'selected' class from all items
  Array.from(items).forEach((item) => item.classList.remove("selected"));

  // Add the 'selected' class to the currently focused item
  if (selectedIndex >= 0 && selectedIndex < items.length) {
    items[selectedIndex].classList.add("selected");
  }
}

// Event listener for input field
urlInput.addEventListener("input", fetchSuggestions());

// Navigating based on input
async function navigateToURL() {
  let inputValue = urlInput.value.trim(); // Get the input value and trim spaces
  clearMessage();

  if (!inputValue) {
    displayMessage("Please enter a URL or search term!", "error");
    return;
  }

  if (
    inputValue.startsWith("localhost") ||
    inputValue.startsWith("http://localhost")
  ) {
    if (!inputValue.startsWith("http://")) {
      inputValue = `http://${inputValue}`;
    }
    window.open(inputValue, "_blank");

    urlInput.value = ""; // Reset the input element to empty when loading url
    urlInput.focus(); // Set the text marker to be on the input element
    return;
  }

  if (checkIp(inputValue)) {
    if (!inputValue.includes("://")) {
      inputValue = `http://${inputValue}`;
    }

    window.open(inputValue, "_blank");

    urlInput.value = ""; // Reset the input element to empty when loading url
    urlInput.focus(); // Set the text marker to be on the input element
    return;
  }

  // Handle TLD and other checks like before
  const validTLDs = await fetchValidTLDs();
  const tld = extractTLD(inputValue);

  if (tld && validTLDs.includes(tld)) {
    let validUrl =
      inputValue.startsWith("http://") || inputValue.startsWith("https://")
        ? inputValue
        : `https://${inputValue}`;

    validUrl = validUrl.split("/");

    validUrl[2] = validUrl[2].toLowerCase();

    const toRedirectUrl = validUrl.join("/");
    window.open(toRedirectUrl, "_blank");
  } else {
    // Perform Ecosia search if no valid TLD found
    const searchQuery = encodeURIComponent(inputValue); // Encode the search query
    window.open(`https://www.ecosia.org/search?q=${searchQuery}`, "_blank");
  }

  urlInput.value = ""; // Reset the input element to empty when loading url
  clearMessage();
  clearSL();
  urlInput.focus(); // Set the text marker to be on the input element
}

window.addEventListener("DOMContentLoaded", () => {
  urlInput.focus();
  fetchValidTLDs();
});

goButton.addEventListener("click", () => {
  navigateToURL();
});

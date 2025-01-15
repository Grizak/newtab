// Select the input and button elements
const urlInput = document.getElementById("urlinput");
const goButton = document.getElementById("goButton");
const messageElement = document.getElementById("message");

// Function to fetch the list of valid TLDs from the IANA database
async function fetchValidTLDs() {
  const response = await fetch(
    "https://data.iana.org/TLD/tlds-alpha-by-domain.txt"
  );

  if (!response.ok) {
    console.error("Failed to fetch TLDs");
    return [];
  }

  const text = await response.text();
  // Split the text by new lines and remove any lines that start with a '#'
  const tlds = text.split("\n").filter((line) => line && !line.startsWith("#"));
  return tlds.map((tld) => tld.toLowerCase()); // Convert all TLDs to lowercase
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
  messageElement.classList = "";
}

// Function to navigate to the URL or Ecosia search
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

  // Get the valid TLDs
  const validTLDs = await fetchValidTLDs();

  // Check if the input is a valid TLD or a search term
  const tld = extractTLD(inputValue);

  if (tld && validTLDs.includes(tld)) {
    // If TLD is valid, construct a full URL
    let validUrl =
      inputValue.startsWith("http://") || inputValue.startsWith("https://")
        ? inputValue
        : `https://${inputValue}`;

    validUrl = validUrl.split("/");

    validUrl[2] = validUrl[2].toLowerCase();

    const toRedirectUrl = validUrl.join("/");
    window.open(toRedirectUrl, "_blank");

    console.log(validUrl, toRedirectUrl);
  } else {
    // If no valid TLD, perform Ecosia search
    const searchQuery = encodeURIComponent(inputValue); // Encode the search query
    window.open(`https://www.ecosia.org/search?q=${searchQuery}`, "_blank");
  }

  urlInput.value = ""; // Reset the input element to empty when loading url
  urlInput.focus(); // Set the text marker to be on the input element
}

// Add event listeners
goButton.addEventListener("click", navigateToURL);
urlInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    event.preventDefault(); // Prevent form submission
    navigateToURL();
  }
});

urlInput.addEventListener("input", () => {
  urlInput.focus();
});

// Set focus on the search input when the page loads
document.addEventListener("DOMContentLoaded", () => {
  urlInput.focus();
});

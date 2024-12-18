// Select the input and button elements
const urlInput = document.getElementById('urlinput');
const goButton = document.getElementById('goButton');

// List of valid TLDs (Top-Level Domains)
const validTLDs = ['com', 'org', 'net', 'io', 'co', 'edu']; // Add more TLDs as needed

// Function to extract the TLD from a URL
function extractTLD(url) {
  try {
    const parsedUrl = new URL(url.includes('://') ? url : `https://${url}`);
    const hostnameParts = parsedUrl.hostname.split('.');

    // If there are at least two parts (e.g., 'example.com'), return the last part as the TLD
    if (hostnameParts.length > 1) {
      return hostnameParts[hostnameParts.length - 1];
    }
  } catch (e) {
    return null; // If the URL is invalid, return null
  }
  return null; // If no TLD found, return null
}

// Function to validate the URL or search term
function navigateToURL() {
  const inputValue = urlInput.value.trim(); // Get the input value and trim spaces
  clearMessage(); // Clear the message from a previous search

  if (!inputValue) {
    displayMessage('Please enter a URL or search term!', "error");
    return;
  }

  // Check if the input is a valid TLD or a search term
  const tld = extractTLD(inputValue);

  if (tld && validTLDs.includes(tld)) {
    // If TLD is valid, construct a full URL
    const validUrl = inputValue.startsWith('http://') || inputValue.startsWith('https://') 
      ? inputValue 
      : `https://${inputValue}`;
    window.open(validUrl, '_blank');
  } else {
    // If no valid TLD, perform Ecosia search
    const searchQuery = encodeURIComponent(inputValue); // Encode the search query
    window.open(`https://www.ecosia.org/search?q=${searchQuery}`, '_blank');
  }
}

// Display an error message
function displayMessage(message, classToAdd) {
  const messageElement = document.getElementById('message');
  if (messageElement) {
    messageElement.textContent = message;
    messageElement.classList.add(classToAdd);
  } else {
    alert(message);
  }
}

function clearMessage() {
  document.getElementById('message').textContent = '';
  document.getElementById('message').classList = '';
}

// Add event listeners
goButton.addEventListener('click', navigateToURL);
urlInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault(); // Prevent form submission
    navigateToURL();
  }
});

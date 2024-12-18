// Select the input and button elements
const urlInput = document.getElementById('urlinput');
const goButton = document.getElementById('goButton');

// Function to validate if a string is a valid URL
function isValidURL(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Function to navigate to the entered URL or Ecosia search
function navigateToURL() {
  const inputValue = urlInput.value.trim(); // Get the input value and trim spaces

  if (!inputValue) {
    displayMessage('Please enter a URL or search term!');
    return;
  }

  if (isValidURL(inputValue)) {
    // If valid, ensure the URL has a scheme
    const validUrl = inputValue.startsWith('http://') || inputValue.startsWith('https://') 
      ? inputValue 
      : `https://${inputValue}`;
    window.open(validUrl, '_blank');
  } else {
    // If not a valid URL, redirect to Ecosia search
    const searchQuery = encodeURIComponent(inputValue); // Encode the search query
    window.open(`https://www.ecosia.org/search?q=${searchQuery}`, '_blank');
  }
}

// Display an error message
function displayMessage(message) {
  const messageElement = document.getElementById('message');
  if (messageElement) {
    messageElement.textContent = message;
  } else {
    alert(message);
  }
}

// Add event listeners
goButton.addEventListener('click', navigateToURL);
urlInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault(); // Prevent form submission
    navigateToURL();
  }
});

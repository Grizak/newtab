// Select the input and button elements
const urlInput = document.getElementById('urlinput');
const goButton = document.getElementById('goButton');

// Function to validate if a string is a valid URL
function isValidURL(url) {
  const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/.*)?$/i;
  return urlPattern.test(url);
}

// Function to navigate to the entered URL or Ecosia search
function navigateToURL() {
  const inputValue = urlInput.value.trim(); // Get the input value and trim spaces

  if (!inputValue) {
    alert('Please enter a URL or search term!');
    return;
  }

  if (isValidURL(inputValue)) {
    // If valid, ensure the URL has a scheme
    const validUrl = inputValue.startsWith('http://') || inputValue.startsWith('https://') 
      ? inputValue 
      : `https://${inputValue}`;
    window.location.href = validUrl; // Navigate to the valid URL
  } else {
    // If not a valid URL, redirect to Ecosia search
    const searchQuery = encodeURIComponent(inputValue); // Encode the search query
    window.location.href = `https://www.ecosia.org/search?q=${searchQuery}`;
  }
}

// Add event listeners
goButton.addEventListener('click', navigateToURL);
urlInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    navigateToURL(); // Trigger navigation on Enter key
  }
});

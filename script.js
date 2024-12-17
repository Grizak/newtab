// Select the input and button elements
const urlInput = document.getElementById('urlinput');
const goButton = document.getElementById('goButton');

// Function to navigate to the entered URL
function navigateToURL() {
  const url = urlInput.value.trim(); // Get the input value and remove extra spaces

  if (!url) {
    alert('Please enter a URL!');
    return;
  }

  // Add 'https://' if the URL does not start with it
  const validUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;

  // Navigate to the URL
  window.location.href = validUrl;
}

// Add a click event listener to the button
goButton.addEventListener('click', navigateToURL);

// Add a keypress event listener to the input field
urlInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    navigateToURL(); // Trigger navigation on Enter key
  }
});

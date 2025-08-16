// Simple fetch of one random motivation
async function loadQuote() {
  const el = document.getElementById('quote');
  try {
    const res = await fetch('/.netlify/functions/motivation/random');
    const data = await res.json();
    if (data.items && data.items.length > 0) {
      el.textContent = data.items[0].text;
    } else {
      el.textContent = 'No quote found.';
    }
  } catch (e) {
    el.textContent = 'Error fetching from API.';
  }
}

// load on page start
loadQuote();

// refresh button
document.getElementById('refresh').addEventListener('click', loadQuote);

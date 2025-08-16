const API = '/.netlify/functions/motivation';

async function loadQuote() {
  const el = document.getElementById('quote');
  try {
    const res = await fetch(`${API}/random`);
    const data = await res.json();
    const text = (data.items && data.items.length > 0)
      ? data.items[0].text
      : 'No quote found.';

    // set text, then replay the fade-in animation class
    el.textContent = text;
    el.classList.remove('quote-enter');
    // force a reflow so the class re-applies even on consecutive clicks
    void el.offsetWidth;
    el.classList.add('quote-enter');
  } catch {
    el.textContent = 'Error fetching from API.';
  }
}

// initial load
loadQuote();

// refresh button
document.getElementById('refresh').addEventListener('click', loadQuote);

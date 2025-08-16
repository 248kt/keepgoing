// Netlify Function serving a Motivation API with 600+ sentences
// Endpoint examples (relative to site root):
//   /.netlify/functions/motivation/health
//   /.netlify/functions/motivation/motivation/random?count=1
//   /.netlify/functions/motivation/motivation/all?limit=5
//   /.netlify/functions/motivation/motivation/search?q=grit
//   /.netlify/functions/motivation/motivation/daily?tz=America/Chicago
//
// Note: The path after '/.netlify/functions/motivation' is inspected to route requests.

function buildSentences() {
  const openings = [
    "Keep going", "Stay focused", "Trust your pace", "Own your morning", "Ship it",
    "Lean into the hard", "Keep it simple", "Start small", "Move with purpose",
    "Protect your energy", "Do it scared", "Be relentlessly kind", "Choose growth",
    "Make it inevitable", "Start before you’re ready", "Just begin", "Let it be messy",
    "Progress over perfection", "Outlearn yesterday", "Bet on yourself",
    "Win the next minute", "Act like it matters", "Stack tiny wins", "Make the call",
    "Take the first step", "Write the next line", "Lift the next rep", "Show up anyway",
    "Pick up the pace", "Stay on the path"
  ];

  const directives = [
    "one more time", "today", "right now", "when it’s hard", "especially on slow days",
    "with courage", "with curiosity", "with discipline", "with gratitude",
    "when nobody’s watching", "like you mean it", "like a pro", "with joy",
    "with calm intensity", "with clean effort", "with quiet confidence",
    "for your future self", "for the reps", "for the learning",
    "for the story you’ll tell", "with patient urgency", "with a clear head",
    "without drama", "with full attention", "with intention", "with humility"
  ];

  const payoffs = [
    "Small steps compound.", "Consistency builds empires.", "Momentum beats motivation.",
    "Action changes your identity.", "Discipline is a form of self-respect.",
    "Clarity lives on the other side of action.", "Every rep writes the habit.",
    "The work works.", "You’re closer than you think.", "Future you is watching.",
    "Today’s effort echoes.", "Confidence comes from kept promises.", "You can do hard things.",
    "Direction over speed.", "This is how it starts.", "Energy follows action.",
    "Hard choices, easy life.", "Easy choices, hard life.", "Tiny progress is still progress.",
    "Talent is common; grit is rare.", "Make discomfort your coach.", "One brick at a time.",
    "Done is a decision.", "You don’t need permission.", "You are the person for this.",
    "Earn your sleep.", "Let results be the noise.", "Plant seeds, not excuses.",
    "You’re building something real.", "Stand back up."
  ];

  const frames = [
    "this hour", "this morning", "this afternoon", "this evening", "today",
    "this week", "this month", "this season"
  ];

  const out = [];
  for (let o = 0; o < openings.length; o++) {
    for (let d = 0; d < directives.length; d++) {
      const p = payoffs[(o + d) % payoffs.length];
      const f = frames[(o * 3 + d) % frames.length];
      const s1 = `${openings[o]} ${directives[d]}. ${p}`;
      const s2 = `${openings[o]} ${directives[d]} ${f}. ${p}`;
      out.push(cap(s1));
      out.push(cap(s2));
      if (out.length >= 640) break;
    }
    if (out.length >= 640) break;
  }

  const oneLiners = [
    "Be the person who follows through.",
    "Hard work is a skill—practice it.",
    "Your habits are your superpower.",
    "The plan is nothing; planning is everything.",
    "You don’t find time—you make it.",
    "What you repeat, you become.",
    "Dreams need deadlines.",
    "Direction first, speed second.",
    "Simplicity scales.",
    "The next best action is enough."
  ];
  for (const l of oneLiners) out.push(l);
  return out.map((t, idx) => ({ id: idx, text: t }));
}

function cap(s) {
  return s.replace(/\s+/g, ' ').replace(/\s\./g, '.').trim();
}

const SENTENCES = buildSentences();
const TOTAL = SENTENCES.length;

function json(body, status = 200) {
  return {
    statusCode: status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    },
    body: JSON.stringify(body)
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json({}, 204);
  }

  // Path after '/.netlify/functions/motivation'
  const path = (event.path || '').replace(/^.*\/motivation/, '') || '/';
  const url = new URL(event.rawUrl || ('http://x' + path));
  const q = url.searchParams;
  const parts = path.split('/').filter(Boolean);

  // Routes:
  // /health
  if (parts.length === 1 && parts[0] === 'health') {
    return json({ ok: true, total: TOTAL });
  }

  // /motivation/random
  if (parts.length === 2 && parts[0] === 'motivation' && parts[1] === 'random') {
    const count = Math.min(parseInt(q.get('count') || '1', 10), 50);
    const items = [];
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * TOTAL);
      items.push(SENTENCES[idx]);
    }
    return json({ count: items.length, items });
  }

  // /motivation/all
  if (parts.length === 2 && parts[0] === 'motivation' && parts[1] === 'all') {
    const limit = Math.min(parseInt(q.get('limit') || '100', 10), 200);
    const offset = Math.max(parseInt(q.get('offset') || '0', 10), 0);
    const items = SENTENCES.slice(offset, offset + limit);
    return json({ total: TOTAL, offset, limit, items });
  }

  // /motivation/search
  if (parts.length === 2 && parts[0] === 'motivation' && parts[1] === 'search') {
    const s = (q.get('q') || '').toLowerCase().trim();
    if (!s) return json({ total: 0, items: [] });
    const items = SENTENCES.filter(x => x.text.toLowerCase().includes(s));
    return json({ total: items.length, items });
  }

  // /motivation/daily
  if (parts.length === 2 && parts[0] === 'motivation' && parts[1] === 'daily') {
    const tz = q.get('tz') || 'UTC';
    const now = new Date();
    let dateStr = now.toISOString().slice(0,10);
    try {
      const fmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
      dateStr = fmt.format(now);
    } catch (e) { /* ignore invalid tz */ }
    const key = `${tz}:${dateStr}`;
    let hash = 0; for (let i=0;i<key.length;i++) hash = (hash*31 + key.charCodeAt(i))>>>0;
    const idx = hash % TOTAL;
    return json({ tz, date: dateStr, item: SENTENCES[idx] });
  }

  // /motivation/:id
  if (parts.length === 2 && parts[0] === 'motivation' && /^\d+$/.test(parts[1])) {
    const id = parseInt(parts[1], 10);
    const item = SENTENCES[id];
    if (!item) return json({ error: 'Not found' }, 404);
    return json(item);
  }

  // Help
  const help = {
    routes: [
      "/.netlify/functions/motivation/health",
      "/.netlify/functions/motivation/motivation/random?count=1",
      "/.netlify/functions/motivation/motivation/all?limit=5",
      "/.netlify/functions/motivation/motivation/search?q=grit",
      "/.netlify/functions/motivation/motivation/daily?tz=America/Chicago",
      "/.netlify/functions/motivation/motivation/0"
    ],
    total: TOTAL
  };
  return json(help);
};

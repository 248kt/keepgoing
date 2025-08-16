// netlify/functions/motivation.js

function buildSentences() {
  const openings = [
    "Keep going","Stay focused","Trust your pace","Own your morning","Ship it",
    "Lean into the hard","Keep it simple","Start small","Move with purpose",
    "Protect your energy","Do it scared","Be relentlessly kind","Choose growth",
    "Make it inevitable","Start before you’re ready","Just begin","Let it be messy",
    "Progress over perfection","Outlearn yesterday","Bet on yourself",
    "Win the next minute","Act like it matters","Stack tiny wins","Make the call",
    "Take the first step","Write the next line","Lift the next rep","Show up anyway",
    "Pick up the pace","Stay on the path"
  ];
  const directives = [
    "one more time","today","right now","when it’s hard","especially on slow days",
    "with courage","with curiosity","with discipline","with gratitude",
    "when nobody’s watching","like you mean it","like a pro","with joy",
    "with calm intensity","with clean effort","with quiet confidence",
    "for your future self","for the reps","for the learning",
    "for the story you’ll tell","with patient urgency","with a clear head",
    "without drama","with full attention","with intention","with humility"
  ];
  const payoffs = [
    "Small steps compound.","Consistency builds empires.","Momentum beats motivation.",
    "Action changes your identity.","Discipline is a form of self-respect.",
    "Clarity lives on the other side of action.","Every rep writes the habit.",
    "The work works.","You’re closer than you think.","Future you is watching.",
    "Today’s effort echoes.","Confidence comes from kept promises.","You can do hard things.",
    "Direction over speed.","This is how it starts.","Energy follows action.",
    "Hard choices, easy life.","Easy choices, hard life.","Tiny progress is still progress.",
    "Talent is common; grit is rare.","Make discomfort your coach.","One brick at a time.",
    "Done is a decision.","You don’t need permission.","You are the person for this.",
    "Earn your sleep.","Let results be the noise.","Plant seeds, not excuses.",
    "You’re building something real.","Stand back up."
  ];
  const frames = ["this hour","this morning","this afternoon","this evening","today","this week","this month","this season"];

  const out = [];
  outer: for (let o=0;o<openings.length;o++) {
    for (let d=0; d<directives.length; d++) {
      const p = payoffs[(o+d)%payoffs.length];
      const f = frames[(o*3+d)%frames.length];
      out.push(`${openings[o]} ${directives[d]}. ${p}`.replace(/\s+/g,' ').trim());
      out.push(`${openings[o]} ${directives[d]} ${f}. ${p}`.replace(/\s+/g,' ').trim());
      if (out.length >= 640) break outer;
    }
  }
  out.push(
    "Be the person who follows through.","Hard work is a skill—practice it.",
    "Your habits are your superpower.","The plan is nothing; planning is everything.",
    "You don’t find time—you make it.","What you repeat, you become.",
    "Dreams need deadlines.","Direction first, speed second.",
    "Simplicity scales.","The next best action is enough."
  );
  return out.map((t, i) => ({ id: i, text: t }));
}

const SENTENCES = buildSentences();
const TOTAL = SENTENCES.length;

function json(body, status=200) {
  return {
    statusCode: status,
    headers: {
      "Content-Type":"application/json; charset=utf-8",
      "Access-Control-Allow-Origin":"*",
      "Access-Control-Allow-Methods":"GET, OPTIONS",
      "Access-Control-Allow-Headers":"Content-Type"
    },
    body: JSON.stringify(body)
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json({}, 204);

  // Path after the function name (no greedy strip)
  const fnBase = '/.netlify/functions/motivation';
  const full = (event.path || '');
  const after = full.startsWith(fnBase) ? full.slice(fnBase.length) : '/';
  const parts = after.split('/').filter(Boolean); // e.g. ['random'] or ['motivation','random']

  // Also support '/motivation/...' prefix after function path
  const seg = parts[0] === 'motivation' ? parts[1] : parts[0];
  const rest = parts[0] === 'motivation' ? parts.slice(1) : parts;

  const url = new URL(event.rawUrl || ('http://x' + after));
  const q = url.searchParams;

  if (seg === 'health') {
    return json({ ok: true, total: TOTAL });
  }

  if (seg === 'random') {
    const count = Math.min(parseInt(q.get('count') || '1', 10), 50);
    const items = Array.from({ length: count }, () => SENTENCES[Math.floor(Math.random()*TOTAL)]);
    return json({ count: items.length, items });
  }

  if (seg === 'all') {
    const limit = Math.min(parseInt(q.get('limit') || '100', 10), 200);
    const offset = Math.max(parseInt(q.get('offset') || '0', 10), 0);
    const items = SENTENCES.slice(offset, offset + limit);
    return json({ total: TOTAL, offset, limit, items });
  }

  if (seg === 'search') {
    const s = (q.get('q') || '').toLowerCase().trim();
    if (!s) return json({ total: 0, items: [] });
    const items = SENTENCES.filter(x => x.text.toLowerCase().includes(s));
    return json({ total: items.length, items });
  }

  if (seg === 'daily') {
    const tz = q.get('tz') || 'UTC';
    const now = new Date();
    let dateStr = now.toISOString().slice(0,10);
    try {
      dateStr = new Intl.DateTimeFormat('en-US',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
    } catch {}
    const key = `${tz}:${dateStr}`;
    let h=0; for (let i=0;i<key.length;i++) h=(h*31+key.charCodeAt(i))>>>0;
    return json({ tz, date: dateStr, item: SENTENCES[h % TOTAL] });
  }

  // id: '/:id' or '/motivation/:id'
  if (seg && /^\d+$/.test(seg)) {
    const id = parseInt(seg, 10);
    const item = SENTENCES[id];
    return item ? json(item) : json({ error: 'Not found' }, 404);
  }

  // Fallback help
  return json({
    routes: [
      "/.netlify/functions/motivation/health",
      "/.netlify/functions/motivation/random",
      "/.netlify/functions/motivation/all?limit=5",
      "/.netlify/functions/motivation/search?q=grit",
      "/.netlify/functions/motivation/daily?tz=America/Chicago",
      "/.netlify/functions/motivation/0"
    ],
    total: TOTAL
  });
};

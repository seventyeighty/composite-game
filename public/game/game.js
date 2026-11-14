// Composite: the game client. One page, several screens, driven by messages from the server.

import { Sketch } from './sketch.js';
import { drawGuide, drawGhosts, drawOutOfBounds, paintPage, isDark } from './guides.js';
import { START_COLORS, clipFor, treat, pageCSS } from './layers.js';

const $ = (id) => document.getElementById(id);
const SCREENS = ['home', 'lobby', 'draw', 'wait', 'reveal', 'end'];
const COLORS = [
  ['#1F2430', 'Black'], ['#FFFFFF', 'White'], ['#8B8F98', 'Grey'], ['#8D5A3B', 'Brown'], ['#E5484D', 'Red'], ['#F5852A', 'Orange'],
  ['#FFD23F', 'Yellow'], ['#46A758', 'Green'], ['#12A594', 'Teal'], ['#3B82F6', 'Blue'], ['#6E56CF', 'Purple'], ['#E667AA', 'Pink'],
];

// What to do, by kind of piece. Shown in large type next to the prompt.
const BRIEFS = {
  full: { kind: 'YOUR PIECE: THE BACKDROP', how: 'Draw the far-away background and cover the whole page. Other players\' pieces will be placed in front of it later.' },
  strip: { kind: 'YOUR PIECE: A LAYER ACROSS THE PICTURE', how: 'Draw across the dotted strip from edge to edge and fill it in. Give the top edge a shape. The fill bucket helps.' },
  personR: { kind: 'YOUR PIECE: A CHARACTER', how: 'Draw your character inside the dotted outline, facing the way the arrow points.' },
  personL: { kind: 'YOUR PIECE: A CHARACTER', how: 'Draw your character inside the dotted outline, facing the way the arrow points.' },
  box: { kind: 'YOUR PIECE', how: 'Draw it inside the dotted box, about that size.' },
};
const CUT_OFF = ' Anything in the shaded part of the page gets cut off.';

const SESSION_KEY = 'composite-session';

let ws = null;
let me = null;            // { code, playerId, name }
let room = null;          // latest room summary from the server
let sketch = null;
let slot = null;          // the piece I'm drawing this phase
let submitted = false;
let deadline = 0;         // local clock time when the current timer ends
let onTimeUp = null;
let revealTimers = [];
let revealLayers = [];    // { label, prompt, artist, png, img }
let gallery = [];         // { round, secret, url }
let lastSecret = '';
let revealPage = null;

// --- small helpers ---------------------------------------------------------

function show(id) {
  for (const s of SCREENS) $(s).hidden = s !== id;
  window.scrollTo(0, 0);
}
const current = () => SCREENS.find((s) => !$(s).hidden);

let toastTimer;
function toast(text) {
  const t = $('toast');
  t.textContent = text;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
}

function saveSession() {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(me)); } catch { /* private mode */ }
}
function loadSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch { return null; }
}
function clearSession() {
  me = null;
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* private mode */ }
}

const isHost = () => room && me && room.hostId === me.playerId;
const roundLabel = (m) => {
  const parts = [`Round ${m.round} of ${m.rounds}`];
  if (m.phases > 1) parts.push(`part ${m.phase + 1} of ${m.phases}`);
  return parts.join(', ');
};

// --- connection ------------------------------------------------------------

function send(msg) {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg));
}

let retry = 0;
function connect() {
  ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host);
  ws.addEventListener('open', () => {
    retry = 0;
    const s = me || loadSession();
    if (s && s.code && s.playerId) {
      me = s;
      send({ type: 'join', code: s.code, playerId: s.playerId, name: s.name });
    }
  });
  ws.addEventListener('message', (e) => {
    let m;
    try { m = JSON.parse(e.data); } catch { return; }
    const fn = on[m.type];
    if (fn) fn(m);
  });
  ws.addEventListener('close', () => {
    if (me) toast('Connection lost. Reconnecting...');
    retry = Math.min(retry + 1, 6);
    setTimeout(connect, 400 * retry);
  });
}

// --- timer -----------------------------------------------------------------

function startTimer(ms, whenUp) {
  deadline = performance.now() + ms;
  onTimeUp = whenUp || null;
  tick();
}
function stopTimer() {
  deadline = 0;
  onTimeUp = null;
  for (const id of ['draw-timer', 'wait-timer']) { $(id).textContent = ''; $(id).classList.remove('hurry'); }
}
function tick() {
  if (!deadline) return;
  const left = Math.max(0, deadline - performance.now());
  const secs = Math.ceil(left / 1000);
  const text = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  const target = current() === 'draw' ? 'draw-timer' : current() === 'wait' ? 'wait-timer' : current() === 'reveal' ? 'rv-count' : null;
  if (target) {
    $(target).textContent = text;
    $(target).classList.toggle('hurry', secs <= 10);
  }
  if (left <= 0 && onTimeUp) {
    const fn = onTimeUp;
    onTimeUp = null;
    fn();
  }
}
setInterval(tick, 200);

// --- home ------------------------------------------------------------------

function homeName() {
  const name = $('name').value.trim();
  if (!name) {
    $('home-error').textContent = 'Type a name first.';
    $('name').focus();
    return null;
  }
  return name;
}
$('create').addEventListener('click', () => {
  const name = homeName();
  if (!name) return;
  me = { name };
  send({ type: 'create', name });
});
function join() {
  const name = homeName();
  if (!name) return;
  const code = $('code').value.trim().toUpperCase();
  if (code.length !== 4) {
    $('home-error').textContent = 'Room codes are four letters.';
    $('code').focus();
    return;
  }
  me = { name };
  send({ type: 'join', code, name });
}
$('join').addEventListener('click', join);
$('code').addEventListener('keydown', (e) => { if (e.key === 'Enter') join(); });
$('name').addEventListener('keydown', (e) => { if (e.key === 'Enter') ($('code').value.trim() ? join() : $('create').click()); });

// --- lobby -----------------------------------------------------------------

function renderLobby() {
  $('lobby-code').textContent = room.code;
  $('lobby-count').textContent = `(${room.players.length})`;
  const list = $('lobby-players');
  list.textContent = '';
  for (const p of room.players) {
    const li = document.createElement('li');
    const who = document.createElement('span');
    who.className = 'who';
    who.textContent = p.name + (p.id === me.playerId ? ' (you)' : '');
    li.appendChild(who);
    if (p.id === room.hostId) {
      const s = document.createElement('span');
      s.className = 'status';
      s.textContent = 'host';
      li.appendChild(s);
    } else if (isHost()) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'kick';
      b.textContent = 'Remove';
      b.setAttribute('aria-label', `Remove ${p.name}`);
      b.addEventListener('click', () => send({ type: 'kick', playerId: p.id }));
      li.appendChild(b);
    }
    list.appendChild(li);
  }
  const host = isHost();
  $('set-time').value = String(room.settings.drawTime);
  $('set-rounds').value = String(room.settings.rounds);
  $('set-guess').checked = room.settings.guess;
  for (const id of ['set-time', 'set-rounds', 'set-guess']) $(id).disabled = !host;
  $('settings-note').textContent = host ? '' : 'Only the host can change these.';
  $('start').hidden = !host;
  const n = room.players.length;
  $('lobby-wait').textContent = host
    ? (n < 3 ? 'You can start now to try it alone, but it is best with 3 to 8 players.' : '')
    : 'Waiting for the host to start the game.';
}
const pushSettings = () => send({
  type: 'settings',
  drawTime: Number($('set-time').value),
  rounds: Number($('set-rounds').value),
  guess: $('set-guess').checked,
});
for (const id of ['set-time', 'set-rounds', 'set-guess']) $(id).addEventListener('change', pushSettings);
$('start').addEventListener('click', () => send({ type: 'start' }));
$('copy-link').addEventListener('click', async () => {
  const link = `${location.origin}/?room=${room.code}`;
  try {
    await navigator.clipboard.writeText(link);
    toast('Invite link copied.');
  } catch {
    toast(link);
  }
});

// --- drawing ---------------------------------------------------------------

function buildColors() {
  const host = $('colors');
  COLORS.forEach(([hex, name], i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch';
    b.style.background = hex;
    b.dataset.color = hex;
    b.setAttribute('aria-label', name);
    b.setAttribute('aria-pressed', String(i === 0));
    b.addEventListener('click', () => {
      if (!sketch) return;
      sketch.color = hex;
      if (sketch.tool === 'eraser') setTool('brush');
      host.querySelectorAll('.swatch').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    });
    host.appendChild(b);
  });
}
function setTool(tool) {
  sketch.tool = tool;
  document.querySelectorAll('[data-tool]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tool === tool)));
}
document.querySelectorAll('[data-tool]').forEach((b) => b.addEventListener('click', () => sketch && setTool(b.dataset.tool)));
document.querySelectorAll('[data-size]').forEach((b) => b.addEventListener('click', () => {
  if (!sketch) return;
  sketch.size = Number(b.dataset.size);
  document.querySelectorAll('[data-size]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
}));
$('undo').addEventListener('click', () => sketch && sketch.undo());
$('redo').addEventListener('click', () => sketch && sketch.redo());
document.addEventListener('keydown', (e) => {
  if (current() !== 'draw' || !sketch || !(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'z') return;
  e.preventDefault();
  if (e.shiftKey) sketch.redo(); else sketch.undo();
});

function submitDrawing() {
  if (submitted || !sketch || !slot) return;
  submitted = true;
  sketch.finishStroke();
  sketch.locked = true;
  send({ type: 'submit', slotId: slot.id, empty: sketch.empty, png: sketch.empty ? '' : sketch.toPNG() });
  showWait('Handed in!');
}
$('done').addEventListener('click', submitDrawing);

function showWait(title) {
  $('wait-title').textContent = title;
  $('wait-round').textContent = $('draw-round').textContent;
  renderWait();
  show('wait');
  tick();
}
function renderWait() {
  if (!room) return;
  const waitingOn = room.players.filter((p) => p.connected && !p.done);
  $('wait-text').textContent = waitingOn.length ? 'Waiting for the others to finish.' : 'Everyone is done.';
  const list = $('wait-players');
  list.textContent = '';
  for (const p of room.players) {
    if (!p.connected) continue;
    const li = document.createElement('li');
    const who = document.createElement('span');
    who.className = 'who';
    who.textContent = p.name;
    const s = document.createElement('span');
    s.className = 'status' + (p.done ? ' ok' : '');
    s.textContent = p.done ? 'done' : 'drawing...';
    li.append(who, s);
    list.appendChild(li);
  }
}

// --- reveal, guess, results --------------------------------------------------

function clearReveal() {
  revealTimers.forEach(clearTimeout);
  revealTimers = [];
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function addLayer(i, animate) {
  const l = revealLayers[i];
  if (!l || !l.img) return;
  const img = l.img;
  img.setAttribute('role', 'img');
  img.setAttribute('aria-label', `${l.label}, drawn by ${l.artist}`);
  if (animate) img.className = 'drop';
  // each layer sits on its own plane, which moves by an amount set by its depth
  const plane = document.createElement('div');
  plane.className = 'plane';
  plane.dataset.depth = revealLayers.length > 1 ? String(i / (revealLayers.length - 1)) : '0';
  plane.appendChild(img);
  $('rv-paper').appendChild(plane);
  applyParallax();
  const li = document.createElement('li');
  const b = document.createElement('b');
  b.textContent = l.artist;
  li.append(b, document.createTextNode(l.prompt));
  const list = $('rv-list');
  list.querySelectorAll('.now').forEach((x) => x.classList.remove('now'));
  if (animate) li.className = 'now';
  list.appendChild(li);
  if (animate) {
    $('rv-artist').textContent = l.artist;
    $('rv-what').textContent = `drew ${l.label.toLowerCase()}`;
    $('rv-tag').hidden = false;
    $('rv-count').textContent = `${i + 1} of ${revealLayers.length}`;
  }
}

// --- the moving reveal ------------------------------------------------------
// Back layers barely move, front layers move the most, so the picture reads as a paper diorama.
// With a mouse it follows the pointer; otherwise it drifts slowly on its own.
const par = { x: 0, y: 0, tx: 0, ty: 0, hover: false, t: 0, running: false };
const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function applyParallax() {
  for (const plane of $('rv-paper').querySelectorAll('.plane')) {
    const d = Number(plane.dataset.depth) || 0;
    const amp = 0.4 + d * 3.2; // percent of the picture's width
    const sc = 1 + (amp * 2.2) / 100;
    plane.style.transform = `translate(${(-par.x * amp).toFixed(3)}%, ${(-par.y * amp * 0.6).toFixed(3)}%) scale(${sc.toFixed(4)})`;
  }
}

function parallaxFrame() {
  if (current() !== 'reveal') { par.running = false; return; }
  par.t += 1 / 60;
  if (!par.hover) {
    par.tx = Math.sin(par.t * 0.55) * 0.7;
    par.ty = Math.cos(par.t * 0.4) * 0.45;
  }
  par.x += (par.tx - par.x) * 0.08;
  par.y += (par.ty - par.y) * 0.08;
  applyParallax();
  requestAnimationFrame(parallaxFrame);
}

function startParallax() {
  if (reduceMotion || par.running) return;
  par.running = true;
  requestAnimationFrame(parallaxFrame);
}

{
  const wrap = $('rv-paper').parentElement;
  wrap.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = $('rv-paper').getBoundingClientRect();
    par.hover = true;
    par.tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
    par.ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
  });
  wrap.addEventListener('pointerleave', () => { par.hover = false; });
}

function composite() {
  const c = document.createElement('canvas');
  c.width = 800; c.height = 600;
  const ctx = c.getContext('2d');
  paintPage(ctx, revealPage, 800, 600);
  for (const l of revealLayers) if (l.img) ctx.drawImage(l.img, 0, 0, 800, 600);
  return c.toDataURL('image/png');
}

// --- messages from the server ----------------------------------------------

const on = {
  joined(m) {
    me = { ...(me || {}), code: m.code, playerId: m.playerId };
    saveSession();
    history.replaceState(null, '', `/?room=${m.code}`);
    $('home-error').textContent = '';
  },

  error(m) {
    // a stale saved session lands here after the server restarts
    if (me && me.playerId) clearSession();
    $('home-error').textContent = m.message;
    show('home');
  },

  kicked() {
    clearSession();
    history.replaceState(null, '', '/');
    $('home-error').textContent = 'The host removed you from the room.';
    show('home');
  },

  room(m) {
    room = m;
    if (me && !me.name) {
      const mine = m.players.find((p) => p.id === me.playerId);
      if (mine) { me.name = mine.name; saveSession(); }
    }
    if (m.state === 'lobby') {
      renderLobby();
      if (current() !== 'lobby') { stopTimer(); clearReveal(); show('lobby'); }
      return;
    }
    if (m.state === 'draw') {
      const done = m.players.filter((p) => p.connected && p.done).length;
      const all = m.players.filter((p) => p.connected).length;
      $('draw-progress').textContent = all > 1 ? `${done} of ${all} players done` : '';
      renderWait();
    }
    if (m.state === 'guess') {
      const left = m.players.filter((p) => p.connected && !p.done).length;
      if ($('guess-send').disabled) $('guess-note').textContent = left ? `Waiting for ${left} more ${left === 1 ? 'guess' : 'guesses'}.` : '';
    }
    if (m.state === 'results') renderNext();
    if (m.state === 'end') renderAgain();
  },

  draw(m) {
    clearReveal();
    slot = m.slot;
    submitted = false;
    $('draw-round').textContent = roundLabel(m);
    $('draw-prompt').textContent = m.slot.prompt;
    sketch = new Sketch($('sketch'), m.canvas);
    const soft = m.slot.guide === 'full';
    const brief = BRIEFS[m.slot.guide] || BRIEFS.box;
    $('draw-kind').textContent = brief.kind;
    const clip = clipFor(m.slot, m.canvas);
    $('draw-how').textContent = brief.how + (clip && m.slot.guide !== 'strip' ? CUT_OFF : '');
    // The backdrop gets a blank page: everything goes in front of it, so marking each piece only adds clutter.
    const ghosts = soft ? [] : m.ghosts;
    $('lg-soft').hidden = true;
    $('lg-back').hidden = !ghosts.some((g) => !g.front);
    $('lg-front').hidden = !ghosts.some((g) => g.front);
    sketch.clip = clip;
    sketch.enclosedFill = m.slot.guide !== 'strip' && m.slot.guide !== 'full';
    sketch.onFillRefused = () => toast('Fill works inside a closed shape. Draw an outline first, then fill it.');
    const dark = isDark(m.page);
    paintPage(sketch.guide, m.page, m.canvas.w, m.canvas.h);
    drawGhosts(sketch.guide, ghosts, m.canvas, soft, dark);
    drawOutOfBounds(sketch.guide, clip, m.canvas, dark);
    drawGuide(sketch.guide, m.slot, m.canvas, dark);
    window.__slot = m.slot; // read by the automated tests
    let startColor = START_COLORS[m.slot.id % START_COLORS.length];
    if (startColor === '#1F2430' && dark) startColor = '#FFFFFF';
    sketch.color = startColor;
    document.querySelectorAll('.swatch').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.color === startColor)));
    const size = document.querySelector('[data-size][aria-pressed="true"]');
    sketch.size = size ? Number(size.dataset.size) : 10;
    setTool('brush');
    show('draw');
    startTimer(m.remainingMs, submitDrawing);
  },

  wait(m) {
    // either I've already handed in, or I have no piece this phase
    clearReveal();
    $('draw-round').textContent = roundLabel(m);
    slot = null;
    showWait(m.idle ? 'Sit tight' : 'Handed in!');
    if (m.idle) $('wait-text').textContent = 'You have no piece to draw in this part. The others are still drawing.';
    startTimer(m.remainingMs);
  },

  async reveal(m) {
    stopTimer();
    clearReveal();
    $('rv-round').textContent = `Round ${m.round} of ${m.rounds}`;
    $('rv-count').textContent = '';
    $('rv-heading').textContent = "Here's what you all made";
    $('rv-paper').textContent = '';
    revealPage = m.page;
    $('rv-paper').style.background = pageCSS(m.page);
    $('rv-list').textContent = '';
    $('rv-list').hidden = false;
    $('rv-tag').hidden = true;
    $('rv-guess').hidden = true;
    $('rv-results').hidden = true;
    show('reveal');
    startParallax();
    const started = performance.now();
    const imgs = await Promise.all(m.layers.map((l) => loadImage(l.png)));
    revealLayers = m.layers.map((l, i) => ({ ...l, img: treat(imgs[i], l.guide) }));
    if (!revealLayers.length) $('rv-heading').textContent = 'Nobody drew anything this round!';
    if (m.instant) {
      revealLayers.forEach((_, i) => addLayer(i, false));
      return;
    }
    const lag = performance.now() - started;
    revealLayers.forEach((_, i) => {
      revealTimers.push(setTimeout(() => addLayer(i, true), Math.max(0, 500 + i * m.perLayerMs - lag)));
    });
  },

  guess(m) {
    // make sure every layer is on the paper even if this arrived early
    clearReveal();
    const shown = $('rv-paper').children.length;
    for (let i = shown; i < revealLayers.length; i++) addLayer(i, false);
    $('rv-list').querySelectorAll('.now').forEach((x) => x.classList.remove('now'));
    $('rv-tag').hidden = true;
    $('rv-heading').textContent = 'What was the scene?';
    $('rv-list').hidden = true;
    $('rv-results').hidden = true;
    $('rv-guess').hidden = false;
    $('guess-input').value = '';
    $('guess-input').disabled = !!m.guessed;
    $('guess-send').disabled = !!m.guessed;
    $('guess-note').textContent = m.guessed ? 'Guess locked in.' : '';
    show('reveal');
    startParallax();
    startTimer(m.remainingMs, () => { if (!$('guess-send').disabled) sendGuess(); });
    if (!m.guessed) $('guess-input').focus({ preventScroll: true });
  },

  results(m) {
    stopTimer();
    clearReveal();
    const shown = $('rv-paper').children.length;
    for (let i = shown; i < revealLayers.length; i++) addLayer(i, false);
    $('rv-count').textContent = '';
    $('rv-tag').hidden = true;
    $('rv-guess').hidden = true;
    $('rv-list').hidden = true;
    $('rv-heading').textContent = m.guesses.length ? 'The guesses are in' : 'The finished picture';
    $('rv-secret').textContent = m.secret;
    lastSecret = m.secret;
    const list = $('rv-guesses');
    list.textContent = '';
    for (const g of m.guesses) {
      const li = document.createElement('li');
      const b = document.createElement('b');
      b.textContent = g.name;
      li.append(b, document.createTextNode(g.text));
      list.appendChild(li);
    }
    $('rv-results').hidden = false;
    $('next').textContent = m.last ? 'See the gallery' : 'Next round';
    renderNext();
    show('reveal');
    startParallax();
    if (room && !gallery.some((g) => g.round === room.round) && revealLayers.length) {
      gallery.push({ round: room.round, secret: m.secret, url: composite() });
    }
  },

  end() {
    stopTimer();
    clearReveal();
    const host = $('gallery');
    host.textContent = '';
    gallery.forEach((g, i) => {
      const fig = document.createElement('figure');
      const img = document.createElement('img');
      img.src = g.url;
      img.alt = `Round ${i + 1}: ${g.secret}`;
      const cap = document.createElement('figcaption');
      cap.textContent = g.secret;
      const a = document.createElement('a');
      a.className = 'btn';
      a.href = g.url;
      a.download = `composite-round-${i + 1}.png`;
      a.textContent = 'Save picture';
      a.style.cssText = 'display:inline-flex;align-items:center;text-decoration:none;color:inherit';
      fig.append(img, cap, a);
      host.appendChild(fig);
    });
    renderAgain();
    show('end');
  },

  lobby() {
    gallery = [];
    revealLayers = [];
  },
};

function sendGuess() {
  if ($('guess-send').disabled) return;
  send({ type: 'guess', text: $('guess-input').value });
  $('guess-input').disabled = true;
  $('guess-send').disabled = true;
  $('guess-note').textContent = 'Guess locked in.';
}
$('guess-send').addEventListener('click', sendGuess);
$('guess-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') sendGuess(); });

function renderNext() {
  $('next').hidden = !isHost();
  $('next-note').textContent = isHost() ? '' : 'Waiting for the host to continue.';
}
$('next').addEventListener('click', () => send({ type: 'next' }));

function renderAgain() {
  $('again').hidden = !isHost();
  $('again-note').textContent = isHost() ? '' : 'The host can take everyone back to the lobby for another game.';
}
$('again').addEventListener('click', () => send({ type: 'again' }));

// --- start -----------------------------------------------------------------

buildColors();
const params = new URLSearchParams(location.search);
const invited = (params.get('room') || '').toUpperCase().slice(0, 4);
const saved = loadSession();
if (invited) $('code').value = invited;
if (saved && invited && saved.code !== invited) clearSession();
if (saved && saved.name) $('name').value = saved.name;
show('home');
connect();

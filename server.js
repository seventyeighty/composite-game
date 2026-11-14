// Composite: serves the pages and runs the multiplayer rooms.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const SCENES = require('./data/scenes');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

// ---------------------------------------------------------------------------
// Static files
// ---------------------------------------------------------------------------

// URL prefix -> folder on disk. Libraries and fonts are served straight from node_modules,
// so nothing is loaded from other sites.
const MOUNTS = [
  ['/vendor/pixi/', path.join(ROOT, 'node_modules/pixi.js/dist')],
  ['/vendor/pixi-filters/', path.join(ROOT, 'node_modules/pixi-filters/dist')],
  ['/fonts/', path.join(ROOT, 'node_modules/@fontsource')],
  ['/', path.join(ROOT, 'public')],
];

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ico': 'image/x-icon',
};

function resolve(urlPath) {
  for (const [prefix, dir] of MOUNTS) {
    if (!urlPath.startsWith(prefix)) continue;
    const file = path.normalize(path.join(dir, urlPath.slice(prefix.length)));
    if (!file.startsWith(dir)) return null; // no escaping the folder
    return file;
  }
  return null;
}

const server = http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  } catch {
    res.writeHead(400).end('Bad request');
    return;
  }
  if (urlPath === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' }).end('ok');
    return;
  }
  let file = resolve(urlPath);
  if (!file) {
    res.writeHead(404).end('Not found');
    return;
  }
  fs.stat(file, (err, stat) => {
    if (!err && stat.isDirectory()) file = path.join(file, 'index.html');
    fs.readFile(file, (err2, data) => {
      if (err2) {
        res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
        return;
      }
      res.writeHead(200, {
        'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': urlPath.startsWith('/vendor/') || urlPath.startsWith('/fonts/') ? 'public, max-age=86400' : 'no-cache',
      });
      res.end(data);
    });
  });
});

// ---------------------------------------------------------------------------
// Rooms
// ---------------------------------------------------------------------------

const CANVAS = { w: 800, h: 600 };
const MAX_PLAYERS = 8;
const MIN_LAYERS = 6;            // small rooms draw more than once so the picture is never thin
const REVEAL_MS = 2600;          // time each layer gets at the reveal
const GUESS_MS = 45000;
const GRACE_MS = 2500;           // lets late drawings arrive after the timer hits zero
const DRAW_TIMES = [45, 60, 90, 120];
const MAX_PNG = 2.5 * 1024 * 1024;

const rooms = new Map();

const rid = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
function newCode() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  for (;;) {
    let code = '';
    for (let i = 0; i < 4; i++) code += letters[Math.floor(Math.random() * letters.length)];
    if (!rooms.has(code)) return code;
  }
}
const cleanName = (s) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, 14) || 'Player';
const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function send(ws, msg) {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg));
}
const active = (room) => [...room.players.values()].filter((p) => p.connected);

function summary(room) {
  const cur = room.current;
  return {
    type: 'room',
    code: room.code,
    hostId: room.hostId,
    state: room.state,
    round: room.round,
    settings: room.settings,
    phase: cur ? { index: cur.phaseIndex, count: cur.phases.length } : null,
    players: [...room.players.values()].map((p) => ({
      id: p.id,
      name: p.name,
      connected: p.connected,
      done: room.state === 'draw' ? isDoneDrawing(room, p.id) : room.state === 'guess' ? cur.guesses.has(p.id) : false,
    })),
  };
}
function broadcast(room, msg) {
  for (const p of room.players.values()) send(p.ws, msg);
}
const update = (room) => broadcast(room, summary(room));

function setTimer(room, ms, fn) {
  clearTimeout(room.timer);
  room.deadline = Date.now() + ms;
  room.timer = setTimeout(fn, ms);
}

// --- a round ---------------------------------------------------------------

function startRound(room) {
  const players = active(room);
  const n = players.length;
  if (n < 1) return;
  if (room.unused.length === 0) room.unused = shuffle(SCENES.map((s) => s.id));
  if (process.env.FIRST_SCENE && room.round === 0) room.unused.push(process.env.FIRST_SCENE);
  const nextId = room.unused.pop();
  const scene = SCENES.find((s) => s.id === nextId);

  // How many drawing phases, and so how many layers.
  const phaseCount = n >= MIN_LAYERS ? 1 : Math.ceil(MIN_LAYERS / n);
  const layerCount = Math.min(n * phaseCount, scene.slots.length);
  const chosen = scene.slots.slice(0, layerCount).map((s, i) => ({ ...s, id: i }));

  // Scenery first, then characters, split into phases of one slot per player.
  const ordered = [...chosen.filter((s) => s.kind === 'scenery'), ...chosen.filter((s) => s.kind !== 'scenery')];
  const order = shuffle(players.map((p) => p.id));
  const phases = [];
  for (let i = 0; i < ordered.length; i += n) {
    const phaseIndex = phases.length;
    phases.push(ordered.slice(i, i + n).map((slot, j) => ({ slotId: slot.id, playerId: order[(j + phaseIndex) % n] })));
  }

  room.round += 1;
  room.current = { scene, chosen, phases, phaseIndex: 0, layers: new Map(), guesses: new Map(), reveal: null };
  startPhase(room, 0);
}

function drawMessage(room, playerId) {
  const cur = room.current;
  const mine = cur.phases[cur.phaseIndex].find((a) => a.playerId === playerId);
  const base = { phase: cur.phaseIndex, phases: cur.phases.length, round: room.round, rounds: room.settings.rounds, remainingMs: Math.max(0, room.deadline - GRACE_MS - Date.now()) };
  if (!mine || cur.layers.has(mine.slotId)) return { type: 'wait', idle: !mine, ...base };
  const slot = cur.chosen[mine.slotId];
  return {
    type: 'draw',
    ...base,
    canvas: CANVAS,
    page: cur.scene.page,
    slot: { id: slot.id, prompt: slot.prompt, guide: slot.guide, rect: slot.rect },
    // where the other pieces go, without saying what they are
    ghosts: cur.chosen
      .filter((s) => s.id !== slot.id && s.guide !== 'full')
      .map((s) => ({ rect: s.rect, front: s.depth > slot.depth })),
  };
}

function startPhase(room, index) {
  const cur = room.current;
  cur.phaseIndex = index;
  room.state = 'draw';
  const seconds = room.settings.drawTime * (index > 0 ? 0.75 : 1);
  setTimer(room, seconds * 1000 + GRACE_MS, () => finishPhase(room));
  for (const p of room.players.values()) send(p.ws, drawMessage(room, p.id));
  update(room);
}

function isDoneDrawing(room, playerId) {
  const cur = room.current;
  const mine = cur.phases[cur.phaseIndex].find((a) => a.playerId === playerId);
  return !mine || cur.layers.has(mine.slotId);
}

function maybeFinishPhase(room) {
  if (room.state !== 'draw') return;
  const waiting = active(room).some((p) => !isDoneDrawing(room, p.id));
  if (!waiting) finishPhase(room);
}

function finishPhase(room) {
  if (room.state !== 'draw') return;
  clearTimeout(room.timer);
  const cur = room.current;
  if (cur.phaseIndex + 1 < cur.phases.length) startPhase(room, cur.phaseIndex + 1);
  else startReveal(room);
}

function startReveal(room) {
  const cur = room.current;
  const layers = cur.chosen
    .filter((s) => cur.layers.get(s.id)) // blank hand-ins are stored as null and left out
    .sort((a, b) => a.depth - b.depth || a.id - b.id)
    .map((s) => {
      const l = cur.layers.get(s.id);
      return { label: s.label, prompt: s.prompt, guide: s.guide, artist: l.artist, png: l.png };
    });
  cur.reveal = { layers, page: cur.scene.page, perLayerMs: REVEAL_MS, round: room.round, rounds: room.settings.rounds };
  room.state = 'reveal';
  broadcast(room, { type: 'reveal', ...cur.reveal });
  update(room);
  setTimer(room, layers.length * REVEAL_MS + 1800, () => (room.settings.guess ? startGuess(room) : showResults(room)));
}

function startGuess(room) {
  room.state = 'guess';
  setTimer(room, GUESS_MS + 1500, () => showResults(room));
  broadcast(room, { type: 'guess', remainingMs: GUESS_MS });
  update(room);
}

function resultsMessage(room) {
  const cur = room.current;
  return {
    type: 'results',
    secret: cur.scene.secret,
    guesses: [...cur.guesses.entries()].map(([id, text]) => ({ name: (room.players.get(id) || {}).name || '?', text })),
    last: room.round >= room.settings.rounds,
  };
}

function showResults(room) {
  if (room.state === 'results') return;
  clearTimeout(room.timer);
  room.state = 'results';
  broadcast(room, resultsMessage(room));
  update(room);
}

// --- joining and leaving ---------------------------------------------------

function createRoom(ws, name) {
  const code = newCode();
  const room = {
    code,
    hostId: null,
    players: new Map(),
    settings: { drawTime: 60, rounds: 3, guess: true },
    state: 'lobby',
    round: 0,
    unused: [],
    current: null,
    timer: null,
    deadline: 0,
    emptySince: 0,
  };
  rooms.set(code, room);
  addPlayer(room, ws, name);
}

function addPlayer(room, ws, name) {
  const player = { id: rid(), name: cleanName(name), ws, connected: true };
  room.players.set(player.id, player);
  if (!room.hostId) room.hostId = player.id;
  ws.roomCode = room.code;
  ws.playerId = player.id;
  send(ws, { type: 'joined', code: room.code, playerId: player.id });
  update(room);
}

function rejoin(room, player, ws) {
  if (player.ws && player.ws !== ws) {
    player.ws.roomCode = null;
    try { player.ws.close(); } catch { /* already gone */ }
  }
  player.ws = ws;
  player.connected = true;
  ws.roomCode = room.code;
  ws.playerId = player.id;
  send(ws, { type: 'joined', code: room.code, playerId: player.id });
  send(ws, summary(room));
  const cur = room.current;
  if (room.state === 'draw') send(ws, drawMessage(room, player.id));
  if (cur && cur.reveal && ['reveal', 'guess', 'results'].includes(room.state)) {
    send(ws, { type: 'reveal', ...cur.reveal, instant: room.state !== 'reveal' });
    if (room.state === 'guess') send(ws, { type: 'guess', remainingMs: Math.max(0, room.deadline - 1500 - Date.now()), guessed: cur.guesses.has(player.id) });
    if (room.state === 'results') send(ws, resultsMessage(room));
  }
  if (room.state === 'end') send(ws, { type: 'end' });
  update(room);
}

function leave(ws) {
  const room = rooms.get(ws.roomCode);
  if (!room) return;
  const player = room.players.get(ws.playerId);
  if (!player || player.ws !== ws) return;
  player.connected = false;
  player.ws = null;
  if (room.state === 'lobby') {
    // give a refresh a moment to come back before dropping them from the list
    setTimeout(() => {
      if (!player.connected && room.state === 'lobby') {
        room.players.delete(player.id);
        fixHost(room);
        update(room);
      }
    }, 8000);
  }
  fixHost(room);
  if (active(room).length === 0) room.emptySince = Date.now();
  update(room);
  maybeFinishPhase(room);
  if (room.state === 'guess' && active(room).every((p) => room.current.guesses.has(p.id))) showResults(room);
}

function fixHost(room) {
  const host = room.players.get(room.hostId);
  if (host && host.connected) return;
  const next = active(room)[0];
  if (next) room.hostId = next.id;
}

// rooms nobody is in get cleaned up
setInterval(() => {
  for (const [code, room] of rooms) {
    if (active(room).length === 0 && room.emptySince && Date.now() - room.emptySince > 10 * 60 * 1000) {
      clearTimeout(room.timer);
      rooms.delete(code);
    }
  }
}, 60 * 1000).unref();

// --- messages --------------------------------------------------------------

const handlers = {
  create(ws, m) {
    if (ws.roomCode) return;
    createRoom(ws, m.name);
  },

  join(ws, m) {
    if (ws.roomCode) return;
    const room = rooms.get(String(m.code || '').toUpperCase().trim());
    if (!room) return send(ws, { type: 'error', message: "That room doesn't exist. Check the code." });
    const existing = m.playerId && room.players.get(m.playerId);
    if (existing) return rejoin(room, existing, ws);
    if (room.state !== 'lobby') return send(ws, { type: 'error', message: 'That game has already started. Ask the host to start a new one.' });
    if (room.players.size >= MAX_PLAYERS) return send(ws, { type: 'error', message: 'That room is full.' });
    room.emptySince = 0;
    addPlayer(room, ws, m.name);
  },

  settings(ws, m, room) {
    if (ws.playerId !== room.hostId || room.state !== 'lobby') return;
    if (DRAW_TIMES.includes(m.drawTime)) room.settings.drawTime = m.drawTime;
    if (Number.isInteger(m.rounds) && m.rounds >= 1 && m.rounds <= 6) room.settings.rounds = m.rounds;
    if (typeof m.guess === 'boolean') room.settings.guess = m.guess;
    update(room);
  },

  kick(ws, m, room) {
    if (ws.playerId !== room.hostId || room.state !== 'lobby' || m.playerId === room.hostId) return;
    const p = room.players.get(m.playerId);
    if (!p) return;
    room.players.delete(p.id);
    if (p.ws) {
      p.ws.roomCode = null;
      send(p.ws, { type: 'kicked' });
    }
    update(room);
  },

  start(ws, m, room) {
    if (ws.playerId !== room.hostId || room.state !== 'lobby') return;
    room.round = 0;
    startRound(room);
  },

  submit(ws, m, room) {
    if (room.state !== 'draw') return;
    const cur = room.current;
    const mine = cur.phases[cur.phaseIndex].find((a) => a.playerId === ws.playerId);
    if (!mine || mine.slotId !== m.slotId || cur.layers.has(mine.slotId)) return;
    const png = String(m.png || '');
    if (m.empty !== true && png.startsWith('data:image/png;base64,') && png.length <= MAX_PNG) {
      cur.layers.set(mine.slotId, { png, artist: room.players.get(ws.playerId).name });
    } else {
      cur.layers.set(mine.slotId, null); // handed in blank
    }
    update(room);
    maybeFinishPhase(room);
  },

  guess(ws, m, room) {
    if (room.state !== 'guess') return;
    const cur = room.current;
    cur.guesses.set(ws.playerId, String(m.text || '').replace(/\s+/g, ' ').trim().slice(0, 90) || '(no guess)');
    update(room);
    if (active(room).every((p) => cur.guesses.has(p.id))) showResults(room);
  },

  next(ws, m, room) {
    if (ws.playerId !== room.hostId || room.state !== 'results') return;
    if (room.round >= room.settings.rounds) {
      room.state = 'end';
      broadcast(room, { type: 'end' });
      update(room);
    } else {
      startRound(room);
    }
  },

  again(ws, m, room) {
    if (ws.playerId !== room.hostId || room.state !== 'end') return;
    room.state = 'lobby';
    room.round = 0;
    room.current = null;
    for (const p of [...room.players.values()]) if (!p.connected) room.players.delete(p.id);
    broadcast(room, { type: 'lobby' });
    update(room);
  },
};

const wss = new WebSocketServer({ server, maxPayload: 4 * 1024 * 1024 });
wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  ws.on('message', (raw) => {
    let m;
    try { m = JSON.parse(raw); } catch { return; }
    const fn = handlers[m && m.type];
    if (!fn) return;
    if (m.type === 'create' || m.type === 'join') return fn(ws, m);
    const room = rooms.get(ws.roomCode);
    if (!room || !room.players.has(ws.playerId)) return;
    fn(ws, m, room);
  });
  ws.on('close', () => leave(ws));
  ws.on('error', () => {});
});

// drop connections that have silently died
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) { ws.terminate(); continue; }
    ws.isAlive = false;
    ws.ping();
  }
}, 30000).unref();

server.listen(PORT, () => {
  console.log(`Composite running at http://localhost:${PORT}`);
});

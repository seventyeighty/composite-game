// Layer telephone, pass and play: one device, players take turns when it's handed to them.

import { Sketch } from '/game/sketch.js';
import { drawGuide, drawGhosts, drawOutOfBounds, paintPage } from '/game/guides.js';
import { START_COLORS, clipFor, treat, pageCSS, overlayCanvas, framer, setupPeek, setupHow } from '/game/layers.js';
import { CANVAS, IDEAS, createGame, taskFor, submitWrite, submitDraw, turnComplete, nextTurn } from './engine.js';

const $ = (id) => document.getElementById(id);
const SCREENS = ['setup', 'handoff', 'write', 'draw', 'reveal', 'end'];
const COLORS = [
  ['#1F2430', 'Black'], ['#FFFFFF', 'White'], ['#8B8F98', 'Grey'], ['#8D5A3B', 'Brown'], ['#E5484D', 'Red'], ['#F5852A', 'Orange'],
  ['#FFD23F', 'Yellow'], ['#46A758', 'Green'], ['#12A594', 'Teal'], ['#3B82F6', 'Blue'], ['#6E56CF', 'Purple'], ['#E667AA', 'Pink'],
];
const DRAW_HOW = {
  setting: 'Draw where this happens across the middle of the page, from edge to edge, and fill it in. Everything else goes in front of it.',
  full: 'Draw this as the backdrop and cover the whole page. Everything else will be added in front of it later.',
  strip: 'Draw across the dotted strip from edge to edge and fill it in. Give the top edge a shape. The fill bucket helps.',
  personR: 'Draw them inside the dotted outline, facing the way the arrow points. Keep it inside the dark frame: anything outside it gets cut off.',
  personL: 'Draw them inside the dotted outline, facing the way the arrow points. Keep it inside the dark frame: anything outside it gets cut off.',
  box: 'Draw it inside the dotted box, about that size. Keep it inside the dark frame: anything outside it gets cut off.',
};

let game = null;
let names = ['Mia', 'Dev', 'Oli', ''];
let timerSetting = 90;
let order = 0;           // whose go it is within the current turn
let task = null;         // what the current player is doing
let sketch = null;
let deadline = 0, onTimeUp = null;
const treated = new Map(); // "chain-layer" -> treated layer canvas

// --- helpers ---------------------------------------------------------------

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

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// A drawn layer with its sticker or strip treatment, cached.
async function layerImage(chainIndex, layerIndex) {
  const key = `${chainIndex}-${layerIndex}`;
  if (treated.has(key)) return treated.get(key);
  const step = game.chains[chainIndex].steps[layerIndex];
  const img = step.png ? await loadImage(step.png) : null;
  const out = img ? treat(img, step.guide) : null;
  treated.set(key, out);
  return out;
}

// The picture so far: the page color and every layer drawn before this one.
async function paintBelow(ctx, t) {
  paintPage(ctx, t.page, CANVAS.w, CANVAS.h);
  for (let j = 0; j < t.layerIndex; j++) {
    const img = await layerImage(t.chain, j);
    if (img) ctx.drawImage(img, 0, 0, CANVAS.w, CANVAS.h);
  }
}

const turnLabel = (t) => `Turn ${t.turn + 1} of ${t.turns}`;

// --- timer -----------------------------------------------------------------

function startTimer(seconds, whenUp) {
  stopTimer();
  if (!seconds) return;
  deadline = performance.now() + seconds * 1000;
  onTimeUp = whenUp;
  tick();
}
function stopTimer() {
  deadline = 0;
  onTimeUp = null;
  for (const id of ['wr-timer', 'draw-timer']) { $(id).textContent = ''; $(id).classList.remove('hurry'); }
}
function tick() {
  if (!deadline) return;
  const left = Math.max(0, deadline - performance.now());
  const secs = Math.ceil(left / 1000);
  const id = current() === 'write' ? 'wr-timer' : current() === 'draw' ? 'draw-timer' : null;
  if (id) {
    $(id).textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
    $(id).classList.toggle('hurry', secs <= 10);
  }
  if (left <= 0 && onTimeUp) { const fn = onTimeUp; onTimeUp = null; fn(); }
}
setInterval(tick, 200);

// --- setup -----------------------------------------------------------------

function renderNames() {
  const list = $('setup-players');
  list.textContent = '';
  names.forEach((name, i) => {
    const li = document.createElement('li');
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 14;
    input.value = name;
    input.placeholder = `Player ${i + 1}`;
    input.setAttribute('aria-label', `Player ${i + 1} name`);
    input.addEventListener('input', () => { names[i] = input.value; });
    li.appendChild(input);
    if (names.length > 2) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'kick';
      b.textContent = 'Remove';
      b.setAttribute('aria-label', `Remove player ${i + 1}`);
      b.addEventListener('click', () => { names.splice(i, 1); renderNames(); });
      li.appendChild(b);
    }
    list.appendChild(li);
  });
  $('add-player').hidden = names.length >= 8;
}
$('add-player').addEventListener('click', () => { names.push(''); renderNames(); });

$('start').addEventListener('click', () => {
  const players = names.map((n) => n.trim()).filter(Boolean);
  if (players.length < 2) {
    $('setup-error').textContent = 'Add at least two player names (three or more is more fun).';
    return;
  }
  if (new Set(players.map((p) => p.toLowerCase())).size !== players.length) {
    $('setup-error').textContent = 'Give every player a different name.';
    return;
  }
  $('setup-error').textContent = '';
  timerSetting = Number($('setup-timer').value);
  game = createGame(players, $('setup-length').value);
  treated.clear();
  order = 0;
  window.__game = game; // read by the automated tests
  handoff();
});

// --- handing the device over -------------------------------------------------

function handoff() {
  stopTimer();
  const t = taskFor(game, order);
  $('ho-turn').textContent = turnLabel(t);
  $('ho-name').textContent = game.players[order];
  $('ho-what').textContent = t.type === 'write'
    ? (t.opening ? 'Your turn to start a picture.' : 'Your turn to write what comes next.')
    : 'Your turn to draw.';
  $('ho-go').textContent = `I'm ${game.players[order]}, let's go`;
  show('handoff');
}
$('ho-go').addEventListener('click', () => {
  task = taskFor(game, order);
  if (task.type === 'write') startWrite(task); else startDraw(task);
});

function finishGo() {
  stopTimer();
  order += 1;
  if (order < game.n) { handoff(); return; }
  if (!turnComplete(game)) return;
  order = 0;
  if (nextTurn(game)) handoff();
  else startReveal(0);
}

// --- write turn ----------------------------------------------------------------

let place = null; // { guide, rect } being placed by the writer

async function startWrite(t) {
  $('wr-turn').textContent = `${turnLabel(t)}: ${game.players[order]} writes`;
  const paper = $('wr-paper');
  paper.textContent = '';
  const below = document.createElement('canvas');
  below.width = CANVAS.w; below.height = CANVAS.h;
  below.className = 'below';
  await paintBelow(below.getContext('2d'), t);
  paper.appendChild(below);
  $('wr-empty').hidden = !t.opening;

  const input = $('wr-text');
  input.value = '';
  $('wr-idea').hidden = !t.opening;
  $('wr-choice').hidden = !t.spec.choice;
  if (t.opening) {
    $('wr-kind').textContent = 'START A PICTURE';
    $('wr-ask').textContent = 'Write one line to start a scene.';
    $('wr-how').textContent = 'Keep it simple. The next player draws where it happens, then everyone builds on it, layer by layer.';
    $('wr-label').textContent = 'Your line';
    input.placeholder = 'e.g. a quiet campsite at night';
    place = null;
  } else {
    $('wr-kind').textContent = `WRITE: ${t.spec.name.toUpperCase()}`;
    $('wr-ask').textContent = t.spec.ask;
    $('wr-how').textContent = "You can see the picture so far, but not what anyone wrote. Say what goes here. The next player will draw it.";
    $('wr-label').textContent = 'What it is';
    input.placeholder = `e.g. ${t.spec.example}`;
    place = { guide: t.guide, rect: [...t.rect] };
    setChoice(t.guide === 'box' ? 'box' : 'person', false);
    buildSlot(t);
  }
  show('write');
  startTimer(timerSetting ? Math.round(timerSetting / 2) : 0, submitWriteTurn);
}

// The outline the writer can drag (characters and things) or just sees (strips).
function buildSlot(t) {
  const paper = $('wr-paper');
  paper.querySelectorAll('.slot, .slot-guide').forEach((x) => x.remove());
  const guideCanvas = document.createElement('canvas');
  guideCanvas.width = CANVAS.w; guideCanvas.height = CANVAS.h;
  guideCanvas.className = 'below slot-guide';
  paper.appendChild(guideCanvas);
  const slot = document.createElement('div');
  slot.className = 'slot' + (t.spec.place ? '' : ' fixed');
  const label = document.createElement('div');
  label.className = 'slot-label';
  slot.appendChild(label);
  paper.appendChild(slot);

  const redraw = () => {
    const ctx = guideCanvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS.w, CANVAS.h);
    ctx.save();
    ctx.shadowColor = 'rgba(255,255,255,0.95)';
    ctx.shadowBlur = 5;
    drawGuide(ctx, { guide: place.guide, rect: place.rect }, CANVAS);
    ctx.restore();
    const [x, y, w, h] = place.rect;
    Object.assign(slot.style, { left: `${(x / CANVAS.w) * 100}%`, top: `${(y / CANVAS.h) * 100}%`, width: `${(w / CANVAS.w) * 100}%`, height: `${(h / CANVAS.h) * 100}%` });
    label.textContent = $('wr-text').value.trim() || (place.guide === 'strip' ? 'this strip' : place.guide === 'box' ? 'a thing' : 'someone');
  };
  slot.redraw = redraw;
  $('wr-text').oninput = redraw;
  $('wr-placing').hidden = !(t.spec.place && place.guide !== 'box');

  if (t.spec.place) {
    const handle = document.createElement('div');
    handle.className = 'handle';
    handle.setAttribute('aria-hidden', 'true');
    slot.appendChild(handle);
    const toCanvas = (e) => {
      const r = paper.getBoundingClientRect();
      return [((e.clientX - r.left) / r.width) * CANVAS.w, ((e.clientY - r.top) / r.height) * CANVAS.h];
    };
    let drag = null;
    const down = (e, mode) => {
      e.preventDefault();
      e.stopPropagation();
      e.target.setPointerCapture(e.pointerId);
      drag = { mode, start: toCanvas(e), rect: [...place.rect], id: e.pointerId };
    };
    slot.addEventListener('pointerdown', (e) => down(e, 'move'));
    handle.addEventListener('pointerdown', (e) => down(e, 'size'));
    const move = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const [px, py] = toCanvas(e);
      const dx = px - drag.start[0], dy = py - drag.start[1];
      let [x, y, w, h] = drag.rect;
      if (drag.mode === 'move') {
        x = Math.max(-w * 0.3, Math.min(CANVAS.w - w * 0.7, x + dx));
        y = Math.max(-h * 0.3, Math.min(CANVAS.h - h * 0.5, y + dy));
      } else {
        const keep = place.guide !== 'box'; // people keep their shape
        w = Math.max(70, Math.min(CANVAS.w, w + dx));
        h = keep ? w * (drag.rect[3] / drag.rect[2]) : Math.max(60, Math.min(CANVAS.h, h + dy));
      }
      place.rect = [x, y, w, h];
      redraw();
    };
    const up = (e) => { if (drag && e.pointerId === drag.id) drag = null; };
    slot.addEventListener('pointermove', move);
    handle.addEventListener('pointermove', move);
    slot.addEventListener('pointerup', up);
    handle.addEventListener('pointerup', up);
    slot.addEventListener('pointercancel', up);
    handle.addEventListener('pointercancel', up);
  }
  redraw();
}

function setChoice(kind, rebuild = true) {
  document.querySelectorAll('[data-choice]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.choice === kind)));
  if (!place || !rebuild) return;
  const [x, y, w] = place.rect;
  if (kind === 'box') place = { guide: 'box', rect: [x, y + 60, Math.max(w, 200), 180] };
  else place = { guide: 'personL', rect: [x, Math.max(0, y - 60), 180, 330] };
  buildSlot(task);
}
document.querySelectorAll('[data-choice]').forEach((b) => b.addEventListener('click', () => setChoice(b.dataset.choice)));
$('wr-flip').addEventListener('click', () => {
  if (!place || place.guide === 'box') return;
  place.guide = place.guide === 'personR' ? 'personL' : 'personR';
  const slot = document.querySelector('#wr-paper .slot');
  if (slot) slot.redraw();
});
$('wr-idea').addEventListener('click', () => {
  $('wr-text').value = IDEAS[Math.floor(Math.random() * IDEAS.length)];
  $('wr-text').focus();
});

function submitWriteTurn() {
  if (current() !== 'write') return;
  const text = $('wr-text').value.trim();
  submitWrite(game, order, { text, rect: place && place.rect, guide: place && place.guide });
  finishGo();
}
$('wr-done').addEventListener('click', () => {
  if (!$('wr-text').value.trim()) {
    toast(task && task.opening ? 'Write a line first, or tap "Give me an idea".' : 'Write what goes here first.');
    $('wr-text').focus();
    return;
  }
  submitWriteTurn();
});
$('wr-text').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('wr-done').click(); });

// --- draw turn -------------------------------------------------------------------

// Small pieces are drawn zoomed in, with the picture so far faded. Holding the eye button
// shows the whole picture at full strength.
const BELOW_OPACITY = '0.5';
const frame = framer($('paper-wrap'), $('sketch'));
const howTurn = setupHow(document.querySelector('#draw .brief'), $('how-toggle'));
let zoomHost = null;
setupPeek($('peek'), () => {
  if (!sketch) return;
  sketch.finishStroke();
  sketch.locked = true;
  sketch.guideCanvas.style.opacity = '1';
  frame.view(false);
}, () => {
  if (!sketch) return;
  sketch.locked = false;
  sketch.guideCanvas.style.opacity = BELOW_OPACITY;
  frame.view(true);
});

function buildColors() {
  const host = $('colors');
  COLORS.forEach(([hex, name]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch';
    b.style.background = hex;
    b.dataset.color = hex;
    b.setAttribute('aria-label', name);
    b.setAttribute('aria-pressed', 'false');
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

async function startDraw(t) {
  $('dr-turn').textContent = `${turnLabel(t)}: ${game.players[order]} draws`;
  $('draw-kind').textContent = `DRAW: ${t.spec.name.toUpperCase()}`;
  $('draw-prompt').textContent = `"${t.instruction}"`;
  $('draw-from').textContent = t.layerIndex === 0 ? `the opening line, by ${t.writer}` : `written by ${t.writer}`;
  $('draw-how').textContent = (t.layerIndex === 0 ? DRAW_HOW.setting : DRAW_HOW[t.guide]) || DRAW_HOW.box;
  $('lg-front').hidden = !t.ghosts.length;
  const slot = { guide: t.guide, rect: t.rect };
  const clip = clipFor(slot, CANVAS);
  zoomHost = document.createElement('div');
  zoomHost.className = 'zoom';
  $('sketch').replaceChildren(zoomHost);
  sketch = new Sketch(zoomHost, CANVAS);
  sketch.clip = clip;
  sketch.enclosedFill = t.guide !== 'strip' && t.guide !== 'full';
  sketch.onFillRefused = () => toast('Fill works inside a closed shape. Draw an outline first, then fill it.');
  window.__slot = { ...slot, prompt: t.instruction, spec: t.spec.key }; // read by the automated tests
  const zoomed = frame.set(zoomHost, clip, CANVAS);
  howTurn();
  await paintBelow(sketch.guide, t);
  drawGhosts(sketch.guide, t.ghosts, CANVAS, false, false, zoomed);
  const over = overlayCanvas(zoomHost, CANVAS);
  drawOutOfBounds(over, clip, CANVAS);
  over.save();
  over.shadowColor = 'rgba(255,255,255,0.95)';
  over.shadowBlur = 5;
  drawGuide(over, slot, CANVAS);
  over.restore();
  sketch.guideCanvas.style.opacity = BELOW_OPACITY;
  if (zoomed) $('draw-how').textContent += ' Hold the eye button to see the whole picture.';
  const startColor = START_COLORS[(t.chain + t.layerIndex) % START_COLORS.length];
  sketch.color = startColor;
  document.querySelectorAll('.swatch').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.color === startColor)));
  const size = document.querySelector('[data-size][aria-pressed="true"]');
  sketch.size = size ? Number(size.dataset.size) : 10;
  setTool('brush');
  show('draw');
  startTimer(timerSetting, submitDrawTurn);
}

function submitDrawTurn() {
  if (current() !== 'draw' || !sketch) return;
  sketch.finishStroke();
  sketch.locked = true;
  submitDraw(game, order, { png: sketch.empty ? null : sketch.toPNG() });
  sketch = null;
  finishGo();
}
$('done').addEventListener('click', submitDrawTurn);

// --- the reveal --------------------------------------------------------------------

const par = { x: 0, y: 0, tx: 0, ty: 0, hover: false, t: 0, running: false };
const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function applyParallax() {
  for (const plane of $('rv-paper').querySelectorAll('.plane')) {
    const d = Number(plane.dataset.depth) || 0;
    const amp = 0.4 + d * 3.2;
    const sc = 1 + (amp * 2.2) / 100;
    plane.style.transform = `translate(${(-par.x * amp).toFixed(3)}%, ${(-par.y * amp * 0.6).toFixed(3)}%) scale(${sc.toFixed(4)})`;
  }
}
function parallaxFrame() {
  if (current() !== 'reveal') { par.running = false; return; }
  par.t += 1 / 60;
  if (!par.hover) { par.tx = Math.sin(par.t * 0.55) * 0.7; par.ty = Math.cos(par.t * 0.4) * 0.45; }
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

let revealTimers = [];
async function startReveal(c) {
  stopTimer();
  revealTimers.forEach(clearTimeout);
  revealTimers = [];
  const chain = game.chains[c];
  $('rv-title').textContent = `Picture ${c + 1} of ${game.n}`;
  $('rv-count').textContent = '';
  $('rv-opening').textContent = `"${chain.steps[0].text}"`;
  $('rv-starter').textContent = `started by ${chain.steps[0].writer}`;
  $('rv-paper').textContent = '';
  $('rv-paper').style.background = pageCSS(chain.page);
  $('rv-list').textContent = '';
  $('rv-tag').hidden = true;
  $('rv-next').hidden = true;
  show('reveal');
  startParallax();

  const imgs = await Promise.all(chain.steps.map((_, j) => layerImage(c, j)));
  const steps = chain.steps.map((s, j) => ({ ...s, img: imgs[j], j }));
  const total = steps.length;
  steps.forEach((s, k) => {
    revealTimers.push(setTimeout(() => {
      if (s.img) {
        const plane = document.createElement('div');
        plane.className = 'plane';
        plane.dataset.depth = String(k / Math.max(1, total - 1));
        s.img.className = 'drop';
        s.img.setAttribute('role', 'img');
        s.img.setAttribute('aria-label', `${s.text}, drawn by ${s.drawer}`);
        plane.appendChild(s.img);
        $('rv-paper').appendChild(plane);
        applyParallax();
      }
      const li = document.createElement('li');
      const b = document.createElement('b');
      b.textContent = s.drawer || '?';
      const who = document.createElement('span');
      who.className = 'who';
      who.textContent = k === 0 ? 'drew the opening line' : `drew what ${s.writer} asked for`;
      li.append(b, document.createTextNode(s.img ? `"${s.text}"` : `"${s.text}" (left blank)`), who);
      $('rv-list').querySelectorAll('.now').forEach((x) => x.classList.remove('now'));
      li.className = 'now';
      $('rv-list').appendChild(li);
      $('rv-tag').innerHTML = '';
      const name = document.createElement('span');
      name.className = 'tag-name';
      name.textContent = s.drawer || '?';
      $('rv-tag').append(name, document.createTextNode(` drew "${s.text}"`));
      $('rv-tag').hidden = false;
      $('rv-count').textContent = `${k + 1} of ${total}`;
    }, 500 + k * 2600));
  });
  revealTimers.push(setTimeout(() => {
    $('rv-tag').hidden = true;
    $('rv-list').querySelectorAll('.now').forEach((x) => x.classList.remove('now'));
    const last = c + 1 >= game.n;
    $('rv-next').textContent = last ? 'See the gallery' : 'Next picture';
    $('rv-next').hidden = false;
    $('rv-next').onclick = () => (last ? showGallery() : startReveal(c + 1));
  }, 500 + total * 2600 + 600));
}

async function composite(c) {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS.w; canvas.height = CANVAS.h;
  const ctx = canvas.getContext('2d');
  paintPage(ctx, game.chains[c].page, CANVAS.w, CANVAS.h);
  for (let j = 0; j < game.layers.length; j++) {
    const img = await layerImage(c, j);
    if (img) ctx.drawImage(img, 0, 0, CANVAS.w, CANVAS.h);
  }
  return canvas.toDataURL('image/png');
}

async function showGallery() {
  revealTimers.forEach(clearTimeout);
  const host = $('gallery');
  host.textContent = '';
  for (let c = 0; c < game.n; c++) {
    const chain = game.chains[c];
    const url = await composite(c);
    const fig = document.createElement('figure');
    const img = document.createElement('img');
    img.src = url;
    img.alt = `Picture that started as: ${chain.steps[0].text}`;
    const cap = document.createElement('figcaption');
    cap.textContent = `"${chain.steps[0].text}"`;
    const a = document.createElement('a');
    a.className = 'btn';
    a.href = url;
    a.download = `composite-${c + 1}.png`;
    a.textContent = 'Save picture';
    a.style.cssText = 'display:inline-flex;align-items:center;text-decoration:none;color:inherit';
    fig.append(img, cap, a);
    host.appendChild(fig);
  }
  show('end');
}
$('again').addEventListener('click', () => { names = game.players.slice(); renderNames(); show('setup'); });

// --- start -------------------------------------------------------------------

buildColors();
renderNames();
show('setup');

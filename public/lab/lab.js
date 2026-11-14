// Poster lab: load sample drawings, pick a finish, type a title, see the poster.
/* global PIXI */

import { SAMPLES, SRC_W } from './samples.js';
import { FINISHES, drawTitle } from './finishes.js';
import { layerToStrokes, bboxOf, renderLayer, fadeBottom, tint, soften, gradientMap, mulberry32 } from './brushes.js';

const PW = 600, PH = 900;      // poster size on screen
const SS = 2;                  // drawn at double size so it stays sharp
const W = PW * SS, H = PH * SS;
const U = W / SRC_W;           // sample units -> pixels
const ROOM = 'KXQP';

const FONTS = [
  ['Cinzel', 900], ['Creepster', 400], ['Monoton', 400], ['Playfair Display', 700, true], ['Playfair Display', 400, true],
  ['Playfair Display', 700], ['Bebas Neue', 400], ['Anton', 400], ['Alfa Slab One', 400], ['Yellowtail', 400],
  ['Oswald', 400], ['Oswald', 700], ['Audiowide', 400],
];

const state = {
  sample: SAMPLES[0],
  finish: FINISHES.find((f) => f.id === 'painted'),
  title: SAMPLES[0].title,
  tagline: SAMPLES[0].tagline,
};

const strokeCache = new Map();
function strokesFor(sample) {
  if (!strokeCache.has(sample.id)) {
    strokeCache.set(sample.id, sample.layers.map((l) => {
      const strokes = layerToStrokes(l, U);
      return { layer: l, strokes, bbox: bboxOf(strokes) };
    }));
  }
  return strokeCache.get(sample.id);
}

function canvas2d() {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  return [c, c.getContext('2d', { willReadFrequently: true })];
}

let app, artCanvas, artCtx, furnCanvas, furnCtx, artSprite, furnSprite;

function buildInfo() {
  const layers = state.sample.layers;
  const by = (role) => layers.find((l) => l.role === role);
  const order = ['hero', 'side', 'looming', 'object', 'backdrop'];
  const cast = [];
  for (const r of order) { const l = by(r); if (l && !cast.includes(l.artist)) cast.push(l.artist); }
  return {
    W, H, k: SS, u: U, rng: mulberry32(11), room: ROOM,
    title: state.title, tagline: state.tagline.trim(),
    layers, cast: cast.slice(0, 3), star: (by('hero') || layers[0]).artist,
  };
}

function render() {
  const f = state.finish;
  const info = buildInfo();

  // 1. artwork: background, then each player's layer re-inked and treated for its slot
  artCtx.setTransform(1, 0, 0, 1, 0, 0);
  artCtx.globalAlpha = 1;
  artCtx.globalCompositeOperation = 'source-over';
  artCtx.clearRect(0, 0, W, H);
  f.bg(artCtx, info);
  strokesFor(state.sample).forEach(({ layer, strokes, bbox }, i) => {
    const t = (f.slots && f.slots[layer.role]) || {};
    let c = renderLayer(strokes, f.brush, W, H, U, 100 + i);
    if (t.fade) c = fadeBottom(c, bbox, t.fade);
    if (t.tint) c = tint(c, t.tint[0], t.tint[1]);
    if (t.soft) c = soften(c, t.soft);
    artCtx.save();
    artCtx.globalAlpha = t.alpha == null ? 1 : t.alpha;
    artCtx.globalCompositeOperation = t.blend || 'source-over';
    if (t.glow) {
      artCtx.shadowColor = t.glow[0];
      artCtx.shadowBlur = t.glow[1] * SS;
      artCtx.drawImage(c, 0, 0);
    }
    artCtx.drawImage(c, 0, 0);
    artCtx.restore();
  });
  if (f.duotone) gradientMap(artCtx, W, H, f.duotone);
  if (f.afterArt) f.afterArt(artCtx, info);

  // 2. type: title and small print, kept crisp above the artwork effects
  furnCtx.setTransform(1, 0, 0, 1, 0, 0);
  furnCtx.clearRect(0, 0, W, H);
  if (f.furniture) f.furniture(furnCtx, info);
  if (f.title) {
    const [bx, by, bw, bh] = f.title.box;
    drawTitle(furnCtx, state.title, { x: bx * W, y: by * H, w: bw * W, h: bh * H }, f.title);
  }

  // 3. effects
  artSprite.texture.source.update();
  furnSprite.texture.source.update();
  const res = app.renderer.resolution;
  const prep = (list) => { list.forEach((x) => { x.resolution = res; }); return list; };
  artSprite.filters = f.pixiArt ? prep(f.pixiArt(PIXI.filters)) : null;
  app.stage.filters = f.pixiFinal ? prep(f.pixiFinal(PIXI.filters)) : null;
  app.render();

  document.querySelectorAll('[data-finish]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.finish === f.id)));
  document.querySelectorAll('[data-sample]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.sample === state.sample.id)));
  document.getElementById('real-title').textContent = state.sample.realTitle;
}

function buildControls() {
  const finishes = document.getElementById('finishes');
  for (const f of FINISHES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'finish';
    b.dataset.finish = f.id;
    b.innerHTML = `<span class="finish-name"></span><span class="finish-blurb"></span>`;
    b.querySelector('.finish-name').textContent = f.name;
    b.querySelector('.finish-blurb').textContent = f.blurb;
    b.addEventListener('click', () => { state.finish = f; render(); });
    finishes.appendChild(b);
  }
  const samples = document.getElementById('samples');
  for (const s of SAMPLES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.sample = s.id;
    b.textContent = s.name;
    b.addEventListener('click', () => {
      state.sample = s; state.title = s.title; state.tagline = s.tagline;
      titleInput.value = s.title; taglineInput.value = s.tagline;
      render();
    });
    samples.appendChild(b);
  }
  const titleInput = document.getElementById('title');
  const taglineInput = document.getElementById('tagline');
  titleInput.value = state.title;
  taglineInput.value = state.tagline;
  titleInput.addEventListener('input', () => { state.title = titleInput.value; render(); });
  taglineInput.addEventListener('input', () => { state.tagline = taglineInput.value; render(); });
  document.getElementById('download').addEventListener('click', () => {
    app.render();
    app.canvas.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${(state.title || 'poster').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${state.finish.id}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }, 'image/png');
  });
}

async function main() {
  await Promise.all(FONTS.map(([font, weight, italic]) => document.fonts.load(`${italic ? 'italic ' : ''}${weight} 40px "${font}"`)));

  [artCanvas, artCtx] = canvas2d();
  [furnCanvas, furnCtx] = canvas2d();

  app = new PIXI.Application();
  await app.init({
    width: PW, height: PH, background: '#000000', antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2), autoDensity: true,
    preference: 'webgl', preserveDrawingBuffer: true, autoStart: false,
  });
  app.canvas.setAttribute('role', 'img');
  app.canvas.setAttribute('aria-label', 'Poster preview');
  document.getElementById('stage').appendChild(app.canvas);

  artSprite = new PIXI.Sprite(PIXI.Texture.from(artCanvas));
  furnSprite = new PIXI.Sprite(PIXI.Texture.from(furnCanvas));
  for (const s of [artSprite, furnSprite]) { s.width = PW; s.height = PH; app.stage.addChild(s); }
  app.stage.filterArea = new PIXI.Rectangle(0, 0, PW, PH);

  buildControls();
  render();
  document.body.dataset.ready = '1';

  // handy for testing from the console
  window.lab = {
    finishes: FINISHES.map((f) => f.id),
    samples: SAMPLES.map((s) => s.id),
    set(finishId, sampleId) {
      if (sampleId) {
        const s = SAMPLES.find((x) => x.id === sampleId);
        state.sample = s; state.title = s.title; state.tagline = s.tagline;
        document.getElementById('title').value = s.title;
        document.getElementById('tagline').value = s.tagline;
      }
      state.finish = FINISHES.find((f) => f.id === finishId) || state.finish;
      render();
    },
  };
}

main().catch((err) => {
  console.error(err);
  document.getElementById('stage').textContent = 'The poster lab could not start: ' + err.message;
});

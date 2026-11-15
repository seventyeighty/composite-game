// Shared helpers for drawing layers: start colors, how far a piece may spill, and the
// sticker / strip treatment used when layers are stacked into a picture.

// Each piece starts on a different colour, so layers differ even if nobody changes it.
export const START_COLORS = ['#1F2430', '#E5484D', '#3B82F6', '#46A758', '#6E56CF', '#F5852A', '#12A594', '#E667AA'];

// How far outside its guide a piece may spill, in drawing units.
export function clipFor(s, canvas) {
  if (s.guide === 'full') return null;
  const m = s.guide === 'strip' ? 10 : 40;
  const [x, y, w, h] = s.rect;
  const x0 = Math.max(0, x - m), y0 = Math.max(0, y - m);
  return [x0, y0, Math.min(canvas.w, x + w + m) - x0, Math.min(canvas.h, y + h + m) - y0];
}

// Characters and objects get a paper backing, like a cut-out: the inside of any closed outline
// becomes solid paper and every line gets a paper border, like a die-cut sticker. That way a piece hides what is
// behind it even when it was drawn as outlines only.
export function cutOut(img) {
  const W = 800, H = 600, EDGE = 9;
  const src = document.createElement('canvas');
  src.width = W; src.height = H;
  const sctx = src.getContext('2d', { willReadFrequently: true });
  sctx.drawImage(img, 0, 0, W, H);
  const data = sctx.getImageData(0, 0, W, H).data;
  // flood in from the page edges across empty pixels: whatever is not reached is "inside"
  const outside = new Uint8Array(W * H);
  const stack = [];
  const visit = (i) => { if (!outside[i] && data[i * 4 + 3] < 60) { outside[i] = 1; stack.push(i); } };
  for (let x = 0; x < W; x++) { visit(x); visit((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { visit(y * W); visit(y * W + W - 1); }
  while (stack.length) {
    const i = stack.pop(), x = i % W;
    if (x > 0) visit(i - 1);
    if (x < W - 1) visit(i + 1);
    if (i >= W) visit(i - W);
    if (i < W * (H - 1)) visit(i + W);
  }
  // Group the drawn pixels into separate blobs. Big blobs get the full sticker border;
  // small separate marks (motion lines, sparkles, dots) only get a thin edge so they stay small.
  const SMALL = 400;
  const label = new Int32Array(W * H).fill(-1);
  const sizes = [];
  for (let start = 0; start < W * H; start++) {
    if (outside[start] || label[start] !== -1) continue;
    const id = sizes.length;
    let count = 0;
    label[start] = id;
    stack.push(start);
    while (stack.length) {
      const i = stack.pop(), x = i % W;
      count++;
      const near = [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i >= W ? i - W : -1, i < W * (H - 1) ? i + W : -1];
      for (const j of near) if (j >= 0 && !outside[j] && label[j] === -1) { label[j] = id; stack.push(j); }
    }
    sizes.push(count);
  }
  const makeMask = (keep) => {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const cx = c.getContext('2d');
    const m = cx.createImageData(W, H);
    let any = false;
    for (let i = 0; i < W * H; i++) {
      if (outside[i] || !keep(sizes[label[i]])) continue;
      any = true;
      m.data[i * 4] = 253; m.data[i * 4 + 1] = 251; m.data[i * 4 + 2] = 246; m.data[i * 4 + 3] = 255;
    }
    cx.putImageData(m, 0, 0);
    return any ? c : null;
  };
  const mask = makeMask((n) => n >= SMALL);
  const smallMask = makeMask((n) => n < SMALL);
  if (!mask && !smallMask) return img;

  // paper backing = the mask grown outward in even rings
  const backing = document.createElement('canvas');
  backing.width = W; backing.height = H;
  const bctx = backing.getContext('2d');
  const grow = (m, edge) => {
    for (const r of [edge / 3, (edge * 2) / 3, edge]) {
      for (let a = 0; a < 16; a++) bctx.drawImage(m, Math.round(Math.cos(a * Math.PI / 8) * r), Math.round(Math.sin(a * Math.PI / 8) * r));
    }
    bctx.drawImage(m, 0, 0);
  };
  if (mask) grow(mask, EDGE);
  if (smallMask) grow(smallMask, 3);
  // The backing casts a soft shadow, like cut paper lying on the page.
  const out = document.createElement('canvas');
  out.width = W; out.height = H;
  const octx = out.getContext('2d');
  // Two shadows: a light rim that shows on dark backgrounds, a dark drop shadow that shows on
  // light ones. Each is invisible where the other is needed, so together they work on any page.
  octx.save();
  octx.shadowColor = 'rgba(255,255,255,0.45)';
  octx.shadowBlur = 10;
  octx.drawImage(backing, 0, 0);
  octx.restore();
  octx.save();
  octx.shadowColor = 'rgba(20,24,32,0.5)';
  octx.shadowBlur = 8;
  octx.shadowOffsetY = 4;
  octx.drawImage(backing, 0, 0);
  octx.restore();
  octx.drawImage(img, 0, 0, W, H);
  return out;
}
export const isCutOut = (guide) => guide === 'box' || guide === 'personR' || guide === 'personL';

// Strips run edge to edge, so they get a shadow but no paper border: a torn strip laid across the page.
export function stripShadow(img) {
  const out = document.createElement('canvas');
  out.width = 800; out.height = 600;
  const ctx = out.getContext('2d');
  ctx.save();
  ctx.shadowColor = 'rgba(20,24,32,0.45)';
  ctx.shadowBlur = 10;
  ctx.drawImage(img, 0, 0, 800, 600);
  ctx.restore();
  ctx.drawImage(img, 0, 0, 800, 600);
  return out;
}
export function treat(img, guide) {
  if (!img) return img;
  if (isCutOut(guide)) return cutOut(img);
  if (guide === 'strip') return stripShadow(img);
  return img;
}
export function pageCSS(page) {
  return page ? `linear-gradient(${page[0]}, ${page[1]})` : '';
}

// A canvas above the drawing for the dotted guide and the cut-off shading, so they stay visible
// while the picture underneath can be faded or hidden with the view buttons.
export function overlayCanvas(host, size) {
  const c = document.createElement('canvas');
  c.width = size.w; c.height = size.h;
  c.className = 'sk-over';
  c.setAttribute('aria-hidden', 'true');
  host.appendChild(c);
  return c.getContext('2d');
}

// Zoom so a small piece's drawing area fills most of the frame. Returns a CSS transform, or null
// when the piece is already big (strips) and zooming wouldn't help.
export function zoomFor(clip, canvas) {
  if (!clip) return null;
  const [x, y, w, h] = clip;
  const s = Math.min(canvas.w / w, canvas.h / h, 2.6) * 0.92;
  if (s < 1.15) return null;
  let tx = 0.5 - (s * (x + w / 2)) / canvas.w;
  let ty = 0.5 - (s * (y + h / 2)) / canvas.h;
  tx = Math.min(0, Math.max(1 - s, tx));
  ty = Math.min(0, Math.max(1 - s, ty));
  return `translate(${(tx * 100).toFixed(3)}%, ${(ty * 100).toFixed(3)}%) scale(${s.toFixed(3)})`;
}

// A button you press and hold. start() runs on press, end() on release.
export function setupPeek(button, start, end) {
  let on = false;
  const go = (e) => { if (e) e.preventDefault(); if (on) return; on = true; button.setAttribute('aria-pressed', 'true'); start(); };
  const stop = () => { if (!on) return; on = false; button.setAttribute('aria-pressed', 'false'); end(); };
  button.addEventListener('pointerdown', (e) => { button.setPointerCapture(e.pointerId); go(e); });
  button.addEventListener('pointerup', stop);
  button.addEventListener('pointercancel', stop);
  button.addEventListener('lostpointercapture', stop);
  button.addEventListener('contextmenu', (e) => e.preventDefault());
  button.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) go(e); });
  button.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') stop(); });
  button.addEventListener('blur', stop);
}

// Shows a small piece's drawing area as big as the screen allows.
// On phones the paper itself changes shape to fit the piece (a tall frame for a character);
// on bigger screens the 4:3 page stays and zooms in. view(false) shows the whole page again.
export function framer(wrap, paper) {
  let host = null, clip = null, canvas = null, mode = null, css = null;
  const phone = () => window.matchMedia('(max-width:600px)').matches;
  function clear() {
    wrap.style.width = '';
    paper.style.aspectRatio = '';
    if (!host) return;
    for (const k of ['left', 'top', 'right', 'bottom', 'width', 'height', 'transform']) host.style[k] = '';
  }
  function apply() {
    clear();
    if (mode === 'frame') {
      const [fx, fy, fw, fh] = css;
      const maxH = Math.min(window.innerHeight * 0.58, 600);
      wrap.style.width = `min(100%, ${Math.round((maxH * fw) / fh)}px)`;
      paper.style.aspectRatio = `${fw} / ${fh}`;
      Object.assign(host.style, {
        left: `${(-fx / fw) * 100}%`, top: `${(-fy / fh) * 100}%`, right: 'auto', bottom: 'auto',
        width: `${(canvas.w / fw) * 100}%`, height: `${(canvas.h / fh) * 100}%`,
      });
    } else if (mode === 'zoom') {
      host.style.transform = css;
    }
  }
  return {
    // Returns true when the view is zoomed or framed.
    set(h, c, size) {
      host = h; clip = c; canvas = size; mode = null; css = null;
      if (clip && phone() && clip[2] < canvas.w * 0.8) {
        const pad = 14;
        const fx = Math.max(0, clip[0] - pad), fy = Math.max(0, clip[1] - pad);
        const fw = Math.min(canvas.w, clip[0] + clip[2] + pad) - fx, fh = Math.min(canvas.h, clip[1] + clip[3] + pad) - fy;
        mode = 'frame'; css = [fx, fy, fw, fh];
      } else {
        css = zoomFor(clip, canvas);
        if (css) mode = 'zoom';
      }
      apply();
      return mode !== null;
    },
    view(close) { if (close) apply(); else clear(); },
  };
}

// On phones the instructions fold away behind a "How?" button, so the drawing gets the room.
// They start open on the first drawing turn of a visit and folded after that.
export function setupHow(brief, button) {
  let first = true;
  const show = (on) => { brief.classList.toggle('show-how', on); button.setAttribute('aria-expanded', String(on)); button.textContent = on ? 'Hide' : 'How?'; };
  button.addEventListener('click', () => show(!brief.classList.contains('show-how')));
  return () => { show(first); first = false; };
}

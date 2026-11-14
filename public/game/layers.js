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

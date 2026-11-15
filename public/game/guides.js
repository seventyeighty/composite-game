// Dotted guides (your piece) and striped ghosts (where other players' pieces go).

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// A standing figure in a 1 x 1 box, facing right. Numbers are [x, y] pairs for bezier segments.
const PERSON = [
  ['M', 0.5, 0.02],
  ['C', 0.68, 0.02, 0.78, 0.1, 0.76, 0.2],
  ['C', 0.75, 0.27, 0.68, 0.31, 0.62, 0.33],
  ['C', 0.76, 0.36, 0.86, 0.44, 0.88, 0.56],
  ['L', 0.92, 0.98], ['L', 0.62, 0.98], ['L', 0.59, 0.72], ['L', 0.43, 0.72], ['L', 0.4, 0.98], ['L', 0.1, 0.98], ['L', 0.14, 0.56],
  ['C', 0.16, 0.44, 0.26, 0.36, 0.4, 0.33],
  ['C', 0.3, 0.3, 0.24, 0.25, 0.24, 0.18],
  ['C', 0.24, 0.09, 0.34, 0.02, 0.5, 0.02],
];

function personPath(ctx, [x, y, w, h], flip) {
  const X = (u) => x + (flip ? 1 - u : u) * w;
  const Y = (v) => y + v * h;
  ctx.beginPath();
  for (const seg of PERSON) {
    if (seg[0] === 'M') ctx.moveTo(X(seg[1]), Y(seg[2]));
    else if (seg[0] === 'L') ctx.lineTo(X(seg[1]), Y(seg[2]));
    else ctx.bezierCurveTo(X(seg[1]), Y(seg[2]), X(seg[3]), Y(seg[4]), X(seg[5]), Y(seg[6]));
  }
  ctx.closePath();
  // arrow showing which way they face
  const dir = flip ? -1 : 1;
  const ax = X(0.86), ay = Y(0.16), len = Math.max(34, w * 0.22);
  ctx.moveTo(ax, ay);
  ctx.lineTo(ax + dir * len, ay);
  ctx.moveTo(ax + dir * (len - 11), ay - 10);
  ctx.lineTo(ax + dir * len, ay);
  ctx.lineTo(ax + dir * (len - 11), ay + 10);
}

export function drawGuide(ctx, slot, canvas, dark = false) {
  const [x, y, w, h] = slot.rect;
  ctx.save();
  ctx.strokeStyle = dark ? 'rgba(244,241,232,0.85)' : '#6F7785';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash([3, 11]);
  if (slot.guide === 'personR' || slot.guide === 'personL') {
    personPath(ctx, slot.rect, slot.guide === 'personL');
    ctx.stroke();
  } else if (slot.guide === 'full') {
    roundRect(ctx, 10, 10, canvas.w - 20, canvas.h - 20, 14);
    ctx.stroke();
  } else {
    // box and strip: keep the dots inside the paper when the area touches an edge
    const inset = 6;
    const x0 = Math.max(x, inset), y0 = Math.max(y, inset);
    const x1 = Math.min(x + w, canvas.w - inset), y1 = Math.min(y + h, canvas.h - inset);
    if (slot.guide === 'strip') {
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.08)' : 'rgba(111,119,133,0.07)';
      ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    }
    roundRect(ctx, x0, y0, x1 - x0, y1 - y0, slot.guide === 'strip' ? 10 : 26);
    ctx.stroke();
  }
  ctx.restore();
}

let stripes = {};
function stripePattern(ctx, front, dark) {
  const key = (front ? 'front' : 'back') + (dark ? '-dark' : '');
  if (!stripes[key]) {
    const c = document.createElement('canvas');
    c.width = c.height = 14;
    const p = c.getContext('2d');
    const rgb = dark ? '244,241,232' : '96,106,122';
    p.strokeStyle = front ? `rgba(${rgb},0.5)` : `rgba(${rgb},0.22)`;
    p.lineWidth = front ? 4.5 : 3;
    p.beginPath();
    for (const o of [-14, 0, 14]) { p.moveTo(o, 14); p.lineTo(o + 14, 0); }
    p.stroke();
    stripes[key] = c;
  }
  return ctx.createPattern(stripes[key], 'repeat');
}

function label(ctx, text, x0, y0, x1, y1, dark = false) {
  const w = x1 - x0, h = y1 - y0;
  ctx.font = '20px "Patrick Hand", system-ui, sans-serif';
  if (w < ctx.measureText(text).width + 16 || h < 34) return;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 5;
  ctx.strokeStyle = dark ? 'rgba(14,20,51,0.85)' : 'rgba(253,251,246,0.9)';
  ctx.strokeText(text, x0 + w / 2, y0 + h / 2);
  ctx.fillStyle = dark ? '#F4F1E8' : '#4A5160';
  ctx.fillText(text, x0 + w / 2, y0 + h / 2);
}

// Where the other pieces go.
// Normal pieces: pale stripes are behind yours, bold stripes will cover yours.
// soft (used for the background, which everything sits on): light dashed boxes only,
// so the page still reads as something to draw all over.
export function drawGhosts(ctx, ghosts, canvas, soft = false, dark = false, quiet = false) {
  const inset = 4;
  const sorted = [...ghosts].sort((a, b) => Number(a.front) - Number(b.front));
  for (const g of sorted) {
    const [x, y, w, h] = g.rect;
    const x0 = Math.max(x, inset), y0 = Math.max(y, inset);
    const x1 = Math.min(x + w, canvas.w - inset), y1 = Math.min(y + h, canvas.h - inset);
    ctx.save();
    if (quiet) ctx.globalAlpha = 0.55; // zoomed in: lighter, no labels, so the drawing gets the room
    roundRect(ctx, x0, y0, x1 - x0, y1 - y0, 22);
    if (soft) {
      ctx.setLineDash([10, 9]);
      ctx.strokeStyle = 'rgba(96,106,122,0.55)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
      label(ctx, 'a piece goes here', x0, y0, x1, y1, dark);
    } else {
      // see-through, so the page colour still shows
      ctx.fillStyle = dark ? (g.front ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.07)') : (g.front ? 'rgba(236,239,243,0.6)' : 'rgba(246,247,249,0.45)');
      ctx.fill();
      ctx.fillStyle = stripePattern(ctx, g.front, dark);
      ctx.fill();
      const rgb = dark ? '244,241,232' : '96,106,122';
      ctx.strokeStyle = g.front ? `rgba(${rgb},0.6)` : `rgba(${rgb},0.3)`;
      ctx.lineWidth = 2;
      ctx.stroke();
      if (!quiet) label(ctx, g.front ? 'covers yours' : 'behind yours', x0, y0, x1, y1, dark);
    }
    ctx.restore();
  }
}

// A light wash over the part of the page this piece cannot draw on.
export function drawOutOfBounds(ctx, clip, canvas, dark = false) {
  if (!clip) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, canvas.w, canvas.h);
  ctx.rect(clip[0], clip[1], clip[2], clip[3]);
  ctx.fillStyle = dark ? 'rgba(0,0,0,0.35)' : 'rgba(31,36,48,0.13)';
  ctx.fill('evenodd');
  // a clear edge: your ink stops here
  ctx.lineWidth = 3;
  ctx.strokeStyle = dark ? 'rgba(244,241,232,0.8)' : 'rgba(31,36,48,0.7)';
  ctx.strokeRect(clip[0] + 1.5, clip[1] + 1.5, clip[2] - 3, clip[3] - 3);
  ctx.restore();
}

// The colored paper the scene is drawn on.
export function paintPage(ctx, page, w, h) {
  const [top, bottom] = page || ['#FDFBF6', '#FDFBF6'];
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

export function isDark(page) {
  if (!page) return false;
  const n = parseInt(page[0].slice(1), 16);
  const l = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return l < 110;
}

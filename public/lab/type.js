// Typesetting helpers: poster titles with gradients, outlines, depth and glow, plus small print.

export function fontString(o, size) {
  return `${o.italic ? 'italic ' : ''}${o.weight || 400} ${size}px "${o.font}"`;
}

export function splitLines(text, maxLines = 2) {
  const t = text.trim().replace(/\s+/g, ' ');
  if (maxLines < 2 || t.length <= 11 || !t.includes(' ')) return [t];
  let best = null;
  for (let i = 0; i < t.length; i++) {
    if (t[i] !== ' ') continue;
    const diff = Math.abs(i - (t.length - i - 1));
    if (!best || diff < best.diff) best = { i, diff };
  }
  return [t.slice(0, best.i), t.slice(best.i + 1)];
}

export function wrap(ctx, text, maxWidth) {
  const words = text.trim().split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? cur + ' ' + w : w;
    if (cur && ctx.measureText(next).width > maxWidth) { lines.push(cur); cur = w; } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

// box: {x, y, w, h} in pixels. style: see finishes.js
export function drawTitle(ctx, rawText, box, st) {
  let text = (rawText || '').trim() || 'Untitled';
  if (st.upper) text = text.toUpperCase();
  const lines = splitLines(text, st.maxLines || 2);
  const lh = st.lineHeight || 1.02;
  const skew = st.skew || 0;

  ctx.save();
  ctx.font = fontString(st, 100);
  const maxW = Math.max(...lines.map((l) => ctx.measureText(l).width));
  const room = box.w * (1 - Math.abs(skew) * 0.35) * (st.speed ? 0.8 : 1);
  const size = Math.min((room / maxW) * 100, box.h / (lines.length * lh));
  ctx.font = fontString(st, size);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.translate(box.x + box.w / 2 + (st.speed ? box.w * 0.08 : 0), box.y + box.h / 2);
  if (st.rotate) ctx.rotate((st.rotate * Math.PI) / 180);
  if (skew) ctx.transform(1, 0, skew, 1, 0, 0);

  const ys = lines.map((_, i) => (i - (lines.length - 1) / 2) * size * lh);
  const paint = (y) => {
    if (Array.isArray(st.fill)) {
      const g = ctx.createLinearGradient(0, y - size * 0.42, 0, y + size * 0.42);
      st.fill.forEach((c, i) => g.addColorStop(i / (st.fill.length - 1), c));
      return g;
    }
    return st.fill;
  };

  lines.forEach((line, i) => {
    const y = ys[i];
    const w = ctx.measureText(line).width;

    if (st.speed) {
      // streaks trailing off to the left, like the title is moving fast
      for (let b = 0; b < 5; b++) {
        const by = y - size * 0.3 + b * size * 0.15;
        const len = size * (1.5 - b * 0.12);
        ctx.fillStyle = paint(y);
        ctx.globalAlpha = 0.95;
        ctx.beginPath();
        ctx.moveTo(-w / 2 - size * 0.08, by);
        ctx.lineTo(-w / 2 - size * 0.08, by + size * 0.07);
        ctx.lineTo(-w / 2 - len, by + size * 0.035);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    if (st.extrude) {
      const e = st.extrude;
      ctx.fillStyle = e.color;
      ctx.strokeStyle = e.color;
      ctx.lineWidth = (st.stroke ? st.stroke.width : 0.02) * size;
      for (let k = e.n; k >= 1; k--) {
        const ox = (e.dx * size * k) / e.n, oy = (e.dy * size * k) / e.n;
        ctx.strokeText(line, ox, y + oy);
        ctx.fillText(line, ox, y + oy);
      }
    }
    for (const g of st.glows || []) {
      ctx.save();
      ctx.shadowColor = g.color;
      ctx.shadowBlur = g.blur * size;
      ctx.fillStyle = g.color;
      ctx.fillText(line, 0, y);
      ctx.restore();
    }
    if (st.stroke) {
      ctx.strokeStyle = st.stroke.color;
      ctx.lineWidth = st.stroke.width * size;
      ctx.strokeText(line, 0, y);
    }
    ctx.fillStyle = paint(y);
    ctx.fillText(line, 0, y);
    if (st.shine) {
      // thin light line across the upper half of the letters
      ctx.save();
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(-w / 2 - 4, y - size * 0.08, w + 8, size * 0.035);
      ctx.restore();
    }
  });
  ctx.restore();
}

export function drawText(ctx, str, x, y, o) {
  ctx.save();
  ctx.font = fontString(o, o.size);
  ctx.textAlign = o.align || 'center';
  ctx.textBaseline = o.baseline || 'alphabetic';
  if (o.spacing && 'letterSpacing' in ctx) ctx.letterSpacing = `${o.spacing}px`;
  ctx.translate(x, y);
  if (o.rotate) ctx.rotate((o.rotate * Math.PI) / 180);
  if (o.shadow) { ctx.shadowColor = o.shadow.color; ctx.shadowBlur = o.shadow.blur; }
  if (o.outline) { ctx.lineJoin = 'round'; ctx.strokeStyle = o.outline.color; ctx.lineWidth = o.outline.width; ctx.strokeText(str, 0, 0); }
  ctx.fillStyle = o.color;
  ctx.fillText(str, 0, 0);
  ctx.restore();
}

// Several lines of wrapped text. Returns the y after the last line.
export function drawParagraph(ctx, str, x, y, maxWidth, o) {
  ctx.save();
  ctx.font = fontString(o, o.size);
  if (o.spacing && 'letterSpacing' in ctx) ctx.letterSpacing = `${o.spacing}px`;
  const lines = wrap(ctx, str, maxWidth);
  ctx.restore();
  const lh = (o.lineHeight || 1.15) * o.size;
  lines.forEach((l, i) => drawText(ctx, l, x, y + i * lh, o));
  return y + lines.length * lh;
}

// The block of small credits at the bottom of a poster, built from the players.
// Returns two lines of roughly equal length.
export function creditLines(info) {
  const parts = [`A ROOM ${info.room} PRODUCTION`];
  for (const l of info.layers) parts.push(`${l.label} BY ${l.artist}`.toUpperCase());
  parts.push('DRAWN IN 60 SECONDS');
  const half = Math.ceil(parts.length / 2);
  return [parts.slice(0, half).join('    '), parts.slice(half).join('    ')];
}

// Turns a layer's strokes into pixels. The same strokes can be "re-inked" with different brushes,
// which is how one drawing ends up looking painted, printed or neon.

const SVG_NS = 'http://www.w3.org/2000/svg';

// --- colour helpers -------------------------------------------------------

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const toHex = (r, g, b) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export const mix = (a, b, t) => {
  const A = hexToRgb(a), B = hexToRgb(b);
  return toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
};
export const darken = (c, t) => mix(c, '#000000', t);
export const lighten = (c, t) => mix(c, '#ffffff', t);
export function vivid(hex) {
  // push a colour toward full saturation, for neon tubes
  const [r, g, b] = hexToRgb(hex);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max - min < 28) return max > 150 ? '#bff4ff' : '#7a5cff';
  const k = 255 / max;
  const f = (v) => (v - min) * (max / (max - min)) * k;
  return toHex(f(r), f(g), f(b));
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- strokes --------------------------------------------------------------

let probe;
function pathProbe() {
  if (!probe) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    probe = document.createElementNS(SVG_NS, 'path');
    svg.appendChild(probe);
    document.body.appendChild(svg);
  }
  return probe;
}

// Sample layer -> list of strokes with point lists (the format the real game will record).
export function layerToStrokes(layer, u) {
  const p = pathProbe();
  const strokes = [];
  for (const item of layer.items) {
    const subs = item.d.split(/(?=M)/).map((s) => s.trim()).filter(Boolean);
    for (const sub of subs) {
      p.setAttribute('d', sub);
      const len = p.getTotalLength();
      const n = Math.max(2, Math.ceil(len / 2));
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const pt = p.getPointAtLength((len * i) / n);
        pts.push([pt.x * u, pt.y * u]);
      }
      strokes.push({
        pts,
        closed: /z\s*$/i.test(sub),
        stroke: item.stroke || null,
        w: (item.w || 3) * u,
        fill: item.fill || null,
        fa: item.fa == null ? 1 : item.fa,
      });
    }
  }
  return strokes;
}

export function bboxOf(strokes) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const s of strokes) for (const [x, y] of s.pts) {
    if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y;
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

function trace(ctx, s, dx = 0, dy = 0) {
  const pts = s.pts;
  ctx.beginPath();
  ctx.moveTo(pts[0][0] + dx, pts[0][1] + dy);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] + dx, pts[i][1] + dy);
  if (s.closed) ctx.closePath();
}

function newCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  return [c, ctx];
}

// --- brushes --------------------------------------------------------------

const BRUSHES = {
  // What the player saw while drawing.
  ink(ctx, strokes) {
    for (const s of strokes) {
      trace(ctx, s);
      if (s.fill) { ctx.globalAlpha = s.fa; ctx.fillStyle = s.fill; ctx.fill(); ctx.globalAlpha = 1; }
      if (s.stroke) { ctx.strokeStyle = s.stroke; ctx.lineWidth = s.w; ctx.stroke(); }
    }
  },

  // Gouache / airbrush: shapes get light and shadow, outlines take the colour of the shape.
  paint(ctx, strokes, u) {
    for (const s of strokes) {
      trace(ctx, s);
      if (s.fill) {
        const b = bboxOf([s]);
        ctx.save();
        ctx.globalAlpha = s.fa;
        ctx.fillStyle = s.fill;
        ctx.fill();
        ctx.clip();
        if (s.fa > 0.6) {
          const r = Math.max(b.w, b.h) * 0.95;
          const g = ctx.createRadialGradient(b.x + b.w * 0.28, b.y + b.h * 0.22, r * 0.05, b.x + b.w * 0.45, b.y + b.h * 0.45, r);
          g.addColorStop(0, 'rgba(255,255,255,0.28)');
          g.addColorStop(0.35, 'rgba(255,255,255,0.05)');
          g.addColorStop(0.7, 'rgba(0,0,20,0.28)');
          g.addColorStop(1, 'rgba(0,0,20,0.6)');
          ctx.globalAlpha = 1;
          ctx.fillStyle = g;
          ctx.fillRect(b.x - 4, b.y - 4, b.w + 8, b.h + 8);
        }
        ctx.restore();
        if (s.stroke) {
          trace(ctx, s);
          ctx.strokeStyle = darken(s.fill, 0.62);
          ctx.lineWidth = s.w * 0.85;
          ctx.stroke();
        }
      } else if (s.stroke) {
        ctx.strokeStyle = s.stroke;
        ctx.lineWidth = s.w * 1.1;
        ctx.stroke();
        ctx.strokeStyle = lighten(s.stroke, 0.45);
        ctx.globalAlpha = 0.7;
        ctx.lineWidth = s.w * 0.35;
        trace(ctx, s, -s.w * 0.15, -s.w * 0.15);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  },

  // Cheap print: flat shapes, heavy black keyline, slightly shaky.
  pulp(ctx, strokes, u, rng) {
    for (const s of strokes) {
      trace(ctx, s);
      if (s.fill) { ctx.globalAlpha = Math.max(s.fa, 0.5); ctx.fillStyle = s.fill; ctx.fill(); ctx.globalAlpha = 1; }
      if (s.stroke) {
        const key = s.fill ? '#0b0b0b' : s.stroke;
        ctx.strokeStyle = key;
        for (let pass = 0; pass < 2; pass++) {
          trace(ctx, s, (rng() - 0.5) * u * 1.6, (rng() - 0.5) * u * 1.6);
          ctx.lineWidth = s.w * (pass ? 0.9 : 1.5);
          ctx.stroke();
        }
      }
    }
  },

  // Glowing tubes.
  neon(ctx, strokes, u) {
    for (const s of strokes) {
      const col = vivid(s.fill && s.fa > 0.6 ? s.fill : s.stroke || s.fill);
      trace(ctx, s);
      if (s.fill) {
        // dark body so the piece hides what is behind it, with a hint of its colour
        if (s.fa > 0.6) { ctx.globalAlpha = 0.82; ctx.fillStyle = '#0a0018'; ctx.fill(); }
        ctx.globalAlpha = 0.2 * s.fa; ctx.fillStyle = col; ctx.fill(); ctx.globalAlpha = 1;
      }
      if (s.stroke || s.fill) {
        ctx.save();
        ctx.shadowColor = col;
        ctx.shadowBlur = 9 * u;
        ctx.strokeStyle = col;
        ctx.lineWidth = Math.max(s.w, 2 * u) * 0.8;
        ctx.stroke();
        ctx.stroke();
        ctx.restore();
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = Math.max(s.w, 2 * u) * 0.28;
        ctx.stroke();
      }
    }
  },

  // Two-colour print: flat fills knocked slightly out of register, thin even outline.
  print(ctx, strokes, u) {
    for (const s of strokes) {
      if (s.fill) {
        trace(ctx, s, 2.2 * u, 1.6 * u);
        ctx.globalAlpha = s.fa;
        ctx.fillStyle = s.fill;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    for (const s of strokes) {
      if (s.stroke || s.fill) {
        trace(ctx, s);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.min(s.w, 3 * u) * 0.75;
        ctx.stroke();
      }
    }
  },
};

export function renderLayer(strokes, brush, W, H, u, seed = 1) {
  const [c, ctx] = newCanvas(W, H);
  (BRUSHES[brush] || BRUSHES.ink)(ctx, strokes, u, mulberry32(seed));
  return c;
}

// --- per-slot treatment ---------------------------------------------------

// Fade the bottom of a piece to nothing, so stacked heads melt into each other.
export function fadeBottom(src, bbox, frac) {
  const [c, ctx] = newCanvas(src.width, src.height);
  ctx.drawImage(src, 0, 0);
  const y0 = bbox.y + bbox.h * (1 - frac);
  const g = ctx.createLinearGradient(0, y0, 0, bbox.y + bbox.h + 2);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,1)');
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = g;
  ctx.fillRect(0, y0, src.width, src.height - y0);
  return c;
}

export function tint(src, color, amount) {
  const [c, ctx] = newCanvas(src.width, src.height);
  ctx.drawImage(src, 0, 0);
  ctx.globalCompositeOperation = 'source-atop';
  ctx.globalAlpha = amount;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, src.width, src.height);
  return c;
}

// Soft focus without relying on canvas blur (which some phone browsers lack): shrink and regrow.
export function soften(src, factor) {
  const w = Math.max(1, Math.round(src.width / factor)), h = Math.max(1, Math.round(src.height / factor));
  const [small, sctx] = newCanvas(w, h);
  sctx.imageSmoothingQuality = 'high';
  sctx.drawImage(src, 0, 0, w, h);
  const [c, ctx] = newCanvas(src.width, src.height);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(small, 0, 0, src.width, src.height);
  return c;
}

// Remap every pixel by brightness through a colour ramp (duotone / tritone).
export function gradientMap(ctx, W, H, stops) {
  const lut = new Uint8ClampedArray(256 * 3);
  const cs = stops.map(([t, c]) => [t, hexToRgb(c)]);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let a = cs[0], b = cs[cs.length - 1];
    for (let k = 0; k < cs.length - 1; k++) if (t >= cs[k][0] && t <= cs[k + 1][0]) { a = cs[k]; b = cs[k + 1]; break; }
    const f = b[0] === a[0] ? 0 : (t - a[0]) / (b[0] - a[0]);
    for (let j = 0; j < 3; j++) lut[i * 3 + j] = a[1][j] + (b[1][j] - a[1][j]) * f;
  }
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const l = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
    d[i] = lut[l * 3]; d[i + 1] = lut[l * 3 + 1]; d[i + 2] = lut[l * 3 + 2];
  }
  ctx.putImageData(img, 0, 0);
}

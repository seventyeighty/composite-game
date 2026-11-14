// A "finish" turns stacked drawings into a poster: background, brush, per-slot treatment,
// colour treatment, effects, title style and small print. The game will pick one by genre.
//
// Sizes below are written for a 600 x 900 poster and multiplied by k for the real pixel size.

import { drawTitle, drawText, drawParagraph, creditLines } from './type.js';

const BONE = '#EDE6D6';

function stars(ctx, { W, H, rng, k }, n, maxY = 0.8) {
  for (let i = 0; i < n; i++) {
    const r = (0.4 + rng() * 1.3) * k;
    ctx.globalAlpha = 0.25 + rng() * 0.7;
    ctx.fillStyle = rng() > 0.8 ? '#bfe0ff' : '#ffffff';
    ctx.beginPath();
    ctx.arc(rng() * W, rng() * H * maxY, r, 0, 7);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function radial(ctx, W, H, cx, cy, r, c0, c1) {
  const g = ctx.createRadialGradient(cx * W, cy * H, 0, cx * W, cy * H, r * W);
  g.addColorStop(0, c0);
  g.addColorStop(1, c1);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function linear(ctx, W, H, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0 * H, 0, y1 * H);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  ctx.fillStyle = g;
  ctx.fillRect(0, y0 * H, W, (y1 - y0) * H);
}

function credits(ctx, info, y, color, size = 13, font = 'Bebas Neue') {
  const { W, H, k } = info;
  creditLines(info).forEach((line, i) => drawText(ctx, line, W / 2, y * H + i * size * 1.3 * k, { font, size: size * k, color, spacing: 1.1 * k }));
}

function burst(ctx, cx, cy, rOuter, rInner, points, color) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? rInner : rOuter;
    const a = (i / (points * 2)) * Math.PI * 2;
    ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function bolt(ctx, rng, x0, y0, x1, y1, k, depth = 0) {
  const segs = 9;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  let px = x0, py = y0;
  for (let i = 1; i <= segs; i++) {
    const t = i / segs;
    const nx = x0 + (x1 - x0) * t + (rng() - 0.5) * 46 * k * (1 - t * 0.4);
    const ny = y0 + (y1 - y0) * t + (rng() - 0.5) * 18 * k;
    ctx.lineTo(nx, ny);
    if (depth < 1 && rng() > 0.72) {
      ctx.stroke();
      bolt(ctx, rng, nx, ny, nx + (rng() - 0.5) * 160 * k, ny + (rng() * 110 + 40) * k * Math.sign(y1 - y0 || 1), k, depth + 1);
      ctx.beginPath();
      ctx.moveTo(nx, ny);
    }
    px = nx; py = ny;
  }
  ctx.stroke();
}

// Film grain (and optional scratches) over the whole poster, without darkening the type.
const grain = (F, noise, scratch = 0, seed = 0.3) => [new F.OldFilmFilter({ sepia: 0, noise, noiseSize: 1.1, scratch, scratchDensity: scratch ? 0.25 : 0, scratchWidth: 1.2, vignetting: 0, vignettingAlpha: 0, vignettingBlur: 0, seed })];

// Darkened corners, drawn on the artwork only so titles and credits stay bright.
function vignette(ctx, W, H, strength) {
  const g = ctx.createRadialGradient(W / 2, H * 0.46, H * 0.3, W / 2, H * 0.46, H * 0.78);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

export const FINISHES = [
  // ------------------------------------------------------------------
  {
    id: 'raw',
    name: 'As drawn',
    blurb: 'The layers stacked with nothing added.',
    brush: 'ink',
    bg(ctx, { W, H }) { ctx.fillStyle = '#131B3A'; ctx.fillRect(0, 0, W, H); },
    slots: {},
    title: null,
  },

  // ------------------------------------------------------------------
  {
    id: 'painted',
    name: 'Painted epic',
    blurb: 'Airbrushed shapes, light rays, a flare. Adventure and sci-fi.',
    brush: 'paint',
    bg(ctx, info) {
      const { W, H } = info;
      linear(ctx, W, H, 0, 1, [[0, '#0a1140'], [0.6, '#0b0d2a'], [1, '#04040c']]);
      radial(ctx, W, H, 0.55, 0.27, 0.62, 'rgba(205,70,160,0.62)', 'rgba(205,70,160,0)');
      radial(ctx, W, H, 0.45, 0.66, 0.6, 'rgba(245,133,42,0.3)', 'rgba(245,133,42,0)');
      stars(ctx, info, 150);
    },
    slots: {
      backdrop: { alpha: 0.95 },
      looming: { alpha: 0.62, soft: 3, tint: ['#ff8ad6', 0.3], blend: 'screen' },
      hero: { fade: 0.3, glow: ['#F5852A', 16] },
      side: { fade: 0.3, glow: ['#6FD6E0', 12] },
      object: { glow: ['#FFD98A', 10] },
    },
    afterArt(ctx, { W, H, k }) {
      linear(ctx, W, H, 0.72, 1, [[0, 'rgba(4,4,12,0)'], [0.55, 'rgba(4,4,12,0.92)'], [1, '#04040c']]);
      // starburst flare
      const fx = W * 0.8, fy = H * 0.12;
      radial(ctx, W, H, 0.8, 0.12, 0.2, 'rgba(255,246,214,0.95)', 'rgba(255,217,138,0)');
      ctx.strokeStyle = 'rgba(255,246,214,0.9)';
      ctx.lineWidth = 1.6 * k;
      ctx.beginPath();
      ctx.moveTo(fx - 90 * k, fy); ctx.lineTo(fx + 90 * k, fy);
      ctx.moveTo(fx, fy - 90 * k); ctx.lineTo(fx, fy + 90 * k);
      ctx.stroke();
      vignette(ctx, W, H, 0.6);
    },
    pixiArt: (F) => [
      new F.GodrayFilter({ angle: 28, gain: 0.5, lacunarity: 2.7, alpha: 0.5, parallel: true, time: 1.7 }),
      new F.AdvancedBloomFilter({ threshold: 0.72, bloomScale: 0.5, brightness: 1, blur: 6, quality: 5 }),
      new F.AdjustmentFilter({ contrast: 1.12, saturation: 1.2 }),
    ],
    title: {
      box: [0.07, 0.8, 0.86, 0.105],
      font: 'Cinzel', weight: 900, upper: true,
      fill: ['#FFF9DE', '#F4CF78', '#B8742A'],
      stroke: { color: '#2a1204', width: 0.07 },
      extrude: { dx: 0.02, dy: 0.05, n: 7, color: '#4a1e06' },
      glows: [{ color: 'rgba(245,133,42,0.85)', blur: 0.4 }],
      shine: true,
    },
    furniture(ctx, info) {
      const { W, H, k } = info;
      drawText(ctx, 'THE ADVENTURE BEGINS', W / 2, H * 0.05, { font: 'Oswald', weight: 400, size: 19 * k, color: BONE, spacing: 9 * k });
      drawText(ctx, info.cast.join('   ·   ').toUpperCase(), W / 2, H * 0.785, { font: 'Oswald', weight: 700, size: 17 * k, color: '#F4CF78', spacing: 5 * k });
      if (info.tagline) drawText(ctx, info.tagline, W / 2, H * 0.935, { font: 'Playfair Display', italic: true, weight: 400, size: 16 * k, color: BONE });
      credits(ctx, info, 0.962, 'rgba(237,230,214,0.85)');
    },
    pixiFinal: (F) => grain(F, 0.14),
  },

  // ------------------------------------------------------------------
  {
    id: 'blockbuster',
    name: '80s blockbuster',
    blurb: 'Lightning, glow, a chrome title with speed lines. Action and comedy.',
    brush: 'paint',
    bg(ctx, info) {
      const { W, H, k, rng } = info;
      linear(ctx, W, H, 0, 1, [[0, '#02030c'], [0.45, '#161c5c'], [0.74, '#7a2a8c'], [0.8, '#ff9a4a'], [0.83, '#1a0c18'], [1, '#040308']]);
      radial(ctx, W, H, 0.5, 0.8, 0.75, 'rgba(255,170,90,0.55)', 'rgba(255,170,90,0)');
      stars(ctx, info, 90, 0.6);
      ctx.save();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.shadowColor = '#6fc8ff'; ctx.shadowBlur = 18 * k;
      ctx.strokeStyle = '#e6f6ff';
      const ends = [[0.02, 0.2], [0.98, 0.3], [0.05, 0.62], [0.97, 0.66], [0.3, 0.02]];
      for (const [ex, ey] of ends) {
        ctx.lineWidth = (1.6 + rng() * 1.8) * k;
        bolt(ctx, rng, W * 0.5, H * 0.45, W * ex, H * ey, k);
      }
      ctx.restore();
    },
    slots: {
      backdrop: { alpha: 0.9 },
      looming: { alpha: 0.6, soft: 2.5, blend: 'screen', tint: ['#9fd0ff', 0.25] },
      hero: { fade: 0.16, glow: ['#ff8a3d', 16] },
      side: { fade: 0.16, glow: ['#7fd8ff', 13] },
      object: { glow: ['#ffffff', 10] },
    },
    afterArt(ctx, { W, H }) {
      linear(ctx, W, H, 0.84, 1, [[0, 'rgba(4,3,8,0)'], [0.5, 'rgba(4,3,8,0.9)'], [1, '#040308']]);
      vignette(ctx, W, H, 0.55);
    },
    pixiArt: (F) => [
      new F.AdvancedBloomFilter({ threshold: 0.7, bloomScale: 0.55, brightness: 1, blur: 7, quality: 5 }),
      new F.AdjustmentFilter({ contrast: 1.1, saturation: 1.3 }),
    ],
    title: {
      box: [0.04, 0.035, 0.66, 0.15],
      font: 'Anton', weight: 400, upper: true, skew: -0.22, speed: true,
      fill: ['#fff78a', '#ffc21e', '#ff5a1a', '#b81414'],
      stroke: { color: '#ffffff', width: 0.045 },
      extrude: { dx: 0.035, dy: 0.04, n: 7, color: '#0a1a7a' },
      glows: [{ color: 'rgba(255,140,40,0.8)', blur: 0.3 }],
      shine: true,
    },
    furniture(ctx, info) {
      const { W, H, k } = info;
      info.cast.slice(0, 2).forEach((n, i) => drawText(ctx, n.toUpperCase(), W * 0.955, H * (0.07 + i * 0.045), { font: 'Bebas Neue', size: 40 * k, color: '#8fe8ff', align: 'right', spacing: 1.5 * k, shadow: { color: '#2a7cff', blur: 12 * k } }));
      if (info.tagline) drawParagraph(ctx, info.tagline, W * 0.955, H * 0.165, W * 0.34, { font: 'Playfair Display', weight: 700, size: 17 * k, color: '#ffe94d', align: 'right', lineHeight: 1.15 });
      credits(ctx, info, 0.93, 'rgba(255,255,255,0.9)', 13);
    },
    pixiFinal: (F) => grain(F, 0.1, 0, 0.5),
  },

  // ------------------------------------------------------------------
  {
    id: 'creature',
    name: 'Creature feature',
    blurb: 'Bold flat color, a huge blocky title, a script tagline. Monsters and mystery.',
    brush: 'paint',
    bg(ctx, info) {
      const { W, H, k } = info;
      ctx.fillStyle = '#12256a'; ctx.fillRect(0, 0, W, H);
      // dark red arch behind the creature
      ctx.fillStyle = '#6a1524';
      ctx.beginPath();
      ctx.moveTo(W * 0.06, H * 0.62);
      ctx.lineTo(W * 0.06, H * 0.3);
      ctx.bezierCurveTo(W * 0.06, H * 0.02, W * 0.94, H * 0.02, W * 0.94, H * 0.3);
      ctx.lineTo(W * 0.94, H * 0.62);
      ctx.closePath();
      ctx.fill();
      // beam of light
      const g = ctx.createLinearGradient(0, 0, W * 0.7, H * 0.7);
      g.addColorStop(0, 'rgba(255,236,160,0.5)');
      g.addColorStop(1, 'rgba(255,236,160,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(W * 0.34, 0); ctx.lineTo(W * 0.9, H * 0.7); ctx.lineTo(W * 0.42, H * 0.7);
      ctx.closePath();
      ctx.fill();
      linear(ctx, W, H, 0.55, 1, [[0, 'rgba(8,10,40,0)'], [0.5, 'rgba(8,10,40,0.9)'], [1, '#080a28']]);
    },
    slots: {
      backdrop: { alpha: 0.85, tint: ['#f7d36a', 0.35] },
      looming: { alpha: 1, tint: ['#8fe07a', 0.3] },
      hero: { fade: 0.12 },
      side: { fade: 0.12 },
    },
    afterArt(ctx, { W, H }) {
      linear(ctx, W, H, 0.7, 1, [[0, 'rgba(8,10,40,0)'], [0.4, 'rgba(8,10,40,0.92)'], [1, '#080a28']]);
    },
    pixiArt: (F) => [new F.AdjustmentFilter({ contrast: 1.2, saturation: 1.45, brightness: 1.03 })],
    title: {
      box: [0.05, 0.775, 0.9, 0.125],
      font: 'Alfa Slab One', weight: 400, upper: true,
      fill: ['#fff6ad', '#ffc62e', '#f0641e'],
      stroke: { color: '#160d2c', width: 0.08 },
      extrude: { dx: 0.045, dy: 0.055, n: 9, color: '#160d2c' },
    },
    furniture(ctx, info) {
      const { W, H, k } = info;
      if (info.tagline) drawParagraph(ctx, info.tagline, W * 0.74, H * 0.09, W * 0.4, { font: 'Yellowtail', size: 40 * k, color: '#fff3d0', rotate: -7, lineHeight: 1.0, outline: { color: '#160d2c', width: 5 * k } });
      drawText(ctx, info.star.toUpperCase(), W * 0.5, H * 0.745, { font: 'Anton', size: 46 * k, color: '#ffd84a', spacing: 4 * k, outline: { color: '#160d2c', width: 7 * k } });
      drawText(ctx, 'the uncanny, in', W * 0.5, H * 0.772, { font: 'Playfair Display', italic: true, weight: 700, size: 16 * k, color: '#fff3d0' });
      const withList = info.cast.filter((n) => n !== info.star).join('   ').toUpperCase();
      if (withList) drawText(ctx, 'WITH   ' + withList, W * 0.5, H * 0.93, { font: 'Oswald', weight: 700, size: 18 * k, color: '#fff3d0', spacing: 3 * k });
      drawText(ctx, `A ROOM ${info.room} PICTURE`, W * 0.5, H * 0.972, { font: 'Anton', size: 22 * k, color: '#ffd84a', spacing: 3 * k });
    },
    pixiFinal: (F) => grain(F, 0.2, 0.35, 0.7),
  },

  // ------------------------------------------------------------------
  {
    id: 'pulp',
    name: 'Pulp print',
    blurb: 'Three inks, heavy keylines, halftone dots, scratches. Horror and B-movies.',
    brush: 'pulp',
    bg(ctx, { W, H }) {
      ctx.fillStyle = '#101010'; ctx.fillRect(0, 0, W, H);
      // sunburst wedges; the colour remap turns mid-grey into red
      const cx = W * 0.5, cy = H * 0.4, R = H;
      ctx.fillStyle = '#6e6e6e';
      for (let i = 0; i < 16; i++) {
        const a0 = (i / 16) * Math.PI * 2, a1 = a0 + Math.PI / 16;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a0) * R, cy + Math.sin(a0) * R);
        ctx.lineTo(cx + Math.cos(a1) * R, cy + Math.sin(a1) * R);
        ctx.closePath();
        ctx.fill();
      }
    },
    slots: { looming: { alpha: 0.95 } },
    duotone: [[0, '#120a0a'], [0.2, '#1a0f0f'], [0.48, '#c2261f'], [0.76, '#f2e6c8'], [1, '#f8f0da']],
    afterArt(ctx, { W, H, k }) {
      // halftone dots over everything
      ctx.fillStyle = 'rgba(18,10,10,0.3)';
      const step = 7 * k;
      for (let y = 0, row = 0; y < H; y += step * 0.86, row++) {
        for (let x = row % 2 ? step / 2 : 0; x < W; x += step) {
          ctx.beginPath(); ctx.arc(x, y, step * 0.27, 0, 7); ctx.fill();
        }
      }
      // black slab for the title
      ctx.fillStyle = '#120a0a';
      ctx.beginPath();
      ctx.moveTo(W * 0.02, H * 0.79); ctx.lineTo(W * 0.98, H * 0.765); ctx.lineTo(W * 0.975, H * 0.925); ctx.lineTo(W * 0.015, H * 0.945);
      ctx.closePath(); ctx.fill();
    },
    title: {
      box: [0.06, 0.785, 0.88, 0.14],
      font: 'Creepster', weight: 400, upper: true, rotate: -1.6,
      fill: '#f2e6c8',
      extrude: { dx: 0.035, dy: 0.045, n: 2, color: '#c2261f' },
    },
    furniture(ctx, info) {
      const { W, H, k } = info;
      const bx = W * 0.2, by = H * 0.115;
      ctx.save(); ctx.translate(bx, by); ctx.rotate(-0.2);
      burst(ctx, 0, 0, 96 * k, 70 * k, 14, '#f2e6c8');
      drawText(ctx, 'SEE IT', 0, -4 * k, { font: 'Anton', size: 36 * k, color: '#c2261f' });
      drawText(ctx, 'IF YOU DARE!', 0, 26 * k, { font: 'Anton', size: 22 * k, color: '#120a0a' });
      ctx.restore();
      if (info.tagline) drawParagraph(ctx, info.tagline.toUpperCase(), W * 0.95, H * 0.07, W * 0.5, { font: 'Anton', size: 25 * k, color: '#f2e6c8', align: 'right', lineHeight: 1.15, outline: { color: '#120a0a', width: 6 * k } });
      credits(ctx, info, 0.962, '#f2e6c8');
      ctx.strokeStyle = '#f2e6c8'; ctx.lineWidth = 9 * k;
      ctx.strokeRect(9 * k, 9 * k, W - 18 * k, H - 18 * k);
    },
    pixiFinal: (F) => grain(F, 0.26, 0.7, 0.2),
  },

  // ------------------------------------------------------------------
  {
    id: 'neon',
    name: 'Neon',
    blurb: 'Glowing tubes, a striped sun, a grid floor, scanlines. 80s sci-fi.',
    brush: 'neon',
    bg(ctx, info) {
      const { W, H, k } = info;
      linear(ctx, W, H, 0, 1, [[0, '#07000f'], [0.68, '#2c0a58'], [0.8, '#3a0c5c'], [1, '#0a0018']]);
      stars(ctx, info, 80, 0.5);
      // sun
      const cx = W * 0.5, cy = H * 0.66, r = W * 0.27;
      const g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
      g.addColorStop(0, '#ffe14d'); g.addColorStop(0.55, '#ff7a3d'); g.addColorStop(1, '#ff3dcb');
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.clip();
      ctx.fillStyle = g; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      ctx.fillStyle = '#2a0a52';
      for (let i = 0; i < 6; i++) {
        const y = cy + r * (0.05 + i * 0.16);
        ctx.fillRect(cx - r, y, r * 2, (4 + i * 3.2) * k);
      }
      ctx.restore();
      // floor and grid
      const hy = H * 0.8;
      ctx.fillStyle = '#0b0020'; ctx.fillRect(0, hy, W, H - hy);
      ctx.save();
      ctx.strokeStyle = '#ff3dcb'; ctx.lineWidth = 1.8 * k;
      ctx.shadowColor = '#ff3dcb'; ctx.shadowBlur = 8 * k;
      ctx.beginPath();
      for (let i = 0; i < 7; i++) { const y = hy + (H - hy) * Math.pow(i / 6, 2.1); ctx.moveTo(0, y); ctx.lineTo(W, y); }
      for (let i = -9; i <= 9; i++) { ctx.moveTo(cx + i * 26 * k, hy); ctx.lineTo(cx + i * 150 * k, H); }
      ctx.stroke();
      ctx.restore();
    },
    slots: { looming: { alpha: 0.8 }, hero: { fade: 0.14 }, side: { fade: 0.14 } },
    pixiArt: (F) => [
      new F.AdvancedBloomFilter({ threshold: 0.5, bloomScale: 0.8, brightness: 1, blur: 8, quality: 6 }),
      new F.RGBSplitFilter({ red: { x: -3, y: 0 }, green: { x: 0, y: 0 }, blue: { x: 3, y: 0 } }),
    ],
    title: {
      box: [0.05, 0.805, 0.9, 0.125],
      font: 'Monoton', weight: 400, upper: true, lineHeight: 1.08,
      fill: ['#ffffff', '#b8f8ff'],
      glows: [{ color: '#ff3dcb', blur: 0.5 }, { color: '#35e8ff', blur: 0.22 }],
    },
    furniture(ctx, info) {
      const { W, H, k } = info;
      drawText(ctx, info.cast.join('    ').toUpperCase(), W / 2, H * 0.055, { font: 'Audiowide', size: 20 * k, color: '#8ff4ff', spacing: 6 * k, shadow: { color: '#35e8ff', blur: 12 * k } });
      if (info.tagline) drawText(ctx, info.tagline, W / 2, H * 0.09, { font: 'Yellowtail', size: 27 * k, color: '#ff8ae0', shadow: { color: '#ff3dcb', blur: 12 * k } });
      credits(ctx, info, 0.955, '#8ff4ff');
    },
    pixiFinal: (F) => [new F.CRTFilter({ curvature: 0, lineWidth: 2.2, lineContrast: 0.14, noise: 0.08, noiseSize: 1, vignetting: 0, vignettingAlpha: 0, vignettingBlur: 0, seed: 0.4 })],
  },

  // ------------------------------------------------------------------
  {
    id: 'indie',
    name: 'Indie print',
    blurb: 'Two inks on cream paper, festival laurels. Drama and romance.',
    brush: 'print',
    bg(ctx, { W, H }) { ctx.fillStyle = '#0d1430'; ctx.fillRect(0, 0, W, H); },
    slots: { looming: { alpha: 0.6 } },
    duotone: [[0, '#f3ebdd'], [0.22, '#f3ebdd'], [0.5, '#e8833a'], [0.8, '#173b45'], [1, '#102c35']],
    title: {
      box: [0.1, 0.8, 0.8, 0.09],
      font: 'Playfair Display', weight: 700, italic: true,
      fill: '#173b45',
    },
    furniture(ctx, info) {
      const { W, H, k } = info;
      const teal = '#173b45';
      // laurels
      ctx.save();
      ctx.strokeStyle = teal; ctx.lineWidth = 2 * k; ctx.lineCap = 'round';
      for (const dir of [-1, 1]) {
        const x = W / 2 + dir * 118 * k;
        ctx.beginPath();
        ctx.moveTo(x, H * 0.075);
        ctx.quadraticCurveTo(x + dir * 22 * k, H * 0.05, x + dir * 8 * k, H * 0.022);
        for (let i = 0; i < 5; i++) {
          const t = i / 4, lx = x + dir * (6 + 12 * Math.sin(t * 3)) * k, ly = H * (0.07 - t * 0.042);
          ctx.moveTo(lx, ly); ctx.lineTo(lx + dir * 11 * k, ly - 5 * k);
          ctx.moveTo(lx, ly); ctx.lineTo(lx - dir * 9 * k, ly - 7 * k);
        }
        ctx.stroke();
      }
      ctx.restore();
      drawText(ctx, 'OFFICIAL SELECTION', W / 2, H * 0.045, { font: 'Oswald', weight: 700, size: 15 * k, color: teal, spacing: 4 * k });
      drawText(ctx, `ROOM ${info.room} FILM FESTIVAL`, W / 2, H * 0.066, { font: 'Oswald', size: 11 * k, color: teal, spacing: 3 * k });
      ctx.fillStyle = teal; ctx.fillRect(W * 0.3, H * 0.905, W * 0.4, 1.5 * k);
      if (info.tagline) drawText(ctx, info.tagline, W / 2, H * 0.932, { font: 'Playfair Display', italic: true, size: 16 * k, color: teal });
      drawText(ctx, ('A FILM BY ' + info.layers.map((l) => l.artist).join(', ')).toUpperCase(), W / 2, H * 0.965, { font: 'Oswald', size: 11.5 * k, color: teal, spacing: 2.5 * k });
    },
    pixiFinal: (F) => grain(F, 0.14, 0, 0.9),
  },
];

export { drawTitle };

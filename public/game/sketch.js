// The drawing surface: brush, eraser, fill, undo and redo on a transparent layer.
// Everything drawn is kept as a list of operations, so undo is "replay all but the last".

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function strokePath(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  if (pts.length === 1) {
    ctx.lineTo(pts[0][0] + 0.01, pts[0][1] + 0.01);
  } else {
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
      ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
    }
    const last = pts[pts.length - 1];
    ctx.lineTo(last[0], last[1]);
  }
  ctx.stroke();
}

// Bucket fill. Soft edge pixels of a line count as "inside", so no pale halo is left around shapes.
function floodFill(ctx, w, h, sx, sy, color) {
  sx = Math.round(sx); sy = Math.round(sy);
  if (sx < 0 || sy < 0 || sx >= w || sy >= h) return;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const [fr, fg, fb] = hexToRgb(color);
  const s = (sy * w + sx) * 4;
  const tr = d[s], tg = d[s + 1], tb = d[s + 2], ta = d[s + 3];
  const targetClear = ta < 110;
  if (!targetClear && Math.abs(tr - fr) + Math.abs(tg - fg) + Math.abs(tb - fb) < 12) return;
  const match = (i) => {
    const a = d[i + 3];
    if (targetClear) return a < 110;
    return a >= 110 && Math.abs(d[i] - tr) + Math.abs(d[i + 1] - tg) + Math.abs(d[i + 2] - tb) < 90;
  };
  const seen = new Uint8Array(w * h);
  const stack = [sx, sy];
  while (stack.length) {
    const y = stack.pop();
    let x = stack.pop();
    let i = (y * w + x) * 4;
    while (x >= 0 && !seen[y * w + x] && match(i)) { x--; i -= 4; }
    x++; i += 4;
    let up = false, down = false;
    while (x < w && !seen[y * w + x] && match(i)) {
      seen[y * w + x] = 1;
      d[i] = fr; d[i + 1] = fg; d[i + 2] = fb; d[i + 3] = 255;
      if (y > 0) {
        const m = !seen[(y - 1) * w + x] && match(i - w * 4);
        if (m && !up) { stack.push(x, y - 1); up = true; } else if (!m) up = false;
      }
      if (y < h - 1) {
        const m = !seen[(y + 1) * w + x] && match(i + w * 4);
        if (m && !down) { stack.push(x, y + 1); down = true; } else if (!m) down = false;
      }
      x++; i += 4;
    }
  }
  ctx.putImageData(img, 0, 0);
}

export class Sketch {
  // host: an element that will hold the stacked canvases. size: {w, h} in drawing units.
  constructor(host, size) {
    this.w = size.w; this.h = size.h;
    this.ops = [];
    this.redoStack = [];
    this.tool = 'brush';
    this.color = '#1F2430';
    this.size = 10;
    this.locked = false;
    this.onChange = () => {};

    host.textContent = '';
    const make = (cls) => {
      const c = document.createElement('canvas');
      c.width = this.w; c.height = this.h;
      c.className = cls;
      host.appendChild(c);
      return c;
    };
    this.guideCanvas = make('sk-guide');
    this.layerCanvas = make('sk-layer');
    this.liveCanvas = make('sk-live');
    this.liveCanvas.setAttribute('role', 'img');
    this.liveCanvas.setAttribute('aria-label', 'Your drawing');
    this.guide = this.guideCanvas.getContext('2d');
    this.layer = this.layerCanvas.getContext('2d', { willReadFrequently: true });
    this.live = this.liveCanvas.getContext('2d');
    for (const c of [this.layer, this.live]) { c.lineCap = 'round'; c.lineJoin = 'round'; }

    this.current = null;
    const el = this.liveCanvas;
    el.addEventListener('pointerdown', (e) => this.down(e));
    el.addEventListener('pointermove', (e) => this.move(e));
    const end = (e) => this.up(e);
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  point(e) {
    const r = this.liveCanvas.getBoundingClientRect();
    return [
      Math.round(((e.clientX - r.left) * this.w / r.width) * 10) / 10,
      Math.round(((e.clientY - r.top) * this.h / r.height) * 10) / 10,
    ];
  }

  down(e) {
    if (this.locked || this.current || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    const p = this.point(e);
    if (this.tool === 'fill') {
      this.commit({ tool: 'fill', color: this.color, x: p[0], y: p[1] });
      return;
    }
    this.liveCanvas.setPointerCapture(e.pointerId);
    this.current = { tool: this.tool, color: this.color, size: this.size, pts: [p], pointerId: e.pointerId };
    this.drawLive();
  }

  move(e) {
    const c = this.current;
    if (!c || e.pointerId !== c.pointerId) return;
    e.preventDefault();
    const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const ev of events.length ? events : [e]) {
      const p = this.point(ev);
      const last = c.pts[c.pts.length - 1];
      if (Math.hypot(p[0] - last[0], p[1] - last[1]) >= 1.2) c.pts.push(p);
    }
    this.drawLive();
  }

  up(e) {
    const c = this.current;
    if (!c || e.pointerId !== c.pointerId) return;
    this.current = null;
    this.live.clearRect(0, 0, this.w, this.h);
    this.commit({ tool: c.tool, color: c.color, size: c.size, pts: c.pts });
  }

  // The stroke in progress. The eraser rubs out on the layer itself as it moves;
  // the brush is previewed on a canvas above, so nothing is committed until the finger lifts.
  drawLive() {
    const c = this.current;
    if (c.tool === 'eraser') {
      const n = c.pts.length;
      this.apply(this.layer, { tool: 'eraser', size: c.size, pts: n > 1 ? [c.pts[n - 2], c.pts[n - 1]] : c.pts });
      return;
    }
    this.live.clearRect(0, 0, this.w, this.h);
    this.apply(this.live, c);
  }

  apply(ctx, op) {
    if (op.tool === 'fill') {
      floodFill(ctx, this.w, this.h, op.x, op.y, op.color);
      return;
    }
    ctx.save();
    ctx.globalCompositeOperation = op.tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = op.tool === 'eraser' ? '#000' : op.color;
    ctx.lineWidth = op.size;
    strokePath(ctx, op.pts);
    ctx.restore();
  }

  commit(op) {
    this.ops.push(op);
    this.redoStack = [];
    if (op.tool === 'eraser') this.redraw(); else this.apply(this.layer, op);
    this.onChange();
  }

  redraw() {
    this.layer.clearRect(0, 0, this.w, this.h);
    for (const op of this.ops) this.apply(this.layer, op);
  }

  undo() {
    if (this.locked || !this.ops.length) return;
    this.redoStack.push(this.ops.pop());
    this.redraw();
    this.onChange();
  }

  redo() {
    if (this.locked || !this.redoStack.length) return;
    this.ops.push(this.redoStack.pop());
    this.redraw();
    this.onChange();
  }

  // If the timer runs out mid-stroke, keep what was drawn so far.
  finishStroke() {
    const c = this.current;
    if (!c) return;
    this.current = null;
    this.live.clearRect(0, 0, this.w, this.h);
    this.commit({ tool: c.tool, color: c.color, size: c.size, pts: c.pts });
  }

  get empty() { return this.ops.length === 0; }
  toPNG() { return this.layerCanvas.toDataURL('image/png'); }
}

// Mask helpers: flood fill, boundary tracing, mask <-> canvas.
import { makeCanvas, ctx2d } from '../lib/image.js';

/** Flood/region select. Returns Uint8Array mask (1 = selected). tol 0..100 */
export function floodMask(img, x0, y0, tol, contiguous = true) {
  const { width: w, height: h, data: d } = img;
  const mask = new Uint8Array(w * h);
  x0 = Math.floor(x0); y0 = Math.floor(y0);
  if (x0 < 0 || y0 < 0 || x0 >= w || y0 >= h) return mask;
  const t = (tol / 100) * 255;
  const s = (y0 * w + x0) * 4;
  const sr = d[s], sg = d[s + 1], sb = d[s + 2], sa = d[s + 3];
  const match = (i) => {
    const p = i * 4;
    if (sa < 16 && d[p + 3] < 16) return true;
    return Math.max(Math.abs(d[p] - sr), Math.abs(d[p + 1] - sg), Math.abs(d[p + 2] - sb), Math.abs(d[p + 3] - sa)) <= t;
  };
  if (!contiguous) {
    for (let i = 0; i < w * h; i++) if (match(i)) mask[i] = 1;
    return mask;
  }
  const stack = [x0, y0];
  while (stack.length) {
    const y = stack.pop(), x = stack.pop();
    let xl = x;
    while (xl >= 0 && !mask[y * w + xl] && match(y * w + xl)) xl--;
    xl++;
    let up = false, dn = false;
    for (let xx = xl; xx < w; xx++) {
      const i = y * w + xx;
      if (mask[i] || !match(i)) break;
      mask[i] = 1;
      if (y > 0) { const m = !mask[i - w] && match(i - w); if (m && !up) { stack.push(xx, y - 1); up = true; } else if (!m) up = false; }
      if (y < h - 1) { const m = !mask[i + w] && match(i + w); if (m && !dn) { stack.push(xx, y + 1); dn = true; } else if (!m) dn = false; }
    }
  }
  return mask;
}

export function maskToCanvas(mask, w, h) {
  const c = makeCanvas(w, h);
  const x = c.getContext('2d');
  const id = x.createImageData(w, h);
  for (let i = 0; i < mask.length; i++) if (mask[i]) { const p = i * 4; id.data[p] = id.data[p + 1] = id.data[p + 2] = id.data[p + 3] = 255; }
  x.putImageData(id, 0, 0);
  return c;
}

export function canvasToMask(c) {
  const d = ctx2d(c).getImageData(0, 0, c.width, c.height).data;
  const m = new Uint8Array(c.width * c.height);
  let any = false;
  for (let i = 0; i < m.length; i++) if (d[i * 4 + 3] > 127) { m[i] = 1; any = true; }
  return any ? m : null;
}

export function maskBounds(mask, w, h) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (mask[y * w + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/**
 * Trace boundaries of a binary mask into closed loops of grid vertices.
 * Loops are clockwise around filled regions (holes come out counter-clockwise).
 */
export function traceLoops(mask, w, h) {
  const W = w + 1;
  const out = new Uint8Array(W * (h + 1)); // bitmask of outgoing directions: 1 right, 2 down, 4 left, 8 up
  const at = (x, y) => x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!mask[y * w + x]) continue;
    if (!at(x, y - 1)) out[y * W + x] |= 1;
    if (!at(x + 1, y)) out[y * W + x + 1] |= 2;
    if (!at(x, y + 1)) out[(y + 1) * W + x + 1] |= 4;
    if (!at(x - 1, y)) out[(y + 1) * W + x] |= 8;
  }
  const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
  const loops = [];
  for (let v0 = 0; v0 < out.length; v0++) {
    while (out[v0]) {
      let dir = out[v0] & 1 ? 0 : out[v0] & 2 ? 1 : out[v0] & 4 ? 2 : 3;
      let v = v0;
      const pts = [];
      let prevDir = -1;
      let guard = 0;
      while (true) {
        out[v] &= ~(1 << dir);
        if (dir !== prevDir) pts.push([v % W, (v / W) | 0]);
        prevDir = dir;
        v = v + DX[dir] + DY[dir] * W;
        if (v === v0) break;
        // choose next direction: right turn, straight, left turn
        const r = (dir + 1) % 4, s = dir, l = (dir + 3) % 4;
        if (out[v] & (1 << r)) dir = r;
        else if (out[v] & (1 << s)) dir = s;
        else if (out[v] & (1 << l)) dir = l;
        else break;
        if (++guard > 4e6) break;
      }
      if (pts.length >= 3) loops.push(pts);
    }
  }
  return loops;
}

export function loopsToPath2D(loops) {
  const p = new Path2D();
  for (const l of loops) {
    p.moveTo(l[0][0], l[0][1]);
    for (let i = 1; i < l.length; i++) p.lineTo(l[i][0], l[i][1]);
    p.closePath();
  }
  return p;
}

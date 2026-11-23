// Raster → vector tracing: colour quantisation + boundary tracing + simplification.
import { makeCanvas, ctx2d, quantize, smoothLabels } from '../lib/image.js';
import { traceLoops } from './selection.js';

function rdp(pts, eps) {
  if (pts.length < 3) return pts;
  const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1];
  const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1;
  let md = -1, mi = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = Math.abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / L;
    if (d > md) { md = d; mi = i; }
  }
  if (md <= eps) return [pts[0], pts[pts.length - 1]];
  const a = rdp(pts.slice(0, mi + 1), eps), b = rdp(pts.slice(mi), eps);
  return a.slice(0, -1).concat(b);
}
function simplifyClosed(loop, eps) {
  if (loop.length < 5 || eps <= 0) return loop;
  // split at the point farthest from the first vertex
  let far = 0, fd = -1;
  for (let i = 1; i < loop.length; i++) { const d = (loop[i][0] - loop[0][0]) ** 2 + (loop[i][1] - loop[0][1]) ** 2; if (d > fd) { fd = d; far = i; } }
  const a = rdp(loop.slice(0, far + 1), eps);
  const b = rdp(loop.slice(far).concat([loop[0]]), eps);
  const out = a.slice(0, -1).concat(b.slice(0, -1));
  return out.length >= 3 ? out : loop;
}
const f1 = (n) => Math.round(n * 10) / 10;
function loopToD(pts, smooth) {
  const n = pts.length;
  if (!smooth || n < 4) return 'M' + pts.map((p) => `${f1(p[0])} ${f1(p[1])}`).join('L') + 'Z';
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m0 = mid(pts[n - 1], pts[0]);
  let d = `M${f1(m0[0])} ${f1(m0[1])}`;
  for (let i = 0; i < n; i++) {
    const p = pts[i], m = mid(p, pts[(i + 1) % n]);
    d += `Q${f1(p[0])} ${f1(p[1])} ${f1(m[0])} ${f1(m[1])}`;
  }
  return d + 'Z';
}

/** Merge connected components smaller than minArea into their most common neighbouring label. */
function despeckle(labels, w, h, minArea) {
  if (minArea <= 1) return labels;
  const comp = new Int32Array(w * h).fill(-1);
  const stack = [];
  let cid = 0;
  for (let i = 0; i < w * h; i++) {
    if (comp[i] !== -1) continue;
    const L = labels[i];
    const members = [];
    stack.push(i); comp[i] = cid;
    while (stack.length) {
      const j = stack.pop(); members.push(j);
      const x = j % w, y = (j / w) | 0;
      const nb = [x > 0 ? j - 1 : -1, x < w - 1 ? j + 1 : -1, y > 0 ? j - w : -1, y < h - 1 ? j + w : -1];
      for (const k of nb) if (k >= 0 && comp[k] === -1 && labels[k] === L) { comp[k] = cid; stack.push(k); }
    }
    if (members.length < minArea) {
      const counts = new Map();
      for (const j of members) {
        const x = j % w, y = (j / w) | 0;
        for (const k of [x > 0 ? j - 1 : -1, x < w - 1 ? j + 1 : -1, y > 0 ? j - w : -1, y < h - 1 ? j + w : -1]) {
          if (k >= 0 && labels[k] !== L) counts.set(labels[k], (counts.get(labels[k]) || 0) + 1);
        }
      }
      let best = L, bc = 0;
      for (const [l, c] of counts) if (c > bc) { bc = c; best = l; }
      for (const j of members) labels[j] = best;
    }
    cid++;
  }
  return labels;
}

const hex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

/**
 * Vectorise a canvas.
 * opts: colors (2..16), detail (0..1, higher = more detail), smooth (bool), removeBg (bool), despeckle (px area)
 */
export function vectorize(src, { colors = 6, detail = 0.6, smooth = true, removeBg = false, speckle = 12 } = {}) {
  const maxSide = 460;
  const k = Math.min(1, maxSide / Math.max(src.width, src.height));
  const w = Math.max(2, Math.round(src.width * k)), h = Math.max(2, Math.round(src.height * k));
  const c = makeCanvas(w, h);
  const x = ctx2d(c);
  x.imageSmoothingQuality = 'high';
  x.drawImage(src, 0, 0, w, h);
  const data = x.getImageData(0, 0, w, h).data;
  let { centers, labels } = quantize(data, colors, { alphaCut: 100, iters: 10 });
  labels = smoothLabels(labels, w, h, 1);
  labels = despeckle(labels, w, h, Math.round(speckle));
  if (removeBg) {
    const counts = new Map();
    for (let i = 0; i < w; i++) { for (const j of [i, (h - 1) * w + i]) counts.set(labels[j], (counts.get(labels[j]) || 0) + 1); }
    for (let y = 0; y < h; y++) { for (const j of [y * w, y * w + w - 1]) counts.set(labels[j], (counts.get(labels[j]) || 0) + 1); }
    let bg = null, bc = 0;
    for (const [l, cnt] of counts) if (l >= 0 && cnt > bc) { bc = cnt; bg = l; }
    if (bg !== null) for (let i = 0; i < labels.length; i++) if (labels[i] === bg) labels[i] = -1;
  }
  const eps = 0.35 + (1 - detail) * 2.6;
  const layers = [];
  for (let L = 0; L < centers.length; L++) {
    const mask = new Uint8Array(w * h);
    let area = 0;
    for (let i = 0; i < labels.length; i++) if (labels[i] === L) { mask[i] = 1; area++; }
    if (!area) continue;
    const loops = traceLoops(mask, w, h).map((l) => simplifyClosed(l, eps)).filter((l) => l.length >= 3);
    if (!loops.length) continue;
    layers.push({ color: hex(centers[L]), area, d: loops.map((l) => loopToD(l, smooth)).join('') });
  }
  layers.sort((a, b) => b.area - a.area);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${src.width}" height="${src.height}">${layers.map((l) => `<path fill="${l.color}" stroke="${l.color}" stroke-width="0.5" stroke-linejoin="round" fill-rule="evenodd" d="${l.d}"/>`).join('')}</svg>`;
  const pathCount = layers.reduce((a, l) => a + (l.d.match(/M/g) || []).length, 0);
  return { w, h, layers, svg, pathCount };
}

export function rasterizeVector(vec, W, H) {
  const c = makeCanvas(W, H);
  const x = c.getContext('2d');
  x.scale(W / vec.w, H / vec.h);
  x.lineJoin = 'round';
  for (const l of vec.layers) {
    const p = new Path2D(l.d);
    x.fillStyle = l.color; x.strokeStyle = l.color; x.lineWidth = 0.5;
    x.fill(p, 'evenodd'); x.stroke(p);
  }
  return c;
}

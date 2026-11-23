// Image loading & pixel utilities shared by the designer and editor.
const imgCache = new Map();

export function loadImage(src) {
  if (imgCache.has(src)) return imgCache.get(src);
  const p = new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith('data:') && !src.startsWith('blob:')) img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => { imgCache.delete(src); reject(new Error('Image failed to load')); };
    img.src = src;
  });
  imgCache.set(src, p);
  if (imgCache.size > 80) imgCache.delete(imgCache.keys().next().value);
  return p;
}

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}
export const ctx2d = (c, opts) => c.getContext('2d', { willReadFrequently: true, ...opts });

export function cloneCanvas(src) {
  const c = makeCanvas(src.width, src.height);
  c.getContext('2d').drawImage(src, 0, 0);
  return c;
}

/** Draw a (possibly large) image into a canvas no bigger than max px on its long side. */
export function imageToCanvas(img, max = 2048) {
  const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
  const s = Math.min(1, max / Math.max(w, h));
  const c = makeCanvas(w * s, h * s);
  const x = c.getContext('2d');
  x.imageSmoothingQuality = 'high';
  x.drawImage(img, 0, 0, c.width, c.height);
  return c;
}

export function canvasToDataURL(c) {
  return c.toDataURL('image/png');
}

async function blobToDataURL(blob, max) {
  let bmp;
  try { bmp = await createImageBitmap(blob); }
  catch {
    const url = URL.createObjectURL(blob);
    try { bmp = await loadImage(url); } finally { setTimeout(() => URL.revokeObjectURL(url), 2000); }
  }
  const c = imageToCanvas(bmp, max);
  return trimTransparent(c).toDataURL('image/png');
}

export async function fileToDataURL(file, max = 1600) {
  if (file.type === 'image/svg+xml') {
    const text = await file.text();
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(text);
    const img = await loadImage(url);
    const w = img.naturalWidth || 800, h = img.naturalHeight || 800;
    const s = max / Math.max(w, h);
    const c = makeCanvas(w * s, h * s);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/png');
  }
  return blobToDataURL(file, max);
}

/** Fetch a remote image (CORS required) and return a local PNG data URL. */
export async function urlToDataURL(url, max = 1600) {
  const res = await fetch(url, { mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  if (!blob.type.startsWith('image/')) throw new Error('Not an image');
  return blobToDataURL(blob, max);
}

/** Crop away fully transparent borders. */
export function trimTransparent(c) {
  const x = ctx2d(c);
  const { width: w, height: h } = c;
  const d = x.getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) {
    if (d[(y * w + xx) * 4 + 3] > 8) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < 0 || (x0 === 0 && y0 === 0 && x1 === w - 1 && y1 === h - 1)) return c;
  const out = makeCanvas(x1 - x0 + 1, y1 - y0 + 1);
  out.getContext('2d').drawImage(c, -x0, -y0);
  return out;
}

/**
 * K-means colour quantisation on RGBA data (transparent pixels ignored).
 * Returns { centers: [[r,g,b]], labels: Int16Array } (label -1 = transparent).
 */
export function quantize(data, k, { alphaCut = 128, iters = 8, sample = 7000 } = {}) {
  const n = data.length / 4;
  const idx = [];
  for (let i = 0; i < n; i++) if (data[i * 4 + 3] >= alphaCut) idx.push(i);
  const labels = new Int16Array(n).fill(-1);
  if (!idx.length) return { centers: [], labels };
  const step = Math.max(1, Math.floor(idx.length / sample));
  const pts = [];
  for (let i = 0; i < idx.length; i += step) { const o = idx[i] * 4; pts.push([data[o], data[o + 1], data[o + 2]]); }
  k = Math.max(1, Math.min(k, pts.length));
  // k-means++ style init (deterministic: farthest point)
  const centers = [pts[Math.floor(pts.length / 2)].slice()];
  const dist = new Float64Array(pts.length).fill(Infinity);
  while (centers.length < k) {
    const c = centers[centers.length - 1];
    let bi = 0, bd = -1;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const dd = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2;
      if (dd < dist[i]) dist[i] = dd;
      if (dist[i] > bd) { bd = dist[i]; bi = i; }
    }
    if (bd <= 0) break;
    centers.push(pts[bi].slice());
  }
  const K = centers.length;
  const asg = new Int16Array(pts.length);
  for (let it = 0; it < iters; it++) {
    const sum = Array.from({ length: K }, () => [0, 0, 0, 0]);
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i]; let bi = 0, bd = Infinity;
      for (let j = 0; j < K; j++) { const c = centers[j]; const dd = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2; if (dd < bd) { bd = dd; bi = j; } }
      asg[i] = bi; const s = sum[bi]; s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; s[3]++;
    }
    for (let j = 0; j < K; j++) if (sum[j][3]) centers[j] = [sum[j][0] / sum[j][3], sum[j][1] / sum[j][3], sum[j][2] / sum[j][3]];
  }
  const cache = new Map();
  for (const i of idx) {
    const o = i * 4;
    const key = ((data[o] >> 2) << 12) | ((data[o + 1] >> 2) << 6) | (data[o + 2] >> 2);
    let l = cache.get(key);
    if (l === undefined) {
      let bd = Infinity; l = 0;
      for (let j = 0; j < K; j++) { const c = centers[j]; const dd = (data[o] - c[0]) ** 2 + (data[o + 1] - c[1]) ** 2 + (data[o + 2] - c[2]) ** 2; if (dd < bd) { bd = dd; l = j; } }
      cache.set(key, l);
    }
    labels[i] = l;
  }
  return { centers: centers.map((c) => c.map(Math.round)), labels };
}

/** Majority filter to remove speckles in a label map. */
export function smoothLabels(labels, w, h, passes = 1) {
  let src = labels;
  for (let p = 0; p < passes; p++) {
    const out = new Int16Array(src);
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const counts = new Map();
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const l = src[i + dy * w + dx]; counts.set(l, (counts.get(l) || 0) + 1);
      }
      let best = src[i], bc = 0;
      for (const [l, c] of counts) if (c > bc) { bc = c; best = l; }
      if (bc >= 5) out[i] = best;
    }
    src = out;
  }
  return src;
}

export function hashString(s) {
  let h = 2166136261;
  const step = Math.max(1, Math.floor(s.length / 4000));
  for (let i = 0; i < s.length; i += step) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36) + s.length.toString(36);
}

export function downloadDataURL(url, filename) {
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
}
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  downloadDataURL(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

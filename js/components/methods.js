// Application methods: how artwork is attached to the garment, and the
// raster + SVG treatments that make each one look different.
import { loadImage, makeCanvas, ctx2d, quantize, smoothLabels } from '../lib/image.js';
import { hexToRgb } from '../lib/color.js';

export const METHODS = [
  { id: 'thin', label: 'Thin stitch', short: 'Thin', desc: 'Fine flat embroidery with delicate thread lines.', best: 'Small logos, script, fine line art', defaults: { colors: 8 } },
  { id: 'thick', label: 'Thick stitch', short: 'Thick', desc: 'Raised, dense satin embroidery that catches the light.', best: 'Bold logos, chest marks, varsity letters', defaults: { colors: 6 } },
  { id: 'print', label: 'Print-on', short: 'Print', desc: 'Screen / DTG print that sits flat on the fabric.', best: 'Photos, gradients, large graphics', defaults: {} },
  { id: 'patch', label: 'Patch', short: 'Patch', desc: 'Separate badge sewn on with a merrowed border.', best: 'Badges, emblems, sleeve & cap patches', defaults: { shape: 'rounded', patchBg: '#f4f1ea', border: '#1d1d1f' } },
  { id: 'integrated', label: 'Integrated stitch', short: 'Woven', desc: 'Knitted or woven into the fabric itself — flush, never raised.', best: 'Knit motifs, jacquard patterns, all-overs', defaults: { colors: 5 } },
];
export const methodById = (id) => METHODS.find((m) => m.id === id) || METHODS[2];

export const PATCH_SHAPES = [
  { id: 'rounded', label: 'Rounded' },
  { id: 'rect', label: 'Square' },
  { id: 'circle', label: 'Circle' },
  { id: 'oval', label: 'Oval' },
  { id: 'shield', label: 'Shield' },
  { id: 'contour', label: 'Die-cut' },
];

/** Small icon illustrating a method (for pickers). */
export function methodIcon(id, size = 40) {
  const s = size;
  const common = `width="${s}" height="${s}" viewBox="0 0 40 40" aria-hidden="true" focusable="false"`;
  switch (id) {
    case 'thin': return `<svg ${common}><rect x="2" y="2" width="36" height="36" rx="8" fill="var(--surface-2)"/><path d="M10 28 L20 10 L30 28" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="2.4 1.6"/><path d="M14 22h12" stroke="currentColor" stroke-width="1.4" stroke-dasharray="2.4 1.6"/></svg>`;
    case 'thick': return `<svg ${common}><rect x="2" y="2" width="36" height="36" rx="8" fill="var(--surface-2)"/><path d="M10 29 L20 9 L30 29" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/><path d="M10 29 L20 9 L30 29" fill="none" stroke="var(--surface)" stroke-width="1" stroke-dasharray="1 2" opacity=".7"/></svg>`;
    case 'print': return `<svg ${common}><rect x="2" y="2" width="36" height="36" rx="8" fill="var(--surface-2)"/><rect x="9" y="11" width="22" height="18" rx="2" fill="currentColor" opacity=".85"/><circle cx="16" cy="18" r="3" fill="var(--surface)"/><path d="M11 27l7-6 4 3 4-4 3 3v4H11z" fill="var(--surface)" opacity=".8"/></svg>`;
    case 'patch': return `<svg ${common}><rect x="2" y="2" width="36" height="36" rx="8" fill="var(--surface-2)"/><rect x="8" y="9" width="24" height="22" rx="6" fill="var(--surface)" stroke="currentColor" stroke-width="3"/><rect x="8" y="9" width="24" height="22" rx="6" fill="none" stroke="var(--surface)" stroke-width="1" stroke-dasharray="1.2 1.6"/><path d="M14 24l6-9 6 9z" fill="currentColor"/></svg>`;
    case 'integrated': return `<svg ${common}><rect x="2" y="2" width="36" height="36" rx="8" fill="var(--surface-2)"/>${[0, 1, 2, 3, 4].map((r) => [0, 1, 2, 3, 4].map((c) => `<path d="M${9 + c * 5} ${9 + r * 5} l2.5 4 l2.5 -4" fill="none" stroke="currentColor" stroke-width="1.6" opacity="${(r + c) % 3 === 0 || (r === 2 && c > 0 && c < 4) ? 1 : 0.28}"/>`).join('')).join('')}</svg>`;
  }
  return '';
}

// ─────────────────────────────────────────────────────────────────
// SVG filters (shadows / bevel) keyed per method
// ─────────────────────────────────────────────────────────────────
export function methodFilterDefs(uid) {
  return `
  <filter id="f-thin-${uid}" x="-10%" y="-10%" width="120%" height="125%">
    <feDropShadow dx="0" dy="0.5" stdDeviation="0.45" flood-color="#000" flood-opacity="0.45"/>
  </filter>
  <filter id="f-thick-${uid}" x="-15%" y="-15%" width="130%" height="135%" color-interpolation-filters="sRGB">
    <feGaussianBlur in="SourceAlpha" stdDeviation="1.1" result="b"/>
    <feSpecularLighting in="b" surfaceScale="2.4" specularConstant="0.75" specularExponent="16" lighting-color="#ffffff" result="spec">
      <feDistantLight azimuth="225" elevation="48"/>
    </feSpecularLighting>
    <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn"/>
    <feComposite in="SourceGraphic" in2="specIn" operator="arithmetic" k1="0" k2="1" k3="0.55" k4="0" result="lit"/>
    <feDropShadow in="lit" dx="0.4" dy="1.4" stdDeviation="1.1" flood-color="#000" flood-opacity="0.5"/>
  </filter>
  <filter id="f-patch-${uid}" x="-15%" y="-15%" width="130%" height="135%" color-interpolation-filters="sRGB">
    <feGaussianBlur in="SourceAlpha" stdDeviation="1.6" result="b"/>
    <feSpecularLighting in="b" surfaceScale="1.4" specularConstant="0.5" specularExponent="12" lighting-color="#ffffff" result="spec">
      <feDistantLight azimuth="225" elevation="55"/>
    </feSpecularLighting>
    <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn"/>
    <feComposite in="SourceGraphic" in2="specIn" operator="arithmetic" k1="0" k2="1" k3="0.35" k4="0" result="lit"/>
    <feDropShadow in="lit" dx="0.6" dy="1.8" stdDeviation="1.6" flood-color="#000" flood-opacity="0.42"/>
  </filter>
  <filter id="f-integrated-${uid}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="4" result="n"/>
    <feColorMatrix in="n" type="saturate" values="0" result="g"/>
    <feComposite in="g" in2="SourceAlpha" operator="in" result="gi"/>
    <feBlend in="SourceGraphic" in2="gi" mode="multiply" result="m"/>
    <feComposite in="m" in2="SourceGraphic" operator="arithmetic" k1="0" k2="0.25" k3="0.75" k4="0"/>
  </filter>
  <filter id="f-print-${uid}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" seed="7" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .5 -.18" result="w"/>
    <feComposite in="w" in2="SourceAlpha" operator="in" result="wi"/>
    <feComposite in="SourceGraphic" in2="wi" operator="over"/>
  </filter>`;
}

// ─────────────────────────────────────────────────────────────────
// Raster treatments
// ─────────────────────────────────────────────────────────────────
const PX = 3.2; // render pixels per garment unit

function sizeFor(wu, hu) {
  const long = Math.max(wu, hu);
  const s = Math.max(Math.min(PX, 1100 / long), 90 / long);
  return { W: Math.max(8, Math.round(wu * s)), H: Math.max(8, Math.round(hu * s)), s };
}

function drawContain(ctx, img, x, y, w, h) {
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const k = Math.min(w / iw, h / ih);
  const dw = iw * k, dh = ih * k;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

const ANGLES = [45, -45, 0, 90, 22, -68, 60, -30, 10, -80, 35, -55].map((a) => (a * Math.PI) / 180);

function stitchFill(img, W, H, s, { colors = 8, thick = false }) {
  const c = makeCanvas(W, H);
  const x = ctx2d(c);
  x.drawImage(img, 0, 0, W, H);
  const src = x.getImageData(0, 0, W, H);
  const d = src.data;
  let { centers, labels } = quantize(d, colors, { alphaCut: 110 });
  labels = smoothLabels(labels, W, H, 1);
  const out = x.createImageData(W, H);
  const o = out.data;
  const period = (thick ? 1.6 : 0.8) * s;
  const stitchLen = (thick ? 8 : 4.6) * s;
  const edgeR = thick ? 2 : 1;
  for (let yy = 0; yy < H; yy++) {
    for (let xx = 0; xx < W; xx++) {
      const i = yy * W + xx;
      const L = labels[i];
      if (L < 0) continue;
      const a = ANGLES[L % ANGLES.length];
      const ca = Math.cos(a), sa = Math.sin(a);
      const v = (-xx * sa + yy * ca) / period;
      const row = Math.floor(v), fr = v - row;
      const arc = Math.sin(Math.PI * fr);
      let shade = thick ? 0.6 + 0.55 * arc : 0.8 + 0.3 * arc;
      const u = (xx * ca + yy * sa + row * stitchLen * 0.41) / stitchLen;
      const fu = u - Math.floor(u);
      if (fu < (thick ? 0.04 : 0.07)) shade *= 0.78;
      let hi = thick ? 70 * Math.pow(arc, 10) : 26 * Math.pow(arc, 12);
      // edge detection
      let edge = false;
      for (let k = 1; k <= edgeR && !edge; k++) {
        if (xx - k < 0 || xx + k >= W || yy - k < 0 || yy + k >= H) { edge = true; break; }
        if (labels[i - k] !== L || labels[i + k] !== L || labels[i - k * W] !== L || labels[i + k * W] !== L) edge = true;
      }
      const cc = centers[L];
      let r = cc[0] * shade + hi, g = cc[1] * shade + hi, b = cc[2] * shade + hi;
      if (edge) { r *= 0.55; g *= 0.55; b *= 0.55; hi = 0; }
      const p = i * 4;
      o[p] = r; o[p + 1] = g; o[p + 2] = b; o[p + 3] = 255;
    }
  }
  x.putImageData(out, 0, 0);
  return c;
}

function integrated(img, W, H, s, { colors = 5 }) {
  const cell = Math.max(4, 3.2 * s);
  const gw = Math.max(2, Math.round(W / cell)), gh = Math.max(2, Math.round(H / (cell * 0.82)));
  const small = makeCanvas(gw, gh);
  const sx = ctx2d(small);
  sx.imageSmoothingQuality = 'high';
  sx.drawImage(img, 0, 0, gw, gh);
  const d = sx.getImageData(0, 0, gw, gh).data;
  const { centers, labels } = quantize(d, colors, { alphaCut: 120 });
  const c = makeCanvas(W, H);
  const x = c.getContext('2d');
  const cw = W / gw, ch = H / gh;
  for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) {
    const L = labels[gy * gw + gx];
    if (L < 0) continue;
    const [r, g, b] = centers[L];
    const cx = gx * cw + cw / 2, cy = gy * ch + ch / 2;
    for (const side of [-1, 1]) {
      const grd = x.createLinearGradient(cx, cy - ch * 0.6, cx, cy + ch * 0.6);
      grd.addColorStop(0, `rgb(${r * 1.12},${g * 1.12},${b * 1.12})`);
      grd.addColorStop(1, `rgb(${r * 0.72},${g * 0.72},${b * 0.72})`);
      x.fillStyle = grd;
      x.beginPath();
      x.ellipse(cx + side * cw * 0.22, cy, cw * 0.26, ch * 0.62, side * -0.45, 0, Math.PI * 2);
      x.fill();
    }
  }
  return c;
}

function printTreatment(img, W, H) {
  const c = makeCanvas(W, H);
  const x = ctx2d(c);
  x.drawImage(img, 0, 0, W, H);
  const id = x.getImageData(0, 0, W, H);
  const d = id.data;
  let seed = 1234567;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    const n = (rnd() - 0.5) * 14;
    const gray = (d[i] + d[i + 1] + d[i + 2]) / 3;
    d[i] = d[i] * 0.94 + gray * 0.06 + n;
    d[i + 1] = d[i + 1] * 0.94 + gray * 0.06 + n;
    d[i + 2] = d[i + 2] * 0.94 + gray * 0.06 + n;
    d[i + 3] = d[i + 3] * 0.97;
  }
  x.putImageData(id, 0, 0);
  return c;
}

function shapePath(x, shape, X, Y, W, H) {
  x.beginPath();
  const r = Math.min(W, H);
  switch (shape) {
    case 'rect': x.rect(X, Y, W, H); break;
    case 'circle': x.ellipse(X + W / 2, Y + H / 2, r / 2, r / 2, 0, 0, Math.PI * 2); break;
    case 'oval': x.ellipse(X + W / 2, Y + H / 2, W / 2, H / 2, 0, 0, Math.PI * 2); break;
    case 'shield':
      x.moveTo(X, Y + H * 0.08);
      x.quadraticCurveTo(X + W / 2, Y - H * 0.04, X + W, Y + H * 0.08);
      x.lineTo(X + W, Y + H * 0.5);
      x.quadraticCurveTo(X + W, Y + H * 0.85, X + W / 2, Y + H);
      x.quadraticCurveTo(X, Y + H * 0.85, X, Y + H * 0.5);
      x.closePath(); break;
    default: x.roundRect ? x.roundRect(X, Y, W, H, r * 0.18) : x.rect(X, Y, W, H);
  }
}

function twill(x, W, H, color) {
  x.save();
  x.globalAlpha = 0.08;
  x.strokeStyle = color;
  x.lineWidth = 1;
  for (let i = -H; i < W; i += 3) { x.beginPath(); x.moveTo(i, H); x.lineTo(i + H, 0); x.stroke(); }
  x.restore();
}

function patch(img, W, H, s, { shape = 'rounded', patchBg = '#f4f1ea', border = '#1d1d1f' }) {
  const c = makeCanvas(W, H);
  const x = c.getContext('2d');
  const bw = Math.max(2.4 * s, Math.min(W, H) * 0.055);
  if (shape === 'contour') {
    // Silhouette dilation for a die-cut look
    const pad = bw * 2.2;
    const inner = makeCanvas(W, H);
    drawContain(inner.getContext('2d'), img, pad, pad, W - pad * 2, H - pad * 2);
    const sil = (color, radius) => {
      const m = makeCanvas(W, H);
      const mx = m.getContext('2d');
      const steps = 24;
      for (let k = 0; k < steps; k++) {
        const a = (k / steps) * Math.PI * 2;
        mx.drawImage(inner, Math.cos(a) * radius, Math.sin(a) * radius);
      }
      mx.drawImage(inner, 0, 0);
      mx.globalCompositeOperation = 'source-in';
      mx.fillStyle = color; mx.fillRect(0, 0, W, H);
      return m;
    };
    x.drawImage(sil(border, pad), 0, 0);
    const base = sil(patchBg, pad - bw);
    x.drawImage(base, 0, 0);
    // merrow texture on border ring
    x.save(); x.globalCompositeOperation = 'source-atop'; x.globalAlpha = 0.25; x.strokeStyle = '#fff'; x.lineWidth = Math.max(1, s * 0.5);
    for (let i = -H; i < W; i += Math.max(2, s * 1.2)) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + H * 0.4, H); x.stroke(); }
    x.restore();
    x.drawImage(base, 0, 0);
    x.save(); x.globalCompositeOperation = 'source-atop'; twill(x, W, H, '#000'); x.restore();
    x.drawImage(inner, 0, 0);
    return c;
  }
  const inset = bw / 2 + 1;
  // base fabric
  shapePath(x, shape, inset, inset, W - inset * 2, H - inset * 2);
  x.fillStyle = patchBg; x.fill();
  x.save(); x.clip(); twill(x, W, H, '#000');
  const pad = bw + Math.min(W, H) * 0.07;
  drawContain(x, img, pad, pad, W - pad * 2, H - pad * 2);
  x.restore();
  // merrowed border
  shapePath(x, shape, inset, inset, W - inset * 2, H - inset * 2);
  x.lineWidth = bw; x.strokeStyle = border; x.stroke();
  const [br, bg, bb] = hexToRgb(border);
  const lum = (br * 0.3 + bg * 0.59 + bb * 0.11);
  x.setLineDash([Math.max(1, s * 0.55), Math.max(1, s * 0.75)]);
  x.lineWidth = bw * 0.92; x.strokeStyle = lum < 128 ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.22)'; x.stroke();
  x.setLineDash([]);
  shapePath(x, shape, inset + bw / 2, inset + bw / 2, W - inset * 2 - bw, H - inset * 2 - bw);
  x.lineWidth = Math.max(1, s * 0.35); x.strokeStyle = 'rgba(0,0,0,0.25)'; x.stroke();
  return c;
}

const effectCache = new Map();

/** Render artwork with a method treatment. Returns a PNG data URL sized to the element. */
export async function renderMethod(src, method, opts) {
  const { w, h } = opts;
  const { W, H, s } = sizeFor(w, h);
  const key = [src.length, src.slice(-64), method, W, H, opts.shape, opts.patchBg, opts.border, opts.colors].join('|');
  if (effectCache.has(key)) return effectCache.get(key);
  const img = await loadImage(src);
  let c;
  const m = methodById(method);
  const o = { ...m.defaults, ...opts };
  if (method === 'thin') c = stitchFill(img, W, H, s, { colors: o.colors, thick: false });
  else if (method === 'thick') c = stitchFill(img, W, H, s, { colors: o.colors, thick: true });
  else if (method === 'integrated') c = integrated(img, W, H, s, { colors: o.colors });
  else if (method === 'patch') c = patch(img, W, H, s, o);
  else c = printTreatment(img, W, H);
  const url = c.toDataURL('image/png');
  effectCache.set(key, url);
  if (effectCache.size > 120) effectCache.delete(effectCache.keys().next().value);
  return url;
}

/** A demo artwork used to preview methods. */
export function demoArtwork(size = 160) {
  const c = makeCanvas(size, size);
  const x = c.getContext('2d');
  const s = size / 160;
  x.fillStyle = '#e0603c';
  x.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 34 * s : 72 * s;
    x.lineTo(80 * s + Math.cos(a) * r, 84 * s + Math.sin(a) * r);
  }
  x.closePath(); x.fill();
  x.fillStyle = '#2b4c7e';
  x.beginPath(); x.arc(80 * s, 88 * s, 20 * s, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#f2d16b';
  x.beginPath(); x.arc(80 * s, 88 * s, 9 * s, 0, Math.PI * 2); x.fill();
  return c.toDataURL('image/png');
}

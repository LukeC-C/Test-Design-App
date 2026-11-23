// Preset image filters operating on ImageData. Each returns a new ImageData.
const clamp8 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);

function mapPixels(src, fn) {
  const out = new ImageData(src.width, src.height);
  const s = src.data, o = out.data;
  for (let i = 0; i < s.length; i += 4) {
    const [r, g, b] = fn(s[i], s[i + 1], s[i + 2], i);
    o[i] = clamp8(r); o[i + 1] = clamp8(g); o[i + 2] = clamp8(b); o[i + 3] = s[i + 3];
  }
  return out;
}
const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const contrast = (v, c) => (v - 128) * c + 128;
function saturate(r, g, b, s) { const l = lum(r, g, b); return [l + (r - l) * s, l + (g - l) * s, l + (b - l) * s]; }

function boxBlur(src, radius) {
  const { width: w, height: h } = src;
  let a = new Float32Array(src.data), b = new Float32Array(a.length);
  const r = Math.max(1, Math.round(radius));
  for (let pass = 0; pass < 3; pass++) {
    // horizontal
    for (let y = 0; y < h; y++) {
      for (let c = 0; c < 4; c++) {
        let acc = 0; const row = y * w;
        for (let x = -r; x <= r; x++) acc += a[(row + Math.min(w - 1, Math.max(0, x))) * 4 + c];
        for (let x = 0; x < w; x++) {
          b[(row + x) * 4 + c] = acc / (2 * r + 1);
          const xa = Math.min(w - 1, x + r + 1), xs = Math.max(0, x - r);
          acc += a[(row + xa) * 4 + c] - a[(row + xs) * 4 + c];
        }
      }
    }
    // vertical
    for (let x = 0; x < w; x++) {
      for (let c = 0; c < 4; c++) {
        let acc = 0;
        for (let y = -r; y <= r; y++) acc += b[(Math.min(h - 1, Math.max(0, y)) * w + x) * 4 + c];
        for (let y = 0; y < h; y++) {
          a[(y * w + x) * 4 + c] = acc / (2 * r + 1);
          const ya = Math.min(h - 1, y + r + 1), ys = Math.max(0, y - r);
          acc += b[(ya * w + x) * 4 + c] - b[(ys * w + x) * 4 + c];
        }
      }
    }
  }
  const out = new ImageData(w, h);
  for (let i = 0; i < a.length; i++) out.data[i] = a[i];
  return out;
}

function convolve(src, k, divisor = 1, offset = 0, keepAlpha = true) {
  const { width: w, height: h } = src;
  const s = src.data;
  const out = new ImageData(w, h);
  const o = out.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let r = 0, g = 0, b = 0;
    for (let ky = -1; ky <= 1; ky++) for (let kx = -1; kx <= 1; kx++) {
      const xx = Math.min(w - 1, Math.max(0, x + kx)), yy = Math.min(h - 1, Math.max(0, y + ky));
      const p = (yy * w + xx) * 4, kv = k[(ky + 1) * 3 + kx + 1];
      r += s[p] * kv; g += s[p + 1] * kv; b += s[p + 2] * kv;
    }
    const i = (y * w + x) * 4;
    o[i] = clamp8(r / divisor + offset); o[i + 1] = clamp8(g / divisor + offset); o[i + 2] = clamp8(b / divisor + offset);
    o[i + 3] = keepAlpha ? s[i + 3] : 255;
  }
  return out;
}

function duotone(c1, c2) {
  return (src) => mapPixels(src, (r, g, b) => {
    const t = lum(r, g, b) / 255;
    return [c1[0] + (c2[0] - c1[0]) * t, c1[1] + (c2[1] - c1[1]) * t, c1[2] + (c2[2] - c1[2]) * t];
  });
}

function vignette(src, amt) {
  const { width: w, height: h } = src;
  const out = new ImageData(new Uint8ClampedArray(src.data), w, h);
  const o = out.data, cx = w / 2, cy = h / 2, md = Math.hypot(cx, cy);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const f = 1 - amt * Math.pow(Math.hypot(x - cx, y - cy) / md, 2.2);
    const i = (y * w + x) * 4; o[i] *= f; o[i + 1] *= f; o[i + 2] *= f;
  }
  return out;
}

export const PRESETS = [
  { id: 'grayscale', label: 'Mono', fn: (s) => mapPixels(s, (r, g, b) => { const l = lum(r, g, b); return [l, l, l]; }) },
  { id: 'sepia', label: 'Sepia', fn: (s) => mapPixels(s, (r, g, b) => [r * 0.393 + g * 0.769 + b * 0.189, r * 0.349 + g * 0.686 + b * 0.168, r * 0.272 + g * 0.534 + b * 0.131]) },
  { id: 'vintage', label: 'Vintage', fn: (s) => vignette(mapPixels(s, (r, g, b) => { [r, g, b] = saturate(r, g, b, 0.7); return [contrast(r, 0.86) + 22, contrast(g, 0.86) + 10, contrast(b, 0.86) - 8]; }), 0.45) },
  { id: 'noir', label: 'Noir', fn: (s) => mapPixels(s, (r, g, b) => { const l = contrast(lum(r, g, b), 1.5); return [l, l, l]; }) },
  { id: 'vivid', label: 'Vivid', fn: (s) => mapPixels(s, (r, g, b) => saturate(contrast(r, 1.1), contrast(g, 1.1), contrast(b, 1.1), 1.55)) },
  { id: 'warm', label: 'Warm', fn: (s) => mapPixels(s, (r, g, b) => [r * 1.08 + 12, g * 1.02 + 4, b * 0.88]) },
  { id: 'cool', label: 'Cool', fn: (s) => mapPixels(s, (r, g, b) => [r * 0.9, g * 1.0 + 4, b * 1.1 + 14]) },
  { id: 'fade', label: 'Fade', fn: (s) => mapPixels(s, (r, g, b) => [contrast(r, 0.75) + 18, contrast(g, 0.75) + 18, contrast(b, 0.75) + 22]) },
  { id: 'matte', label: 'Matte', fn: (s) => mapPixels(s, (r, g, b) => { [r, g, b] = saturate(r, g, b, 0.85); return [r * 0.86 + 30, g * 0.86 + 28, b * 0.86 + 26]; }) },
  { id: 'contrast', label: 'Punch', fn: (s) => mapPixels(s, (r, g, b) => [contrast(r, 1.45), contrast(g, 1.45), contrast(b, 1.45)]) },
  { id: 'invert', label: 'Invert', fn: (s) => mapPixels(s, (r, g, b) => [255 - r, 255 - g, 255 - b]) },
  { id: 'posterize', label: 'Poster', fn: (s) => mapPixels(s, (r, g, b) => [r, g, b].map((v) => Math.round(v / 85) * 85)) },
  { id: 'threshold', label: 'Stencil', fn: (s) => mapPixels(s, (r, g, b) => { const v = lum(r, g, b) > 128 ? 255 : 0; return [v, v, v]; }) },
  { id: 'duoBlue', label: 'Duo Navy', fn: duotone([22, 34, 74], [255, 196, 160]) },
  { id: 'duoPink', label: 'Duo Pop', fn: duotone([82, 18, 92], [120, 240, 214]) },
  { id: 'blur', label: 'Soften', fn: (s) => boxBlur(s, Math.max(1, Math.min(s.width, s.height) / 220)) },
  { id: 'sharpen', label: 'Sharpen', fn: (s) => convolve(s, [0, -1, 0, -1, 5, -1, 0, -1, 0]) },
  { id: 'emboss', label: 'Emboss', fn: (s) => convolve(s, [-2, -1, 0, -1, 1, 1, 0, 1, 2], 1, 0) },
  { id: 'sketch', label: 'Sketch', fn: (s) => { const e = convolve(s, [-1, -1, -1, -1, 8, -1, -1, -1, -1], 1, 0); return mapPixels(e, (r, g, b) => { const v = 255 - Math.min(255, lum(r, g, b) * 2.2); return [v, v, v]; }); } },
  { id: 'pixelate', label: 'Pixel', fn: (s) => {
    const { width: w, height: h } = s; const bs = Math.max(2, Math.round(Math.max(w, h) / 48));
    const out = new ImageData(w, h); const d = s.data, o = out.data;
    for (let by = 0; by < h; by += bs) for (let bx = 0; bx < w; bx += bs) {
      const cx = Math.min(w - 1, bx + (bs >> 1)), cy = Math.min(h - 1, by + (bs >> 1)); const ci = (cy * w + cx) * 4;
      for (let y = by; y < Math.min(h, by + bs); y++) for (let x = bx; x < Math.min(w, bx + bs); x++) { const i = (y * w + x) * 4; o[i] = d[ci]; o[i + 1] = d[ci + 1]; o[i + 2] = d[ci + 2]; o[i + 3] = d[ci + 3]; }
    }
    return out;
  } },
];

/** Apply a preset with an intensity (0..1) blend toward the original. */
export function applyPreset(src, id, intensity = 1) {
  const p = PRESETS.find((x) => x.id === id);
  if (!p) return src;
  const f = p.fn(src);
  if (intensity >= 0.999) return f;
  const out = new ImageData(src.width, src.height);
  const a = src.data, b = f.data, o = out.data, t = intensity;
  for (let i = 0; i < a.length; i++) o[i] = a[i] + (b[i] - a[i]) * t;
  return out;
}

// Drop-in garment artwork.
//
// Custom SVG drawings listed in assets/garments/manifest.json replace the generated
// drawings for specific garment types (and optionally specific cuts). Everything else
// in the app keeps working: colour, material texture, artwork clipping, export.
// See assets/garments/README.md and docs/garment-art-brief.md for the file format.

let manifest = null;
let baseUrl = '';
const cache = new Map();
let seq = 0;

export async function loadGarmentArt(url = 'assets/garments/manifest.json') {
  manifest = null;
  cache.clear();
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) return;
    manifest = await res.json();
  } catch {
    return; // no manifest → generated drawings only
  }
  baseUrl = url.slice(0, url.lastIndexOf('/') + 1);
  const files = new Set();
  for (const entry of Object.values(manifest.garments || {})) {
    for (const v of ['front', 'back']) if (entry[v]) files.add(entry[v]);
    for (const c of Object.values(entry.cuts || {})) for (const v of ['front', 'back']) if (c[v]) files.add(c[v]);
  }
  await Promise.all([...files].map(async (f) => {
    try {
      const res = await fetch(baseUrl + f, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      cache.set(f, parseArt(await res.text(), f));
    } catch (e) {
      console.warn(`Garment art "${f}" could not be used:`, e.message);
    }
  }));
}

/** Custom art for a resolved spec's params and view, or null to use the generated drawing. */
export function customArt(params, view) {
  if (!manifest || !params?.artKey) return null;
  const entry = manifest.garments?.[params.artKey];
  if (!entry) return null;
  const cut = (params.artCut && entry.cuts?.[params.artCut]) || {};
  let file = cut[view] || entry[view];
  let mirrored = false;
  // Shoes: the inner side defaults to a mirrored outer side.
  if (!file && view === 'back' && params.artKey.startsWith('shoes/')) { file = cut.front || entry.front; mirrored = true; }
  const art = file && cache.get(file);
  if (!art) return null;
  return mirrored ? { ...art, mirrored } : art;
}

// ─────────────────────────────────────────────────────────────────
// Parsing & sanitising
// ─────────────────────────────────────────────────────────────────
const BLOCKED = ['script', 'foreignObject', 'style', 'iframe', 'object', 'embed', 'audio', 'video', 'image', 'a'];
const SHAPES = 'path, ellipse, circle, rect, polygon, polyline';

function sanitize(root) {
  for (const tag of BLOCKED) root.querySelectorAll(tag).forEach((n) => n.remove());
  const all = [root, ...root.querySelectorAll('*')];
  for (const el of all) {
    for (const a of [...el.attributes]) {
      const name = a.name.toLowerCase();
      const val = a.value.trim();
      if (name.startsWith('on')) el.removeAttribute(a.name);
      else if ((name === 'href' || name === 'xlink:href') && !val.startsWith('#')) el.removeAttribute(a.name);
      else if (/url\(\s*['"]?(?!#)/i.test(val)) el.removeAttribute(a.name); // only local url(#id) references
      else if (name === 'style') el.removeAttribute(a.name);
    }
  }
}

/** Prefix every id so several drawings can share one page without clashing. */
function prefixIds(root, pre) {
  const ids = new Map();
  root.querySelectorAll('[id]').forEach((el) => { ids.set(el.id, pre + el.id); el.id = pre + el.id; });
  const fix = (v) => v
    .replace(/url\(\s*#([^)\s]+)\s*\)/g, (m, id) => (ids.has(id) ? `url(#${ids.get(id)})` : m))
    .replace(/^#(.+)$/, (m, id) => (ids.has(id) ? `#${ids.get(id)}` : m));
  for (const el of root.querySelectorAll('*')) {
    for (const a of [...el.attributes]) {
      if (a.name === 'id') continue;
      const nv = fix(a.value);
      if (nv !== a.value) el.setAttribute(a.name, nv);
    }
  }
}

const ser = new (typeof XMLSerializer !== 'undefined' ? XMLSerializer : class { serializeToString() { return ''; } })();
const inner = (el) => (el ? [...el.childNodes].map((n) => (n.nodeType === 1 ? ser.serializeToString(n) : '')).join('') : '');
/** The element itself (keeping group attributes like fill="none") without its id. */
const whole = (el) => { if (!el) return ''; const c = el.cloneNode(true); c.removeAttribute('id'); return ser.serializeToString(c); };

export function parseArt(text, name = 'art') {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const svg = doc.documentElement;
  if (!svg || svg.nodeName.toLowerCase() !== 'svg' || doc.getElementsByTagName('parsererror').length) throw new Error('not a valid SVG file');
  sanitize(svg);
  const pre = `ga${++seq}-`;
  prefixIds(svg, pre);
  const byId = (id) => svg.querySelector(`[id="${pre}${id}"]`);

  // viewBox → garment coordinate box
  let vb = (svg.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
  if (vb.length !== 4 || vb.some((n) => !isFinite(n))) {
    const w = parseFloat(svg.getAttribute('width')) || 600, h = parseFloat(svg.getAttribute('height')) || 600;
    vb = [0, 0, w, h];
  }
  const box = { x: vb[0], y: vb[1], w: vb[2], h: vb[3] };

  // outline: one shape, or a group of shapes — fill/stroke stripped, the app paints it
  const o = byId('outline');
  if (!o) throw new Error('missing an element with id="outline"');
  const shapes = o.matches(SHAPES) ? [o] : [...o.querySelectorAll(SHAPES)];
  if (!shapes.length) throw new Error('id="outline" contains no shapes');
  const outline = shapes.map((s) => {
    const c = s.cloneNode(false);
    for (const a of ['fill', 'stroke', 'stroke-width', 'opacity', 'fill-opacity', 'class']) c.removeAttribute(a);
    c.removeAttribute('id');
    return ser.serializeToString(c).replace(/\sxmlns="[^"]*"/, '');
  });
  // accent shapes: geometry only, painted with the trim colour
  const accentEl = byId('accent');
  const accent = accentEl ? [...accentEl.querySelectorAll(SHAPES)].map((s) => {
    const c = s.cloneNode(false); c.removeAttribute('fill'); c.removeAttribute('id'); return ser.serializeToString(c);
  }).join('') : '';
  const defs = [...svg.querySelectorAll('defs')].map(inner).join('');
  const strip = (m) => m.replace(/\sxmlns="[^"]*"/g, '');
  return {
    name, box,
    viewBox: `${box.x} ${box.y} ${box.w} ${box.h}`,
    outline: outline.map(strip),
    accent: strip(accent),
    details: strip(whole(byId('details'))),
    shading: strip(whole(byId('shading'))),
    outside: strip(whole(byId('outside'))),
    defs: strip(defs),
  };
}

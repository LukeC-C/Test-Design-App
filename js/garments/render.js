// Turns a garment spec + view into layered SVG markup.
import { top } from './top.js';
import { bottom } from './bottom.js';
import { hat } from './hat.js';
import { shoe } from './shoe.js';
import { textureMarkup, patternOnly } from './textures.js';
import { mix, isDark } from '../lib/color.js';
import { MATERIALS } from '../data/materials.js';
import { customArt } from './custom.js';

const GEN = { top, bottom, hat, shoe };
const geoCache = new Map();
const boxCache = new Map();
let uidSeq = 0;

export function viewsFor(tpl) {
  return tpl === 'shoe'
    ? [{ id: 'front', label: 'Outer side' }, { id: 'back', label: 'Inner side' }]
    : [{ id: 'front', label: 'Front' }, { id: 'back', label: 'Back' }];
}

export function geometry(tpl, params, view) {
  const key = tpl + '|' + view + '|' + JSON.stringify(params);
  let g = geoCache.get(key);
  if (!g) {
    g = GEN[tpl](params, view);
    g.subpaths = splitSubpaths(g.outline);
    geoCache.set(key, g);
    if (geoCache.size > 600) geoCache.delete(geoCache.keys().next().value);
  }
  return g;
}

function splitSubpaths(d) {
  return d.split(/(?=M )/).map((s) => s.trim()).filter(Boolean);
}

let measureSvg = null;
/** Bounding box of a garment (all views share one box so switching views doesn't jump). */
export function garmentBox(tpl, params) {
  const key = tpl + '|' + JSON.stringify(params);
  if (boxCache.has(key)) return boxCache.get(key);
  let box = { x: 0, y: 0, w: 400, h: 480 };
  if (typeof document !== 'undefined') {
    if (!measureSvg) {
      measureSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      measureSvg.setAttribute('aria-hidden', 'true');
      measureSvg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;left:-9999px;top:0';
      document.body.appendChild(measureSvg);
    }
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const view of ['front', 'back']) {
      const g = geometry(tpl, params, view);
      const ds = [g.outline, ...g.outside.map((o) => o.d)];
      for (const d of ds) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        measureSvg.appendChild(path);
        try {
          const b = path.getBBox();
          if (b.width || b.height) {
            x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y);
            x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height);
          }
        } catch { /* ignore */ }
        path.remove();
      }
    }
    if (isFinite(x0)) {
      const pad = Math.max(x1 - x0, y1 - y0) * 0.06 + 6;
      box = { x: x0 - pad, y: y0 - pad, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2 };
      // a pleasant minimum aspect so very wide items (shoes) aren't too flat
      const minH = box.w * 0.62;
      if (box.h < minH) { box.y -= (minH - box.h) / 2; box.h = minH; }
    }
  }
  boxCache.set(key, box);
  return box;
}

function palette(base, accent, materialId) {
  const dark = isDark(base);
  const seam = dark ? mix(base, '#ffffff', 0.22) : mix(base, '#000000', 0.38);
  const stitch = dark ? mix(base, '#ffffff', 0.4) : mix(base, '#000000', 0.42);
  return {
    base, accent, dark,
    seam, stitch,
    panel: mix(base, '#000000', 0.06),
    shade: mix(base, '#000000', 0.12),
    interior: mix(base, '#000000', dark ? 0.35 : 0.42),
    light: mix(base, '#ffffff', 0.12),
    bandDark: mix(base, '#000000', 0.45),
    ribDark: mix(base, '#000000', 0.22),
    cord: dark ? '#e6e6e6' : mix(base, '#000000', 0.2),
    lace: isDark(accent) ? '#f2f2f2' : accent === base ? '#f2f2f2' : mix(accent, '#ffffff', 0.4),
    accentSeam: isDark(accent) ? mix(accent, '#ffffff', 0.22) : mix(accent, '#000000', 0.35),
  };
}

function styleAttrs(s, c, uid) {
  const S = (o) => Object.entries(o).map(([k, v]) => `${k}="${v}"`).join(' ');
  switch (s) {
    // seams read as slightly raised: a dark line with a faint highlight just below-right
    case 'seam': return [S({ fill: 'none', stroke: '#ffffff', 'stroke-width': 1.1, opacity: c.dark ? 0.08 : 0.35, transform: 'translate(0.8 0.9)', 'stroke-linecap': 'round' }), S({ fill: 'none', stroke: c.seam, 'stroke-width': 1.1, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', opacity: 0.7 })];
    case 'seam-soft': return [S({ fill: 'none', stroke: c.seam, 'stroke-width': 1, opacity: 0.5, 'stroke-linecap': 'round' })];
    case 'stitch': return [S({ fill: 'none', stroke: c.stitch, 'stroke-width': 0.8, 'stroke-dasharray': '2.6 2.2', opacity: 0.6, 'stroke-linecap': 'round' })];
    case 'stitch-contrast': return [S({ fill: 'none', stroke: '#d9a441', 'stroke-width': 1.2, 'stroke-dasharray': '3.4 2.4' })];
    case 'stitch-heavy': return [S({ fill: 'none', stroke: c.stitch, 'stroke-width': 1.6, 'stroke-dasharray': '4 3' })];
    case 'rib': return [S({ fill: c.base, stroke: c.seam, 'stroke-width': 1, 'stroke-opacity': 0.7 }), S({ fill: `url(#rib-${uid})`, stroke: 'none' })];
    case 'rib-dark': return [S({ fill: c.ribDark, stroke: c.seam, 'stroke-width': 1 }), S({ fill: `url(#rib-${uid})`, stroke: 'none' })];
    case 'rib-edge': return [S({ fill: 'none', stroke: c.seam, 'stroke-width': 2.6, opacity: 0.35 })];
    case 'accent': return [S({ fill: c.accent, stroke: c.accentSeam, 'stroke-width': 1 })];
    case 'accent-line': return [S({ fill: 'none', stroke: c.accent, 'stroke-width': 3 })];
    case 'panel': case 'band': case 'binding': case 'loop-tab': return [S({ fill: c.panel, stroke: c.seam, 'stroke-width': 1.1, 'stroke-linejoin': 'round' })];
    case 'placket': return [S({ fill: 'none', stroke: c.seam, 'stroke-width': 1.1 })];
    case 'collar': return [S({ fill: c.light, stroke: c.seam, 'stroke-width': 1.3, 'stroke-linejoin': 'round' })];
    case 'pocket': return [S({ fill: 'rgba(0,0,0,0.035)', stroke: c.seam, 'stroke-width': 1.2, 'stroke-linejoin': 'round' })];
    case 'pocket-line': return [S({ fill: 'none', stroke: c.seam, 'stroke-width': 0.9, opacity: 0.7 })];
    case 'flap': return [S({ fill: c.shade, stroke: c.seam, 'stroke-width': 1.2, 'stroke-linejoin': 'round' })];
    case 'welt': return [S({ fill: c.interior, stroke: c.seam, 'stroke-width': 1, opacity: 0.8 })];
    case 'band-dark': return [S({ fill: c.bandDark, stroke: c.seam, 'stroke-width': 1 })];
    case 'interior': return [S({ fill: c.interior, stroke: c.seam, 'stroke-width': 1, 'stroke-linejoin': 'round' })];
    case 'interior-line': return [S({ fill: 'none', stroke: c.interior, 'stroke-width': 1.2 })];
    case 'hood-edge': return [S({ fill: 'none', stroke: c.seam, 'stroke-width': 2.4, opacity: 0.55 })];
    case 'fur': return [S({ fill: '#e9e1d3', stroke: 'none' }), S({ fill: `url(#fur-${uid})`, stroke: 'none' })];
    case 'cord': return [S({ fill: 'none', stroke: c.cord, 'stroke-width': 3.2, 'stroke-linecap': 'round' })];
    case 'cord-thin': return [S({ fill: 'none', stroke: c.cord, 'stroke-width': 1.8, 'stroke-linecap': 'round' })];
    case 'metal': return [S({ fill: '#d2d2d2', stroke: '#8d8d8d', 'stroke-width': 0.8 })];
    case 'rivet': return [S({ fill: '#c58b3a', stroke: '#8a5a1f', 'stroke-width': 0.6 })];
    case 'eyelet': return [S({ fill: c.interior, stroke: '#9a9a9a', 'stroke-width': 0.8 })];
    case 'zip': return [S({ fill: 'none', stroke: '#7c7c7c', 'stroke-width': 3.4, 'stroke-dasharray': '1.6 1.1' }), S({ fill: 'none', stroke: '#5c5c5c', 'stroke-width': 0.8 })];
    case 'zip-small': return [S({ fill: 'none', stroke: '#7c7c7c', 'stroke-width': 2.2, 'stroke-dasharray': '1.4 1' })];
    case 'button': return [S({ fill: c.dark ? '#d9d4cb' : mix(c.base, '#000000', 0.3), stroke: c.seam, 'stroke-width': 0.6 })];
    case 'button-hat': return [S({ fill: c.panel, stroke: c.seam, 'stroke-width': 1 })];
    case 'binding-line': return [S({ fill: 'none', stroke: c.seam, 'stroke-width': 2, opacity: 0.6 })];
    case 'buckle': return [S({ fill: 'none', stroke: '#b9b9b9', 'stroke-width': 3, 'stroke-linejoin': 'round' })];
    case 'fold': return [S({ fill: 'none', stroke: c.seam, 'stroke-width': 1, opacity: 0.28, 'stroke-linecap': 'round' })];
    case 'pleat': return [S({ fill: 'none', stroke: c.seam, 'stroke-width': 1.3, opacity: 0.5 })];
    case 'rip': return [S({ fill: 'none', stroke: '#f1f1ec', 'stroke-width': 2.6, 'stroke-linecap': 'round' })];
    case 'selvedge': return [S({ fill: 'none', stroke: '#c0392b', 'stroke-width': 2 })];
    case 'mesh': return [S({ fill: mix(c.base, '#000000', 0.1), stroke: c.seam, 'stroke-width': 1 }), S({ fill: `url(#mesh-${uid})`, stroke: 'none' })];
    case 'lace': return [S({ fill: 'none', stroke: c.lace, 'stroke-width': 3, 'stroke-linecap': 'round' })];
    case 'gore': return [S({ fill: c.bandDark, stroke: c.seam, 'stroke-width': 1 }), S({ fill: `url(#rib-${uid})`, stroke: 'none' })];
    case 'brogue': return [S({ fill: 'none', stroke: c.interior, 'stroke-width': 2.2, 'stroke-dasharray': '0.1 4', 'stroke-linecap': 'round' })];
    case 'heel-tip': return [S({ fill: '#1d1d1d' })];
    case 'sole-line': return [S({ fill: 'none', stroke: 'rgba(0,0,0,0.25)', 'stroke-width': 1.2 })];
    case 'sole-dark': return [S({ fill: 'rgba(0,0,0,0.3)' })];
    case 'foxing': return [S({ fill: 'none', stroke: '#1f1f1f', 'stroke-width': 3.5, opacity: 0.8 })];
    case 'strap-line': return [S({ fill: 'none', stroke: c.seam, 'stroke-width': 7, 'stroke-linecap': 'round' }), S({ fill: 'none', stroke: c.base, 'stroke-width': 5, 'stroke-linecap': 'round' })];
    // outside-only styles
    case 'strap': return [S({ fill: 'none', stroke: c.seam, 'stroke-width': 7, 'stroke-linecap': 'round' }), S({ fill: 'none', stroke: c.base, 'stroke-width': 5, 'stroke-linecap': 'round' })];
    case 'strap-wide': return [S({ fill: 'none', stroke: c.seam, 'stroke-width': 16, 'stroke-linecap': 'round' }), S({ fill: 'none', stroke: c.base, 'stroke-width': 14, 'stroke-linecap': 'round' })];
    case 'belt-tie': return [S({ fill: 'none', stroke: c.seam, 'stroke-width': 16, 'stroke-linecap': 'round' }), S({ fill: 'none', stroke: c.panel, 'stroke-width': 14, 'stroke-linecap': 'round' })];
    case 'toggle': return [S({ fill: '#2b2b2b', stroke: '#111', 'stroke-width': 0.6 })];
    case 'loop': return [S({ fill: 'none', stroke: c.seam, 'stroke-width': 6, 'stroke-linecap': 'round' }), S({ fill: 'none', stroke: c.panel, 'stroke-width': 4, 'stroke-linecap': 'round' })];
    case 'lace-loop': return [S({ fill: 'none', stroke: c.lace, 'stroke-width': 3, 'stroke-linecap': 'round' })];
    case 'fabric': return [S({ fill: c.base, stroke: c.seam, 'stroke-width': 1.2 })];
    default: return [S({ fill: 'none', stroke: c.seam, 'stroke-width': 1 })];
  }
}

function soleColor(fill, accent) {
  if (fill === 'gum') return '#c48a4a';
  return accent;
}

/**
 * Build the layered SVG pieces for a garment.
 * Returns { viewBox, box, defs, under, over, clipId, mirror, uid }.
 * `under` = fabric layers (drawn below artwork), `over` = details/shading (above artwork).
 */
export function garmentLayers({ tpl, params, view = 'front', color, accent, materialId }) {
  const uid = (++uidSeq).toString(36);
  const art = customArt(params, view);
  if (art) return customLayers({ art, tpl, color, accent, materialId, uid });
  const mat = MATERIALS[materialId] || {};
  const p = { ...params };
  if (mat.quilt && tpl === 'top' && !p.quilt) p.quilt = 46;
  if (mat.meshBack && tpl === 'hat') p.mesh = true;
  const g = geometry(tpl, p, view);
  const box = garmentBox(tpl, p);
  const base = color || mat.color || '#cccccc';
  const acc = accent || '#f2f2f2';
  const c = palette(base, acc, materialId);
  const mirror = tpl === 'shoe' && view === 'back';
  const mt = mirror ? ` transform="matrix(-1 0 0 1 ${2 * (box.x + box.w / 2)} 0)"` : '';
  const clipId = `clip-${uid}`;
  const texScale = tpl === 'hat' ? 0.9 : tpl === 'shoe' ? 0.8 : 1;
  const tex = textureMarkup(mat.tex || 'jersey', uid, texScale, { x: box.x - 50, y: box.y - 50, w: box.w + 100, h: box.h + 100 });
  const bx = `x="${box.x - 50}" y="${box.y - 50}" width="${box.w + 100}" height="${box.h + 100}"`;
  const sc = Math.max(box.w, box.h) / 520; // keeps blur & stroke sizes proportional across garment families

  const defs = `
    <clipPath id="${clipId}">${g.subpaths.map((d) => `<path d="${d}"${mt}/>`).join('')}</clipPath>
    ${tex.defs}
    ${patternOnly('rib', `rib-${uid}`)}
    ${patternOnly('mesh', `mesh-${uid}`)}
    ${patternOnly('fur', `fur-${uid}`)}
    <radialGradient id="shl-${uid}" cx="0.36" cy="0.2" r="0.75">
      <stop offset="0" stop-color="#fff" stop-opacity="${c.dark ? 0.12 : 0.16}"/>
      <stop offset="0.55" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="shy-${uid}" x1="0" x2="0.25" y1="0" y2="1">
      <stop offset="0.45" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.12"/>
    </linearGradient>
    <filter id="fb1-${uid}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${sc * 0.7}"/></filter>
    <filter id="fb4-${uid}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${sc * 4}"/></filter>
    <filter id="fb8-${uid}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${sc * 8}"/></filter>
    <filter id="gsh-${uid}" x="-20%" y="-20%" width="140%" height="150%"><feGaussianBlur stdDeviation="${sc * 7}"/></filter>
    <filter id="mot-${uid}" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="${0.008 / sc}" numOctaves="2" seed="5"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.2 -0.08"/>
    </filter>`;

  // soft folds & light, grouped so each blur filter runs once
  const folds = g.folds || [];
  const fg = (kinds, attrs, filterId) => {
    const ds = folds.filter((f) => kinds.includes(f.k)).map((f) => f.d);
    return ds.length ? `<g filter="url(#${filterId}-${uid})" ${attrs}>${ds.map((d) => `<path d="${d}"/>`).join('')}</g>` : '';
  };
  const foldMarkup =
    fg(['shadow'], `fill="none" stroke="#000" stroke-width="${7 * sc}" stroke-linecap="round" opacity="${c.dark ? 0.28 : 0.16}"`, 'fb4') +
    fg(['shadowSoft'], `fill="none" stroke="#000" stroke-width="${12 * sc}" stroke-linecap="round" opacity="${c.dark ? 0.22 : 0.1}"`, 'fb8') +
    fg(['crease'], `fill="none" stroke="#000" stroke-width="${1.4 * sc}" stroke-linecap="round" opacity="${c.dark ? 0.3 : 0.2}"`, 'fb1') +
    fg(['light'], `fill="none" stroke="#fff" stroke-width="${12 * sc}" stroke-linecap="round" opacity="${c.dark ? 0.1 : 0.2}"`, 'fb8') +
    fg(['lightSoft'], `fill="none" stroke="#fff" stroke-width="${8 * sc}" stroke-linecap="round" opacity="${c.dark ? 0.06 : 0.12}"`, 'fb8');
  const edgeShade = g.subpaths.map((d) => `<path d="${d}"/>`).join('');

  const paths = (list, filter) => list.filter(filter || (() => true)).map((it) => styleAttrs(it.s, c, uid).map((a) => `<path d="${it.d}" ${a}/>`).join('')).join('');
  const accentParts = g.parts.filter((x) => x.fill === 'accent').map((x) => `<path d="${x.d}" fill="${acc}"/>`).join('');
  const soleParts = g.parts.filter((x) => x.fill === 'sole' || x.fill === 'gum').map((x) => {
    const sc = soleColor(x.fill, acc);
    return `<path d="${x.d}" fill="${sc}" stroke="${isDark(sc) ? mix(sc, '#ffffff', 0.25) : mix(sc, '#000000', 0.3)}" stroke-width="1.2"/>`;
  }).join('');

  const under = `<g${mt} filter="url(#gsh-${uid})" opacity="${tpl === 'shoe' || tpl === 'hat' ? 0.22 : 0.16}" transform-origin="center"><g transform="translate(${3 * sc} ${8 * sc})">${edgeShade.replace(/<path /g, '<path fill="#000" ')}</g></g>
    <g clip-path="url(#${clipId})"><g${mt}>
      <rect ${bx} fill="${base}"/>
      ${accentParts}
      <rect ${bx} filter="url(#mot-${uid})"/>
      ${tex.overlay}
    </g></g>`;
  const over = `<g clip-path="url(#${clipId})"><g${mt}>
      ${foldMarkup}
      ${paths(g.details)}
      ${soleParts}
      <g filter="url(#fb8-${uid})" fill="none" stroke="#000" stroke-width="${16 * sc}" opacity="${c.dark ? 0.3 : 0.2}">${edgeShade}</g>
      <rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" fill="url(#shl-${uid})"/>
      <rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" fill="url(#shy-${uid})"/>
    </g></g>
    <g${mt}>
      ${g.subpaths.map((d) => `<path d="${d}" fill="none" stroke="${c.dark ? mix(base, '#000000', 0.5) : mix(base, '#000000', 0.45)}" stroke-width="1.1" stroke-linejoin="round" opacity="0.75"/>`).join('')}
      ${paths(g.outside)}
    </g>`;
  return { viewBox: `${r(box.x)} ${r(box.y)} ${r(box.w)} ${r(box.h)}`, box, defs, under, over, clipId, mirror, uid, palette: c };
}
const r = (n) => Math.round(n * 10) / 10;

/**
 * Layers for a drop-in custom drawing (see custom.js). Same contract as garmentLayers:
 * the app paints the outline with the garment colour + material, the drawing supplies
 * accent shapes, translucent shading/details (above artwork) and unclipped extras.
 */
function customLayers({ art, tpl, color, accent, materialId, uid }) {
  const mat = MATERIALS[materialId] || {};
  const box = art.box;
  const base = color || mat.color || '#cccccc';
  const acc = accent || '#f2f2f2';
  const c = palette(base, acc, materialId);
  const sc = Math.max(box.w, box.h) / 520;
  const mt = art.mirrored ? ` transform="matrix(-1 0 0 1 ${2 * (box.x + box.w / 2)} 0)"` : '';
  const clipId = `clip-${uid}`;
  const pad = Math.max(box.w, box.h) * 0.1;
  const tex = textureMarkup(mat.tex || 'jersey', uid, sc * (tpl === 'shoe' ? 0.8 : 1), { x: box.x - pad, y: box.y - pad, w: box.w + pad * 2, h: box.h + pad * 2 });
  const bx = `x="${box.x - pad}" y="${box.y - pad}" width="${box.w + pad * 2}" height="${box.h + pad * 2}"`;
  const shapes = art.outline.join('');
  // <clipPath> may only contain shapes (no <g>), so the mirror transform goes on each shape
  const mtx = art.mirrored ? `matrix(-1 0 0 1 ${2 * (box.x + box.w / 2)} 0)` : '';
  const clipShapes = art.outline.map((el) => {
    if (!mtx) return el;
    return /\stransform="/.test(el) ? el.replace(/\stransform="([^"]*)"/, ` transform="${mtx} $1"`) : el.replace(/^<([a-zA-Z]+)/, `<$1 transform="${mtx}"`);
  }).join('');
  const defs = `
    <clipPath id="${clipId}">${clipShapes}</clipPath>
    ${art.defs}
    ${tex.defs}
    <radialGradient id="shl-${uid}" cx="0.36" cy="0.2" r="0.75">
      <stop offset="0" stop-color="#fff" stop-opacity="${c.dark ? 0.1 : 0.12}"/><stop offset="0.55" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <filter id="fb8-${uid}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${sc * 8}"/></filter>
    <filter id="gsh-${uid}" x="-20%" y="-20%" width="140%" height="150%"><feGaussianBlur stdDeviation="${sc * 7}"/></filter>`;
  const under = `<g filter="url(#gsh-${uid})" opacity="${tpl === 'shoe' || tpl === 'hat' ? 0.22 : 0.16}"><g${mt}><g transform="translate(${3 * sc} ${8 * sc})" fill="#000">${shapes}</g></g></g>
    <g clip-path="url(#${clipId})"><g${mt}>
      <rect ${bx} fill="${base}"/>
      ${art.accent ? `<g fill="${acc}" stroke="none">${art.accent}</g>` : ''}
      ${tex.overlay}
    </g></g>`;
  const over = `<g clip-path="url(#${clipId})"><g${mt}>
      ${art.shading}
      ${art.details}
      <g filter="url(#fb8-${uid})" fill="none" stroke="#000" stroke-width="${16 * sc}" opacity="${c.dark ? 0.26 : 0.16}">${shapes}</g>
      <rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" fill="url(#shl-${uid})"/>
    </g></g>
    <g${mt}>
      <g fill="none" stroke="${mix(base, '#000000', 0.48)}" stroke-width="${1.1 * sc}" stroke-linejoin="round" opacity="0.75">${shapes}</g>
      ${art.outside}
    </g>`;
  return { viewBox: art.viewBox, box, defs, under, over, clipId, mirror: !!art.mirrored, uid, palette: c, custom: true };
}

/** Convenience: full standalone SVG string. */
export function garmentSVG(opts, { elements = '', extraDefs = '', title = '', className = '' } = {}) {
  const L = garmentLayers(opts);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${L.viewBox}" class="${className}" ${title ? `role="img" aria-label="${title.replace(/"/g, '&quot;')}"` : 'aria-hidden="true"'} focusable="false">
    <defs>${L.defs}${extraDefs}</defs>${L.under}<g clip-path="url(#${L.clipId})">${elements}</g>${L.over}</svg>`;
}

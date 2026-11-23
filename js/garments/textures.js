// Fabric textures as SVG <pattern>/<filter> overlays. All are drawn in
// translucent black/white so they work on top of any base colour.
const d = (a) => `rgba(0,0,0,${a})`;
const l = (a) => `rgba(255,255,255,${a})`;

const pat = (id, w, h, body, extra = '') =>
  `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${w}" height="${h}" ${extra}>${body}</pattern>`;

const noise = (id, freq, oct, alpha, light = false, seed = 3) =>
  `<filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="${oct}" seed="${seed}" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 ${light ? 1 : 0}  0 0 0 0 ${light ? 1 : 0}  0 0 0 0 ${light ? 1 : 0}  0 0 0 ${alpha * 3} ${-alpha * 1.1}"/>
  </filter>`;

// Each texture → { defs(id) => string, layers(id) => [{fill|filter}] }
const T = {
  knit: {
    defs: (id) => pat(id, 8, 7, `<path d="M0 0 L4 6 L8 0" fill="none" stroke="${d(0.2)}" stroke-width="1.2"/><path d="M0 1.5 L4 7.2" stroke="${l(0.12)}" stroke-width="0.8"/>`),
  },
  chunky: {
    defs: (id) => pat(id, 16, 14, `<path d="M0 0 Q4 10 8 13 Q12 10 16 0" fill="none" stroke="${d(0.24)}" stroke-width="2.2"/><path d="M2 2 Q5 9 8 11" fill="none" stroke="${l(0.16)}" stroke-width="1.2"/>`),
  },
  rib: {
    defs: (id) => pat(id, 6, 10, `<rect x="0" y="0" width="2.2" height="10" fill="${d(0.14)}"/><rect x="3.2" y="0" width="1" height="10" fill="${l(0.09)}"/>`),
  },
  cable: {
    defs: (id) => pat(id, 36, 40, `<rect width="36" height="40" fill="none"/><path d="M0 0v40M6 0v40M30 0v40M36 0v40" stroke="${d(0.14)}" stroke-width="1.6"/><path d="M12 0 C12 10 24 10 24 20 C24 30 12 30 12 40 M24 0 C24 10 12 10 12 20 C12 30 24 30 24 40" fill="none" stroke="${d(0.22)}" stroke-width="3"/><path d="M13 2 C13 10 23 11 23 19" fill="none" stroke="${l(0.14)}" stroke-width="1.2"/>`),
  },
  fleece: { noise: [0.9, 2, 0.12] },
  felt: { noise: [1.4, 2, 0.12] },
  suede: { noise: [0.55, 3, 0.14], noise2: [1.8, 1, 0.08, true] },
  crepe: { noise: [2.4, 1, 0.18] },
  heather: { noise: [1.6, 2, 0.16], noise2: [2.2, 1, 0.14, true] },
  waxed: { noise: [0.05, 3, 0.22], noise2: [1.2, 1, 0.06, true] },
  leather: { noise: [0.35, 4, 0.12], noise2: [0.02, 2, 0.08, true] },
  terry: {
    defs: (id) => pat(id, 4, 4, `<circle cx="1" cy="1" r="0.8" fill="${d(0.16)}"/><circle cx="3" cy="3" r="0.8" fill="${d(0.12)}"/>`),
  },
  jersey: {
    defs: (id) => pat(id, 3, 4, `<path d="M0 0 L1.5 4 L3 0" fill="none" stroke="${d(0.07)}" stroke-width="0.6"/>`),
  },
  slub: {
    defs: (id) => pat(id, 60, 9, `<path d="M0 2 h18 M24 2 h30" stroke="${d(0.12)}" stroke-width="1.6"/><path d="M6 6 h14 M36 6 h22" stroke="${l(0.12)}" stroke-width="1.4"/>`),
  },
  pique: {
    defs: (id) => pat(id, 6, 6, `<path d="M3 0 L6 3 L3 6 L0 3 Z" fill="none" stroke="${d(0.14)}" stroke-width="0.8"/><circle cx="3" cy="3" r="0.9" fill="${d(0.12)}"/>`),
  },
  waffle: {
    defs: (id) => pat(id, 10, 10, `<rect x="1.5" y="1.5" width="7" height="7" rx="1" fill="${d(0.1)}"/><path d="M0 0.5h10M0.5 0v10" stroke="${l(0.16)}" stroke-width="1.2"/>`),
  },
  mesh: {
    defs: (id) => pat(id, 7, 6, `<circle cx="1.75" cy="1.5" r="1.3" fill="${d(0.38)}"/><circle cx="5.25" cy="4.5" r="1.3" fill="${d(0.38)}"/>`),
  },
  fineMesh: {
    defs: (id) => pat(id, 3.5, 3, `<circle cx="0.9" cy="0.75" r="0.6" fill="${d(0.22)}"/><circle cx="2.6" cy="2.25" r="0.6" fill="${d(0.22)}"/>`),
  },
  knitMesh: {
    defs: (id) => pat(id, 6, 6, `<path d="M0 0 L3 5 L6 0" fill="none" stroke="${d(0.16)}" stroke-width="0.9"/><circle cx="3" cy="2" r="0.9" fill="${d(0.25)}"/>`),
  },
  smooth: { defs: (id) => pat(id, 40, 40, `<path d="M-10 50 L50 -10" stroke="${l(0.04)}" stroke-width="14"/>`) },
  rubber: { defs: (id) => pat(id, 40, 40, `<path d="M-10 50 L50 -10" stroke="${l(0.05)}" stroke-width="10"/>`) },
  patent: { defs: (id) => pat(id, 60, 60, `<path d="M-10 70 L70 -10" stroke="${l(0.14)}" stroke-width="10"/><path d="M10 70 L70 10" stroke="${l(0.06)}" stroke-width="4"/>`) },
  nylon: { defs: (id) => pat(id, 4, 4, `<path d="M0 0.5h4" stroke="${l(0.06)}" stroke-width="1"/><path d="M0 2.5h4" stroke="${d(0.05)}" stroke-width="1"/>`) },
  ripstop: { defs: (id) => pat(id, 10, 10, `<path d="M0 0.5h10M0.5 0v10" stroke="${d(0.16)}" stroke-width="1"/><path d="M0 5h10" stroke="${l(0.05)}" stroke-width="0.6"/>`) },
  sherpa: {
    defs: (id) => pat(id, 12, 12, `<path d="M2 4 q2 -3 4 0 t4 0 M0 10 q2 -3 4 0 t4 0 t4 0" fill="none" stroke="${l(0.3)}" stroke-width="1.4"/><path d="M3 6 q2 -2 4 0 M7 12 q2 -2 4 0" fill="none" stroke="${d(0.14)}" stroke-width="1.2"/>`),
  },
  fur: {
    defs: (id) => pat(id, 8, 8, `<path d="M1 7 q1 -6 2 -6 M5 8 q1 -6 2 -6" fill="none" stroke="${l(0.35)}" stroke-width="1.2"/><path d="M3 8 q1 -5 1 -6" fill="none" stroke="${d(0.18)}" stroke-width="1"/>`),
  },
  velvet: { noise: [0.8, 2, 0.08], defs: (id) => pat(id, 80, 80, `<path d="M-20 100 L100 -20" stroke="${l(0.08)}" stroke-width="30"/>`) },
  fuzzy: {
    noise: [1.2, 2, 0.14, true],
    defs: (id) => pat(id, 9, 9, `<path d="M0 3 l4 -2 M5 8 l4 -3 M2 7 l2 1" stroke="${l(0.22)}" stroke-width="0.8"/>`),
  },
  fairisle: {
    defs: (id) => pat(id, 24, 24, `<path d="M0 0 L4 6 L8 0 L12 6 L16 0 L20 6 L24 0" fill="none" stroke="${d(0.12)}" stroke-width="1"/><path d="M12 9 l5 5 l-5 5 l-5 -5 z" fill="${l(0.32)}"/><circle cx="0" cy="14" r="2" fill="${l(0.32)}"/><circle cx="24" cy="14" r="2" fill="${l(0.32)}"/><path d="M0 22h24" stroke="${l(0.25)}" stroke-width="2"/>`),
  },
  boucle: {
    defs: (id) => pat(id, 10, 10, `<circle cx="3" cy="3" r="2.2" fill="none" stroke="${d(0.18)}" stroke-width="1.1"/><circle cx="8" cy="8" r="1.8" fill="none" stroke="${l(0.24)}" stroke-width="1.1"/><circle cx="8" cy="2" r="1" fill="${d(0.14)}"/>`),
  },
  pointelle: {
    defs: (id) => pat(id, 12, 12, `<path d="M0 0 L3 5 L6 0 L9 5 L12 0" fill="none" stroke="${d(0.12)}" stroke-width="0.8"/><circle cx="6" cy="9" r="1.4" fill="${d(0.3)}"/>`),
  },
  poplin: { defs: (id) => pat(id, 2, 2, `<rect width="1" height="1" fill="${d(0.05)}"/><rect x="1" y="1" width="1" height="1" fill="${d(0.05)}"/>`) },
  oxford: { defs: (id) => pat(id, 4, 4, `<rect width="2" height="2" fill="${l(0.18)}"/><rect x="2" y="2" width="2" height="2" fill="${l(0.18)}"/><rect x="2" width="2" height="2" fill="${d(0.05)}"/>`) },
  plaid: {
    defs: (id) => pat(id, 48, 48, `<rect x="0" y="0" width="48" height="16" fill="${d(0.22)}"/><rect x="0" y="0" width="16" height="48" fill="${d(0.22)}"/><rect x="28" width="3" height="48" fill="${l(0.3)}"/><rect y="28" width="48" height="3" fill="${l(0.3)}"/><rect x="38" width="1.5" height="48" fill="${d(0.3)}"/><rect y="38" width="48" height="1.5" fill="${d(0.3)}"/>`),
  },
  gingham: { defs: (id) => pat(id, 16, 16, `<rect width="8" height="16" fill="${d(0.3)}"/><rect width="16" height="8" fill="${d(0.3)}"/>`) },
  chambray: { noise: [1.8, 1, 0.12, true], defs: (id) => pat(id, 3, 3, `<path d="M0 0.5h3" stroke="${l(0.12)}" stroke-width="0.8"/>`) },
  linen: {
    noise: [0.04, 2, 0.06],
    defs: (id) => pat(id, 22, 22, `<path d="M0 3h22M0 9h14M6 15h16M0 20h22" stroke="${d(0.1)}" stroke-width="0.9"/><path d="M4 0v22M12 0v12M18 6v16" stroke="${l(0.12)}" stroke-width="0.8"/>`),
  },
  seersucker: { defs: (id) => pat(id, 14, 6, `<rect width="7" height="6" fill="${l(0.35)}"/><path d="M7 0 q2 3 0 6 M10 0 q2 3 0 6" fill="none" stroke="${d(0.1)}" stroke-width="0.8"/>`) },
  satin: { defs: (id) => pat(id, 90, 90, `<path d="M-20 110 L110 -20" stroke="${l(0.14)}" stroke-width="24"/><path d="M20 110 L110 20" stroke="${l(0.06)}" stroke-width="10"/>`) },
  sheer: { defs: (id) => pat(id, 3, 3, `<rect width="1" height="1" fill="${l(0.12)}"/>`) },
  cord: { defs: (id) => pat(id, 6, 10, `<rect width="3.6" height="10" fill="${l(0.1)}"/><rect x="4" width="2" height="10" fill="${d(0.2)}"/>`) },
  twill: { defs: (id) => pat(id, 5, 5, `<path d="M-1 6 L6 -1" stroke="${d(0.12)}" stroke-width="1.2"/>`) },
  denim: {
    noise: [1.6, 1, 0.12, true],
    defs: (id) => pat(id, 4, 4, `<path d="M-1 5 L5 -1" stroke="${d(0.18)}" stroke-width="1.1"/><path d="M1 5 L5 1" stroke="${l(0.06)}" stroke-width="0.6"/>`),
  },
  acid: {
    noise: [0.03, 4, 0.3, true, 9],
    defs: (id) => pat(id, 4, 4, `<path d="M-1 5 L5 -1" stroke="${d(0.16)}" stroke-width="1.1"/>`),
  },
  canvas: { defs: (id) => pat(id, 4, 4, `<path d="M0 1h4M1 0v4" stroke="${d(0.1)}" stroke-width="1.2"/><path d="M0 3h4" stroke="${l(0.1)}" stroke-width="0.8"/>`) },
  tweed: {
    noise: [0.9, 2, 0.12],
    defs: (id) => pat(id, 14, 14, `<path d="M1 2h3M8 5h4M3 9h3M10 12h3" stroke="${l(0.32)}" stroke-width="1.2"/><path d="M5 1h2M1 12h3M9 9h2" stroke="rgba(180,80,40,0.3)" stroke-width="1.2"/><path d="M12 2h2M6 13h2" stroke="${d(0.3)}" stroke-width="1.2"/>`),
  },
  herringbone: {
    defs: (id) => pat(id, 12, 8, `<path d="M0 8 L6 0 M0 4 L3 0 M3 8 L6 4" stroke="${d(0.16)}" stroke-width="1"/><path d="M6 0 L12 8 M9 0 L12 4 M6 4 L9 8" stroke="${l(0.12)}" stroke-width="1"/>`),
  },
  straw: {
    defs: (id) => pat(id, 12, 12, `<rect x="0" y="0" width="6" height="6" fill="${d(0.08)}"/><rect x="6" y="6" width="6" height="6" fill="${d(0.08)}"/><path d="M0 1.5h6M0 4.5h6M7.5 6v6M10.5 6v6" stroke="${d(0.14)}" stroke-width="0.8"/><path d="M1.5 6v6M4.5 6v6M6 7.5h6M6 10.5h6" stroke="${l(0.14)}" stroke-width="0.8"/>`),
  },
  cork: { defs: (id) => pat(id, 9, 9, `<circle cx="2" cy="3" r="0.9" fill="${d(0.3)}"/><circle cx="6.5" cy="7" r="0.6" fill="${d(0.3)}"/><circle cx="7" cy="2" r="1.2" fill="${d(0.14)}"/><circle cx="3" cy="7.5" r="0.5" fill="${l(0.3)}"/>`) },
  pebble: { defs: (id) => pat(id, 7, 7, `<circle cx="2" cy="2" r="1.6" fill="none" stroke="${d(0.12)}" stroke-width="0.6"/><circle cx="5.5" cy="5.5" r="1.4" fill="none" stroke="${d(0.12)}" stroke-width="0.6"/>`) },
  croc: { defs: (id) => pat(id, 18, 14, `<rect x="1" y="1" width="16" height="12" rx="4" fill="none" stroke="${d(0.25)}" stroke-width="1.2"/><rect x="3" y="3" width="8" height="5" rx="2" fill="${l(0.08)}"/>`) },
  lace: {
    defs: (id) => pat(id, 20, 20, `<circle cx="10" cy="10" r="5" fill="none" stroke="${d(0.28)}" stroke-width="1"/><circle cx="10" cy="10" r="1.6" fill="${d(0.35)}"/><circle cx="0" cy="0" r="3" fill="${d(0.3)}"/><circle cx="20" cy="0" r="3" fill="${d(0.3)}"/><circle cx="0" cy="20" r="3" fill="${d(0.3)}"/><circle cx="20" cy="20" r="3" fill="${d(0.3)}"/><path d="M10 0v5M10 15v5M0 10h5M15 10h5" stroke="${d(0.2)}" stroke-width="0.8"/>`),
  },
};

/** Build defs + overlay markup for a texture, covering a rect. */
export function textureMarkup(tex, uid, scale = 1, box = { x: -200, y: -300, w: 1000, h: 1300 }) {
  const t = T[tex];
  if (!t) return { defs: '', overlay: '' };
  let defs = '', overlay = '';
  const tr = scale !== 1 ? ` patternTransform="scale(${scale})"` : '';
  if (t.defs) {
    const id = `tx-${uid}`;
    defs += t.defs(id).replace('<pattern ', `<pattern${tr} `);
    overlay += `<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" fill="url(#${id})"/>`;
  }
  if (t.noise) {
    const [f, o, a, light, seed] = t.noise;
    const id = `tn-${uid}`;
    defs += noise(id, f / scale, o, a, light, seed);
    overlay += `<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" filter="url(#${id})"/>`;
  }
  if (t.noise2) {
    const [f, o, a, light] = t.noise2;
    const id = `tn2-${uid}`;
    defs += noise(id, f / scale, o, a, light, 11);
    overlay += `<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" filter="url(#${id})"/>`;
  }
  return { defs, overlay };
}

export function patternOnly(tex, id) {
  const t = T[tex];
  return t?.defs ? t.defs(id) : '';
}

export const TEXTURE_IDS = Object.keys(T);

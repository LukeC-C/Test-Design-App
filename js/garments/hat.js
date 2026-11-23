// Parametric headwear (front / back views).
import { P, M, L, Q, C, spline, smooth, poly, circle, ellipse, rect, along, lerp } from './geometry.js';
import { mirrorD } from './top.js';

export function hat(params, view) {
  const p = { kind: 'cap', ...params };
  const back = view === 'back';
  const cx = 200, by = 240;
  const det = [], out = [], parts = [];
  const D = (d, s, extra) => det.push({ d, s, ...extra });
  let outline = '';
  const k = p.kind;

  if (k === 'cap' || k === 'military' || k === 'visor') {
    const cw = p.crownW || 138, ch = k === 'military' ? 120 : (p.crownH || 118);
    const st = p.structured !== false;
    let crown;
    if (k === 'military') {
      crown = M(P(cx - cw * 0.92, by)) + L(P(cx - cw * 1.0, by - ch * 0.86)) + Q(P(cx, by - ch * 1.02), P(cx + cw * 1.0, by - ch * 0.86)) + L(P(cx + cw * 0.92, by)) + ' Z';
    } else if (k === 'visor') {
      crown = M(P(cx - cw, by - 4)) + Q(P(cx, by - 50), P(cx + cw, by - 4)) + L(P(cx + cw, by - 34)) + Q(P(cx, by - 80), P(cx - cw, by - 34)) + ' Z';
    } else {
      const f = st ? 0.6 : 0.68;
      crown = smooth([P(cx - cw, by), P(cx - cw * 0.97, by - ch * 0.5), P(cx - cw * f, by - ch * 0.93), P(cx, by - ch), P(cx + cw * f, by - ch * 0.93), P(cx + cw * 0.97, by - ch * 0.5), P(cx + cw, by)], false) + Q(P(cx, by + 8), P(cx - cw, by)) + ' Z';
    }
    outline = crown;
    if (!back) {
      const bd = p.brimD || (k === 'visor' ? 60 : 50);
      let brim;
      if (p.brim === 'flat' || k === 'military') {
        brim = M(P(cx - cw - 14, by - 6)) + L(P(cx + cw + 14, by - 6)) + L(P(cx + cw + 18, by + bd * 0.36)) + Q(P(cx, by + bd * 0.5), P(cx - cw - 18, by + bd * 0.36)) + ' Z';
        D(M(P(cx - cw - 10, by + bd * 0.18)) + Q(P(cx, by + bd * 0.28), P(cx + cw + 10, by + bd * 0.18)), 'stitch');
      } else {
        brim = M(P(cx - cw - 8, by - 10)) + C(P(cx - cw * 0.6, by + bd * 1.2), P(cx + cw * 0.6, by + bd * 1.2), P(cx + cw + 8, by - 10)) + C(P(cx + cw * 0.5, by + 10), P(cx - cw * 0.5, by + 10), P(cx - cw - 8, by - 10)) + ' Z';
        for (const t of [0.35, 0.65]) D(M(P(cx - cw - 4 + t * 6, by - 6 + t * 10)) + C(P(cx - cw * 0.6, by + bd * (0.3 + t * 0.7)), P(cx + cw * 0.6, by + bd * (0.3 + t * 0.7)), P(cx + cw + 4 - t * 6, by - 6 + t * 10)), 'stitch');
      }
      outline += ' ' + brim;
      if (k === 'visor') {
        D(M(P(cx - cw, by - 20)) + Q(P(cx, by - 66), P(cx + cw, by - 20)), 'stitch');
      }
    } else if (k === 'visor') {
      D(rect(cx - 30, by - 66, 60, 26, 4), 'band');
    }
    if (k === 'cap') {
      // panels
      const panels = p.panels || 6;
      if (!back && panels === 6) D(M(P(cx, by - ch)) + L(P(cx, by - 2)), 'seam');
      const sx = panels === 5 ? 0.5 : 0.6;
      for (const s of [1, -1]) {
        D(M(P(cx, by - ch)) + spline([P(cx, by - ch), P(cx + s * cw * sx * 0.6, by - ch * 0.82), P(cx + s * cw * sx, by - ch * 0.4), P(cx + s * cw * (sx + 0.1), by)]), 'seam');
        D(circle(cx + s * cw * (sx + 0.17), by - ch * 0.62, 3.2), 'eyelet');
      }
      if (back) D(M(P(cx, by - ch)) + L(P(cx, by - 52)), 'seam');
      D(circle(cx, by - ch - 1, 7), 'button-hat');
      if (p.mesh) {
        const meshL = M(P(cx - cw, by)) + spline([P(cx - cw, by), P(cx - cw * 0.97, by - ch * 0.5), P(cx - cw * 0.72, by - ch * 0.86)]) + spline([P(cx - cw * 0.72, by - ch * 0.86), P(cx - cw * 0.65, by - ch * 0.4), P(cx - cw * 0.7, by)]) + ' Z';
        if (!back) { D(meshL, 'mesh'); D(mirrorD(meshL, cx), 'mesh'); }
        else D(M(P(cx - cw, by)) + spline([P(cx - cw, by), P(cx - cw * 0.97, by - ch * 0.5), P(cx - cw * 0.6, by - ch * 0.93), P(cx, by - ch), P(cx + cw * 0.6, by - ch * 0.93), P(cx + cw * 0.97, by - ch * 0.5), P(cx + cw, by)]) + ' Z', 'mesh');
      }
      if (back) {
        const bk = p.back || 'strap';
        if (bk !== 'fitted') {
          D(M(P(cx - 36, by + 2)) + Q(P(cx - 38, by - 56), P(cx, by - 60)) + Q(P(cx + 38, by - 56), P(cx + 36, by + 2)) + ' Z', 'interior');
          D(rect(cx - 46, by - 16, 92, 15, 3), bk === 'snap' ? 'band-dark' : 'band');
          if (bk === 'snap') for (const x of [-30, -15, 0, 15, 30]) D(circle(cx + x, by - 8.5, 2.6), 'metal');
          else D(rect(cx + 14, by - 20, 14, 22, 2), 'buckle');
        }
      }
      D(M(P(cx - cw + 2, by - 4)) + Q(P(cx, by + 4), P(cx + cw - 2, by - 4)), 'stitch');
    }
    if (k === 'military') {
      D(M(P(cx - cw * 0.98, by - ch * 0.8)) + Q(P(cx, by - ch * 0.96), P(cx + cw * 0.98, by - ch * 0.8)), 'seam');
      D(M(P(cx - cw * 0.93, by - 20)) + Q(P(cx, by - 16), P(cx + cw * 0.93, by - 20)), 'stitch');
      if (!back) D(M(P(cx, by - ch * 0.9)) + L(P(cx, by)), 'seam-soft');
    }
  } else if (k === 'beanie' || k === 'trapper') {
    const cw = p.crownW || 130, ch = k === 'trapper' ? 120 : (p.crownH || 140);
    const cuff = k === 'trapper' ? 0 : (p.cuff ?? 46);
    const bot = by + 30;
    const top = bot - cuff - ch;
    let body;
    if (p.slouch && !back) {
      body = M(P(cx - cw, bot)) + L(P(cx - cw, bot - cuff - ch * 0.3)) + spline([P(cx - cw, bot - cuff - ch * 0.3), P(cx - cw * 0.7, top + 16), P(cx + cw * 0.2, top - 8), P(cx + cw * 1.1, top + ch * 0.3), P(cx + cw * 1.06, top + ch * 0.62), P(cx + cw, bot - cuff - 10)]) + L(P(cx + cw, bot)) + Q(P(cx, bot + 8), P(cx - cw, bot)) + ' Z';
    } else {
      const peak = (p.crownH || 140) > 150 ? 0.28 : 0.6;
      body = M(P(cx - cw, bot)) + L(P(cx - cw, bot - cuff - ch * 0.35)) + spline([P(cx - cw, bot - cuff - ch * 0.35), P(cx - cw * 0.86, top + ch * 0.12), P(cx - cw * peak, top + 2), P(cx, top), P(cx + cw * peak, top + 2), P(cx + cw * 0.86, top + ch * 0.12), P(cx + cw, bot - cuff - ch * 0.35)]) + L(P(cx + cw, bot)) + Q(P(cx, bot + 8), P(cx - cw, bot)) + ' Z';
    }
    outline = body;
    if (cuff) {
      D(M(P(cx - cw, bot - cuff)) + Q(P(cx, bot - cuff + 8), P(cx + cw, bot - cuff)) + L(P(cx + cw + 2, bot)) + Q(P(cx, bot + 8), P(cx - cw - 2, bot)) + ' Z', 'rib');
      if (p.cuff >= 60) D(M(P(cx - cw, bot - cuff / 2)) + Q(P(cx, bot - cuff / 2 + 8), P(cx + cw, bot - cuff / 2)), 'seam-soft');
    } else {
      D(M(P(cx - cw, bot - 14)) + Q(P(cx, bot - 6), P(cx + cw, bot - 14)), 'stitch');
    }
    if (p.pom) {
      const pr = 34;
      outline += ' ' + circle(cx + (p.slouch ? cw * 0.3 : 0), top - pr + 10, pr);
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2, r1 = pr * 0.4, r2 = pr * 0.95;
        const px = cx + (p.slouch ? cw * 0.3 : 0), py = top - pr + 10;
        D(M(P(px + Math.cos(a) * r1, py + Math.sin(a) * r1)) + L(P(px + Math.cos(a) * r2, py + Math.sin(a) * r2)), 'fold');
      }
    }
    if (p.flaps || k === 'trapper') {
      for (const s of [1, -1]) {
        const fl = poly([P(cx + s * (cw - 4), bot - 30), P(cx + s * (cw - 4), bot + 70), P(cx + s * (cw - 30), bot + 96), P(cx + s * (cw - 64), bot + 70), P(cx + s * (cw - 70), bot + 4)]);
        outline += ' ' + fl;
        if (k === 'trapper') D(fl, 'fur');
        else out.push({ d: M(P(cx + s * (cw - 30), bot + 96)) + L(P(cx + s * (cw - 34), bot + 170)), s: 'cord' });
      }
    }
    if (k === 'trapper' && !back) {
      D(M(P(cx - cw - 4, bot - 70)) + Q(P(cx, bot - 120), P(cx + cw + 4, bot - 70)) + L(P(cx + cw + 4, bot - 10)) + Q(P(cx, bot - 44), P(cx - cw - 4, bot - 10)) + ' Z', 'fur');
      outline += ' ' + M(P(cx - cw - 4, bot - 70)) + Q(P(cx, bot - 120), P(cx + cw + 4, bot - 70)) + L(P(cx + cw + 4, bot - 10)) + Q(P(cx, bot - 44), P(cx - cw - 4, bot - 10)) + ' Z';
    }
    if (back) D(M(P(cx, top + 4)) + L(P(cx, bot - cuff - 2)), 'seam-soft');
  } else if (k === 'bucket' || k === 'cloche') {
    const cw = p.crownW || 120, ch = p.crownH || (k === 'cloche' ? 120 : 96), bw = p.brimW ?? (k === 'cloche' ? 14 : 40);
    let crown;
    if (k === 'cloche') crown = smooth([P(cx - cw * 0.92, by), P(cx - cw * 0.94, by - ch * 0.55), P(cx - cw * 0.55, by - ch * 0.98), P(cx, by - ch), P(cx + cw * 0.55, by - ch * 0.98), P(cx + cw * 0.94, by - ch * 0.55), P(cx + cw * 0.92, by)], false) + ' Z';
    else crown = M(P(cx - cw * 0.86, by)) + L(P(cx - cw * 0.74, by - ch)) + Q(P(cx, by - ch - 12), P(cx + cw * 0.74, by - ch)) + L(P(cx + cw * 0.86, by)) + ' Z';
    const bd = k === 'cloche' ? 34 : 54;
    const brim = M(P(cx - cw * 0.9, by - 6)) + L(P(cx - cw - bw, by + bd)) + Q(P(cx, by + bd + 22), P(cx + cw + bw, by + bd)) + L(P(cx + cw * 0.9, by - 6)) + Q(P(cx, by + 10), P(cx - cw * 0.9, by - 6)) + ' Z';
    outline = crown + ' ' + brim;
    if (k === 'bucket') {
      D(M(P(cx - cw * 0.76, by - ch + 12)) + Q(P(cx, by - ch), P(cx + cw * 0.76, by - ch + 12)), 'stitch');
      for (const t of [0.3, 0.55, 0.8]) D(M(lerp(P(cx - cw * 0.9, by), P(cx - cw - bw, by + bd), t)) + Q(P(cx, by + 8 + (bd + 14) * t), lerp(P(cx + cw * 0.9, by), P(cx + cw + bw, by + bd), t)), 'stitch');
      for (const s of [1, -1]) D(circle(cx + s * cw * 0.6, by - ch * 0.55, 3.2), 'eyelet');
      if (p.loops) for (const x of [-0.6, -0.2, 0.2, 0.6]) D(rect(cx + cw * x - 5, by - 26, 10, 22, 2), 'loop-tab');
      if (p.loops) D(rect(cx - cw * 0.86, by - 22, cw * 1.72, 14, 0), 'band');
    } else {
      D(rect(cx - cw * 0.92, by - 22, cw * 1.84, 18, 0), 'accent');
      D(ellipse(cx + cw * 0.6, by - 13, 12, 9), 'accent');
    }
    if (p.straps) out.push({ d: M(P(cx - cw * 0.88, by)) + Q(P(cx, by + 170), P(cx + cw * 0.88, by)), s: 'cord' });
  } else if (k === 'fedora' || k === 'boater') {
    const cw = p.crownW || 116, ch = p.crownH || (k === 'boater' ? 76 : 108), bw = p.brimW ?? (k === 'boater' ? 50 : 50);
    let crown;
    const pinch = k === 'boater' ? 'flat' : (p.pinch || 'center');
    if (pinch === 'flat' || pinch === 'telescope') {
      crown = M(P(cx - cw * 0.8, by)) + L(P(cx - cw * 0.8, by - ch + 6)) + Q(P(cx - cw * 0.8, by - ch), P(cx - cw * 0.7, by - ch)) + L(P(cx + cw * 0.7, by - ch)) + Q(P(cx + cw * 0.8, by - ch), P(cx + cw * 0.8, by - ch + 6)) + L(P(cx + cw * 0.8, by)) + ' Z';
      if (pinch === 'telescope') D(M(P(cx - cw * 0.66, by - ch + 4)) + Q(P(cx, by - ch + 14), P(cx + cw * 0.66, by - ch + 4)), 'seam');
    } else if (pinch === 'none') {
      crown = smooth([P(cx - cw * 0.8, by), P(cx - cw * 0.78, by - ch * 0.6), P(cx - cw * 0.45, by - ch), P(cx + cw * 0.45, by - ch), P(cx + cw * 0.78, by - ch * 0.6), P(cx + cw * 0.8, by)], false) + ' Z';
    } else {
      const dent = pinch === 'teardrop' ? 0.74 : pinch === 'cattleman' ? 0.7 : 0.82;
      crown = smooth([P(cx - cw * 0.8, by), P(cx - cw * 0.76, by - ch * 0.7), P(cx - cw * 0.52, by - ch), P(cx - cw * 0.14, by - ch * 0.9), P(cx, by - ch * dent), P(cx + cw * 0.14, by - ch * 0.9), P(cx + cw * 0.52, by - ch), P(cx + cw * 0.76, by - ch * 0.7), P(cx + cw * 0.8, by)], false) + ' Z';
      if (!back) for (const s of [1, -1]) D(M(P(cx + s * cw * 0.3, by - ch * 0.92)) + Q(P(cx + s * cw * 0.22, by - ch * 0.7), P(cx + s * cw * 0.3, by - ch * 0.48)), 'fold');
      D(M(P(cx, by - ch * dent)) + L(P(cx, by - ch * (dent - 0.2))), 'fold');
    }
    const rx = cw * 0.8 + bw, up = (p.upturn ? 30 + bw * 0.25 : 0), bh = 24 + bw * 0.1 + (p.snap && !back ? 14 : 0);
    let brim;
    if (p.floppy) {
      const pts = [];
      for (let i = 0; i <= 12; i++) { const t = i / 12; const a = Math.PI * t; pts.push(P(cx - Math.cos(a) * rx, by + Math.sin(a) * bh * 1.6 + Math.sin(t * Math.PI * 6) * 6)); }
      brim = M(pts[0]) + spline(pts) + C(P(cx + rx * 0.5, by - bh * 0.5), P(cx - rx * 0.5, by - bh * 0.5), pts[0]) + ' Z';
    } else {
      brim = M(P(cx - rx, by - up)) + C(P(cx - rx * 0.6, by + bh), P(cx + rx * 0.6, by + bh), P(cx + rx, by - up)) + C(P(cx + rx * 0.55, by - bh * 0.55 - up * 0.2), P(cx - rx * 0.55, by - bh * 0.55 - up * 0.2), P(cx - rx, by - up)) + ' Z';
    }
    outline = brim + ' ' + crown;
    const band = M(P(cx - cw * 0.8, by)) + L(P(cx - cw * 0.79, by - 22)) + Q(P(cx, by - 16), P(cx + cw * 0.79, by - 22)) + L(P(cx + cw * 0.8, by)) + Q(P(cx, by + 6), P(cx - cw * 0.8, by)) + ' Z';
    D(band, k === 'boater' ? 'accent' : 'band-dark');
    if (k === 'boater') D(M(P(cx - cw * 0.8, by - 11)) + Q(P(cx, by - 5), P(cx + cw * 0.8, by - 11)), 'accent-line');
    if (!back && k !== 'boater') D(poly([P(cx + cw * 0.56, by - 20), P(cx + cw * 0.72, by - 12), P(cx + cw * 0.56, by - 2)]), 'band-dark');
    D(M(P(cx - rx + 10, by - up + 2)) + C(P(cx - rx * 0.6, by + bh - 6), P(cx + rx * 0.6, by + bh - 6), P(cx + rx - 10, by - up + 2)), 'stitch');
  } else if (k === 'beret') {
    const cw = p.crownW || 130;
    outline = ellipse(cx + 14, by - 64, cw * 1.28, 56) + ' ' + M(P(cx - cw * 0.8, by - 34)) + Q(P(cx, by - 56), P(cx + cw * 0.8, by - 34)) + L(P(cx + cw * 0.8, by - 12)) + Q(P(cx, by - 32), P(cx - cw * 0.8, by - 12)) + ' Z' + ' ' + rect(cx + 8, by - 132, 8, 14, 3);
    D(M(P(cx - cw * 0.8, by - 34)) + Q(P(cx, by - 56), P(cx + cw * 0.8, by - 34)) + L(P(cx + cw * 0.8, by - 12)) + Q(P(cx, by - 32), P(cx - cw * 0.8, by - 12)) + ' Z', 'band');
    D(M(P(cx - cw * 1.1, by - 52)) + Q(P(cx + 14, by - 30), P(cx + cw * 1.35, by - 54)), 'fold');
  } else if (k === 'flatcap' || k === 'newsboy') {
    const cw = p.crownW || 136, ch = p.crownH || (k === 'newsboy' ? 104 : 86);
    const puff = k === 'newsboy' ? 1.08 : 1.0;
    const crown = smooth([P(cx - cw, by), P(cx - cw * puff, by - ch * 0.45), P(cx - cw * 0.55, by - ch * 0.62 * puff), P(cx, by - ch * 0.68 * puff), P(cx + cw * 0.55, by - ch * 0.62 * puff), P(cx + cw * puff, by - ch * 0.45), P(cx + cw, by)], false) + Q(P(cx, by + 8), P(cx - cw, by)) + ' Z';
    outline = crown;
    if (!back) {
      const brim = M(P(cx - cw * 0.9, by - 8)) + C(P(cx - cw * 0.5, by + 36), P(cx + cw * 0.5, by + 36), P(cx + cw * 0.9, by - 8)) + Q(P(cx, by + 6), P(cx - cw * 0.9, by - 8)) + ' Z';
      outline += ' ' + brim;
      D(M(P(cx - cw * 0.84, by - 2)) + C(P(cx - cw * 0.5, by + 26), P(cx + cw * 0.5, by + 26), P(cx + cw * 0.84, by - 2)), 'stitch');
    }
    if (k === 'newsboy') {
      const top = P(cx, by - ch * 0.66 * puff);
      for (const x of [-0.75, -0.35, 0.35, 0.75]) D(M(top) + Q(P(cx + cw * x * 0.8, by - ch * 0.5), P(cx + cw * x, by - 2)), 'seam');
      D(circle(top[0], top[1], 7), 'button-hat');
    } else {
      D(M(P(cx - cw * 0.9, by - ch * 0.42)) + Q(P(cx, by - ch * 0.28), P(cx + cw * 0.9, by - ch * 0.42)), 'seam');
    }
  } else if (k === 'balaclava') {
    const hd = smooth([P(cx, by - 190), P(cx + 104, by - 140), P(cx + 112, by - 40), P(cx + 86, by + 40), P(cx + 136, by + 96), P(cx, by + 110), P(cx - 136, by + 96), P(cx - 86, by + 40), P(cx - 112, by - 40), P(cx - 104, by - 140)], true);
    outline = hd;
    if (!back) {
      D(ellipse(cx, by - 70, 58, 46), 'interior');
      D(ellipse(cx, by - 70, 66, 54), 'rib-edge');
    } else D(M(P(cx, by - 188)) + L(P(cx, by + 100)), 'seam-soft');
    D(M(P(cx - 92, by + 44)) + Q(P(cx, by + 60), P(cx + 92, by + 44)), 'seam-soft');
  } else if (k === 'bandana') {
    outline = poly([P(cx - 170, by - 110), P(cx + 170, by - 110), P(cx, by + 110)]);
    D(poly([P(cx - 152, by - 100), P(cx + 152, by - 100), P(cx, by + 92)]), 'stitch');
    if (back) {
      out.push({ d: poly([P(cx - 170, by - 110), P(cx - 216, by - 150), P(cx - 196, by - 90)]), s: 'fabric' });
      out.push({ d: poly([P(cx + 170, by - 110), P(cx + 216, by - 150), P(cx + 196, by - 90)]), s: 'fabric' });
    }
  } else if (k === 'headband') {
    outline = M(P(cx - 136, by - 10)) + Q(P(cx, by - 90), P(cx + 136, by - 10)) + L(P(cx + 136, by + 40)) + Q(P(cx, by - 32), P(cx - 136, by + 40)) + ' Z';
    D(M(P(cx - 134, by + 14)) + Q(P(cx, by - 62), P(cx + 134, by + 14)), 'seam-soft');
  } else if (k === 'durag') {
    const cw = 128;
    outline = smooth([P(cx - cw, by + 10), P(cx - cw * 0.98, by - 90), P(cx - cw * 0.5, by - 160), P(cx + cw * 0.5, by - 160), P(cx + cw * 0.98, by - 90), P(cx + cw, by + 10)], false) + Q(P(cx, by + 20), P(cx - cw, by + 10)) + ' Z';
    D(M(P(cx, by - 166)) + L(P(cx, by + 14)), 'seam');
    D(M(P(cx - cw, by - 20)) + Q(P(cx, by - 10), P(cx + cw, by - 20)) + L(P(cx + cw, by + 6)) + Q(P(cx, by + 16), P(cx - cw, by + 6)) + ' Z', 'band');
    if (back) {
      outline += ' ' + poly([P(cx - 50, by + 10), P(cx + 50, by + 10), P(cx + 56, by + 200), P(cx - 56, by + 200)]);
      D(M(P(cx, by + 12)) + L(P(cx, by + 200)), 'seam-soft');
      out.push({ d: M(P(cx - 40, by + 4)) + Q(P(cx - 120, by + 80), P(cx - 100, by + 180)), s: 'strap-wide' });
      out.push({ d: M(P(cx + 40, by + 4)) + Q(P(cx + 120, by + 80), P(cx + 100, by + 180)), s: 'strap-wide' });
    }
  }
  if (p.meshBack === true && back && k === 'cap') { /* handled via mesh flag */ }
  return { outline, parts, details: det, outside: out };
}

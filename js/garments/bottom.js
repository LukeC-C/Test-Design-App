// Parametric bottoms: trousers, jeans, shorts, joggers, skirts, leggings.
import { P, M, L, Q, C, spline, poly, lerp, add, circle, rect, along } from './geometry.js';
import { mirrorD } from './top.js';

export const BOTTOM_DEFAULTS = {
  kind: 'pants', waistW: 86, hipW: 104, rise: 200, len: 600, thigh: 52, knee: 44, hem: 40, spread: 0,
  waistband: 'band', fly: true, pockets: 'slant', back: 'patch', loops: true, flare: 1.25,
};

export function bottom(params, view) {
  const p = { ...BOTTOM_DEFAULTS, ...params };
  const back = view === 'back';
  const cx = 200, wy = 40;
  const det = [], out = [], parts = [];
  const D = (d, s, extra) => det.push({ d, s, ...extra });
  const ww = p.waistW, hw = p.hipW, cy = wy + p.rise, hy = p.len;
  const wbH = p.waistband === 'none' ? 0 : p.waistband === 'high' ? 50 : p.waistband === 'board' ? 26 : 32;
  const stitchKind = p.contrastStitch ? 'stitch-contrast' : 'stitch';
  let outline;
  const hipY = wy + 104;

  if (p.kind === 'skirt') {
    const hem = hw * p.flare;
    const dw = p.dropWaist ? hipY + 18 : null;
    let rightPts, hemD;
    const Hr = P(cx + hem, p.asym ? hy - 90 : hy);
    const Hl = P(cx - hem, hy);
    if (p.tiers) {
      const tiers = p.tiers;
      let d = M(P(cx - ww, wy)) + Q(P(cx, wy + 4), P(cx + ww, wy)) + Q(P(cx + hw, wy + 36), P(cx + hw, hipY));
      const ys = [], ws = [];
      for (let i = 1; i <= tiers; i++) { ys.push(hipY + ((hy - hipY) * i) / tiers); ws.push(hw + (hem - hw) * (i / tiers)); }
      let prevW = hw;
      for (let i = 0; i < tiers; i++) {
        const yTop = i === 0 ? hipY : ys[i - 1];
        d += L(P(cx + ws[i], ys[i]));
        if (i < tiers - 1) d += L(P(cx + ws[i] - 18, ys[i]));
        prevW = ws[i];
        if (i < tiers - 1) D(M(P(cx - ws[i] + 18, ys[i])) + Q(P(cx, ys[i] + 6), P(cx + ws[i] - 18, ys[i])), 'seam');
        for (let k = -3; k <= 3; k++) D(M(P(cx + k * (ws[i] / 4), yTop + 6)) + L(P(cx + k * (ws[i] / 3.6), ys[i] - 6)), 'fold');
      }
      d += Q(P(cx, hy + 10), P(cx - prevW, hy));
      for (let i = tiers - 2; i >= 0; i--) d += L(P(cx - ws[i] + 18, ys[i]), P(cx - ws[i], ys[i]));
      d += L(P(cx - hw, hipY)) + Q(P(cx - hw, wy + 36), P(cx - ww, wy)) + ' Z';
      outline = d;
    } else {
      rightPts = [P(cx + ww, wy), P(cx + hw, hipY), Hr];
      if (p.flare < 1) rightPts = [P(cx + ww, wy), P(cx + hw, hipY), P(cx + (hw + hem) / 2, (hipY + hy) / 2), Hr];
      if (dw) rightPts = [P(cx + ww, wy), P(cx + hw, dw), Hr];
      hemD = p.asym ? L(P(cx, hy - 40)) + Q(P(cx - hem * 0.5, hy + 8), Hl) : Q(P(cx, hy + 14), Hl);
      const leftPts = rightPts.map(([x, y]) => [2 * cx - x, y]).reverse();
      leftPts[0] = Hl;
      outline = M(P(cx - ww, wy)) + Q(P(cx, wy + 4), P(cx + ww, wy)) + spline(rightPts, 0.7) + hemD + spline(leftPts, 0.7) + ' Z';
    }
    // details
    if (p.pleated) {
      const n = p.pleated;
      for (let i = 0; i <= n; i++) {
        const t = i / n - 0.5;
        D(M(P(cx + t * 2 * hw * 0.92, hipY - 30)) + L(P(cx + t * 2 * hem * 0.96, hy - 4 + (p.asym ? -t * 90 : 0))), 'pleat');
      }
    }
    if (p.wrap && !back) {
      D(M(P(cx + ww * 0.55, wy + wbH)) + Q(P(cx + 10, (wy + hy) / 2), P(cx - hem * 0.35, hy + 8)), 'seam');
      out.push({ d: M(P(cx + ww * 0.55, wy + wbH + 4)) + Q(P(cx + ww * 0.7, wy + 70), P(cx + ww * 0.5, wy + 110)), s: 'belt-tie', fill: true });
      if (p.pleated) D(rect(cx + ww * 0.6, wy + wbH + 30, 16, 10, 2), 'buckle');
    }
    if (p.sideSlit) D(M(P(cx + hem - 2, hy)) + L(P(cx + (hw + hem) / 2 - 2, hy - 140)) + L(P(cx + hem - 14, hy)) + ' Z', 'interior');
    if (p.slit && back) D(M(P(cx - 7, hy)) + L(P(cx, hy - 110), P(cx + 7, hy)) + ' Z', 'interior');
    if (dw) {
      D(M(P(cx - hw, dw)) + Q(P(cx, dw + 6), P(cx + hw, dw)), 'seam');
      for (let k = -5; k <= 5; k++) D(M(P(cx + k * (hw / 5.4), dw + 6)) + L(P(cx + k * (hem / 5.4), hy - 10)), 'fold');
    }
    D(M(P(cx - hem + 4, (p.asym ? hy : hy) - 12)) + Q(P(cx, hy + 2), P(cx + hem - 4, (p.asym ? hy - 90 : hy) - 12)), 'stitch');
    if (back) D(M(P(cx, wy + wbH)) + L(P(cx, p.slit ? hy - 110 : hipY + 40)), 'seam-soft');
  } else {
    // pants / shorts / leggings
    const legC = hw / 2 + 2;
    const kneeY = cy + (hy - cy) * 0.46;
    let sp = p.spread;
    sp = Math.max(sp, p.hem - legC + 8, (p.knee - legC + 8) / 0.6, 0);
    const isShort = hy - cy < 220;
    const thighY = cy + Math.min(50, (hy - cy) * 0.4);
    const outerR = isShort
      ? [P(cx + ww, wy), P(cx + hw, hipY), P(cx + legC + p.hem + sp, hy)]
      : [P(cx + ww, wy), P(cx + hw, hipY), P(cx + legC + p.thigh + sp * 0.3, thighY), P(cx + legC + p.knee + sp * 0.6, kneeY), P(cx + legC + p.hem + sp, hy)];
    const innerR = isShort
      ? [P(cx + Math.max(4, legC - p.hem + sp), hy), P(cx + 4, cy + 14), P(cx, cy)]
      : [P(cx + Math.max(4, legC - p.hem + sp), hy), P(cx + Math.max(4, legC - p.knee + sp * 0.6), kneeY), P(cx + 6, cy + 30), P(cx, cy)];
    const hemR = Q(P(cx + legC + sp, hy + 4), innerR[0]);
    const right = spline(outerR, 0.85) + hemR + spline(innerR, 0.8);
    const leftInner = innerR.slice(0, -1).map(([x, y]) => [2 * cx - x, y]).reverse();
    leftInner.unshift(P(cx, cy));
    const leftOuter = outerR.map(([x, y]) => [2 * cx - x, y]).reverse();
    const left = spline(leftInner, 0.8) + Q(P(cx - legC - sp, hy + 4), leftOuter[0]) + spline(leftOuter, 0.85);
    outline = M(P(cx - ww, wy)) + Q(P(cx, wy + 4), P(cx + ww, wy)) + right + left + ' Z';

    // overalls bib
    if (p.overalls) {
      const bib = poly([P(cx - ww + 18, wy + 2), P(cx - ww + 24, wy - 150), P(cx + ww - 24, wy - 150), P(cx + ww - 18, wy + 2)]);
      outline = bib + ' ' + outline;
      if (!back) {
        D(rect(cx - 36, wy - 120, 72, 60, 4), 'pocket');
        D(M(P(cx - ww + 26, wy - 142)) + L(P(cx + ww - 26, wy - 142)), stitchKind);
        for (const s of [1, -1]) { D(circle(cx + s * (ww - 30), wy - 136, 5), 'metal'); out.push({ d: M(P(cx + s * (ww - 30), wy - 140)) + L(P(cx + s * (ww - 20), wy - 230)), s: 'strap-wide' }); }
      } else {
        out.push({ d: M(P(cx - ww + 30, wy - 146)) + L(P(cx + ww - 10, wy - 240)), s: 'strap-wide' });
        out.push({ d: M(P(cx + ww - 30, wy - 146)) + L(P(cx - ww + 10, wy - 240)), s: 'strap-wide' });
      }
    }

    // Leg details
    for (const s of [1, -1]) {
      const legX = (t) => cx + s * (legC + sp * t);
      if (p.crease) D(M(P(legX(0.1), hipY + 10)) + L(P(legX(1), hy - 6)), 'fold');
      if (p.cargo && !back) {
        const y0 = isShort ? cy + 6 : cy + 70, y1 = isShort ? Math.min(hy - 16, cy + 92) : cy + 172;
        const x0 = cx + s * (legC + 8 + sp * 0.4), x1 = cx + s * (legC + p.thigh - 6 + sp * 0.45);
        D(poly([P(x0, y0), P(x1, y0), P(x1 + s * 2, y1), P(x0, y1)]), 'pocket');
        D(poly([P(x0 - s * 2, y0 - 6), P(x1 + s * 2, y0 - 6), P(x1 + s * 2, y0 + 18), P(x0 - s * 2, y0 + 18)]), 'flap');
        D(circle((x0 + x1) / 2, y0 + 10, 3), 'button');
      }
      if (p.kneePanel && !isShort) {
        const ky = kneeY;
        D(poly([P(legX(0.5) - 34 * 1, ky - 60), P(legX(0.5) + 34, ky - 60), P(legX(0.6) + 36, ky + 50), P(legX(0.6) - 36, ky + 50)].map(([x, y]) => [x, y])), 'panel');
      }
      if (p.stripe) {
        const o = outerR.map(([x, y]) => [cx + s * (x - cx), y]);
        const inner = o.map(([x, y]) => [x - s * 12, y]);
        const d = M(o[1]) + spline(o.slice(1), 0.85) + L(inner[inner.length - 1]) + spline(inner.slice(1).reverse(), 0.85) + ' Z';
        D(d, 'accent');
      }
      if (p.cuffs) {
        const oh = cx + s * (legC + p.hem + sp), ih = cx + s * Math.max(4, legC - p.hem + sp);
        D(poly([P(oh + s * 1, hy - 34), P(ih - s * 1, hy - 34), P(ih, hy), P(oh, hy)]), 'rib');
      } else if (!p.rollHem) {
        const oh = cx + s * (legC + p.hem + sp), ih = cx + s * Math.max(4, legC - p.hem + sp);
        D(M(P(oh - s * 2, hy - 12)) + L(P(ih + s * 2, hy - 12)), stitchKind);
      }
      if (p.rollHem) {
        const oh = cx + s * (legC + p.hem + sp), ih = cx + s * Math.max(4, legC - p.hem + sp);
        D(poly([P(oh, hy - 30), P(ih, hy - 30), P(ih, hy), P(oh, hy)]), 'panel');
        D(M(P(ih + s * 3, hy - 28)) + L(P(ih + s * 3, hy - 2)), 'selvedge');
      }
      if (p.stack) for (const k of [1, 2, 3]) D(M(P(cx + s * (legC - p.hem + sp), hy - 30 - k * 26)) + Q(P(cx + s * (legC + sp), hy - 20 - k * 26), P(cx + s * (legC + p.hem + sp), hy - 34 - k * 26)), 'fold');
      if (p.toggleHem) out.push({ d: M(P(cx + s * (legC + p.hem + sp - 6), hy)) + L(P(cx + s * (legC + p.hem + sp - 4), hy + 22)), s: 'cord' });
      if (p.rips && !back) {
        const ky = kneeY;
        for (const k of [-10, 0, 10, 18]) D(M(P(legX(0.5) - 22, ky + k)) + Q(P(legX(0.5), ky + k + 3), P(legX(0.5) + 22, ky + k)), 'rip');
      }
      if (p.split && !back) {
        const oh = cx + s * (legC + p.hem + sp);
        D(M(P(oh, hy)) + L(P(oh - s * 10, hy - 28), P(oh - s * 18, hy)) + ' Z', 'interior');
      }
      if (p.panels) D(M(P(cx + s * (hw - 6), hipY + 20)) + Q(P(cx + s * (legC + p.knee * 0.4 + sp * 0.6), kneeY), P(cx + s * (legC + sp + p.hem * 0.3), hy - 6)), 'seam');
      if (p.stirrup) out.push({ d: M(P(cx + s * (legC - p.hem + sp + 4), hy)) + Q(P(cx + s * (legC + sp), hy + 30), P(cx + s * (legC + p.hem + sp - 4), hy)), s: 'strap' });
    }
    // crotch / fly
    if (!back) {
      if (p.fly) {
        D(M(P(cx, wy + wbH)) + L(P(cx, cy - 6)), 'seam');
        D(M(P(cx + 22, wy + wbH)) + L(P(cx + 22, cy - 40)) + Q(P(cx + 22, cy - 14), P(cx + 1, cy - 12)), stitchKind);
      } else {
        D(M(P(cx, wy + wbH)) + L(P(cx, cy - 4)), 'seam-soft');
      }
      if (p.carpenter) {
        D(rect(cx + legC + 14 + sp * 0.4, cy + 40, 24, 90, 2), 'pocket');
        out.push({ d: M(P(cx - hw + 6, hipY - 10)) + Q(P(cx - hw - 12, hipY + 40), P(cx - hw + 12, hipY + 70)), s: 'loop' });
      }
    } else {
      D(M(P(cx, wy + wbH)) + L(P(cx, cy - 4)), 'seam');
      if (p.yoke) D(M(P(cx - hw + 2, wy + 66)) + L(P(cx, wy + 98), P(cx + hw - 2, wy + 66)), stitchKind);
      if (p.back === 'patch' && p.pockets === 'jean') {
        for (const s of [1, -1]) {
          const x0 = cx + s * 22, x1 = cx + s * 80, y0 = wy + 104;
          D(poly([P(x0, y0), P(x1, y0 - 6), P(x1 - s * 4, y0 + 64), P((x0 + x1) / 2, y0 + 80), P(x0 + s * 2, y0 + 68)]), 'pocket');
          D(M(P(x0 + s * 8, y0 + 28)) + Q(P((x0 + x1) / 2, y0 + 50), P(x1 - s * 8, y0 + 22)), stitchKind);
        }
      } else if (p.back === 'welt' || (p.pockets !== 'none' && p.pockets !== 'jean')) {
        for (const s of [1, -1]) {
          D(rect(cx + (s > 0 ? 30 : -82), wy + 92, 52, 8, 1), 'welt');
          D(circle(cx + s * 56, wy + 106, 3), 'button');
        }
      }
    }
    // front pockets
    if (!back) {
      for (const s of [1, -1]) {
        if (p.pockets === 'slant') D(M(P(cx + s * (ww - 26), wy + wbH)) + L(P(cx + s * (hw - 1), hipY - 8)), 'seam');
        if (p.pockets === 'jean') {
          D(M(P(cx + s * (ww - 48), wy + wbH)) + Q(P(cx + s * (ww - 42), wy + wbH + 60), P(cx + s * (hw), wy + wbH + 66)), 'seam');
          D(M(P(cx + s * (ww - 42), wy + wbH)) + Q(P(cx + s * (ww - 36), wy + wbH + 54), P(cx + s * (hw), wy + wbH + 58)), stitchKind);
          if (s > 0) D(poly([P(cx + ww - 34, wy + wbH + 4), P(cx + ww - 4, wy + wbH + 4), P(cx + ww - 4, wy + wbH + 34), P(cx + ww - 32, wy + wbH + 36)]), 'pocket-line');
          D(circle(cx + s * (ww - 46), wy + wbH + 4, 2.6), 'rivet');
          D(circle(cx + s * (hw - 2), wy + wbH + 64, 2.6), 'rivet');
        }
        if (p.pockets === 'zip') D(M(P(cx + s * (ww - 20), wy + wbH + 10)) + L(P(cx + s * (hw - 4), hipY + 10)), 'zip-small');
      }
      if (p.pleats) for (const s of [1, -1]) for (let k = 0; k < p.pleats; k++) D(M(P(cx + s * (34 + k * 22), wy + wbH)) + L(P(cx + s * (36 + k * 24), wy + wbH + 64)), 'pleat');
    }
  }

  // Waistband
  if (wbH) {
    const wb = M(P(cx - ww, wy)) + Q(P(cx, wy + 4), P(cx + ww, wy)) + L(P(cx + ww + 2, wy + wbH)) + Q(P(cx, wy + wbH + 4), P(cx - ww - 2, wy + wbH)) + ' Z';
    D(wb, p.waistband === 'elastic' || p.waistband === 'drawcord' ? 'rib' : 'band');
    if (p.crossover && !back) D(M(P(cx - ww, wy + 4)) + L(P(cx, wy + wbH)) + L(P(cx + ww, wy + 4)), 'seam');
    if (p.waistband === 'elastic' || p.waistband === 'drawcord') {
      for (let x = -ww + 8; x < ww; x += 9) D(M(P(cx + x, wy + 4)) + L(P(cx + x + 2, wy + wbH - 2)), 'fold');
    } else {
      D(M(P(cx - ww + 2, wy + 7)) + Q(P(cx, wy + 11), P(cx + ww - 2, wy + 7)), stitchKind);
      D(M(P(cx - ww - 1, wy + wbH - 6)) + Q(P(cx, wy + wbH - 2), P(cx + ww + 1, wy + wbH - 6)), stitchKind);
    }
    if (p.waistband === 'drawcord' && !back) {
      D(circle(cx - 10, wy + 16, 2.6), 'metal'); D(circle(cx + 10, wy + 16, 2.6), 'metal');
      out.push({ d: M(P(cx - 10, wy + 16)) + Q(P(cx - 18, wy + 60), P(cx - 14, wy + 96)), s: 'cord' });
      out.push({ d: M(P(cx + 10, wy + 16)) + Q(P(cx + 20, wy + 56), P(cx + 16, wy + 90)), s: 'cord' });
    }
    if (p.waistband === 'board' && !back) {
      for (let i = 0; i < 3; i++) D(M(P(cx - 8, wy + 8 + i * 22)) + L(P(cx + 8, wy + 18 + i * 22)) + M(P(cx + 8, wy + 8 + i * 22)) + L(P(cx - 8, wy + 18 + i * 22)), 'cord-thin');
    }
    if (p.fly && !back && p.kind !== 'skirt') D(circle(cx + 8, wy + wbH / 2, 4.6), p.pockets === 'jean' ? 'metal' : 'button');
    if (p.fly && !back && p.kind === 'skirt') { D(circle(cx + 8, wy + wbH / 2, 4.6), 'metal'); D(M(P(cx, wy + wbH)) + L(P(cx, wy + wbH + 80)), 'seam'); }
    if (p.loops) {
      const xs = back ? [-ww + 12, -26, 0, 26, ww - 12] : [-ww + 14, -ww * 0.42, ww * 0.42, ww - 14];
      for (const x of xs) D(rect(cx + x - 4, wy - 3, 8, wbH + 8, 1.5), 'loop-tab');
    }
  }
  return { outline, parts, details: det, outside: out };
}

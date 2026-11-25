// Parametric tops: tees, sweaters, hoodies, shirts, jackets, coats, tanks.
import { P, M, L, Q, C, spline, smooth, poly, mirrorX, lerp, add, sub, norm, circle, rect, along } from './geometry.js';

const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

const SLEEVES = {
  cap:    { L: 36,  a: 64, cw: 80 },
  short:  { L: 98,  a: 52, cw: 70 },
  elbow:  { L: 150, a: 38, cw: 60 },
  threeq: { L: 196, a: 31, cw: 54 },
  long:   { L: 252, a: 25, cw: 50 },
};

export const TOP_DEFAULTS = {
  w: 96, len: 410, sleeve: 'long', drop: 0, raglan: false, neck: 'crew', open: 'none',
  pocket: 'none', hem: 'rib', cuffs: true, sleeveW: 1, flare: 1, straps: null, strapW: 30,
  armDeep: 0, back: 'normal',
};

export function top(params, view) {
  const p = { ...TOP_DEFAULTS, ...params };
  const back = view === 'back';
  const cx = 200, sy = 96;
  const parts = [], det = [], out = [];
  const D = (d, s, extra) => det.push({ d, s, ...extra });

  const hood = p.neck === 'hood';
  const strapMode = p.straps; // null | wide | thin | none | halter
  const sleeveless = p.sleeve === 'none';
  let nw = p.neck === 'boat' ? 60 : hood ? 46 : (p.neck === 'scoop' && strapMode) ? 46 : 36;
  if (p.neck === 'turtle' || p.neck === 'mock') nw = 33;
  const w = p.w, Lh = p.len, hw = w * p.flare;
  const drop = p.drop;
  const ribHem = p.hem === 'rib' || p.hem === 'band';
  const hemInset = p.hem === 'rib' ? 6 : 0;

  // Key points (right side; mirrored for left)
  const NR = P(cx + nw, sy - 6);
  let S = P(cx + w + 14 + drop * 24, sy + 12 + drop * 24);
  const A = P(cx + w + (sleeveless ? 2 : 0), sy + 96 + drop * 30 + (sleeveless ? 14 + p.armDeep : 0));
  const H = P(cx + hw - hemInset, Lh);

  // ── Right side contour from neck to hem ──────────────────────────
  let right = '';      // path after NR, ends at H
  let sleeve = null;   // {S, C1, C2, A, d}
  let topBodyY = null; // for strap modes where top edge is lower
  if (strapMode === 'thin' || strapMode === 'none' || strapMode === 'halter') {
    // body starts at a lower edge; handled separately below
  } else if (strapMode === 'wide' || (sleeveless && !strapMode)) {
    // tank / vest armhole
    const sw = strapMode === 'wide' ? p.strapW : 0;
    const racer = back && p.back === 'racer';
    const So = strapMode === 'wide'
      ? (racer ? P(cx + nw * 0.5 + 6, sy - 4) : P(cx + nw + sw, sy - 3))
      : P(cx + w - 8 + drop * 10, sy + 8);
    const Ap = strapMode === 'wide' ? P(cx + w, sy + 100 + p.armDeep) : A;
    const ctrl = racer ? P(cx + 26, sy + 80) : strapMode === 'wide' ? P(cx + nw + sw + 6, Ap[1] - 10) : P(cx + w - 16, sy + 70);
    right = L(So) + Q(ctrl, Ap) + sideToHem(Ap);
    S = So;
    if (p.armRib) D(M(So) + Q(ctrl, Ap), 'rib-edge');
    if (strapMode === 'wide' && !racer) D(M(NR) + L(So), 'seam-soft');
  } else {
    const sl = SLEEVES[p.sleeve] || SLEEVES.long;
    const a = (sl.a * Math.PI) / 180;
    const d = [Math.sin(a), Math.cos(a)];
    const n = [Math.cos(a), -Math.sin(a)];
    const Lx = sl.L - drop * 22;
    const C1 = add(S, d, Lx);
    const C2 = add(C1, n, -sl.cw * p.sleeveW);
    sleeve = { S, C1, C2, A, d, n, sl };
    if (p.sleeveW > 1.15) {
      // voluminous sleeve: bulge outwards in the middle
      const mid = add(lerp(S, C1, 0.55), n, 14 * (p.sleeveW - 1) * 2);
      const midIn = add(lerp(A, C2, 0.55), n, -14 * (p.sleeveW - 1) * 2);
      right = L(S) + spline([S, mid, C1], 0.9) + L(C2) + spline([C2, midIn, A], 0.9) + sideToHem(A);
    } else {
      // Curved shoulder, gently tapered sleeve, rounded cuff and a soft armpit instead of hard corners.
      const A1 = lerp(C2, A, 0.84), A2 = P(A[0] - 1, A[1] + 14);
      right = Q(P(mid(NR, S)[0], mid(NR, S)[1] - 4), S)
        + Q(add(mid(S, C1), n, 3.5), C1)
        + Q(add(mid(C1, C2), d, 3), C2)
        + Q(add(mid(C2, A1), n, -2), A1)
        + Q(A, A2)
        + sideToHem(A2);
    }
  }

  function sideToHem(from) {
    // a slight waist curve even on straight garments reads as fabric rather than a box
    const waist = P(cx + Math.min(w, hw) - 3 - (p.flare < 0.95 ? 4 : 0), (from[1] + Lh) / 2 + 20);
    return spline([from, waist, H], 0.8);
  }

  // ── Hem ───────────────────────────────────────────────────────────
  const HL = P(2 * cx - H[0], H[1]);
  let hemPath;
  if (p.hem === 'curved') {
    const Hr = P(H[0], Lh - 16), Hl = P(HL[0], Lh - 16);
    hemPath = { r: Hr, l: Hl, d: C(P(cx + hw * 0.55, Lh + 14), P(cx - hw * 0.55, Lh + 14), Hl) };
  } else if (p.hem === 'point') {
    hemPath = { r: H, l: HL, d: L(P(cx, Lh + 26), HL) };
  } else if (p.hem === 'brief') {
    hemPath = { r: H, l: HL, d: Q(P(cx + 40, Lh + 10), P(cx + 30, Lh + 74)) + L(P(cx - 30, Lh + 74)) + Q(P(cx - 40, Lh + 10), HL) };
  } else {
    hemPath = { r: H, l: HL, d: Q(P(cx, Lh + 3), HL) };
  }
  // if curved, the side ends a bit higher: adjust final point
  const rightPath = p.hem === 'curved' ? right.replace(new RegExp(`${H[0]} ${H[1]}$`), `${hemPath.r[0]} ${hemPath.r[1]}`) : right;

  // mirror right side for the left: we rebuild by mirroring the numeric path
  const leftPath = mirrorPathReverse(NR, rightPath, cx);

  // ── Top edge (neck / hood / straps) ──────────────────────────────
  const NL = P(cx - nw, sy - 6);
  let topEdge;
  let outline;
  if (strapMode === 'thin' || strapMode === 'none' || strapMode === 'halter') {
    const ty = strapMode === 'halter' ? sy + 6 : sy + 74;
    const AR = P(cx + w - 2, sy + 100), ALp = P(cx - w + 2, sy + 100);
    let edge;
    if (strapMode === 'halter') {
      edge = M(ALp) + Q(P(cx - 30, sy + 50), P(cx - 18, sy + 2)) + Q(P(cx, sy - 6), P(cx + 18, sy + 2)) + Q(P(cx + 30, sy + 50), AR);
    } else if (p.neck === 'sweetheart' && !back) {
      edge = M(ALp) + spline([ALp, P(cx - w * 0.55, ty - 12), P(cx - 10, ty + 10), P(cx, ty + 18)]) + spline([P(cx, ty + 18), P(cx + 10, ty + 10), P(cx + w * 0.55, ty - 12), AR]);
    } else if (p.neck === 'v' && !back) {
      edge = M(ALp) + Q(P(cx - w * 0.5, ty - 6), P(cx, ty + 34)) + Q(P(cx + w * 0.5, ty - 6), AR);
    } else {
      edge = M(ALp) + Q(P(cx, ty + (back ? 8 : 4)), AR);
    }
    const sideR = sideToHemFrom(AR);
    const sideL = sideToHemFrom(ALp, true);
    outline = edge + sideR + hemPath.d.replace(/^/, '') + sideL + ' Z';
    topBodyY = ty;
    if (strapMode === 'thin') {
      const s1 = P(cx + w * 0.62, ty - 4), s2 = P(cx + nw * 0.7, sy - 8);
      out.push({ d: M(s1) + Q(P(cx + nw + 6, sy + 10), s2), s: 'strap' });
      out.push({ d: M(mirrorX([s1])[0]) + Q(P(cx - nw - 6, sy + 10), mirrorX([s2])[0]), s: 'strap' });
      if (back && p.back === 'cross') {
        out.push({ d: M(P(cx - nw * 0.7, sy - 8)) + L(P(cx + w * 0.5, ty + 6)), s: 'strap' });
        out.push({ d: M(P(cx + nw * 0.7, sy - 8)) + L(P(cx - w * 0.5, ty + 6)), s: 'strap' });
      }
    }
    if (strapMode === 'halter') {
      out.push({ d: M(P(cx - 16, sy + 2)) + Q(P(cx - 20, sy - 44), P(cx, sy - 46)) + Q(P(cx + 20, sy - 44), P(cx + 16, sy + 2)), s: 'strap' });
    }
    function sideToHemFrom(Ap, left = false) {
      if (!left) {
        const Hx = p.hem === 'curved' ? hemPath.r : H;
        return Math.abs(hw - w) < 2 ? L(Hx) : spline([Ap, P(cx + Math.min(w, hw) - 4, (Ap[1] + Lh) / 2 + 20), Hx], 0.8);
      }
      return Math.abs(hw - w) < 2 ? L(Ap) : spline([HL, P(cx - Math.min(w, hw) + 4, (Ap[1] + Lh) / 2 + 20), Ap], 0.8);
    }
  } else {
    if (hood) {
      const hb = sy - 2;
      const hpts = [P(cx - nw, hb), P(cx - nw - 18, sy - 50), P(cx - 66, sy - 116), P(cx - 24, sy - 150), P(cx + 24, sy - 150), P(cx + 66, sy - 116), P(cx + nw + 18, sy - 50), P(cx + nw, hb)];
      topEdge = M(NL) + spline(hpts.map((q, i) => (i === 0 ? NL : i === hpts.length - 1 ? NR : q)), 0.9);
    } else if (p.neck === 'turtle' || p.neck === 'mock') {
      const th = p.neck === 'turtle' ? 50 : 24;
      topEdge = M(NL) + L(P(cx - nw + 3, sy - 6 - th)) + Q(P(cx, sy - 10 - th), P(cx + nw - 3, sy - 6 - th)) + L(NR);
    } else if (['collar', 'polo', 'camp', 'lapel', 'shawl'].includes(p.neck)) {
      topEdge = M(NL) + Q(P(cx, sy - 20), NR);
    } else if (p.neck === 'scoop' && strapMode === 'wide' && !back) {
      topEdge = M(NL) + Q(P(cx, sy - 2), NR);
    } else {
      topEdge = M(NL) + Q(P(cx, sy - 10), NR);
    }
    outline = topEdge + rightPath + hemPath.d + leftPath + ' Z';
  }

  // ── Accent parts (varsity sleeves, ringer bands) ─────────────────
  if (p.varsity && sleeve) {
    const sd = p.raglan
      ? M(P(cx + nw, sy - 6)) + L(sleeve.S, sleeve.C1, sleeve.C2, sleeve.A) + Q(P(cx + nw + 30, sy + 40), P(cx + nw + 4, sy - 4)) + ' Z'
      : M(sleeve.S) + L(sleeve.C1, sleeve.C2, sleeve.A) + Q(P(sleeve.S[0] - 6, (sleeve.S[1] + sleeve.A[1]) / 2), sleeve.S) + ' Z';
    parts.push({ d: sd, fill: 'accent' });
    parts.push({ d: mirrorD(sd, cx), fill: 'accent' });
  }

  // ── Sleeve seams & cuffs ─────────────────────────────────────────
  if (sleeve) {
    const { S: s, C1, C2, A: a, d } = sleeve;
    if (p.raglan) {
      const rs = M(P(cx + nw + 6, sy - 3)) + Q(P(cx + nw + 30, sy + 40), a);
      D(rs, 'seam'); D(mirrorD(rs, cx), 'seam');
    } else {
      const as = M(s) + Q(P(s[0] - 8, (s[1] + a[1]) / 2), a);
      D(as, 'seam'); D(mirrorD(as, cx), 'seam');
      const sh = M(NR) + L(s);
      if (back) { D(sh, 'seam-soft'); D(mirrorD(sh, cx), 'seam-soft'); }
    }
    const cuffOn = p.cuffs && p.sleeve !== 'cap';
    if (cuffOn || p.ringer) {
      const cl = p.cuffStyle === 'shirt' ? 30 : p.sleeve === 'short' ? 14 : 26;
      const c1 = add(C1, d, -cl), c2 = add(C2, d, -cl);
      const cd = poly([c1, C1, C2, c2]);
      const kind = p.ringer ? 'accent' : p.ribAccent ? 'rib-dark' : p.cuffStyle === 'shirt' ? 'panel' : 'rib';
      D(cd, kind); D(mirrorD(cd, cx), kind);
      if (p.cuffStyle === 'shirt') {
        const b = lerp(lerp(c1, C1, 0.5), lerp(c2, C2, 0.5), 0.25);
        D(circle(b[0], b[1], 3.2), 'button'); D(circle(2 * cx - b[0], b[1], 3.2), 'button');
        const pl = M(lerp(c1, c2, 0.3)) + L(add(lerp(c1, c2, 0.3), d, -38));
        D(pl, 'seam-soft'); D(mirrorD(pl, cx), 'seam-soft');
      }
      if (p.stripedRib) {
        const s1 = M(lerp(c1, C1, 0.35)) + L(lerp(c2, C2, 0.35));
        const s2 = M(lerp(c1, C1, 0.65)) + L(lerp(c2, C2, 0.65));
        for (const sd of [s1, s2]) { D(sd, 'accent-line'); D(mirrorD(sd, cx), 'accent-line'); }
      }
    }
    if (p.stripes) {
      const [o1, o2] = [add(s, sleeve.n, -8), add(C1, sleeve.n, -8)];
      const [i1, i2] = [add(s, sleeve.n, -18), add(C1, sleeve.n, -18)];
      const sd = poly([o1, o2, i2, i1]);
      D(sd, 'accent'); D(mirrorD(sd, cx), 'accent');
    }
    if (p.sleeveTab && !back) {
      const m = lerp(s, C1, 0.3); const q = add(m, sleeve.n, -16);
      D(rect(2 * cx - q[0] - 14, q[1] - 10, 28, 22, 3), 'panel');
      D(M(P(2 * cx - q[0] - 10, q[1] - 4)) + L(P(2 * cx - q[0] + 10, q[1] - 4)), 'zip-small');
    }
    if (p.thumbholes) {
      const th = lerp(C1, C2, 0.55); D(circle(th[0], th[1] - 6, 3), 'interior'); D(circle(2 * cx - th[0], th[1] - 6, 3), 'interior');
    }
    if (p.quilt) {
      const n = Math.max(2, Math.floor(sleeve.sl.L / p.quilt));
      for (let i = 1; i < n; i++) {
        const t = i / n;
        const sd = M(lerp(s, C1, t)) + L(lerp(a, C2, t));
        D(sd, 'seam-soft'); D(mirrorD(sd, cx), 'seam-soft');
      }
    }
  }

  // ── Neckline & collars ───────────────────────────────────────────
  if (!strapMode || strapMode === 'wide') {
    neckline();
  }
  function neckline() {
    const n = p.neck;
    if (hood) {
      if (back) {
        D(M(P(cx, sy - 148)) + Q(P(cx + 4, sy - 60), P(cx, sy + 6)), 'seam');
        D(M(P(cx - nw - 6, sy + 2)) + Q(P(cx, sy + 26), P(cx + nw + 6, sy + 2)), 'seam');
        if (p.furHood) D(M(NL) + spline([NL, P(cx - nw - 18, sy - 50), P(cx - 66, sy - 116), P(cx - 24, sy - 150)]), 'fur');
      } else {
        const zip = p.open === 'zip';
        const open = zip
          ? M(P(cx - 2, sy + 34)) + spline([P(cx - 2, sy + 34), P(cx - nw + 4, sy - 4), P(cx - 48, sy - 84), P(cx, sy - 124), P(cx + 48, sy - 84), P(cx + nw - 4, sy - 4), P(cx + 2, sy + 34)]) + ' Z'
          : M(P(cx - nw + 8, sy + 6)) + spline([P(cx - nw + 8, sy + 6), P(cx - 50, sy - 80), P(cx, sy - 122), P(cx + 50, sy - 80), P(cx + nw - 8, sy + 6)]) + Q(P(cx, sy + 30), P(cx - nw + 8, sy + 6)) + ' Z';
        D(open, 'interior');
        D(open, 'hood-edge');
        if (p.furHood) D(open, 'fur');
        if (p.drawcord || zip) {
          const cy0 = sy + 16;
          D(M(P(cx - 16, cy0)) + Q(P(cx - 20, cy0 + 50), P(cx - 14, cy0 + 96)), 'cord');
          D(M(P(cx + 16, cy0)) + Q(P(cx + 22, cy0 + 50), P(cx + 18, cy0 + 90)), 'cord');
          D(rect(cx - 17, cy0 + 94, 6, 12, 2), 'metal');
          D(rect(cx + 15, cy0 + 88, 6, 12, 2), 'metal');
        }
      }
      return;
    }
    if (back) {
      if (n === 'turtle' || n === 'mock') {
        const th = n === 'turtle' ? 50 : 24;
        ribZone(M(NL) + L(P(cx - nw + 3, sy - 6 - th)) + Q(P(cx, sy - 10 - th), P(cx + nw - 3, sy - 6 - th)) + L(NR) + Q(P(cx, sy + 4), NL) + ' Z', 'rib');
        if (n === 'turtle') D(M(P(cx - nw + 1, sy - 30)) + Q(P(cx, sy - 26), P(cx + nw - 1, sy - 30)), 'seam-soft');
      } else if (['collar', 'polo', 'camp', 'lapel', 'shawl'].includes(n)) {
        const cd = M(NL) + Q(P(cx, sy - 20), NR) + L(P(cx + nw + 14, sy + 10)) + Q(P(cx, sy + 22), P(cx - nw - 14, sy + 10)) + ' Z';
        D(cd, p.rugby ? 'accent' : 'panel');
      } else {
        D(M(NL) + Q(P(cx, sy - 10), NR) + L(P(cx + nw - 2, sy + 2)) + Q(P(cx, sy - 2), P(cx - nw + 2, sy + 2)) + ' Z', p.ringer ? 'accent' : 'rib');
      }
      return;
    }
    const backEdge = M(NL) + Q(P(cx, sy - 10), NR);
    const front = (depth, wide = 0) => {
      const fr = M(P(cx - nw - wide, sy - 6)) + Q(P(cx, sy + depth * 2), P(cx + nw + wide, sy - 6));
      return fr;
    };
    switch (n) {
      case 'crew': case 'scoop': case 'boat': {
        const depth = n === 'scoop' ? 46 : n === 'boat' ? 10 : 22;
        const inner = M(NL) + Q(P(cx, sy - 10), NR) + Q(P(cx, sy + depth * 2 - 4), NL) + ' Z';
        D(inner, 'interior');
        const band = M(NL) + Q(P(cx, sy + depth * 2 - 4), NR) + L(P(cx + nw + 8, sy - 3)) + Q(P(cx, sy + depth * 2 + 18), P(cx - nw - 8, sy - 3)) + ' Z';
        D(band, p.ringer ? 'accent' : strapMode ? 'binding' : 'rib');
        if (p.vNotch) D(poly([P(cx - 9, sy + depth + 9), P(cx + 9, sy + depth + 9), P(cx, sy + depth + 26)]), 'rib-dark');
        if (p.gathered) for (let i = -4; i <= 4; i++) D(M(P(cx + i * 12, sy + depth + 16 - Math.abs(i) * 3)) + L(P(cx + i * 13, sy + depth + 40 - Math.abs(i) * 3)), 'fold');
        break;
      }
      case 'v': case 'deepv': {
        const vd = n === 'deepv' ? 130 : (strapMode ? 70 : 62);
        D(M(NL) + Q(P(cx, sy - 10), NR) + L(P(cx, sy + vd)) + ' Z', 'interior');
        D(M(NL) + L(P(cx, sy + vd), NR) + L(P(cx + nw + 9, sy - 4), P(cx, sy + vd + 16), P(cx - nw - 9, sy - 4)) + ' Z', p.open === 'buttons' ? 'panel' : 'rib');
        break;
      }
      case 'square': {
        D(M(NL) + Q(P(cx, sy - 10), NR) + L(P(cx + nw, sy + 40), P(cx - nw, sy + 40)) + ' Z', 'interior');
        D(poly([NL, P(cx - nw, sy + 40), P(cx + nw, sy + 40), NR, P(cx + nw + 8, sy - 4), P(cx + nw + 8, sy + 48), P(cx - nw - 8, sy + 48), P(cx - nw - 8, sy - 4)]), 'binding');
        break;
      }
      case 'turtle': case 'mock': {
        const th = n === 'turtle' ? 50 : 24;
        ribZone(M(NL) + L(P(cx - nw + 3, sy - 6 - th)) + Q(P(cx, sy - 10 - th), P(cx + nw - 3, sy - 6 - th)) + L(NR) + Q(P(cx, sy + 10), NL) + ' Z', p.ribAccent ? 'rib-dark' : 'rib');
        D(M(P(cx - nw + 3, sy - 6 - th)) + Q(P(cx, sy - th + 8), P(cx + nw - 3, sy - 6 - th)), 'interior-line');
        if (n === 'turtle') D(M(P(cx - nw + 1, sy - 30)) + Q(P(cx, sy - 22), P(cx + nw - 1, sy - 30)), 'seam-soft');
        break;
      }
      case 'henley': {
        D(M(NL) + Q(P(cx, sy - 10), NR) + Q(P(cx, sy + 40), NL) + ' Z', 'interior');
        D(M(NL) + Q(P(cx, sy + 40), NR) + L(P(cx + nw + 8, sy - 3)) + Q(P(cx, sy + 60), P(cx - nw - 8, sy - 3)) + ' Z', 'rib');
        D(rect(cx - 9, sy + 26, 18, 78, 2), 'panel');
        for (const y of [sy + 44, sy + 66, sy + 88]) D(circle(cx, y, 3.4), 'button');
        break;
      }
      case 'polo': case 'collar': {
        const isPolo = n === 'polo';
        D(poly([P(cx - 12, sy - 4), P(cx + 12, sy - 4), P(cx, sy + 26)]), 'interior');
        const lc = poly([NL, P(cx - nw - 12, sy + 12), P(cx - 14, sy + 46), P(cx, sy + 24)]);
        const rc = mirrorD(lc, cx);
        const ck = p.rugby ? 'accent' : 'collar';
        D(lc, ck); D(rc, ck);
        if (p.bdCollar) { D(circle(cx - 20, sy + 36, 2.4), 'button'); D(circle(cx + 20, sy + 36, 2.4), 'button'); }
        if (isPolo) {
          D(rect(cx - 10, sy + 22, 20, 84, 2), p.rugby ? 'accent' : 'panel');
          for (const y of [sy + 42, sy + 64, sy + 86]) D(circle(cx, y, 3.4), 'button');
        }
        break;
      }
      case 'camp': {
        D(M(NL) + Q(P(cx, sy - 10), NR) + L(P(cx + 4, sy + 74), P(cx - 4, sy + 74)) + ' Z', 'interior');
        const lc = poly([NL, P(cx - nw - 22, sy + 4), P(cx - nw - 2, sy + 52), P(cx - 4, sy + 74), P(cx - 10, sy + 30)]);
        D(lc, 'collar'); D(mirrorD(lc, cx), 'collar');
        break;
      }
      case 'lapel': case 'shawl': {
        const vb = p.biker ? sy + 70 : p.open === 'double' ? sy + 140 : sy + 168;
        D(M(NL) + Q(P(cx, sy - 10), NR) + L(P(cx, vb)) + ' Z', 'interior');
        if (n === 'shawl') {
          const lc = M(NL) + spline([NL, P(cx - nw - 18, sy + 30), P(cx - 22, vb - 40), P(cx, vb)]) + L(P(cx - 8, vb - 20)) + spline([P(cx - 8, vb - 20), P(cx - 18, sy + 50), P(cx - nw + 6, sy + 4)]) + ' Z';
          D(lc, 'collar'); D(mirrorD(lc, cx), 'collar');
        } else {
          const lw = p.wideLapel ? 34 : 24;
          const lc = poly([NL, P(cx - nw - 16, sy + 8), P(cx - nw - 10, sy + 48), P(cx - nw - lw - 4, sy + 58), P(cx - 6, vb), P(cx - nw + 10, sy + 12)]);
          D(lc, 'collar'); D(mirrorD(lc, cx), 'collar');
          D(M(P(cx - nw - 10, sy + 48)) + L(P(cx - nw + 4, sy + 46)), 'seam');
          D(M(P(cx + nw + 10, sy + 48)) + L(P(cx + nw - 4, sy + 46)), 'seam');
        }
        break;
      }
      case 'halter': case 'sweetheart': case 'strapless': break;
      default: {
        D(M(NL) + Q(P(cx, sy - 10), NR) + Q(P(cx, sy + 40), NL) + ' Z', 'interior');
      }
    }
  }
  function ribZone(d, kind) { D(d, kind); }

  // ── Front openings ───────────────────────────────────────────────
  const neckBottom = (() => {
    const n = p.neck;
    if (strapMode && strapMode !== 'wide') return topBodyY + 10;
    if (hood) return p.open === 'zip' ? sy + 34 : sy + 30;
    if (n === 'turtle' || n === 'mock') return sy + 8;
    if (n === 'v') return sy + 62;
    if (n === 'deepv') return sy + 130;
    if (n === 'collar' || n === 'polo') return sy + 24;
    if (n === 'camp') return sy + 74;
    if (n === 'lapel' || n === 'shawl') return p.biker ? sy + 70 : p.open === 'double' ? sy + 140 : sy + 168;
    return sy + 24;
  })();
  const hemTop = ribHem ? Lh - 26 : Lh;
  const hemBottom = p.hem === 'curved' ? Lh + 6 : Lh;
  if (!back) {
    switch (p.open) {
      case 'zip': {
        const z = M(P(cx, neckBottom - (p.neck === 'mock' ? 30 : 0))) + L(P(cx, hemBottom));
        D(z, 'zip');
        D(rect(cx - 4, neckBottom + 2 - (p.neck === 'mock' ? 30 : 0), 8, 16, 2), 'metal');
        if (p.placket) {
          D(rect(cx - 2, neckBottom, 18, hemBottom - neckBottom, 0), 'panel');
          for (const q of along(P(cx + 8, neckBottom), P(cx + 8, hemBottom), 5)) D(circle(q[0], q[1], 3), 'metal');
        }
        break;
      }
      case 'halfzip': case 'quarterzip': {
        const top0 = p.neck === 'mock' ? sy - 26 : neckBottom;
        const end = p.open === 'halfzip' ? sy + 160 : sy + 96;
        D(M(P(cx, top0)) + L(P(cx, end)), 'zip');
        D(rect(cx - 2, top0 - 2, 4, end - top0 + 4, 1), 'seam-soft');
        D(rect(cx - 4, top0 + 2, 8, 16, 2), 'metal');
        break;
      }
      case 'asymzip': {
        D(M(P(cx + 34, sy + 30)) + Q(P(cx + 26, sy + 140), P(cx + 22, hemBottom)), 'zip');
        D(rect(cx + 30, sy + 40, 8, 16, 2), 'metal');
        break;
      }
      case 'buttons': case 'snap': {
        const pl = rect(cx - 10, neckBottom, 20, hemBottom - neckBottom - (p.hem === 'curved' ? 4 : 0), 0);
        D(pl, 'placket');
        const n = Math.max(3, Math.round((hemBottom - neckBottom) / 54));
        for (const q of along(P(cx, neckBottom + 10), P(cx, hemTop - 12), n, true)) D(circle(q[0], q[1], p.open === 'snap' ? 4.2 : 3.6), p.open === 'snap' ? 'metal' : 'button');
        break;
      }
      case 'buttons2': {
        const y0 = neckBottom;
        D(M(P(cx, y0)) + L(P(cx - 2, Lh - 40)) + Q(P(cx - 6, Lh - 6), P(cx - 34, Lh)), 'seam');
        D(circle(cx - 4, y0 + 20, 4.4), 'button'); D(circle(cx - 4, y0 + 74, 4.4), 'button');
        break;
      }
      case 'double': {
        D(M(P(cx + 30, neckBottom - 8)) + L(P(cx + 30, hemBottom)), 'seam');
        for (let i = 0; i < 3; i++) {
          const y = neckBottom + 16 + i * 52;
          if (y > hemTop - 30) break;
          D(circle(cx - 26, y, 4.6), 'button'); D(circle(cx + 18, y, 4.6), 'button');
        }
        break;
      }
    }
  } else if (p.open === 'double' || p.len > 500) {
    D(M(P(cx, sy + 30)) + L(P(cx, Lh)), 'seam-soft');
    D(M(P(cx, Lh - 90)) + L(P(cx + 6, Lh)), 'seam');
  }

  // ── Pockets ──────────────────────────────────────────────────────
  if (!back) {
    const pk = p.pocket;
    const py = hemTop;
    if (pk === 'kangaroo' || pk === 'split') {
      const y0 = py - 120, y1 = py - 6;
      const kd = M(P(cx - 62, y0)) + L(P(cx + 62, y0)) + Q(P(cx + 72, y0 + 50), P(cx + 86, y1 - 30)) + L(P(cx + 82, y1)) + L(P(cx - 82, y1)) + L(P(cx - 86, y1 - 30)) + Q(P(cx - 72, y0 + 50), P(cx - 62, y0)) + ' Z';
      D(kd, 'pocket');
      D(M(P(cx + 62, y0)) + Q(P(cx + 72, y0 + 50), P(cx + 86, y1 - 30)), 'rib-edge');
      D(M(P(cx - 62, y0)) + Q(P(cx - 72, y0 + 50), P(cx - 86, y1 - 30)), 'rib-edge');
    }
    if (pk === 'chest' || pk === 'patch3') {
      D(M(P(cx + 32, sy + 54)) + L(P(cx + 76, sy + 54), P(cx + 76, sy + 96)) + Q(P(cx + 76, sy + 102), P(cx + 70, sy + 102)) + L(P(cx + 38, sy + 102)) + Q(P(cx + 32, sy + 102), P(cx + 32, sy + 96)) + ' Z', 'pocket');
    }
    if (pk === 'flapChest') {
      for (const s of [1, -1]) {
        const x0 = cx + s * 30, x1 = cx + s * 80;
        D(poly([P(x0, sy + 60), P(x1, sy + 60), P(x1, sy + 112), P((x0 + x1) / 2, sy + 118), P(x0, sy + 112)]), 'pocket');
        D(poly([P(x0 - s * 2, sy + 56), P(x1 + s * 2, sy + 56), P(x1 + s * 2, sy + 76), P((x0 + x1) / 2, sy + 84), P(x0 - s * 2, sy + 76)]), 'flap');
        D(circle((x0 + x1) / 2, sy + 76, 3.2), p.open === 'snap' ? 'metal' : 'button');
      }
    }
    if (pk === 'flap2' || pk === 'patch2' || pk === 'patch3') {
      const y0 = Math.min(py - 110, sy + (Lh - sy) * 0.55);
      for (const s of [1, -1]) {
        const x0 = cx + s * 24, x1 = cx + s * (Math.min(w, hw) - 10);
        if (pk === 'flap2') {
          D(M(P(x0, y0 + 8)) + L(P(x1, y0 + 8)), 'seam');
          D(poly([P(x0, y0 + 8), P(x1, y0 + 8), P(x1, y0 + 34), P(x0, y0 + 34)]), 'flap');
        } else {
          D(poly([P(x0, y0), P(x1, y0), P(x1, y0 + 66), P(x0, y0 + 66)]), 'pocket');
        }
      }
    }
    if (pk === 'welt') {
      const y0 = Math.min(py - 80, sy + (Lh - sy) * 0.6);
      for (const s of [1, -1]) D(poly([P(cx + s * 44, y0), P(cx + s * 72, y0 - 10), P(cx + s * 78, y0 + 40), P(cx + s * 50, y0 + 50)]), 'welt');
    }
    if (pk === 'zip2') {
      for (const s of [1, -1]) D(M(P(cx + s * 40, Lh - 110)) + L(P(cx + s * 80, Lh - 60)), 'zip-small');
      D(M(P(cx - 40, sy + 60)) + L(P(cx - 80, sy + 76)), 'zip-small');
    }
    if (pk === 'zipLow') {
      for (const s of [1, -1]) D(M(P(cx + s * 60, hemTop - 110)) + L(P(cx + s * 70, hemTop - 30)), 'zip-small');
    }
    if (p.breast) D(poly([P(cx + 36, sy + 80), P(cx + 72, sy + 74), P(cx + 72, sy + 82), P(cx + 36, sy + 88)]), 'welt');
  }

  // ── Hem treatments ───────────────────────────────────────────────
  if (ribHem) {
    const band = M(P(cx - hw + hemInset - 0.5, Lh - 26)) + L(P(cx + hw - hemInset + 0.5, Lh - 26), P(cx + hw - hemInset, Lh)) + Q(P(cx, Lh + 3), P(cx - hw + hemInset, Lh)) + ' Z';
    D(band, p.hem === 'band' ? 'band' : p.ringer ? 'accent' : p.ribAccent ? 'rib-dark' : 'rib');
    if (p.stripedRib) { D(M(P(cx - hw, Lh - 18)) + L(P(cx + hw, Lh - 18)), 'accent-line'); D(M(P(cx - hw, Lh - 10)) + L(P(cx + hw, Lh - 10)), 'accent-line'); }
  } else if (p.hem === 'drawcord') {
    D(M(P(cx - hw, Lh - 18)) + L(P(cx + hw, Lh - 18)), 'stitch');
    out.push({ d: M(P(cx + hw - 14, Lh - 10)) + L(P(cx + hw - 8, Lh + 26)), s: 'cord' });
    out.push({ d: M(P(cx - hw + 14, Lh - 10)) + L(P(cx - hw + 8, Lh + 26)), s: 'cord' });
    out.push({ d: rect(cx + hw - 13, Lh + 22, 10, 12, 3), s: 'toggle' });
    out.push({ d: rect(cx - hw + 3, Lh + 22, 10, 12, 3), s: 'toggle' });
  } else if (p.hem !== 'brief' && p.hem !== 'point') {
    const hy = p.hem === 'curved' ? null : Lh - 10;
    if (hy) D(M(P(cx - hw + 2, hy)) + Q(P(cx, hy + 3), P(cx + hw - 2, hy)), 'stitch');
    else D(M(P(cx - hw + 2, Lh - 26)) + C(P(cx - hw * 0.55, Lh + 4), P(cx + hw * 0.55, Lh + 4), P(cx + hw - 2, Lh - 26)), 'stitch');
  }

  // ── Extras ───────────────────────────────────────────────────────
  if (p.quilt) {
    for (let y = sy + 40; y < hemTop - 10; y += p.quilt) D(M(P(cx - w - 4, y)) + Q(P(cx, y + 6), P(cx + w + 4, y)), 'seam-soft');
  }
  if (p.belt) {
    const by = Math.round(sy + (Lh - sy) * (p.biker ? 0.88 : 0.42));
    const bw = Math.max(w, hw) + 6;
    D(rect(cx - bw, by, bw * 2, 20, 0), 'band');
    if (!back) {
      D(rect(cx - 13, by - 3, 26, 26, 3), 'buckle');
      if (!p.biker) {
        out.push({ d: M(P(cx + 10, by + 22)) + Q(P(cx + 22, by + 80), P(cx + 14, by + 120)), s: 'belt-tie', fill: true });
        out.push({ d: M(P(cx - 4, by + 22)) + Q(P(cx - 18, by + 70), P(cx - 26, by + 108)), s: 'belt-tie', fill: true });
      }
    }
  }
  if (p.yoke) {
    if (back) {
      D(M(P(cx - w - 10, sy + 56)) + L(P(cx - 30, sy + 64), P(cx, sy + 84), P(cx + 30, sy + 64), P(cx + w + 10, sy + 56)), 'seam');
    } else {
      const yd = M(P(cx - w - 12, sy + 34)) + L(P(cx - 50, sy + 44), P(cx - 26, sy + 64), P(cx - 10, sy + 50));
      D(yd, 'seam'); D(mirrorD(yd, cx), 'seam');
    }
  } else if (back && ['collar', 'camp'].includes(p.neck)) {
    D(M(P(cx - w - 10, sy + 52)) + Q(P(cx, sy + 56), P(cx + w + 10, sy + 52)), 'seam');
    D(M(P(cx, sy + 54)) + L(P(cx, sy + 92)), 'seam-soft');
  }
  if (p.epaulets) {
    for (const s of [1, -1]) {
      const a0 = P(cx + s * (nw + 10), sy - 2), a1 = P(cx + s * (w + 10 + drop * 22), sy + 10 + drop * 22);
      const nn = norm([-(a1[1] - a0[1]), a1[0] - a0[0]]);
      D(poly([add(a0, nn, -7), add(a1, nn, -7), add(a1, nn, 7), add(a0, nn, 7)]), 'flap');
      D(circle(a0[0] + s * 8, a0[1] + 1, 3), 'button');
    }
  }
  if (p.panels) {
    for (const s of [1, -1]) D(M(P(cx + s * (w - 4), sy + 110)) + Q(P(cx + s * (w - 40), (sy + Lh) / 2), P(cx + s * (hw - 24), hemTop)), 'seam');
  }
  if (p.boning) {
    for (const x of [-50, -22, 22, 50]) D(M(P(cx + x, topBodyY + 22)) + L(P(cx + x * 0.9, Lh - 6)), 'seam');
    if (!back) D(M(P(cx, topBodyY + 26)) + L(P(cx, Lh + 18)), 'seam');
    else for (const q of along(P(cx, topBodyY + 20), P(cx, Lh - 8), 7)) { D(circle(q[0] - 10, q[1], 2), 'metal'); D(circle(q[0] + 10, q[1], 2), 'metal'); }
  }
  if (p.contrast) det.forEach((x) => { if (x.s === 'stitch') x.s = 'stitch-contrast'; });
  if (back && p.back === 'racer' && strapMode === 'wide') {
    D(M(P(cx - nw * 0.5, sy - 2)) + Q(P(cx, sy + 30), P(cx + nw * 0.5, sy - 2)), 'binding-line');
  }

  // ── Natural fabric folds & light (soft shading, drawn over artwork too) ──
  const folds = [];
  const F = (d, k, both = true) => { folds.push({ d, k }); if (both) folds.push({ d: mirrorD(d, cx), k }); };
  const bodyTop = topBodyY ?? (sy + 40);
  const hemY = ribHem ? Lh - 28 : Lh - 6;
  if (sleeve) {
    const { S: s0, C1, C2, A: a0, n } = sleeve;
    // drag folds from the armpit into the body
    F(M(P(a0[0] - 4, a0[1] + 8)) + Q(P(a0[0] - 26, a0[1] + 46), P(a0[0] - 16, Math.min(hemY - 10, a0[1] + 104))), 'shadow');
    F(M(P(a0[0] - 2, a0[1] + 4)) + Q(P(a0[0] - 16, a0[1] + 26), P(a0[0] - 12, a0[1] + 52)), 'crease');
    // sleeve folds
    const ts = ['long', 'threeq', 'elbow'].includes(p.sleeve) ? [0.38, 0.62, 0.84] : p.sleeve === 'short' ? [0.45] : [];
    for (const t of ts) {
      const a = lerp(a0, C2, t), b = lerp(s0, C1, t - 0.05);
      const e = lerp(a, b, 0.62);
      F(M(a) + Q(add(mid(a, e), n, -4), e), 'shadow');
      F(M(lerp(a, e, 0.1)) + Q(add(mid(a, e), n, -3), lerp(a, e, 0.8)), 'crease');
    }
    // light catching the top of the (viewer's left) shoulder and sleeve
    const ls = M(lerp(NR, s0, 0.35)) + Q(add(s0, n, -10), add(lerp(s0, C1, 0.55), n, -12));
    folds.push({ d: mirrorD(ls, cx), k: 'light' });
    folds.push({ d: ls, k: 'lightSoft' });
  }
  // body drape: soft shadows near the sides, a highlight left of centre (light from upper left)
  F(M(P(cx + w * 0.64, bodyTop + 60)) + Q(P(cx + w * 0.5, (bodyTop + hemY) / 2 + 20), P(cx + hw * 0.6, hemY)), 'shadow');
  folds.push({ d: M(P(cx - w * 0.3, bodyTop + 40)) + Q(P(cx - w * 0.36, (bodyTop + hemY) / 2), P(cx - w * 0.26, hemY - 30)), k: 'light' });
  folds.push({ d: M(P(cx + w * 0.12, bodyTop + 70)) + Q(P(cx + w * 0.2, (bodyTop + hemY) / 2 + 30), P(cx + w * 0.1, hemY - 20)), k: 'shadowSoft' });
  // small ripples at the hem
  for (const f of [-0.62, -0.2, 0.28, 0.7]) folds.push({ d: M(P(cx + hw * f, hemY - 2)) + Q(P(cx + hw * f + 5, hemY - 26), P(cx + hw * f + 2, hemY - 48)), k: 'crease' });
  // gentle shadow just below the neckline
  if (!strapMode || strapMode === 'wide') folds.push({ d: M(P(cx - nw - 4, sy + 6)) + Q(P(cx, sy + (p.neck === 'v' ? 70 : 42)), P(cx + nw + 4, sy + 6)), k: 'shadowSoft' });

  return { outline, parts, details: det, outside: out, folds };
}

// ─────────────────────────────────────────────────────────────────
// Path mirroring utilities
// ─────────────────────────────────────────────────────────────────

/** Mirror every x coordinate of an absolute path string around cx. */
export function mirrorD(d, cx = 200) {
  // Works for absolute M/L/Q/C/Z and our relative 'a'/'h'/'v' circle/rect forms.
  const tokens = d.match(/[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?/g) || [];
  let out = [], cmd = '', i = 0, argi = 0;
  const arity = { M: 2, L: 2, Q: 4, C: 6, Z: 0, a: 7, h: 1, v: 1 };
  while (i < tokens.length) {
    const tk = tokens[i];
    if (/[A-Za-z]/.test(tk)) { cmd = tk; out.push(tk); argi = 0; i++; continue; }
    let n = parseFloat(tk);
    if ('MLQC'.includes(cmd)) { if (argi % 2 === 0) n = 2 * cx - n; }
    else if (cmd === 'a') { const k = argi % 7; if (k === 5) n = -n; if (k === 4) n = n ? 0 : 1; }
    else if (cmd === 'h') n = -n;
    out.push(String(Math.round(n * 10) / 10));
    argi++; i++;
  }
  return out.join(' ');
}

/** Given a right-side path fragment that starts after point `start` and contains
 *  only absolute L/C/Q commands, return the mirrored fragment traversed in reverse
 *  (from mirrored end back to mirrored start). */
export function mirrorPathReverse(start, frag, cx = 200) {
  const tokens = frag.match(/[A-Za-z]|-?\d*\.?\d+/g) || [];
  const segs = [];
  let cur = start, i = 0;
  while (i < tokens.length) {
    const c = tokens[i++];
    const take = (n) => { const a = []; for (let k = 0; k < n; k++) a.push(parseFloat(tokens[i++])); return a; };
    if (c === 'L') { const [x, y] = take(2); segs.push({ c: 'L', from: cur, pts: [[x, y]] }); cur = [x, y]; }
    else if (c === 'Q') { const [a, b, x, y] = take(4); segs.push({ c: 'Q', from: cur, pts: [[a, b], [x, y]] }); cur = [x, y]; }
    else if (c === 'C') { const [a, b, e, f, x, y] = take(6); segs.push({ c: 'C', from: cur, pts: [[a, b], [e, f], [x, y]] }); cur = [x, y]; }
  }
  const mx = (p) => `${Math.round((2 * cx - p[0]) * 10) / 10} ${p[1]}`;
  let d = '';
  for (let k = segs.length - 1; k >= 0; k--) {
    const s = segs[k];
    if (s.c === 'L') d += ` L ${mx(s.from)}`;
    else if (s.c === 'Q') d += ` Q ${mx(s.pts[0])} ${mx(s.from)}`;
    else d += ` C ${mx(s.pts[1])} ${mx(s.pts[0])} ${mx(s.from)}`;
  }
  return d;
}

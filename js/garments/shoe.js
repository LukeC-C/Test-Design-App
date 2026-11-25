// Parametric footwear in side profile (outer side; inner side is mirrored).
import { P, M, L, Q, C, spline, smooth, poly, circle, ellipse, rect, along, lerp } from './geometry.js';

export function shoe(params) {
  const p = { kind: 'sneaker', sole: 26, collar: 0, heel: 0, toe: 'round', laces: true, ...params };
  const det = [], out = [], parts = [];
  const D = (d, s, extra) => det.push({ d, s, ...extra });
  const gy = 330, hx = 70, tx = 430;
  const k = p.kind;
  let outline = '';
  let sole = '';
  const s = p.sole;

  const toeTip = (base) => {
    switch (p.toe) {
      case 'pointed': return { tip: P(tx + 30, base - 10), top: P(tx - 50, base - 36) };
      case 'square': return { tip: P(tx + 2, base - 22), top: P(tx - 30, base - 44) };
      case 'almond': return { tip: P(tx + 16, base - 14), top: P(tx - 40, base - 40) };
      case 'chisel': return { tip: P(tx + 18, base - 12), top: P(tx - 30, base - 34) };
      default: return { tip: P(tx, base - 20), top: P(tx - 58, base - 56) };
    }
  };

  const heelShoe = k === 'pump' || k === 'flat' || (p.heel > 30 && k === 'boot');
  if (heelShoe) {
    // ─ Arched foot: heel seat raised, ball on ground ─
    const hh = k === 'flat' ? 10 : p.heel;
    const plat = p.platform || 0;
    const ballX = 330;
    const seat = P(hx + 8, gy - hh - 6);
    const ball = P(ballX, gy - plat - 6);
    const tt = toeTip(gy - plat - 4);
    // sole line from heel seat to toe (upper bottom edge)
    const soleLine = [seat, P(hx + 120, gy - hh * 0.72 - 6), P(250, gy - plat - hh * 0.18 - 6), ball, P(tx - 10, gy - plat - 6), tt.tip];
    // Sole/platform
    const soleTop = soleLine.slice(0, -1);
    sole = M(seat) + spline(soleTop, 0.9) + L(P(tt.tip[0] - 2, tt.tip[1] + 6)) + L(P(tt.tip[0] - 12, gy - 1)) + L(P(ballX - 30, gy)) + (plat ? '' : spline([P(ballX - 30, gy), P(250, gy - plat - hh * 0.18 + 1), P(hx + 120, gy - hh * 0.72 + 1), P(hx + 6, gy - hh + 2)], 0.9)) + (plat ? L(P(ballX - 60, gy)) + Q(P(ballX - 80, gy - plat - 10), P(ballX - 100, gy - plat - hh * 0.3)) + spline([P(ballX - 100, gy - plat - hh * 0.3), P(hx + 120, gy - hh * 0.72 + 1), P(hx + 6, gy - hh + 2)], 0.9) : '') + ' Z';
    // Heel block
    if (k !== 'flat') {
      let hb;
      if (p.wedge) hb = M(P(hx + 4, gy - hh)) + spline([P(hx + 4, gy - hh), P(hx + 120, gy - hh * 0.7), P(250, gy - plat - hh * 0.14)]) + L(P(ballX - 10, gy)) + L(P(hx + 18, gy)) + ' Z';
      else if (p.stiletto) hb = poly([P(hx + 4, gy - hh), P(hx + 50, gy - hh + 8), P(hx + 34, gy), P(hx + 28, gy), P(hx + 14, gy - hh * 0.5)]);
      else if (p.block || k === 'boot') hb = poly([P(hx + 2, gy - hh), P(hx + 56, gy - hh + 6), P(hx + 50, gy), P(hx + 12, gy)]);
      else hb = M(P(hx + 2, gy - hh)) + L(P(hx + 56, gy - hh + 8)) + Q(P(hx + 38, gy - hh * 0.4), P(hx + 38, gy)) + L(P(hx + 24, gy)) + Q(P(hx + 20, gy - hh * 0.5), P(hx + 2, gy - hh)) + ' Z';
      parts.push({ d: hb, fill: 'sole' });
      D(rect(p.stiletto ? hx + 26 : hx + 14, gy - 6, p.stiletto ? 10 : 36, 6, 1), 'heel-tip');
      outline += hb + ' ';
    } else {
      const hb = poly([P(hx + 4, gy - hh - 4), P(hx + 60, gy - hh), P(hx + 58, gy), P(hx + 8, gy)]);
      parts.push({ d: hb, fill: 'sole' }); outline += hb + ' ';
    }
    // Upper
    let upper;
    if (k === 'boot') {
      const top = gy - hh - p.collar;
      upper = M(seat) + spline([seat, P(hx - 6, gy - hh - 50), P(hx - 2, gy - hh - p.collar * 0.6), P(hx + 4, top)]) + L(P(hx + 112, top + 4)) + spline([P(hx + 112, top + 4), P(hx + 124, gy - hh * 0.5 - 120), P(hx + 170, gy - hh * 0.4 - 86), P(270, gy - plat - 66), tt.top, tt.tip]);
    } else if (p.open) {
      upper = null;
    } else {
      const backTop = P(hx + 4, seat[1] - (k === 'flat' ? 56 : 66));
      const vamp = P(k === 'flat' ? 250 : 262, gy - plat - hh * 0.2 - (k === 'flat' ? 62 : 70));
      upper = M(seat) + spline([seat, P(hx - 4, seat[1] - 30), backTop]) + spline([backTop, P(hx + 90, seat[1] - (k === 'flat' ? 40 : 46)), P(200, gy - hh * 0.45 - 54), vamp, tt.top, tt.tip], 0.9);
    }
    if (upper) {
      upper += spline([...soleLine].reverse(), 0.9) + ' Z';
      outline += upper;
    }
    if (p.peep) D(ellipse(tt.tip[0] - 14, tt.tip[1] - 8, 16, 9), 'interior');
    if (p.bow) { D(M(P(250, gy - 66)) + Q(P(236, gy - 80), P(240, gy - 60)) + Q(P(264, gy - 80), P(260, gy - 60)) + ' Z', 'band-dark'); }
    // straps
    if (p.strap === 'ankle' || p.open) {
      const sd = poly([P(hx + 2, seat[1] - 78), P(hx + 92, seat[1] - 92), P(hx + 94, seat[1] - 80), P(hx + 4, seat[1] - 66)]);
      outline += ' ' + sd; D(circle(hx + 80, seat[1] - 84, 4), 'metal');
    }
    if (p.strap === 'slingback') {
      outline = outline.replace(/$/, '');
      D(M(P(hx + 6, seat[1] - 20)) + Q(P(hx + 40, seat[1] - 64), P(hx + 110, seat[1] - 44)), 'strap-line');
    }
    if (p.strap === 'maryjane') {
      const sd = poly([P(196, gy - hh * 0.45 - 58), P(210, gy - hh * 0.45 - 112), P(226, gy - hh * 0.45 - 112), P(214, gy - hh * 0.45 - 56)]);
      outline += ' ' + sd; D(circle(216, gy - hh * 0.45 - 100, 4), 'button');
    }
    if (p.open) {
      outline += ' ' + poly([P(240, gy - plat - 6), P(262, gy - plat - 56), P(352, gy - plat - 58), P(372, gy - plat - 6)]);
      outline += ' ' + poly([P(hx + 6, seat[1]), P(hx, seat[1] - 70), P(hx + 14, seat[1] - 70), P(hx + 22, seat[1])]);
    }
    outline += ' ' + sole;
    parts.push({ d: sole, fill: 'sole' });
    if (k === 'boot') {
      if (p.zip) D(M(P(hx + 30, gy - hh - p.collar + 8)) + L(P(hx + 50, gy - hh - 30)), 'zip');
      D(M(P(hx + 6, gy - hh - p.collar + 10)) + L(P(hx + 110, gy - hh - p.collar + 14)), 'stitch');
    }
    const folds = [
      { d: M(P(240, gy - 62)) + Q(P(330, gy - 52), P(tx + 4, gy - 22)), k: 'light' },
      { d: M(P(hx + 20, gy - hh - 40)) + Q(P(hx + 80, gy - hh * 0.6 - 30), P(220, gy - hh * 0.3 - 40)), k: 'lightSoft' },
    ];
    return { outline, parts, details: det, outside: out, ground: gy, folds };
  }

  // ─────────────────────────────────────────────────────────────
  // Flat-soled shoes: sneakers, boots, oxfords, loafers, sandals…
  // ─────────────────────────────────────────────────────────────
  const heel = p.heel || 0;
  const base = gy - s;           // top of sole at forefoot
  const baseH = base - heel;     // top of sole at heel
  const tt = toeTip(base);
  const sandalLike = ['slide', 'flipflop', 'sandal'].includes(k);

  // Sole
  const soleTopPts = [P(hx - 6, baseH), P(200, base - heel * 0.4), P(tx - 40, base), P(tt.tip[0] + 2, base - 4)];
  sole = M(soleTopPts[0]) + spline(soleTopPts, 0.8) + Q(P(tt.tip[0] + 14, gy - s * 0.4), P(tt.tip[0] - 14, gy - 2)) + L(P(hx + 20, gy)) + Q(P(hx - 12, gy - 2), soleTopPts[0]) + ' Z';
  if (heel && !p.wedge) {
    sole = M(soleTopPts[0]) + spline(soleTopPts, 0.8) + Q(P(tt.tip[0] + 14, gy - s * 0.4), P(tt.tip[0] - 14, gy - 2)) + L(P(250, gy)) + Q(P(220, gy - 4), P(190, gy - s - heel * 0.4 + 4)) + L(P(hx + 64, baseH + s)) + L(P(hx + 60, gy)) + L(P(hx + 2, gy)) + L(P(hx - 6, baseH)) + ' Z';
  }
  if (p.footbed) D(M(P(hx + 6, baseH + 6)) + Q(P(200, base - 2), P(tx - 30, base + 6)), 'seam-soft');

  // Upper
  let upper = '';
  const bootLike = k === 'boot' || (k === 'sneaker' && p.collar > 30);
  const hh = k === 'boot' ? p.collar : k === 'oxford' || k === 'loafer' ? 84 : k === 'clog' || k === 'mule' || k === 'espadrille' ? 80 : 112 + (p.collar || 0);
  if (sandalLike) {
    if (k === 'slide') upper = M(P(232, base)) + spline([P(232, base), P(250, base - 56), P(320, base - 70), P(400, base - 46), P(432, base)]) + ' Z';
    else if (k === 'flipflop') {
      upper = M(P(330, base)) + L(P(338, base - 8)) + Q(P(300, base - 50), P(214, base - 6)) + L(P(206, base)) + Q(P(296, base - 40), P(330, base)) + ' Z';
    } else {
      const n = p.straps || 2;
      const xs = along(P(220, 0), P(420, 0), n, true).map((q) => q[0]);
      for (const x of xs) {
        const st = poly([P(x - 14, base), P(x - 10, base - 60 + (x - 220) * 0.12), P(x + 10, base - 62 + (x - 220) * 0.12), P(x + 14, base)]);
        upper += ' ' + st;
      }
      if (p.closedToe) upper += ' ' + M(P(380, base)) + spline([P(380, base), P(400, base - 42), tt.tip]) + L(P(tt.tip[0], base)) + ' Z';
      if (p.strap === 'ankle') {
        upper += ' ' + poly([P(hx + 2, baseH), P(hx, baseH - 70), P(hx + 18, baseH - 72), P(hx + 24, baseH)]);
        upper += ' ' + poly([P(hx, baseH - 74), P(hx + 120, baseH - 90), P(hx + 124, baseH - 74), P(hx + 4, baseH - 58)]);
        D(rect(hx + 96, baseH - 92, 14, 20, 2), 'buckle');
      }
      if (p.gladiator) for (let i = 1; i <= 3; i++) upper += ' ' + poly([P(hx + 2, baseH - 74 - i * 34), P(hx + 112, baseH - 90 - i * 34), P(hx + 114, baseH - 78 - i * 34), P(hx + 4, baseH - 62 - i * 34)]);
    }
  } else if (k === 'clog' || k === 'mule') {
    upper = M(P(hx + 120, base)) + spline([P(hx + 120, base), P(hx + 130, base - 74), P(250, base - 92), P(350, base - 64), tt.top, tt.tip]) + L(P(tt.tip[0] - 2, base)) + ' Z';
    if (k === 'clog') for (const q of along(P(270, base - 70), P(390, base - 46), 4)) D(circle(q[0], q[1], 4), 'interior');
  } else {
    const collarBack = P(hx + 2, baseH - hh);
    let pts;
    if (bootLike && k === 'boot') {
      const sh = p.collar || 120;
      pts = [P(hx + 4, baseH), P(hx - 8, baseH - 46), P(hx - (p.slouchy ? 0 : 4), baseH - Math.min(sh, 140) * 0.8), P(hx + (sh > 200 ? -10 : 2), baseH - sh * 0.75), P(hx + 2, baseH - sh), P(hx + 112, baseH - sh + 4), P(hx + 120, baseH - Math.min(sh, 150) * 0.8), P(hx + 136, base - 112), P(hx + 190, base - 82), P(300, base - 60), tt.top, tt.tip];
    } else {
      const sl = p.slim ? 0.84 : 1;
      const topY = baseH - hh;
      const tongue = k === 'sneaker' || (k === 'oxford' && p.laces !== false);
      pts = [P(hx + 4, baseH), P(hx - 8, baseH - hh * 0.45), collarBack, P(hx + 96 + (p.collar || 0) * 0.1, topY + 20 + (p.collar > 30 ? 4 : 0))];
      if (tongue) pts.push(P(hx + 124, topY - (k === 'sneaker' ? 10 : -6)), P(hx + 186, base - 88 * sl), P(296, base - 68 * sl), tt.top, tt.tip);
      else pts.push(P(hx + 160, base - 74 * sl), P(290, base - 70 * sl), tt.top, tt.tip);
      if (p.sockCollar) pts.splice(2, 2, P(hx + 4, topY - 30), P(hx + 104, topY - 14));
    }
    upper = M(pts[0]) + spline(pts, 0.85) + L(P(tt.tip[0] - 4, base)) + spline([P(tt.tip[0] - 4, base), P(tx - 40, base + 2), P(200, base - heel * 0.4 + 2), P(hx + 4, baseH)].slice(0), 0.8) + ' Z';

    // ── Upper details ──
    const throatStart = bootLike && k === 'boot' ? P(hx + 116, baseH - (p.collar || 120) + 10) : P(hx + 122, baseH - hh + 6);
    const throatEnd = P(hx + 196, base - 84);
    if (p.laces !== false && (k === 'sneaker' || k === 'oxford' || k === 'boot' || k === 'espadrille')) {
      const n = p.lacesN || (k === 'oxford' ? 5 : bootLike ? Math.round((p.collar || 120) / 28) + 3 : 6);
      const a = throatStart, b = throatEnd;
      D(M(a) + Q(P(hx + 150, base - 104), b), k === 'oxford' && !p.derby ? 'seam' : 'stitch');
      const eyes = along(a, b, n, true);
      eyes.forEach((q, i) => {
        D(circle(q[0] - 6, q[1] + 4, p.hooks && i < 3 && bootLike ? 3.4 : 2.4), p.hooks && i < 3 ? 'metal' : 'eyelet');
        if (i < eyes.length - 1) {
          const q2 = eyes[i + 1];
          D(M(P(q[0] - 6, q[1] + 4)) + L(P(q2[0] - 2, q2[1] - 6)), 'lace');
        }
      });
      const last = eyes[0];
      out.push({ d: M(P(last[0] - 4, last[1])) + Q(P(last[0] - 36, last[1] - 30), P(last[0] - 20, last[1] + 26)), s: 'lace-loop' });
      if (p.derby) D(M(P(hx + 130, base - 70)) + Q(P(hx + 160, base - 50), P(hx + 200, base - 64)), 'seam');
    }
    if (k === 'sneaker' && !p.minimal) {
      D(M(P(hx + 30, baseH - 6)) + Q(P(hx + 30, baseH - hh * 0.7), P(hx + 70, baseH - hh * 0.95)), 'seam'); // heel counter
      D(M(P(hx + 150, base - 4)) + Q(P(hx + 170, base - 66), P(hx + 230, base - 64)), 'seam'); // eyestay panel
      if (p.retro) D(M(P(hx + 90, base - 6)) + Q(P(hx + 170, base - 50), P(hx + 260, base - 20)), 'seam');
    }
    if (p.toecap || k === 'sneaker') D(M(P(tx - 70, base - 2)) + Q(P(tx - 74, base - 44), tt.top[0] > tx - 70 ? tt.top : P(tx - 54, base - 48)), 'seam');
    if (k === 'sneaker' || k === 'boot') D(M(P(hx + 6, baseH - 12)) + Q(P(200, base - 8), P(tx - 4, base - 10)), 'stitch');
    if (p.elastic) D(M(P(hx + 104, baseH - hh + 18)) + L(P(hx + 124, base - 64), P(hx + 144, baseH - hh + 14)) + ' Z', 'gore');
    if (p.pullTab) out.push({ d: M(P(hx - 2, baseH - hh + 2)) + Q(P(hx - 24, baseH - hh - 26), P(hx + 12, baseH - hh - 6)), s: 'loop' });
    if (p.padded) D(M(P(hx + 4, baseH - hh + 12)) + Q(P(hx + 60, baseH - hh + 20), P(hx + 110, baseH - hh + 28)), 'seam');
    if (p.apron) D(M(P(hx + 180, base - 70)) + C(P(tx - 70, base - 90), P(tx - 10, base - 50), P(tx - 8, base - 18)), 'stitch-heavy');
    if (p.penny) { D(rect(hx + 170, base - 84, 70, 18, 3), 'band'); D(ellipse(hx + 205, base - 75, 14, 4), 'interior'); }
    if (p.bit) D(rect(hx + 176, base - 82, 56, 7, 3), 'metal');
    if (p.boat) { D(M(P(hx + 4, baseH - hh + 8)) + Q(P(hx + 100, baseH - hh + 20), P(hx + 170, base - 80)), 'lace'); out.push({ d: M(P(hx + 170, base - 80)) + Q(P(hx + 150, base - 120), P(hx + 190, base - 110)), s: 'lace-loop' }); }
    if (p.monk) { D(rect(hx + 120, base - 96, 90, 18, 3), 'band'); D(rect(hx + 120, base - 99, 16, 24, 2), 'buckle'); }
    if (p.wing) D(M(P(hx + 210, base - 4)) + Q(P(hx + 230, base - 60), P(tx - 66, base - 52)) + Q(P(tx - 50, base - 20), P(tx - 20, base - 8)), p.broguing ? 'brogue' : 'seam');
    if (p.broguing) D(M(P(hx + 30, baseH - 6)) + Q(P(hx + 50, baseH - hh * 0.8), P(hx + 110, baseH - hh + 10)), 'brogue');
    if (p.scallop) { D(M(P(hx + 2, baseH - (p.collar || 120))) + Q(P(hx + 56, baseH - (p.collar || 120) + 50), P(hx + 112, baseH - (p.collar || 120) + 4)), 'seam'); for (const y of [0.35, 0.55]) D(M(P(hx + 20, baseH - (p.collar || 120) * y)) + Q(P(hx + 60, baseH - (p.collar || 120) * y - 30), P(hx + 100, baseH - (p.collar || 120) * y)), 'stitch-heavy'); }
    if (p.buckles) for (const y of [0.35, 0.7]) { const yy = baseH - (p.collar || 120) * y; D(rect(hx - 4, yy - 8, 126, 16, 0), 'band'); D(rect(hx + 90, yy - 11, 18, 22, 2), 'buckle'); }
    if (p.rain) D(rect(hx, baseH - (p.collar || 120), 116, 22, 0), 'band');
    if (p.furCuff) { const fc = M(P(hx - 6, baseH - p.collar - 6)) + L(P(hx + 122, baseH - p.collar - 2)) + L(P(hx + 124, baseH - p.collar + 34)) + L(P(hx - 6, baseH - p.collar + 30)) + ' Z'; outline += fc + ' '; D(fc, 'fur'); }
    if (p.zip && k === 'boot') D(M(P(hx + 20, baseH - (p.collar || 120) + 10)) + L(P(hx + 40, baseH - 20)), 'zip');
    if (p.welt || k === 'oxford' || k === 'loafer') D(M(P(hx + 2, baseH - 3)) + Q(P(200, base - 3 - heel * 0.4), P(tt.tip[0] - 4, base - 4)), 'stitch');
    if (p.sockCollar) for (let i = 0; i < 6; i++) D(M(P(hx + 6 + i * 18, baseH - hh - 26 + i * 2)) + L(P(hx + 8 + i * 18, baseH - hh + 6 + i * 3)), 'fold');
  }
  outline = (upper ? upper + ' ' : '') + outline + sole;
  parts.push({ d: sole, fill: 'sole' });

  // Sole details
  if (k === 'espadrille') {
    for (let x = hx; x < tx; x += 10) D(M(P(x, gy - s + 3)) + L(P(x + 6, gy - 2)), 'sole-line');
  } else {
    D(M(P(hx - 2, gy - s * 0.42)) + Q(P(260, gy - s * 0.42 + 2), P(tt.tip[0] + 4, gy - s * 0.45)), p.foxing ? 'foxing' : 'sole-line');
    if (p.lug) for (let x = hx + 8; x < tx - 10; x += 22) D(rect(x, gy - 9, 14, 9, 2), 'sole-dark');
    if (p.crepe) D(M(P(hx, gy - s * 0.7)) + L(P(tx, gy - s * 0.7)), 'sole-line');
  }
  if (p.gum) parts[parts.length - 1].fill = 'gum';
  const folds = sandalLike ? [] : [
    { d: M(P(tx - 140, base - 58)) + Q(P(tx - 70, base - 66), P(tx - 8, base - 32)), k: 'light' },
    { d: M(P(hx + 10, baseH - hh * 0.75)) + Q(P(hx + 40, baseH - hh * 0.5), P(hx + 120, base - 40)), k: 'lightSoft' },
    { d: M(P(290, base - 66)) + Q(P(302, base - 40), P(296, base - 12)), k: 'crease' },
    { d: M(P(310, base - 60)) + Q(P(320, base - 36), P(316, base - 10)), k: 'crease' },
    { d: M(P(hx, base - 6)) + L(P(tx, base - 6)), k: 'shadowSoft' },
  ];
  return { outline, parts, details: det, outside: out, ground: gy, folds };
}

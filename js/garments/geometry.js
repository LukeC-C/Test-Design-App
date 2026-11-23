// Shared geometry helpers for garment templates.
export const R = (n) => Math.round(n * 10) / 10;
export const P = (x, y) => [R(x), R(y)];
export const pt = (p) => `${R(p[0])} ${R(p[1])}`;

/** Catmull-Rom spline through points, emitted as cubic Bézier segments.
 *  Assumes the pen is already at pts[0]. */
export function spline(pts, tension = 1) {
  let d = '';
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + ((p2[0] - p0[0]) / 6) * tension, p1[1] + ((p2[1] - p0[1]) / 6) * tension];
    const c2 = [p2[0] - ((p3[0] - p1[0]) / 6) * tension, p2[1] - ((p3[1] - p1[1]) / 6) * tension];
    d += ` C ${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return d;
}

export const M = (p) => `M ${pt(p)}`;
export const L = (...ps) => ps.map((p) => ` L ${pt(p)}`).join('');
export const Q = (c, p) => ` Q ${pt(c)} ${pt(p)}`;
export const C = (c1, c2, p) => ` C ${pt(c1)} ${pt(c2)} ${pt(p)}`;

export const poly = (ps, close = true) => M(ps[0]) + L(...ps.slice(1)) + (close ? ' Z' : '');
export const smooth = (ps, close = true, tension = 1) => M(ps[0]) + spline(ps, tension) + (close ? ' Z' : '');

export function mirrorX(ps, cx = 200) { return ps.map(([x, y]) => [R(2 * cx - x), y]); }
export const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const len = (v) => Math.hypot(v[0], v[1]);
export const norm = (v) => { const l = len(v) || 1; return [v[0] / l, v[1] / l]; };

export function circle(cx, cy, r) {
  return `M ${R(cx - r)} ${R(cy)} a ${R(r)} ${R(r)} 0 1 0 ${R(2 * r)} 0 a ${R(r)} ${R(r)} 0 1 0 ${R(-2 * r)} 0 Z`;
}
export function ellipse(cx, cy, rx, ry) {
  return `M ${R(cx - rx)} ${R(cy)} a ${R(rx)} ${R(ry)} 0 1 0 ${R(2 * rx)} 0 a ${R(rx)} ${R(ry)} 0 1 0 ${R(-2 * rx)} 0 Z`;
}
export function rect(x, y, w, h, r = 0) {
  if (!r) return `M ${R(x)} ${R(y)} h ${R(w)} v ${R(h)} h ${R(-w)} Z`;
  r = Math.min(r, w / 2, h / 2);
  return `M ${R(x + r)} ${R(y)} h ${R(w - 2 * r)} a ${r} ${r} 0 0 1 ${r} ${r} v ${R(h - 2 * r)} a ${r} ${r} 0 0 1 ${-r} ${r} h ${R(-(w - 2 * r))} a ${r} ${r} 0 0 1 ${-r} ${-r} v ${R(-(h - 2 * r))} a ${r} ${r} 0 0 1 ${r} ${-r} Z`;
}
/** Evenly spaced points along a straight segment (exclusive of ends unless incl). */
export function along(a, b, n, incl = false) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = incl ? (n === 1 ? 0.5 : i / (n - 1)) : (i + 1) / (n + 1);
    out.push(lerp(a, b, t));
  }
  return out;
}
/** Offset polyline by distance (positive = left normal). */
export function offsetLine(a, b, d) {
  const n = norm([-(b[1] - a[1]), b[0] - a[0]]);
  return [add(a, n, d), add(b, n, d)];
}

"""Shared helpers for the hand-tuned garment flats in assets/garments/.

Each garment module builds a Drawing per (key, view) from Bezier geometry and
writes it as an SVG that follows docs/garment-art-brief.md (outline / accent /
shading / details / outside groups). Run `python3 tools/flats/build.py`.
"""
import json
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'assets', 'garments')
AX = 300  # vertical axis for tops, bottoms and hats


def f(n):
    s = ('%.1f' % n)
    return s[:-2] if s.endswith('.0') else s


def pt(p):
    return f'{f(p[0])} {f(p[1])}'


# ── path builders ────────────────────────────────────────────────
def path(start, segs, close=False, ox=0, sx=1):
    """Path from a start point and segments. Points are (x, y); x is mapped
    through ox + sx * x, so (ox=300, sx=1) means x is an offset from the axis."""
    X = lambda p: (ox + sx * p[0], p[1])
    out = ['M' + pt(X(start))]
    for s in segs:
        k = s[0]
        out.append(k + ' '.join(pt(X(p)) for p in s[1:]))
    if close:
        out.append('Z')
    return ' '.join(out)


def reverse(start, segs):
    """Reverse a segment chain: returns (new_start, new_segs)."""
    pts = [start]
    for s in segs:
        pts.append(s[-1])
    rs = []
    for i in range(len(segs) - 1, -1, -1):
        s, a = segs[i], pts[i]
        if s[0] == 'L':
            rs.append(('L', a))
        elif s[0] == 'C':
            rs.append(('C', s[2], s[1], a))
        elif s[0] == 'Q':
            rs.append(('Q', s[1], a))
    return pts[-1], rs


def sym(start, segs):
    """Closed symmetric shape: the right half runs from `start` (on the axis,
    x=0) down/around to a point on the axis; the left half is its mirror.
    x values are offsets from the axis."""
    end, rs = reverse(start, segs)
    right = path(start, segs, ox=AX)
    left = path(end, rs, ox=AX, sx=-1)
    import re
    return right + ' ' + re.sub(r'^M\S+ \S+ ', '', left) + ' Z'


def half(start, segs, side=1, close=False):
    """Detail path on one side (side=+1 right, -1 left) in axis-offset coords."""
    return path(start, segs, close=close, ox=AX, sx=side)


def pair(start, segs, close=False):
    return [half(start, segs, 1, close), half(start, segs, -1, close)]


def circle(cx, cy, r):
    return (f'M{f(cx - r)} {f(cy)} A{f(r)} {f(r)} 0 1 0 {f(cx + r)} {f(cy)} '
            f'A{f(r)} {f(r)} 0 1 0 {f(cx - r)} {f(cy)} Z')


def rect(x, y, w, h, r=0):
    if not r:
        return f'M{f(x)} {f(y)} H{f(x + w)} V{f(y + h)} H{f(x)} Z'
    return (f'M{f(x + r)} {f(y)} H{f(x + w - r)} Q{f(x + w)} {f(y)} {f(x + w)} {f(y + r)} '
            f'V{f(y + h - r)} Q{f(x + w)} {f(y + h)} {f(x + w - r)} {f(y + h)} H{f(x + r)} '
            f'Q{f(x)} {f(y + h)} {f(x)} {f(y + h - r)} V{f(y + r)} Q{f(x)} {f(y)} {f(x + r)} {f(y)} Z')


def lerp(a, b, t):
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)


def bez(p0, p1, p2, p3, t):
    u = 1 - t
    return (u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0],
            u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1])


# ── detail styles (black/white at low opacity, grey hardware) ────
STYLES = {
    # outline-adjacent construction seam: dark line with a faint highlight under it
    'seam': [dict(stroke='#000', **{'stroke-opacity': .34, 'stroke-width': 1.7}),
             dict(stroke='#fff', **{'stroke-opacity': .16, 'stroke-width': 1.2, 'transform': 'translate(1 1.2)'})],
    'seamL': [dict(stroke='#000', **{'stroke-opacity': .22, 'stroke-width': 1.5})],
    'stitch': [dict(stroke='#000', **{'stroke-opacity': .32, 'stroke-width': 1.2, 'stroke-dasharray': '4 3'}),
               dict(stroke='#fff', **{'stroke-opacity': .2, 'stroke-width': 1, 'stroke-dasharray': '4 3', 'transform': 'translate(.8 1)'})],
    'stitchW': [dict(stroke='#fff', **{'stroke-opacity': .42, 'stroke-width': 1.3, 'stroke-dasharray': '4 3'})],
    'edge': [dict(stroke='#000', **{'stroke-opacity': .48, 'stroke-width': 2}),
             dict(stroke='#fff', **{'stroke-opacity': .14, 'stroke-width': 1.4, 'transform': 'translate(1 1.4)'})],
    'rib': [dict(stroke='#000', **{'stroke-opacity': .13, 'stroke-width': 1.2})],
    'ribW': [dict(stroke='#fff', **{'stroke-opacity': .16, 'stroke-width': 1.2})],
    'hole': [dict(fill='#000', stroke='none', **{'fill-opacity': .4})],
    'inner': [dict(fill='#000', stroke='#000', **{'fill-opacity': .26, 'stroke-opacity': .4, 'stroke-width': 1.4})],
    'tint': [dict(fill='#000', stroke='none', **{'fill-opacity': .08})],
    'tintW': [dict(fill='#fff', stroke='none', **{'fill-opacity': .12})],
    'panel': [dict(fill='#000', stroke='#000', **{'fill-opacity': .05, 'stroke-opacity': .32, 'stroke-width': 1.6})],
    'button': [dict(fill='#000', stroke='#000', **{'fill-opacity': .14, 'stroke-opacity': .5, 'stroke-width': 1.2})],
    'hw': [dict(fill='#c9c9c6', stroke='#6f6f6c', **{'stroke-width': 1.1})],
    'hwLine': [dict(stroke='#8e8e8a', **{'stroke-width': 3, 'stroke-linecap': 'round'})],
    'zip': [dict(stroke='#8a8a86', **{'stroke-width': 3.6, 'stroke-dasharray': '1.6 1.3'}),
            dict(stroke='#5a5a57', **{'stroke-width': .9})],
    'perf': [dict(stroke='#000', **{'stroke-opacity': .45, 'stroke-width': 2.4, 'stroke-dasharray': '.1 5', 'stroke-linecap': 'round'})],
    'mesh': [dict(fill='#000', stroke='#000', **{'fill-opacity': .1, 'stroke-opacity': .3, 'stroke-width': 1.4})],
}


def attrs(d):
    return ' '.join(f'{k}="{v}"' for k, v in d.items())


class Drawing:
    def __init__(self, w=600, h=600):
        self.w, self.h = w, h
        self.outline = []      # list of path d (or raw shape tags)
        self.accent = []
        self.shade = []        # (d, colour, width, opacity)
        self.det = []          # (d, style)
        self.out = []          # raw svg elements

    # convenience
    def o(self, d):
        self.outline.append(d)

    def a(self, d):
        self.accent.append(d)

    def dark(self, d, w=14, op=.2):
        self.shade.append((d, '#000', w, op))

    def light(self, d, w=18, op=.2):
        self.shade.append((d, '#fff', w, op))

    def d(self, style, *ds):
        for x in ds:
            if isinstance(x, (list, tuple)):
                for y in x:
                    self.det.append((y, style))
            else:
                self.det.append((x, style))

    def x(self, el):
        self.out.append(el)

    def svg(self):
        L = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {self.h}">',
             '  <defs><filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter></defs>']
        if len(self.outline) == 1:
            L.append(f'  <path id="outline" d="{self.outline[0]}"/>')
        else:
            L.append('  <g id="outline">')
            for d in self.outline:
                L.append(f'    {d}' if d.startswith('<') else f'    <path d="{d}"/>')
            L.append('  </g>')
        if self.accent:
            L.append('  <g id="accent">')
            for d in self.accent:
                L.append(f'    <path d="{d}"/>')
            L.append('  </g>')
        if self.shade:
            L.append('  <g id="shading" filter="url(#soft)" fill="none" stroke-linecap="round">')
            for d, c, w, op in self.shade:
                L.append(f'    <path d="{d}" stroke="{c}" stroke-width="{f(w)}" stroke-opacity="{op}"/>')
            L.append('  </g>')
        if self.det:
            L.append('  <g id="details" fill="none" stroke-linecap="round" stroke-linejoin="round">')
            # group by style, keeping order of first appearance
            order = []
            for _, s in self.det:
                if s not in order:
                    order.append(s)
            for s in order:
                ds = [d for d, st in self.det if st == s]
                for layer in STYLES[s]:
                    L.append(f'    <g {attrs(layer)}>' + ''.join(f'<path d="{d}"/>' for d in ds) + '</g>')
            L.append('  </g>')
        if self.out:
            L.append('  <g id="outside">')
            for el in self.out:
                L.append(f'    {el}')
            L.append('  </g>')
        L.append('</svg>')
        return '\n'.join(L) + '\n'


MANIFEST = os.path.join(OUT, 'manifest.json')


def write(cat, key, view, drawing):
    os.makedirs(os.path.join(OUT, cat), exist_ok=True)
    rel = f'{cat}/{key}-{view}.svg'
    with open(os.path.join(OUT, rel), 'w') as fh:
        fh.write(drawing.svg())
    return rel


def register(entries):
    """entries: {"cat/key": {"front": rel, "back": rel}} merged into the manifest."""
    try:
        with open(MANIFEST) as fh:
            m = json.load(fh)
    except FileNotFoundError:
        m = {'version': 1, 'garments': {}}
    m.setdefault('garments', {}).update(entries)
    m['garments'] = dict(sorted(m['garments'].items()))
    with open(MANIFEST, 'w') as fh:
        json.dump(m, fh, indent=2)
        fh.write('\n')


def _norm(a, b):
    import math
    dx, dy = b[0] - a[0], b[1] - a[1]
    L = math.hypot(dx, dy) or 1
    return (-dy / L, dx / L)


def band(p0, c1, c2, p3, w, w1=None):
    """Closed strap shape of width w (to w1 at the end) along a cubic centreline."""
    w1 = w if w1 is None else w1
    n0, n1 = _norm(p0, c1 if c1 != p0 else c2), _norm(c2 if c2 != p3 else c1, p3)
    o = lambda p, n, k: (p[0] + n[0] * k, p[1] + n[1] * k)
    a0, a1, a2, a3 = o(p0, n0, w / 2), o(c1, n0, w / 2), o(c2, n1, w1 / 2), o(p3, n1, w1 / 2)
    b0, b1, b2, b3 = o(p0, n0, -w / 2), o(c1, n0, -w / 2), o(c2, n1, -w1 / 2), o(p3, n1, -w1 / 2)
    return (f'M{pt(a0)} C{pt(a1)} {pt(a2)} {pt(a3)} L{pt(b3)} C{pt(b2)} {pt(b1)} {pt(b0)} Z')


def centre(p0, c1, c2, p3):
    return f'M{pt(p0)} C{pt(c1)} {pt(c2)} {pt(p3)}'

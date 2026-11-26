"""Tops: front and back flats, 600x600, axis x=300.

Coordinates in this file are offsets from the axis (dx, y) unless noted.
One body block (chest half-width 130, HPS y=72, shoulder (126, 96)) is shared
so every top sits at the same scale; garments change length, ease, sleeves,
necklines and construction."""
import math
from lib import Drawing, sym, half, pair, path, circle, rect, band, f, pt, AX, bez, reverse

X = lambda dx: AX + dx
HPS_Y = 72


def unit(a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    L = math.hypot(dx, dy) or 1
    return dx / L, dy / L


def add(p, v, k=1):
    return (p[0] + v[0] * k, p[1] + v[1] * k)


# ─────────────────────────────────────────────────────────────────
# geometry
# ─────────────────────────────────────────────────────────────────
class G:
    pass


def sleeve_geo(kind, SP, AP, sw=1.0, drop=0):
    """Return dict with outer/inner edge segments (right side) and cuff points."""
    spec = {'long': (27, 300, 50), 'short': (42, 128, 92), 'three': (31, 222, 62), 'elbow': (36, 176, 76),
            'cap': (52, 54, 70), 'puff': (44, 120, 92), 'balloon': (29, 296, 52), 'bell': (30, 290, 96)}[kind]
    a, L, cw = spec
    L -= drop * 24
    cw *= sw
    d = (math.sin(math.radians(a)), math.cos(math.radians(a)))
    n = (-d[1], d[0])                            # towards the body / down
    CO = add(SP, d, L)
    CI = add(CO, n, cw)
    bulge = {'puff': 16, 'balloon': 30, 'bell': 0}.get(kind, 0) * sw
    if kind == 'bell':
        CO = add(CO, n, -22)
    outer = [('C', add(add(SP, (14, 4)), n, -bulge * .6), add(add(SP, d, L * .55), n, -bulge - 4 * sw + 4), CO)]
    inner = [('C', add(add(CI, d, -L * .42), n, bulge * .3 + (8 if kind == 'balloon' else 0)), add(AP, d, 26), AP)]
    return dict(kind=kind, d=d, n=n, CO=CO, CI=CI, L=L, cw=cw, outer=outer, inner=inner, a=a)


def body(view, o):
    """Build the outline (right half → mirrored) for a sleeved top."""
    g = G()
    B = o.get('B', 130)
    Bh = o.get('Bh', B)
    L = o.get('L', 470)
    drop = o.get('drop', 0)
    sl = o.get('sleeve', 'long')
    SP = (126 + drop * 26 + (B - 130) * .7, 96 + drop * 18)
    AP = (B, 204 + drop * 26 + (B - 130) * .3)
    g.B, g.Bh, g.L, g.SP, g.AP, g.drop = B, Bh, L, SP, AP, drop
    nw = o.get('nw', 48)
    g.nw = nw
    neck = o.get('neck', 'crew')
    # ── neck / top of the outline ──
    segs = []
    start = (0, 82)
    if neck == 'hood':
        if view == 'front':
            start = (0, 4)
            segs = [('C', (56, 4), (92, 30), (94, 78)), ('C', (95, 92), (90, 100), (86, 104)),
                    ('C', (100, 100), (SP[0] - 20, SP[1] - 4), SP)]
        else:
            start = (0, 4)
            segs = [('C', (58, 4), (98, 34), (98, 88)), ('C', (98, 100), (94, 108), (90, 110)),
                    ('C', (104, 102), (SP[0] - 20, SP[1] - 4), SP)]
    elif neck == 'turtle':
        start = (0, 14)
        segs = [('L', (52, 14)), ('C', (57, 14), (58, 20), (58, 26)), ('L', (56, 62)),
                ('C', (56, 70), (62, 76), (72, 80)), ('L', SP)]
    elif neck in ('mock', 'stand', 'funnel'):
        top = o.get('neckTop') or {'mock': 44, 'stand': 50, 'funnel': 30}[neck]
        start = (0, top)
        segs = [('L', (nw - 4, top)), ('C', (nw, top), (nw + 2, top + 4), (nw + 2, top + 10)), ('L', (nw + 2, HPS_Y + 4)),
                ('C', (nw + 12, 80), (SP[0] - 30, SP[1] - 6), SP)]
    elif neck in ('collar', 'lapel', 'polo', 'camp', 'band'):
        top = {'collar': 58, 'lapel': 62, 'polo': 60, 'camp': 66, 'band': 66}[neck]
        start = (0, top if view == 'back' or neck != 'camp' else top + 4)
        segs = [('C', (26, top - 2), (48, top - 2), (56, top + 6)), ('C', (60, top + 12), (62, 78), (64, 80)),
                ('C', (84, 84), (SP[0] - 26, SP[1] - 6), SP)]
    else:                                   # cut necklines: the back neck shows through the front
        wide = o.get('neckW', nw)
        bny = 82 if wide <= 56 else 90
        start = (0, bny)
        segs = [('C', (wide * .6, bny), (wide - 6, HPS_Y + 2), (wide, HPS_Y)),
                ('C', (wide + 20, HPS_Y + 6), (SP[0] - 30, SP[1] - 8), SP)]
    g.start = start
    # ── sleeve ──
    if sl == 'none':
        inset = o.get('armInset', 14)
        SPn = (SP[0] - inset, SP[1] + 2)
        segs[-1] = segs[-1][:-1] + (SPn,)
        APn = (AP[0] - 2, AP[1] + 12)
        segs += [('C', (SPn[0] - 8, SPn[1] + 40), (APn[0] - 24, APn[1] - 22), APn)]
        g.SV = None
        g.AP = APn
        g.SPn = SPn
    else:
        sv = sleeve_geo(sl, SP, AP, o.get('sw', 1.0), drop)
        segs += sv['outer'] + [('L', sv['CI'])] + sv['inner']
        g.SV = sv
    # ── side seam & hem ──
    AP = g.AP
    hem = o.get('hem', 'straight')
    wy = o.get('waistY')
    W = o.get('W')
    if o.get('baffles'):
        prev = AP
        for y in [y for y in o['baffles'] if y > AP[1] + 20] + [L]:
            segs += [('Q', (Bh + 9, (prev[1] + y) / 2), (Bh, y))]
            prev = (Bh, y)
    elif W:
        segs += [('C', (AP[0], AP[1] + 40), (W, wy - 50), (W, wy)), ('C', (W, wy + 50), (Bh, L - 60), (Bh, L - (18 if hem == 'curved' else 0)))]
    else:
        segs += [('C', (AP[0] + (Bh - AP[0]) * .1, AP[1] + (L - AP[1]) * .4), (Bh, L - (L - AP[1]) * .3), (Bh, L - (18 if hem == 'curved' else 0)))]
    if hem == 'curved':
        segs += [('C', (Bh * .8, L - 18), (Bh * .45, L + 14), (0, L + 14))]
    elif hem == 'blouson':
        segs += [('C', (Bh - 2, L + 4), (Bh * .6, L + 6), (0, L + 6))]
    else:
        segs += [('L', (0, L))]
    g.outline = sym(start, segs)
    g.hem = hem
    return g


# ─────────────────────────────────────────────────────────────────
# detail helpers (dx coordinates)
# ─────────────────────────────────────────────────────────────────
def hem_y(g, x=0):
    if g.hem == 'curved':
        t = abs(x) / g.Bh
        return g.L + 14 - 32 * t ** 1.6
    return g.L + (6 if g.hem == 'blouson' else 0)


def hem_line(g, off):
    """Line parallel to the hem, `off` above it."""
    if g.hem == 'curved':
        return sym_line((-g.Bh + 2, g.L - 18 - off), [('C', (-g.Bh * .45, g.L + 14 - off), (g.Bh * .45, g.L + 14 - off), (g.Bh - 2, g.L - 18 - off))])
    return f'M{f(X(-g.Bh + 1))} {f(g.L - off)} L{f(X(g.Bh - 1))} {f(g.L - off)}'


def sym_line(start, segs):
    return path(start, segs, ox=AX)


def cuff_line(g, off, side=1):
    sv = g.SV
    a = add(sv['CO'], sv['d'], -off)
    b = add(sv['CI'], sv['d'], -off)
    return half(a, [('L', b)], side)


def cuffs(D, g, off=34, style='seam', ribs=True):
    if not g.SV:
        return
    D.d(style, cuff_line(g, off, 1), cuff_line(g, off, -1))
    if ribs:
        sv = g.SV
        lines = []
        for s in (1, -1):
            for i in range(1, 7):
                t = i / 7
                p = add(sv['CO'], sv['n'], sv['cw'] * t)
                lines.append(half(add(p, sv['d'], -off + 3), [('L', add(p, sv['d'], -2))], s))
        D.d('rib', *lines)


def rib_hem(D, g, h=40, ribs=True):
    D.d('seam', hem_line(g, h))
    if ribs:
        n = int(g.Bh * 2 / 12)
        D.d('rib', *[f'M{f(X(-g.Bh + i * 2 * g.Bh / n))} {f(g.L - h + 3)} L{f(X(-g.Bh + i * 2 * g.Bh / n))} {f(g.L - 2)}' for i in range(1, n)])


def sleeve_seams(D, g, style='seam'):
    """Set-in armhole seam (front view)."""
    if g.SV is None:
        return
    SP, AP = g.SP, g.AP
    D.d(style, *pair(SP, [('C', (SP[0] - 6, SP[1] + 40), (AP[0] - 8, AP[1] - 40), AP)]))


def raglan_seams(D, g, y0=None):
    y0 = y0 or 96
    D.d('seam', *pair((g.nw * .7, y0), [('C', (g.nw + 20, y0 + 30), (g.AP[0] - 30, g.AP[1] - 50), g.AP)]))


def neck_crew(D, g, view, depth=108, rib=10, w=None):
    w = w or g.nw
    if view == 'front':
        front = half((-w, HPS_Y), [('C', (-w + 6, depth - 12), (-w * .5, depth), (0, depth)), ('C', (w * .5, depth), (w - 6, depth - 12), (w, HPS_Y))])
        inner = front + f' C{f(X(w - 6))} {HPS_Y + 2} {f(X(w * .6))} 82 {f(X(0))} 82 C{f(X(-w * .6))} 82 {f(X(-w + 6))} {HPS_Y + 2} {f(X(-w))} {HPS_Y} Z'
        D.d('inner', inner)
        if rib:
            D.d('seam', half((-w - 2, HPS_Y + 1), [('C', (-w + 4, depth - 12 + rib), (-w * .5, depth + rib), (0, depth + rib)),
                                                   ('C', (w * .5, depth + rib), (w - 4, depth - 12 + rib), (w + 2, HPS_Y + 1))]))
    else:
        if rib:
            D.d('seam', half((-w - 2, HPS_Y + 1), [('C', (-w * .6, 82 + rib), (w * .6, 82 + rib), (w + 2, HPS_Y + 1))]))


def neck_v(D, g, view, depth=170, rib=12, w=None):
    w = w or g.nw
    if view == 'front':
        D.d('inner', half((-w, HPS_Y), [('C', (-w + 4, 110), (-14, depth - 30), (0, depth)), ('C', (14, depth - 30), (w - 4, 110), (w, HPS_Y)),
                                        ('C', (w * .6, 82), (-w * .6, 82), (-w, HPS_Y))], close=True))
        if rib:
            D.d('seam', half((-w - 2, HPS_Y + 1), [('C', (-w + 4 + rib * .4, 114), (-12, depth - 20 + rib), (0, depth + rib)),
                                                   ('C', (12, depth - 20 + rib), (w - 4 - rib * .4, 114), (w + 2, HPS_Y + 1))]))
            D.d('seamL', f'M{X(0)} {depth} L{X(0)} {depth + rib}')
    else:
        D.d('seam', half((-w - 2, HPS_Y + 1), [('C', (-w * .6, 82 + rib), (w * .6, 82 + rib), (w + 2, HPS_Y + 1))]))


def placket(D, g, y0, y1, w=14, n=4, style='button', xoff=0, r=4.6, line=True):
    if line:
        D.d('seam', f'M{f(X(xoff - w))} {f(y0)} L{f(X(xoff - w))} {f(y1)}', f'M{f(X(xoff + w))} {f(y0)} L{f(X(xoff + w))} {f(y1)}')
    if n:
        for i in range(n):
            y = y0 + 16 + (y1 - y0 - 32) * (i / max(1, n - 1))
            if style == 'button':
                D.d('button', circle(X(xoff), y, r))
            elif style == 'snap':
                D.d('hw', circle(X(xoff), y, r + 1))


def zip_line(D, y0, y1, x=0, pull=True):
    D.d('zip', f'M{f(X(x))} {f(y0)} L{f(X(x))} {f(y1)}')
    if pull:
        D.d('hw', rect(X(x) - 4, y0 + 4, 8, 20, 3))


def patch_pocket(D, x, y, w, h, flap=False, point=False, side=1, button=True, style='seam'):
    """Pocket at (x,y) top-left in dx coords, on `side` (mirrored x)."""
    s = side
    xa, xb = x, x + w
    if point:
        d = half((xa, y), [('L', (xa, y + h - 12)), ('L', ((xa + xb) / 2, y + h)), ('L', (xb, y + h - 12)), ('L', (xb, y))], s)
    else:
        d = half((xa, y), [('L', (xa, y + h - 6)), ('Q', (xa, y + h), (xa + 6, y + h)), ('L', (xb - 6, y + h)), ('Q', (xb, y + h), (xb, y + h - 6)), ('L', (xb, y))], s)
    D.d(style, d)
    D.d('stitch', half((xa + 5, y + 6), [('L', (xa + 5, y + h - (14 if point else 8)))], s), half((xb - 5, y + 6), [('L', (xb - 5, y + h - (14 if point else 8)))], s))
    if flap:
        fh = 30
        D.d('panel', half((xa - 3, y - 4), [('L', (xb + 3, y - 4)), ('L', (xb + 3, y + fh - 8)), ('L', ((xa + xb) / 2, y + fh)), ('L', (xa - 3, y + fh - 8))], s, close=True))
        if button:
            D.d('button', circle(X(s * (xa + xb) / 2), y + fh - 9, 4))
    else:
        D.d('stitch', half((xa + 2, y + 6), [('L', (xb - 2, y + 6))], s))


def welt_pocket(D, x0, y0, x1, y1, side=1, w=8):
    D.d('panel', half((x0, y0), [('L', (x1, y1)), ('L', (x1, y1 + w)), ('L', (x0, y0 + w))], side, close=True))


def zip_pocket(D, x0, y0, x1, y1, side=1):
    D.d('edge', half((x0, y0), [('L', (x1, y1))], side))
    D.d('zip', half((x0 + 2, y0 + 3), [('L', (x1 - 2, y1 + 3))], side))


def kangaroo(D, y0=330, y1=436, w0=88, w1=112):
    D.d('seam', half((-w1, y1), [('L', (-w0 + 8, y0 + 6)), ('Q', (-w0, y0), (-w0 + 12, y0)), ('L', (w0 - 12, y0)), ('Q', (w0, y0), (w0 - 8, y0 + 6)), ('L', (w1, y1))]))
    D.d('edge', half((-w0 + 4, y0 + 8), [('C', (-w0 - 10, y0 + 40), (-w1 - 4, y1 - 40), (-w1, y1 - 6))]),
        half((w0 - 4, y0 + 8), [('C', (w0 + 10, y0 + 40), (w1 + 4, y1 - 40), (w1, y1 - 6))]))
    D.d('stitch', half((-w0 + 14, y0 + 8), [('L', (w0 - 14, y0 + 8))]))


def shading(D, g, view='front', strong=1.0):
    B, L, AP = g.B, g.L, g.AP
    D.light(half((-B * .56, AP[1] - 50), [('C', (-B * .62, AP[1] + 30), (-B * .62, L - 140), (-B * .56, L - 50))]), 44, .12 * strong)
    D.dark(half((B * .84, AP[1] + 10), [('C', (B * .9, AP[1] + 80), (g.Bh * .9, L - 120), (g.Bh * .86, L - 20))]), 24, .18 * strong)
    D.dark(half((-B * .2, L - 70), [('C', (-B * .05, L - 60), (B * .1, L - 74), (B * .3, L - 64))]), 10, .1 * strong)
    if g.SV:
        sv = g.SV
        for s, c, op in ((1, '#000', .2), (-1, '#fff', .2)):
            mid = add(g.SP, sv['d'], sv['L'] * .5)
            a = add(add(g.SP, sv['d'], sv['L'] * .12), sv['n'], sv['cw'] * (.62 if s > 0 else .3))
            b = add(add(g.SP, sv['d'], sv['L'] * .84), sv['n'], sv['cw'] * (.62 if s > 0 else .3))
            dd = half(a, [('L', b)], s)
            (D.dark if s > 0 else D.light)(dd, 22 if sv['L'] > 200 else 16, op * .6 * strong)


def back_neck_seam(D, g, y=84, w=None):
    w = w or g.nw
    D.d('seamL', half((-w - 2, HPS_Y + 2), [('C', (-w * .6, y + 2), (w * .6, y + 2), (w + 2, HPS_Y + 2))]))


# ─────────────────────────────────────────────────────────────────
# shared pieces for hoods, collars and lapels
# ─────────────────────────────────────────────────────────────────
def hood_front(D, cords=True):
    D.d('inner', 'M300 136 C330 130 352 100 354 66 C356 38 334 22 300 22 C266 22 244 38 246 66 C248 100 270 130 300 136 Z')
    D.d('seam', half((-58, 102), [('C', (-40, 124), (-16, 134), (0, 138)), ('C', (16, 134), (40, 124), (58, 102))]))
    D.d('edge', 'M300 22 C340 22 366 40 366 70 C366 104 336 130 300 142 C264 130 234 104 234 70 C234 40 260 22 300 22')
    D.light('M244 60 C236 40 254 20 280 12', 12, .2)
    if cords:
        for s in (1, -1):
            x = X(s * 22)
            D.x(f'<path d="M{f(x)} 136 C{f(x + s * 2)} 160 {f(x - s * 2)} 190 {f(x + s * 2)} 216" fill="none" stroke="#6f6b63" stroke-width="5.4" stroke-linecap="round"/>')
            D.x(f'<path d="M{f(x)} 136 C{f(x + s * 2)} 160 {f(x - s * 2)} 190 {f(x + s * 2)} 216" fill="none" stroke="#eeebe4" stroke-width="3.6" stroke-linecap="round"/>')
            D.x(f'<rect x="{f(x - 3)}" y="214" width="6" height="12" rx="2" fill="#8d8a84"/>')
        D.d('hole', circle(X(-22), 132, 3.2), circle(X(22), 132, 3.2))


def hood_back(D):
    D.d('seam', 'M300 6 L300 150')
    D.d('seam', half((-92, 96), [('C', (-70, 140), (-30, 156), (0, 158)), ('C', (30, 156), (70, 140), (92, 96))]))
    D.light('M236 50 C240 30 260 16 284 12', 18, .22)
    D.dark('M360 60 C380 90 384 120 372 140', 18, .18)


def point_collar(D, view, spread=0, button_down=False, open_=False, depth=146):
    if view == 'front':
        # collar band visible behind; two collar leaves meeting at the centre front
        D.d('panel', half((0, 112), [('C', (-14, 110), (-40, 90), (-54, 66)), ('L', (-60, 80)), ('C', (-58, 100), (-52 - spread, 128), (-36 - spread * 1.4, depth)),
                                     ('C', (-24, 132), (-10, 120), (0, 112))], close=True))
        D.d('panel', half((0, 112), [('C', (14, 110), (40, 90), (54, 66)), ('L', (60, 80)), ('C', (58, 100), (52 + spread, 128), (36 + spread * 1.4, depth)),
                                     ('C', (24, 132), (10, 120), (0, 112))], close=True))
        D.d('inner', half((-50, 66), [('C', (-30, 74), (-12, 88), (0, 108)), ('C', (12, 88), (30, 74), (50, 66)), ('C', (30, 60), (-30, 60), (-50, 66))], close=True))
        D.d('stitch', *pair((56, 84), [('C', (54, 104), (48 + spread, 126), (37 + spread * 1.4, 138))]))
        if button_down:
            D.d('button', circle(X(-32 - spread), depth - 12, 3.4), circle(X(32 + spread), depth - 12, 3.4))
    else:
        D.d('panel', half((-60, 64), [('C', (-30, 58), (30, 58), (60, 64)), ('L', (62, 84)), ('C', (30, 92), (-30, 92), (-62, 84))], close=True))
        D.d('stitch', half((-58, 78), [('C', (-30, 86), (30, 86), (58, 78))]))


def camp_collar(D, view):
    if view == 'front':
        # open notched camp collar lying flat, revealing a V
        D.d('inner', half((-50, 70), [('C', (-30, 76), (-14, 100), (0, 150)), ('C', (14, 100), (30, 76), (50, 70)), ('C', (30, 64), (-30, 64), (-50, 70))], close=True))
        for s in (1, -1):
            D.d('panel', half((6, 158), [('C', (16, 120), (30, 90), (52, 70)), ('L', (64, 82)), ('L', (78, 118)), ('L', (58, 128)), ('C', (40, 140), (22, 156), (6, 158))], s, close=True))
            D.d('seamL', half((58, 128), [('L', (46, 144))], s))
    else:
        D.d('panel', half((-64, 66), [('C', (-30, 60), (30, 60), (64, 66)), ('L', (66, 88)), ('C', (30, 96), (-30, 96), (-66, 88))], close=True))


def lapel(D, depth=270, wide=1.0, notch=True, peak=False, db=False, gorge=130):
    """Notched lapels with the V opening (the far side of the garment) shown dark."""
    vx = 0 if not db else 40
    D.d('inner', half((-50, 70), [('C', (-36, 100), (-14, depth - 120), (-vx, depth)), ('L', (vx, depth) if db else (0, depth)),
                                  ('C', (14, depth - 120), (36, 100), (50, 70)), ('C', (30, 64), (-30, 64), (-50, 70))], close=True))
    for s in (1, -1):
        lw = 44 * wide
        D.d('panel', half((s * 0 + (vx if db else 0), depth), [
            ('C', (lw * .6 + (vx if db else 0), depth - 60), (lw + 26, gorge + 40), (lw + 30, gorge)),     # lapel outer edge up to the notch
            ('L', (lw + 6, gorge - 4)) if notch and not peak else ('L', (lw + 52, gorge - 30)),
            ('L', (lw + 2, gorge - 10)) if not peak else ('L', (lw + 26, gorge - 8)),
            ('C', (58, 100), (54, 80), (52, 70)),                                                          # collar up to the neck
            ('L', (40, 72)), ('C', (30, 110), (14, depth - 100), (vx if db else 0, depth))], s, close=True))
    D.d('seamL', *pair((44 * wide + 30, gorge), [('L', (40 * wide + 4, gorge - 2))]))


SWEAT = dict(B=132, L=462)


# ─────────────────────────────────────────────────────────────────
# sweaters & sweatshirts
# ─────────────────────────────────────────────────────────────────
def start(view, **o):
    D = Drawing()
    g = body(view, o)
    D.o(g.outline)
    return D, g


def hoodie(view):
    D, g = start(view, neck='hood', **SWEAT)
    cuffs(D, g, 34)
    rib_hem(D, g, 44)
    sleeve_seams(D, g)
    if view == 'front':
        hood_front(D)
        kangaroo(D, 318, g.L - 44)
    else:
        hood_back(D)
    shading(D, g)
    return D


def zip_hoodie(view):
    D, g = start(view, neck='hood', **SWEAT)
    cuffs(D, g, 34)
    rib_hem(D, g, 44)
    sleeve_seams(D, g)
    if view == 'front':
        hood_front(D)
        zip_line(D, 138, g.L - 2)
        D.d('edge', half((-112, g.L - 46), [('L', (-86, 330)), ('L', (-80, 330))]), half((112, g.L - 46), [('L', (86, 330)), ('L', (80, 330))]))
        D.d('stitch', half((-104, g.L - 46), [('L', (-80, 340))]), half((104, g.L - 46), [('L', (80, 340))]))
        D.d('seamL', half((-8, 140), [('L', (-8, g.L))]), half((8, 140), [('L', (8, g.L))]))
    else:
        hood_back(D)
    shading(D, g)
    return D


def crewneck(view):
    D, g = start(view, **SWEAT)
    cuffs(D, g, 34)
    rib_hem(D, g, 44)
    sleeve_seams(D, g)
    neck_crew(D, g, view, 108, 12)
    if view == 'front':
        D.d('stitch', 'M292 126 L300 112 L308 126')                                  # V-insert stitch
    shading(D, g)
    return D


def quarter_zip(view):
    D, g = start(view, neck='stand', **SWEAT)
    cuffs(D, g, 34)
    rib_hem(D, g, 44)
    sleeve_seams(D, g)
    if view == 'front':
        zip_line(D, 52, 196)
        D.d('seam', half((-10, 50), [('L', (-10, 198)), ('L', (10, 198)), ('L', (10, 50))]))
        D.d('seamL', half((-48, 80), [('C', (-30, 84), (30, 84), (48, 80))]))
    else:
        D.d('seamL', half((-48, 82), [('C', (-30, 88), (30, 88), (48, 82))]))
    shading(D, g)
    return D


def half_zip(view):
    D, g = start(view, neck='stand', B=134, L=460, Bh=134, hem='blouson')
    D.d('panel', half((-10, 48), [('L', (10, 48)), ('L', (10, 242)), ('L', (-10, 242))], close=True)) if view == 'front' else None
    if view == 'front':
        zip_line(D, 52, 238)
        patch_pocket(D, 30, 188, 70, 74, side=-1)                                       # chest pocket
        D.d('seamL', half((-48, 82), [('C', (-30, 86), (30, 86), (48, 82))]))
    # bound cuffs and drawcord hem (fleece)
    D.d('seam', cuff_line(g, 16, 1), cuff_line(g, 16, -1))
    D.d('seam', hem_line(g, 18))
    D.x(f'<path d="M{X(-g.Bh + 14)} {g.L - 4} C{X(-g.Bh + 10)} {g.L + 10} {X(-g.Bh + 14)} {g.L + 20} {X(-g.Bh + 10)} {g.L + 30}" fill="none" stroke="#6f6b63" stroke-width="3" stroke-linecap="round"/>')
    sleeve_seams(D, g)
    shading(D, g)
    return D


KNIT = dict(B=128, L=458)


def knit_trims(D, g, cuff=40, hem=40):
    cuffs(D, g, cuff)
    rib_hem(D, g, hem)


def pullover(view):
    D, g = start(view, **KNIT)
    knit_trims(D, g)
    neck_crew(D, g, view, 104, 14)
    if view == 'front':
        D.d('rib', *[half((x, 100 + abs(x) * 0), [('L', (x, 120))]) for x in ()])
    D.d('seamL', *pair(g.SP, [('C', (g.SP[0] - 6, g.SP[1] + 40), (g.AP[0] - 8, g.AP[1] - 40), g.AP)]))   # fully-fashioned armhole
    D.d('rib', *pair((g.SP[0] - 8, g.SP[1] + 2), [('C', (g.SP[0] - 14, g.SP[1] + 40), (g.AP[0] - 16, g.AP[1] - 40), (g.AP[0] - 8, g.AP[1]))]))
    shading(D, g)
    return D


def cardigan(view):
    D, g = start(view, neckW=56, **KNIT)
    knit_trims(D, g)
    sleeve_seams(D, g, 'seamL')
    if view == 'front':
        # V-neck button band down the centre front
        D.d('inner', half((-56, HPS_Y), [('C', (-50, 120), (-14, 200), (-8, 232)), ('L', (8, 232)), ('C', (14, 200), (50, 120), (56, HPS_Y)),
                                         ('C', (30, 84), (-30, 84), (-56, HPS_Y))], close=True))
        D.d('seam', half((-70, HPS_Y + 4), [('C', (-64, 130), (-28, 210), (-14, 240)), ('L', (-14, g.L))]),
            half((70, HPS_Y + 4), [('C', (64, 130), (28, 210), (14, 240)), ('L', (14, g.L))]))
        D.d('seamL', f'M{X(0)} 236 L{X(0)} {g.L}')
        for i in range(5):
            D.d('button', circle(X(-6), 256 + i * 44, 5))
        patch_pocket(D, 42, 340, 66, 70, side=1)
        patch_pocket(D, 42, 340, 66, 70, side=-1)
    else:
        back_neck_seam(D, g, 88, 56)
    shading(D, g)
    return D


def turtleneck(view):
    D, g = start(view, neck='turtle', **KNIT)
    knit_trims(D, g)
    sleeve_seams(D, g, 'seamL')
    D.d('seam', 'M246 50 C270 56 330 56 354 50')                                 # fold of the roll collar
    D.d('seamL', half((-54, 62), [('C', (-30, 70), (30, 70), (54, 62))]))
    D.d('rib', *[f'M{X(x)} 18 L{X(x)} {48 + (1 - (x / 54) ** 2) * 5}' for x in range(-48, 50, 8)])
    D.light('M256 22 L256 60', 10, .2)
    D.dark('M346 22 L346 60', 10, .18)
    shading(D, g)
    return D


def mock_neck(view):
    D, g = start(view, neck='mock', **KNIT)
    knit_trims(D, g)
    sleeve_seams(D, g, 'seamL')
    D.d('seam', half((-48, 76), [('C', (-30, 84), (30, 84), (48, 76))]))
    D.d('rib', *[f'M{X(x)} 46 L{X(x)} {74 + (1 - (x / 46) ** 2) * 8}' for x in range(-40, 44, 8)])
    shading(D, g)
    return D


def v_neck_sweater(view):
    D, g = start(view, neckW=54, **KNIT)
    knit_trims(D, g)
    sleeve_seams(D, g, 'seamL')
    neck_v(D, g, view, 186, 14, 54)
    shading(D, g)
    return D


def sweater_vest(view):
    D, g = start(view, sleeve='none', neckW=54, armInset=20, **KNIT)
    rib_hem(D, g, 40)
    neck_v(D, g, view, 200, 14, 54)
    # ribbed armhole bands
    for s in (1, -1):
        D.d('seam', half((g.SPn[0] - 12, g.SPn[1] + 2), [('C', (g.SPn[0] - 20, g.SPn[1] + 40), (g.AP[0] - 40, g.AP[1] - 20), (g.AP[0] - 10, g.AP[1] + 4))], s))
    shading(D, g)
    return D


def knit_polo(view):
    D, g = start(view, neck='polo', **KNIT)
    knit_trims(D, g)
    sleeve_seams(D, g, 'seamL')
    if view == 'front':
        point_collar(D, view, spread=6, depth=150)
        placket(D, g, 108, 210, 12, 3)
    else:
        point_collar(D, view)
    shading(D, g)
    return D


def shawl_cardigan(view):
    D, g = start(view, neck='lapel', B=134, L=470)
    knit_trims(D, g, 42, 44)
    sleeve_seams(D, g, 'seamL')
    if view == 'front':
        # rolled shawl collar running into the button band
        D.d('inner', half((-48, 72), [('C', (-30, 110), (-10, 200), (0, 250)), ('C', (10, 200), (30, 110), (48, 72)), ('C', (30, 66), (-30, 66), (-48, 72))], close=True))
        for s in (1, -1):
            D.d('panel', half((0, 262), [('C', (40, 220), (80, 140), (74, 74)), ('C', (70, 62), (52, 60), (46, 66)), ('C', (34, 110), (12, 200), (0, 252))], s, close=True))
        D.d('seam', half((-14, 262), [('L', (-14, g.L))]), half((14, 262), [('L', (14, g.L))]))
        for i in range(3):
            D.d('button', circle(X(-4), 290 + i * 50, 6.5))
        patch_pocket(D, 40, 346, 74, 74, side=1)
        patch_pocket(D, 40, 346, 74, 74, side=-1)
        D.dark(half((-40, 90), [('C', (-60, 140), (-50, 200), (-20, 250))]), 14, .18)
    else:
        D.d('panel', half((-70, 64), [('C', (-30, 56), (30, 56), (70, 64)), ('L', (72, 100)), ('C', (30, 110), (-30, 110), (-72, 100))], close=True))
        D.d('rib', *[f'M{X(x)} {60} L{X(x)} {104 - (x / 72) ** 2 * 6}' for x in range(-64, 70, 9)])
    shading(D, g)
    return D


# ─────────────────────────────────────────────────────────────────
# tees
# ─────────────────────────────────────────────────────────────────
TEE = dict(B=130, L=470, sleeve='short')


def tee_base(view, neck='crew', depth=108, **o):
    o = {**TEE, **o}
    D, g = start(view, neck=neck if neck not in ('v', 'scoop') else 'crew', **o)
    sleeve_seams(D, g)
    if g.SV:
        if g.SV['kind'] == 'long':
            cuffs(D, g, 40)
        else:
            D.d('stitch', cuff_line(g, 14, 1), cuff_line(g, 14, -1))
    D.d('stitch', hem_line(g, 14))
    return D, g


def tshirt(view):
    D, g = tee_base(view)
    neck_crew(D, g, view, 108, 10)
    shading(D, g)
    return D


def long_sleeve(view):
    D, g = tee_base(view, sleeve='long')
    neck_crew(D, g, view, 108, 10)
    shading(D, g)
    return D


def pocket_tee(view):
    D, g = tee_base(view)
    neck_crew(D, g, view, 108, 10)
    if view == 'front':
        patch_pocket(D, 34, 158, 62, 70, side=-1)
    shading(D, g)
    return D


def v_neck_tee(view):
    D, g = tee_base(view, neckW=50)
    neck_v(D, g, view, 168, 10, 50)
    shading(D, g)
    return D


def ringer(view):
    D, g = tee_base(view)
    # contrast rib collar and sleeve bands
    if view == 'front':
        D.d('inner', half((-48, HPS_Y), [('C', (-42, 96), (-24, 108), (0, 108)), ('C', (24, 108), (42, 96), (48, HPS_Y)),
                                         ('C', (30, 82), (-30, 82), (-48, HPS_Y))], close=True))
        D.a(half((-52, HPS_Y - 2), [('C', (-48, 104), (-26, 120), (0, 120)), ('C', (26, 120), (48, 104), (52, HPS_Y - 2)),
                                    ('L', (48, HPS_Y)), ('C', (42, 96), (24, 108), (0, 108)), ('C', (-24, 108), (-42, 96), (-48, HPS_Y))], close=True))
    else:
        D.a(half((-52, HPS_Y - 2), [('C', (-30, 92), (30, 92), (52, HPS_Y - 2)), ('L', (48, HPS_Y + 10)), ('C', (30, 82), (-30, 82), (-48, HPS_Y)), ], close=True))
        D.a(half((-60, 66), [('C', (-30, 80), (30, 80), (60, 66)), ('L', (60, 60)), ('L', (-60, 60))], close=True))
    sv = g.SV
    for s in (1, -1):
        a, b = sv['CO'], sv['CI']
        D.a(half(add(a, sv['d'], 2), [('L', add(b, sv['d'], 2)), ('L', add(b, sv['d'], -18)), ('L', add(a, sv['d'], -18))], s, close=True))
    shading(D, g)
    return D


def henley(view):
    D, g = tee_base(view, sleeve='long')
    neck_crew(D, g, view, 104, 10)
    if view == 'front':
        placket(D, g, 104, 196, 12, 3)
        D.d('seam', f'M{X(-12)} 196 L{X(12)} 196')
    shading(D, g)
    return D


def baseball_tee(view):
    D, g = tee_base(view, sleeve='three')
    neck_crew(D, g, view, 106, 10)
    # contrast raglan sleeves (accent): from the neck to the underarm
    sv = g.SV
    for s in (1, -1):
        D.a(half((40, 76), [('C', (60, 80), (90, 88), g.SP)] + sv['outer'] + [('L', sv['CI'])] + sv['inner'] +
                 [('C', (g.AP[0] - 30, g.AP[1] - 50), (68, 110), (40, 76))], s, close=True))
    raglan_seams(D, g, 78)
    shading(D, g)
    return D


def graphic_tee(view):
    # roomier, slightly dropped shoulder: keeps a big clean print field
    D, g = tee_base(view, B=136, drop=.5, L=474)
    neck_crew(D, g, view, 106, 12)
    shading(D, g, strong=.8)
    return D


def baby_tee(view):
    D, g = tee_base(view, B=114, Bh=112, W=108, waistY=290, L=372, sleeve='cap', nw=46)
    neck_crew(D, g, view, 116, 8, 46)
    shading(D, g)
    return D


def mock_tee(view):
    D, g = tee_base(view, neck='mock', neckTop=56)
    D.d('seam', half((-48, 78), [('C', (-30, 86), (30, 86), (48, 78))]))
    D.d('stitch', half((-44, 64), [('L', (44, 64))]))
    shading(D, g)
    return D


def scoop_tee(view):
    D, g = tee_base(view, neckW=60, B=124, W=118, waistY=310)
    neck_crew(D, g, view, 150, 8, 60)
    shading(D, g)
    return D


def thermal(view):
    D, g = tee_base(view, sleeve='long', B=128)
    neck_crew(D, g, view, 104, 10)
    if view == 'front':
        placket(D, g, 104, 176, 11, 3, r=4)
    cuffs(D, g, 52)
    rib_hem(D, g, 30)
    # waffle knit suggested with a few faint vertical ribs only
    D.d('rib', *[f'M{X(x)} 220 L{X(x)} {g.L - 36}' for x in range(-100, 110, 40)])
    shading(D, g)
    return D


# ─────────────────────────────────────────────────────────────────
# shirts
# ─────────────────────────────────────────────────────────────────
SHIRT = dict(B=130, L=488, hem='curved', neck='collar')


def shirt_base(view, cuff=40, yoke=True, front_placket=True, n=6, style='button', pleat='box', collar=None, **o):
    o = {**SHIRT, **o}
    D, g = start(view, **o)
    sleeve_seams(D, g)
    if g.SV and g.SV['kind'] in ('long', 'balloon'):
        D.d('seam', cuff_line(g, cuff, 1), cuff_line(g, cuff, -1))
        for s in (1, -1):
            p = add(add(g.SV['CI'], g.SV['d'], -cuff * .5), g.SV['n'], -14)
            D.d('button', half(p, [], s) if False else circle(X(s * p[0]), p[1], 3.6))
        D.d('seamL', *pair(add(add(g.SV['CI'], g.SV['n'], -22), g.SV['d'], -cuff), [('L', add(add(g.SV['CI'], g.SV['n'], -30), g.SV['d'], -cuff - 60))]))  # sleeve placket
    elif g.SV:
        D.d('stitch', cuff_line(g, 16, 1), cuff_line(g, 16, -1))
    D.d('stitch', hem_line(g, 10))
    if view == 'front':
        if (collar or 'point') == 'point':
            point_collar(D, view, **({} if collar is None else {}))
        if front_placket:
            placket(D, g, 112, hem_y(g) - 2, 14, n, style)
    else:
        point_collar(D, view)
        if yoke:
            D.d('seam', half((-g.SP[0] - 2, 128), [('C', (-60, 132), (60, 132), (g.SP[0] + 2, 128))]))
        if pleat == 'box':
            D.d('seamL', half((-14, 130), [('L', (-12, 170))]), half((14, 130), [('L', (12, 170))]))
        elif pleat == 'side':
            D.d('seamL', *pair((70, 130), [('L', (72, 166))]))
    return D, g


def button_up(view):
    D, g = shirt_base(view)
    if view == 'front':
        patch_pocket(D, 34, 166, 60, 68, side=-1, point=True)
    shading(D, g)
    return D


def oxford(view):
    D, g = shirt_base(view)
    if view == 'front':
        D.d('button', circle(X(-34), 134, 3.4), circle(X(34), 134, 3.4))           # button-down collar points
        patch_pocket(D, 34, 166, 60, 68, side=-1)
    else:
        D.d('panel', rect(X(-6), 132, 12, 22, 3))                                 # locker loop
    shading(D, g)
    return D


def dress_shirt(view):
    D, g = shirt_base(view, cuff=48, B=126, W=118, waistY=320, Bh=124, pleat='side')
    if view == 'front':
        D.d('panel', half((0, 112), [('C', (-14, 110), (-40, 90), (-54, 66)), ('L', (-66, 82)), ('C', (-72, 100), (-74, 118), (-58, 134)),
                                     ('C', (-34, 126), (-12, 118), (0, 112))], close=True))     # spread collar overlay
        D.d('panel', half((0, 112), [('C', (14, 110), (40, 90), (54, 66)), ('L', (66, 82)), ('C', (72, 100), (74, 118), (58, 134)),
                                     ('C', (34, 126), (12, 118), (0, 112))], close=True))
    else:
        D.d('seamL', *pair((60, 240), [('C', (62, 290), (64, 340), (60, 400))]))   # back darts
    shading(D, g)
    return D


def flannel(view):
    D, g = shirt_base(view, B=134)
    if view == 'front':
        patch_pocket(D, 34, 168, 62, 70, flap=True, side=1)
        patch_pocket(D, 34, 168, 62, 70, flap=True, side=-1)
    shading(D, g)
    return D


def camp(view):
    D, g = shirt_base(view, neck='camp', sleeve='short', hem='straight', B=136, L=476, n=5, collar='camp', pleat='none')
    if view == 'front':
        camp_collar(D, view)
        D.d('seam', half((-14, 158), [('L', (-14, g.L))]), half((14, 158), [('L', (14, g.L))]))
        for i in range(5):
            D.d('button', circle(X(0), 180 + i * 58, 4.6))
        D.d('seamL', *pair((g.Bh, g.L - 30), [('L', (g.Bh - 14, g.L - 30)), ('L', (g.Bh - 14, g.L))]))   # side vents
    else:
        camp_collar(D, view)
    shading(D, g)
    return D


def overshirt(view):
    D, g = shirt_base(view, hem='straight', B=136, L=482, n=6, cuff=44)
    if view == 'front':
        patch_pocket(D, 32, 170, 66, 72, flap=True, side=1)
        patch_pocket(D, 32, 170, 66, 72, flap=True, side=-1)
        D.d('stitch', half((-20, 112), [('L', (-20, g.L))]), half((20, 112), [('L', (20, g.L))]))
    shading(D, g)
    return D


def polo_shirt(view):
    D, g = start(view, neck='polo', sleeve='short', B=130, L=474)
    sleeve_seams(D, g)
    # ribbed armbands, uneven hem with side vents
    D.d('seam', cuff_line(g, 18, 1), cuff_line(g, 18, -1))
    D.d('stitch', hem_line(g, 12))
    D.d('seamL', *pair((g.Bh, g.L - 34), [('L', (g.Bh - 12, g.L - 34)), ('L', (g.Bh - 12, g.L))]))
    if view == 'front':
        point_collar(D, view, spread=6, depth=148)
        placket(D, g, 108, 218, 14, 3)
        D.d('seam', f'M{X(-14)} 218 L{X(14)} 218')
    else:
        point_collar(D, view)
    shading(D, g)
    return D


def rugby(view):
    D, g = shirt_base(view, hem='straight', B=134, L=480, front_placket=False, yoke=False, pleat='none')
    cuffs(D, g, 40)
    if view == 'front':
        # contrast twill collar and a white-button placket
        D.a(half((0, 112), [('C', (-14, 110), (-40, 90), (-54, 66)), ('L', (-60, 80)), ('C', (-58, 100), (-52, 128), (-36, 146)),
                            ('C', (-24, 132), (-10, 120), (0, 112)), ('C', (10, 120), (24, 132), (36, 146)), ('C', (52, 128), (58, 100), (60, 80)),
                            ('L', (54, 66)), ('C', (40, 90), (14, 110), (0, 112))], close=True))
        D.a(rect(X(-16), 112, 32, 120, 2))
        placket(D, g, 112, 232, 16, 3, r=5.5)
    else:
        D.a(half((-60, 64), [('C', (-30, 58), (30, 58), (60, 64)), ('L', (62, 84)), ('C', (30, 92), (-30, 92), (-62, 84))], close=True))
    shading(D, g)
    return D


def western(view):
    D, g = shirt_base(view, style='snap', n=6, B=128, W=122, waistY=320, cuff=52, pleat='none')
    if view == 'front':
        # pointed front yokes and sawtooth-flap pockets
        D.d('seam', *pair((g.SP[0] - 4, 104), [('C', (90, 130), (70, 150), (46, 162)), ('L', (22, 150))]))
        D.d('stitch', *pair((g.SP[0] - 8, 112), [('C', (88, 136), (68, 156), (46, 170)), ('L', (22, 158))]))
        for s in (1, -1):
            D.d('panel', half((40, 186), [('L', (100, 186)), ('L', (100, 200)), ('L', (85, 196)), ('L', (70, 212)), ('L', (55, 196)), ('L', (40, 200))], s, close=True))
            D.d('hw', circle(X(s * 70), 202, 4))
            D.d('seamL', half((42, 200), [('L', (42, 250)), ('L', (98, 250)), ('L', (98, 200))], s))
        for s in (1, -1):
            for k in range(3):
                p = add(add(g.SV['CI'], g.SV['d'], -26), g.SV['n'], -12 - k * 13)
                D.d('hw', circle(X(s * p[0]), p[1], 3.4))
    else:
        D.d('seam', half((-g.SP[0] - 2, 122), [('L', (-40, 148)), ('L', (0, 176)), ('L', (40, 148)), ('L', (g.SP[0] + 2, 122))]))
    shading(D, g)
    return D


def work(view):
    D, g = shirt_base(view, hem='straight', B=136, L=482, n=6, pleat='side')
    if view == 'front':
        patch_pocket(D, 32, 170, 66, 74, flap=True, side=1)
        patch_pocket(D, 32, 170, 66, 74, flap=True, side=-1)
        D.d('seamL', half((-70, 166), [('L', (-70, 236))]))                     # pen slot
    shading(D, g)
    return D


def blouse(view):
    # fluid blouse: soft collarless neckline with a keyhole tie, gathered sleeves into cuffs
    D, g = start(view, neckW=56, sleeve='balloon', B=128, Bh=134, L=470, sw=1.1)
    sleeve_seams(D, g)
    D.d('seam', cuff_line(g, 30, 1), cuff_line(g, 30, -1))
    D.d('seamL', *[half(add(add(g.SV['CO'], g.SV['d'], -32), g.SV['n'], k), [('L', add(add(g.SV['CO'], g.SV['d'], -60), g.SV['n'], k - 2))], s)
                   for s in (1, -1) for k in (14, 28, 42)])
    D.d('stitch', hem_line(g, 12))
    neck_crew(D, g, view, 104, 10, 56)
    if view == 'front':
        D.d('edge', 'M300 104 C292 130 292 150 300 166 C308 150 308 130 300 104')
        D.x('<path d="M300 112 C286 128 274 160 268 196 M300 112 C314 128 326 160 332 196" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="7" stroke-linecap="round"/>')
        D.d('seamL', *pair((g.SP[0] - 2, 104), [('C', (100, 112), (106, 124), (112, 130))]))
    else:
        D.d('button', circle(X(0), 92, 4))
        D.d('seamL', 'M300 84 L300 118')
    shading(D, g)
    return D


def peasant(view):
    # wide gathered neckline with a drawstring, puffy three-quarter sleeves, loose A-line
    D, g = start(view, neckW=86, sleeve='three', sw=1.25, B=132, Bh=150, L=466)
    sleeve_seams(D, g, 'seamL')
    for s in (1, -1):
        sv = g.SV
        D.d('seam', half(add(sv['CO'], sv['d'], -18), [('L', add(sv['CI'], sv['d'], -18))], s))
        D.d('seamL', *[half(add(add(sv['CO'], sv['d'], -20), sv['n'], k), [('L', add(add(sv['CO'], sv['d'], -50), sv['n'], k + 3))], s) for k in (16, 34, 52)])
    D.d('stitch', hem_line(g, 12))
    if view == 'front':
        D.d('inner', half((-86, HPS_Y), [('C', (-70, 120), (-30, 128), (0, 128)), ('C', (30, 128), (70, 120), (86, HPS_Y)),
                                         ('C', (60, 92), (-60, 92), (-86, HPS_Y))], close=True))
        D.d('edge', half((-88, HPS_Y + 2), [('C', (-72, 138), (-30, 142), (0, 142)), ('C', (30, 142), (72, 138), (88, HPS_Y + 2))]))
        D.d('seamL', *[half((x, 136 + (abs(x) > 60) * -10), [('L', (x * 1.06, 170))]) for x in (-70, -46, -22, 22, 46, 70)])
        D.x('<path d="M300 142 C292 160 286 190 282 214 M300 142 C308 160 314 188 320 210" fill="none" stroke="#6f6b63" stroke-width="2.6" stroke-linecap="round"/>')
    else:
        D.d('edge', half((-88, HPS_Y + 2), [('C', (-60, 108), (60, 108), (88, HPS_Y + 2))]))
        D.d('seamL', *[half((x, 100), [('L', (x * 1.06, 134))]) for x in (-60, -30, 0, 30, 60)])
    shading(D, g)
    return D


def tunic(view):
    D, g = start(view, neckW=50, B=132, Bh=142, L=546, hem='straight')
    sleeve_seams(D, g)
    D.d('seam', cuff_line(g, 26, 1), cuff_line(g, 26, -1))
    D.d('stitch', hem_line(g, 12))
    D.d('seamL', *pair((g.Bh, g.L - 70), [('L', (g.Bh - 2, g.L))]))                 # side slits
    D.d('edge', *pair((g.Bh - 1, g.L - 70), [('L', (g.Bh - 1, g.L))]))
    neck_crew(D, g, view, 102, 8, 50)
    if view == 'front':
        D.d('edge', 'M300 102 L300 186')
        D.d('stitch', 'M292 104 L292 192 L308 192 L308 104')
    shading(D, g)
    return D


# ─────────────────────────────────────────────────────────────────
# outerwear
# ─────────────────────────────────────────────────────────────────
JKT = dict(B=140, L=470, sw=1.08)
COAT = dict(B=144, L=566, sw=1.1)


def bomber(view):
    D, g = start(view, neck='stand', hem='blouson', **{**JKT, 'L': 456})
    cuffs(D, g, 40)
    rib_hem(D, g, 46)
    sleeve_seams(D, g)
    D.d('rib', *[f'M{X(x)} 50 L{X(x)} {78 + (1 - (x / 50) ** 2) * 6}' for x in range(-44, 48, 8)])
    D.d('seam', half((-50, 78), [('C', (-30, 86), (30, 86), (50, 78))]))
    if view == 'front':
        zip_line(D, 52, g.L)
        welt_pocket(D, 72, 310, 92, 380, -1, 12)
        welt_pocket(D, 72, 310, 92, 380, 1, 12)
        # utility zip pocket on the left sleeve
        sv = g.SV
        p = add(add(g.SP, sv['d'], 70), sv['n'], 10)
        D.d('panel', half(p, [('L', add(p, sv['d'], 46)), ('L', add(add(p, sv['d'], 46), sv['n'], 34)), ('L', add(p, sv['n'], 34))], 1, close=True))
        D.d('zip', half(add(p, sv['n'], 6), [('L', add(add(p, sv['n'], 30), (0, 0)))], 1))
    shading(D, g)
    return D


def denim_jacket(view):
    D, g = start(view, neck='collar', **{**JKT, 'L': 446, 'B': 140})
    sleeve_seams(D, g)
    D.d('seam', cuff_line(g, 32, 1), cuff_line(g, 32, -1))
    D.d('stitch', cuff_line(g, 26, 1), cuff_line(g, 26, -1))
    D.d('seam', hem_line(g, 40))                                                  # waistband
    D.d('stitch', hem_line(g, 34), hem_line(g, 6))
    if view == 'front':
        point_collar(D, view, spread=4)
        placket(D, g, 112, g.L - 2, 16, 5)
        D.d('button', circle(X(-6), g.L - 20, 5))
        # pointed yoke, chest flap pockets, vertical panel seams
        D.d('seam', *pair((g.SP[0] - 4, 106), [('C', (110, 130), (90, 150), (60, 156)), ('L', (16, 150))]))
        D.d('stitch', *pair((g.SP[0] - 8, 114), [('C', (108, 138), (90, 158), (60, 164)), ('L', (16, 158))]))
        for s in (1, -1):
            D.d('panel', half((40, 172), [('L', (102, 172)), ('L', (102, 196)), ('L', (71, 212)), ('L', (40, 196))], s, close=True))
            D.d('button', circle(X(s * 71), 200, 4.4))
            D.d('stitch', half((34, 160), [('L', (34, g.L - 40))], s), half((108, 160), [('L', (108, g.L - 40))], s))
        D.d('seamL', *pair((g.Bh - 30, g.L - 40), [('L', (g.Bh - 30, g.L))]))
        D.d('button', circle(X(-g.Bh + 16), g.L - 20, 4), circle(X(g.Bh - 16), g.L - 20, 4))
    else:
        point_collar(D, view)
        D.d('seam', half((-g.SP[0] - 2, 150), [('L', (-40, 160)), ('L', (0, 184)), ('L', (40, 160)), ('L', (g.SP[0] + 2, 150))]))
        D.d('stitch', half((-g.SP[0] - 2, 158), [('L', (-40, 168)), ('L', (0, 192)), ('L', (40, 168)), ('L', (g.SP[0] + 2, 158))]))
        D.d('seam', *pair((64, 172), [('C', (66, 260), (70, 340), (72, g.L - 40))]))
        D.d('stitch', *pair((70, 176), [('C', (72, 260), (76, 340), (78, g.L - 40))]))
        D.d('panel', *pair((g.Bh - 60, g.L - 36), [('L', (g.Bh - 30, g.L - 36)), ('L', (g.Bh - 30, g.L - 8)), ('L', (g.Bh - 60, g.L - 8))], close=True))
    shading(D, g)
    return D


def varsity(view):
    D, g = start(view, neck='stand', hem='blouson', **{**JKT, 'L': 456})
    # contrast leather sleeves (accent) and striped rib trims
    sv = g.SV
    for s in (1, -1):
        D.a(half(g.SP, sv['outer'] + [('L', sv['CI'])] + sv['inner'] + [('C', (g.AP[0] - 8, g.AP[1] - 40), (g.SP[0] - 6, g.SP[1] + 40), g.SP)], s, close=True))
    cuffs(D, g, 40)
    rib_hem(D, g, 46)
    for off in (14, 24):
        D.d('edge', hem_line(g, off))
        D.d('edge', cuff_line(g, off, 1), cuff_line(g, off, -1))
    D.d('rib', *[f'M{X(x)} 50 L{X(x)} {78 + (1 - (x / 50) ** 2) * 6}' for x in range(-44, 48, 8)])
    D.d('seam', half((-50, 78), [('C', (-30, 86), (30, 86), (50, 78))]))
    D.d('edge', half((-50, 62), [('L', (50, 62))]))
    if view == 'front':
        D.d('seam', 'M300 50 L300 410')
        for i in range(6):
            D.d('hw', circle(X(-8), 92 + i * 60, 5))
        for s in (1, -1):
            D.d('panel', half((86, 300), [('C', (80, 330), (84, 360), (96, 380)), ('L', (108, 376)), ('C', (96, 356), (94, 330), (98, 300))], s, close=True))
    shading(D, g)
    return D


def coach(view):
    D, g = start(view, neck='collar', **{**JKT, 'L': 462, 'B': 142})
    sleeve_seams(D, g)
    D.d('seam', cuff_line(g, 20, 1), cuff_line(g, 20, -1))                       # elastic cuffs
    D.d('rib', *[half(add(add(g.SV['CO'], g.SV['n'], k), g.SV['d'], -18), [('L', add(add(g.SV['CO'], g.SV['n'], k), g.SV['d'], -2))], s) for s in (1, -1) for k in (10, 20, 30, 40, 50)])
    D.d('seam', hem_line(g, 26))                                                  # drawcord channel
    for s in (1, -1):
        x = X(s * (g.Bh - 4))
        D.x(f'<path d="M{f(x)} {g.L - 12} C{f(x + s * 8)} {g.L + 6} {f(x + s * 6)} {g.L + 24} {f(x + s * 10)} {g.L + 40}" fill="none" stroke="#6f6b63" stroke-width="3" stroke-linecap="round"/>')
        D.x(f'<rect x="{f(x + s * 10 - 5)}" y="{g.L + 38}" width="10" height="14" rx="3" fill="#2f2f2f"/>')
    if view == 'front':
        point_collar(D, view, spread=10)
        D.d('seam', half((-14, 112), [('L', (-14, g.L))]), half((14, 112), [('L', (14, g.L))]))
        for i in range(5):
            D.d('hw', circle(X(0), 140 + i * 66, 5.2))
        welt_pocket(D, 74, 330, 90, 400, -1, 10)
        welt_pocket(D, 74, 330, 90, 400, 1, 10)
    else:
        point_collar(D, view)
    shading(D, g)
    return D


def windbreaker(view):
    D, g = start(view, neck='hood', **{**JKT, 'L': 462})
    sleeve_seams(D, g)
    D.d('seam', cuff_line(g, 18, 1), cuff_line(g, 18, -1))
    D.d('seam', hem_line(g, 22))
    if view == 'front':
        hood_front(D)
        # colour-blocked chest panel (accent)
        D.a(half((-g.B - 4, 200), [('C', (-60, 214), (60, 214), (g.B + 4, 200)), ('L', (g.B + 4, 260)), ('C', (60, 274), (-60, 274), (-g.B - 4, 260))], close=True))
        D.d('seam', half((-g.B, 200), [('C', (-60, 214), (60, 214), (g.B, 200))]), half((-g.B, 260), [('C', (-60, 274), (60, 274), (g.B, 260))]))
        zip_line(D, 140, g.L)
        zip_pocket(D, 64, 340, 92, 400, -1)
        zip_pocket(D, 64, 340, 92, 400, 1)
    else:
        hood_back(D)
        D.d('seam', half((-g.B, 200), [('C', (-60, 214), (60, 214), (g.B, 200))]))
        D.d('panel', half((-60, 196), [('C', (-30, 204), (30, 204), (60, 196)), ('L', (56, 210)), ('C', (30, 218), (-30, 218), (-56, 210))], close=True))   # vent
    shading(D, g)
    return D


def puffer(view):
    D = Drawing()
    g = body(view, dict(neck='stand', baffles=[150, 210, 270, 330, 390], **{**JKT, 'B': 148, 'L': 452, 'sw': 1.25}))
    # scalloped silhouette: each baffle bulges out at the side seams
    D.o(g.outline)
    baffles = [150, 210, 270, 330, 390]
    for y in baffles:
        D.d('edge', f'M{X(-g.B)} {y} C{X(-g.B * .5)} {y + 8} {X(g.B * .5)} {y + 8} {X(g.B)} {y}')
        D.dark(f'M{X(-g.B * .8)} {y + 4} C{X(-g.B * .4)} {y + 10} {X(g.B * .4)} {y + 10} {X(g.B * .8)} {y + 4}', 10, .2)
        D.light(f'M{X(-g.B * .7)} {y + 28} C{X(-g.B * .4)} {y + 32} {X(-g.B * .1)} {y + 32} {X(g.B * .2)} {y + 30}', 14, .14)
    sv = g.SV
    for s in (1, -1):
        for k in range(1, 6):
            a = add(g.SP, sv['d'], sv['L'] * k / 6 + 6)
            D.d('edge', half(add(a, sv['n'], 4), [('L', add(a, sv['n'], sv['cw'] + 8))], s))
    D.d('seam', cuff_line(g, 20, 1), cuff_line(g, 20, -1), hem_line(g, 18))
    D.d('seam', half((-48, 82), [('C', (-30, 88), (30, 88), (48, 82))]))
    if view == 'front':
        zip_line(D, 52, g.L)
        D.d('seamL', half((-12, 52), [('L', (-12, g.L))]))
        zip_pocket(D, 76, 340, 96, 400, -1)
        zip_pocket(D, 76, 340, 96, 400, 1)
    shading(D, g, strong=1.2)
    return D


def parka(view):
    D, g = start(view, neck='hood', **{**COAT, 'L': 540})
    sleeve_seams(D, g)
    D.d('seam', cuff_line(g, 24, 1), cuff_line(g, 24, -1))
    D.d('stitch', hem_line(g, 12))
    D.d('stitch', half((-g.B, 330), [('C', (-60, 334), (60, 334), (g.B, 330))]))      # drawcord waist channel
    if view == 'front':
        # faux-fur ruff (accent) around the hood opening
        D.a('M300 4 C352 4 386 32 388 74 C390 110 360 140 300 156 C240 140 210 110 212 74 C214 32 248 4 300 4 Z '
            'M300 26 C266 26 248 42 250 68 C252 102 274 128 300 134 C326 128 348 102 350 68 C352 42 334 26 300 26 Z')
        D.d('inner', 'M300 134 C326 128 348 102 350 68 C352 42 334 26 300 26 C266 26 248 42 250 68 C252 102 274 128 300 134 Z')
        D.d('panel', half((-16, 140), [('L', (16, 140)), ('L', (16, g.L)), ('L', (-16, g.L))], close=True))         # storm flap
        for i in range(6):
            D.d('hw', circle(X(0), 170 + i * 64, 4.6))
        for s in (1, -1):
            patch_pocket(D, 40, 186, 64, 70, flap=True, side=s)
            patch_pocket(D, 40, 386, 82, 92, flap=True, side=s)
    else:
        hood_back(D)
        D.d('seam', 'M300 158 L300 540')
    shading(D, g)
    return D


def leather(view):
    D, g = start(view, neck='lapel', **{**JKT, 'L': 448, 'B': 138})
    sleeve_seams(D, g)
    D.d('seam', hem_line(g, 40))                                                   # belted hem
    D.d('panel', *[half((g.Bh - 50, g.L - 42), [('L', (g.Bh - 26, g.L - 42)), ('L', (g.Bh - 26, g.L - 4)), ('L', (g.Bh - 50, g.L - 4))], s, close=True) for s in (1, -1)])
    D.d('hw', *[rect(X(s * (g.Bh - 38)) - 9, g.L - 36, 18, 26, 3) for s in (1, -1)])
    for s in (1, -1):                                                               # zipped cuffs
        D.d('zip', half(add(add(g.SV['CI'], g.SV['n'], -8), g.SV['d'], -2), [('L', add(add(g.SV['CI'], g.SV['n'], -8), g.SV['d'], -66))], s))
    if view == 'front':
        # asymmetric zip and wide lapels with snaps
        D.d('inner', 'M250 70 C270 100 300 140 330 160 L350 70 C330 64 270 64 250 70 Z')
        D.d('panel', 'M330 160 C360 130 382 100 384 74 L404 96 C400 130 380 160 352 188 Z')
        D.d('panel', 'M330 160 C300 140 270 100 250 70 L222 84 C226 120 250 160 290 196 Z')
        D.d('zip', 'M352 188 C376 230 384 300 380 440')
        D.d('hw', circle(392, 92, 4.4), circle(232, 96, 4.4), rect(376, 186, 8, 20, 3))
        zip_pocket(D, 70, 170, 120, 190, -1)
        zip_pocket(D, 66, 330, 96, 390, -1)
        zip_pocket(D, 66, 330, 96, 390, 1)
    else:
        D.d('panel', half((-60, 64), [('C', (-30, 58), (30, 58), (60, 64)), ('L', (62, 88)), ('C', (30, 96), (-30, 96), (-62, 88))], close=True))
        D.d('seam', half((-g.SP[0] - 2, 160), [('C', (-60, 168), (60, 168), (g.SP[0] + 2, 160))]))
        D.d('seam', *pair((60, 168), [('C', (62, 260), (66, 340), (70, g.L - 40))]))
    shading(D, g, strong=1.2)
    return D


def harrington(view):
    D, g = start(view, neck='stand', hem='blouson', **{**JKT, 'L': 448})
    cuffs(D, g, 36)
    rib_hem(D, g, 40)
    sleeve_seams(D, g)
    D.d('seam', half((-50, 78), [('C', (-30, 86), (30, 86), (50, 78))]))
    if view == 'front':
        zip_line(D, 56, g.L - 2)
        D.d('panel', half((-10, 50), [('L', (40, 50)), ('L', (40, 66)), ('L', (-10, 66))], close=True))    # throat tab
        D.d('button', circle(X(-2), 58, 3.6), circle(X(30), 58, 3.6))
        for s in (1, -1):
            D.d('panel', half((60, 296), [('L', (112, 280)), ('L', (116, 304)), ('L', (64, 320))], s, close=True))   # slanted flap pockets
            D.d('button', circle(X(s * 88), 302, 3.6))
    else:
        # umbrella yoke
        D.d('seam', half((-g.SP[0] - 2, 104), [('C', (-g.SP[0] + 10, 150), (-80, 196), (-40, 210)), ('C', (-20, 216), (20, 216), (40, 210)),
                                               ('C', (80, 196), (g.SP[0] - 10, 150), (g.SP[0] + 2, 104))]))
    shading(D, g)
    return D


def shacket(view):
    D, g = shirt_base(view, hem='straight', B=146, L=506, sw=1.1, n=6, cuff=44, pleat='box')
    if view == 'front':
        patch_pocket(D, 32, 172, 70, 76, flap=True, side=1)
        patch_pocket(D, 32, 172, 70, 76, flap=True, side=-1)
        D.d('stitch', half((-22, 112), [('L', (-22, g.L))]), half((22, 112), [('L', (22, g.L))]))
        D.d('seamL', *pair((g.Bh - 2, g.L - 40), [('L', (g.Bh - 14, g.L - 40)), ('L', (g.Bh - 14, g.L))]))
    shading(D, g)
    return D


def chore(view):
    D, g = start(view, neck='collar', **{**JKT, 'L': 500, 'B': 144})
    sleeve_seams(D, g)
    D.d('stitch', cuff_line(g, 18, 1), cuff_line(g, 18, -1), hem_line(g, 12))
    D.d('seamL', *pair(add(add(g.SV['CI'], g.SV['n'], -16), g.SV['d'], -2), [('L', add(add(g.SV['CI'], g.SV['n'], -16), g.SV['d'], -70))]))
    if view == 'front':
        point_collar(D, view, spread=10, depth=150)
        placket(D, g, 120, g.L - 4, 16, 5)
        patch_pocket(D, 30, 176, 64, 70, side=-1)                          # chest pocket
        patch_pocket(D, 34, 340, 84, 92, side=1)                           # two hip pockets
        patch_pocket(D, 34, 340, 84, 92, side=-1)
    else:
        point_collar(D, view)
    shading(D, g)
    return D


def anorak(view):
    D, g = start(view, neck='hood', **{**JKT, 'L': 484, 'B': 144})
    sleeve_seams(D, g)
    D.d('seam', cuff_line(g, 18, 1), cuff_line(g, 18, -1), hem_line(g, 18))
    D.d('stitch', half((-g.B, 300), [('C', (-60, 304), (60, 304), (g.B, 300))]))      # waist drawcord
    for s in (1, -1):
        D.x(f'<path d="M{f(X(s * 30))} 304 C{f(X(s * 34))} 320 {f(X(s * 30))} 336 {f(X(s * 34))} 352" fill="none" stroke="#6f6b63" stroke-width="3" stroke-linecap="round"/>')
    if view == 'front':
        hood_front(D)
        zip_line(D, 140, 250)
        D.d('panel', half((-16, 140), [('L', (16, 140)), ('L', (16, 250)), ('L', (-16, 250))], close=True))
        # big kangaroo pouch with a flap
        D.d('seam', half((-104, 446), [('L', (-104, 340)), ('L', (104, 340)), ('L', (104, 446)), ('L', (-104, 446))]))
        D.d('panel', half((-108, 334), [('L', (108, 334)), ('L', (108, 372)), ('L', (-108, 372))], close=True))
        D.d('hw', circle(X(-50), 360, 4.4), circle(X(50), 360, 4.4))
    else:
        hood_back(D)
    shading(D, g)
    return D


def fleece(view):
    D, g = start(view, neck='stand', **{**JKT, 'L': 462, 'B': 140})
    sleeve_seams(D, g)
    # bound edges (accent) at cuffs and hem
    for s in (1, -1):
        sv = g.SV
        D.a(half(add(sv['CO'], sv['d'], 4), [('L', add(sv['CI'], sv['d'], 4)), ('L', add(sv['CI'], sv['d'], -14)), ('L', add(sv['CO'], sv['d'], -14))], s, close=True))
    D.a(f'M{X(-g.Bh - 2)} {g.L - 14} L{X(g.Bh + 2)} {g.L - 14} L{X(g.Bh + 2)} {g.L + 4} L{X(-g.Bh - 2)} {g.L + 4} Z')
    D.a(half((-48, 46), [('L', (48, 46)), ('L', (48, 58)), ('L', (-48, 58))], close=True))
    D.d('seam', hem_line(g, 14), cuff_line(g, 14, 1), cuff_line(g, 14, -1))
    D.d('seam', half((-50, 80), [('C', (-30, 86), (30, 86), (50, 80))]))
    if view == 'front':
        zip_line(D, 48, g.L)
        # contrast yoke overlay and chest pocket
        D.d('seam', half((-g.SP[0] - 2, 150), [('C', (-60, 160), (60, 160), (g.SP[0] + 2, 150))]))
        zip_pocket(D, 34, 210, 90, 196, -1)
        zip_pocket(D, 76, 330, 98, 410, -1)
        zip_pocket(D, 76, 330, 98, 410, 1)
    else:
        D.d('seam', half((-g.SP[0] - 2, 150), [('C', (-60, 160), (60, 160), (g.SP[0] + 2, 150))]))
    shading(D, g)
    return D


def rain(view):
    D, g = start(view, neck='hood', **{**JKT, 'L': 500, 'B': 146})
    sleeve_seams(D, g)
    D.d('seam', cuff_line(g, 22, 1), cuff_line(g, 22, -1))
    D.d('panel', *[half(add(add(g.SV['CI'], g.SV['n'], -2), g.SV['d'], -12), [('L', add(add(g.SV['CI'], g.SV['n'], -30), g.SV['d'], -18)),
                                                                              ('L', add(add(g.SV['CI'], g.SV['n'], -30), g.SV['d'], -30)), ('L', add(add(g.SV['CI'], g.SV['n'], -2), g.SV['d'], -28))], s, close=True) for s in (1, -1)])
    D.d('stitch', hem_line(g, 12))
    if view == 'front':
        hood_front(D)
        D.d('panel', half((-18, 140), [('L', (18, 140)), ('L', (18, g.L)), ('L', (-18, g.L))], close=True))
        for i in range(5):
            D.d('hw', circle(X(0), 172 + i * 70, 4.6))
        for s in (1, -1):
            D.d('panel', half((48, 346), [('L', (124, 346)), ('L', (124, 374)), ('L', (48, 374))], s, close=True))
            D.d('seamL', half((50, 374), [('L', (50, 440)), ('L', (122, 440)), ('L', (122, 374))], s))
    else:
        hood_back(D)
        D.d('panel', half((-g.SP[0], 150), [('C', (-60, 168), (60, 168), (g.SP[0], 150)), ('L', (g.SP[0] - 6, 178)), ('C', (60, 194), (-60, 194), (-g.SP[0] + 6, 178))], close=True))
    shading(D, g)
    return D


def gilet(view):
    D, g = start(view, neck='stand', sleeve='none', armInset=6, baffles=[150, 210, 270, 330, 390], **{**JKT, 'B': 144, 'L': 452})
    for y in (150, 210, 270, 330, 390):
        D.d('edge', f'M{X(-g.B)} {y} C{X(-g.B * .5)} {y + 8} {X(g.B * .5)} {y + 8} {X(g.B)} {y}')
        D.dark(f'M{X(-g.B * .8)} {y + 4} C{X(-g.B * .4)} {y + 10} {X(g.B * .4)} {y + 10} {X(g.B * .8)} {y + 4}', 10, .2)
        D.light(f'M{X(-g.B * .7)} {y + 28} C{X(-g.B * .4)} {y + 32} {X(-g.B * .1)} {y + 32} {X(g.B * .2)} {y + 30}', 14, .14)
    D.d('seam', hem_line(g, 16))
    D.d('edge', *pair((g.SPn[0] - 2, g.SPn[1] + 2), [('C', (g.SPn[0] - 10, g.SPn[1] + 40), (g.AP[0] - 26, g.AP[1] - 22), (g.AP[0] - 2, g.AP[1]))]))
    D.d('seam', half((-48, 82), [('C', (-30, 88), (30, 88), (48, 82))]))
    if view == 'front':
        zip_line(D, 52, g.L)
        zip_pocket(D, 80, 330, 100, 390, -1)
        zip_pocket(D, 80, 330, 100, 390, 1)
    shading(D, g)
    return D


def tailored(view, D, g, depth=300, db=False, buttons=2, gorge=136, wide=1.0, pockets='flap', vent='centre', ticket=False, chest=True, peak=False):
    sleeve_seams(D, g)
    D.d('stitch', hem_line(g, 10))
    for s in (1, -1):                                                         # cuff buttons
        for k in range(3 if not db else 2):
            p = add(add(g.SV['CI'], g.SV['d'], -24 - k * 13), g.SV['n'], -10)
            D.d('button', circle(X(s * p[0]), p[1], 3))
    if view == 'front':
        lapel(D, depth, wide, db=db, gorge=gorge, peak=peak)
        # front edge: a softly cut-away quarter on single-breasted coats
        if not db:
            D.d('seam', half((0, depth), [('L', (0, g.L - 40)), ('C', (0, g.L - 14), (10, g.L - 4), (30, g.L))]))
            for i in range(buttons):
                D.d('button', circle(X(-8), depth + 20 + i * 64, 6))
        else:
            D.d('seam', half((40, depth), [('L', (40, g.L))]))
            for i in range(buttons // 2):
                for x in (-24, 24):
                    D.d('button', circle(X(x), depth + 22 + i * 64, 6))
        if pockets == 'flap':
            for s in (1, -1):
                D.d('panel', half((60, 400), [('L', (128, 398)), ('L', (128, 424)), ('L', (60, 426))], s, close=True))
        elif pockets == 'slash':
            for s in (1, -1):
                welt_pocket(D, 76, 360, 104, 430, s, 10)
        if ticket:
            D.d('panel', half((70, 366), [('L', (122, 364)), ('L', (122, 382)), ('L', (70, 384))], -1, close=True))
        if chest:
            D.d('panel', half((60, 210), [('L', (108, 204)), ('L', (108, 216)), ('L', (60, 222))], -1, close=True))
        D.d('seamL', *pair((100, 240), [('C', (102, 300), (100, 360), (98, 396))]))             # front darts
    else:
        D.d('panel', half((-62, 64), [('C', (-30, 58), (30, 58), (62, 64)), ('L', (64, 90)), ('C', (30, 98), (-30, 98), (-64, 90))], close=True))
        D.d('seam', half((0, 96), [('C', (-4, 200), (2, 300), (0, g.L)) if vent != 'centre' else ('C', (-4, 200), (2, 300), (0, g.L - 110))]))
        if vent == 'centre':
            D.d('seam', half((0, g.L - 110), [('L', (0, g.L))]))
            D.d('seamL', half((0, g.L - 110), [('L', (14, g.L - 96)), ('L', (14, g.L))]))
        D.d('seamL', *pair((104, 200), [('C', (100, 280), (104, 360), (110, g.L))]))


def blazer(view):
    D, g = start(view, neck='lapel', **{**JKT, 'B': 136, 'W': 128, 'waistY': 320, 'Bh': 136, 'L': 488})
    tailored(view, D, g, depth=300, buttons=2, ticket=False)
    shading(D, g)
    return D


def trench(view):
    D, g = start(view, neck='lapel', **{**COAT, 'L': 568, 'Bh': 164})
    tailored(view, D, g, depth=230, db=True, buttons=6, gorge=110, wide=1.3, pockets='slash', chest=False)
    # belt and storm flap, epaulettes, sleeve straps
    D.d('panel', half((-g.B - 2, 318), [('L', (g.B + 2, 318)), ('L', (g.B + 2, 344)), ('L', (-g.B - 2, 344))], close=True))
    D.d('hw', rect(X(-16), 314, 32, 34, 4))
    D.d('hole', rect(X(-10), 320, 20, 22, 2))
    D.d('panel', *pair((60, 76), [('L', (g.SP[0] - 6, 92)), ('L', (g.SP[0] - 8, 106)), ('L', (58, 92))], close=True))
    D.d('button', circle(X(-68), 86, 3.4), circle(X(68), 86, 3.4))
    for s in (1, -1):
        sv = g.SV
        a, b = add(sv['CO'], sv['d'], -60), add(sv['CI'], sv['d'], -60)
        D.d('panel', half(a, [('L', b), ('L', add(b, sv['d'], -16)), ('L', add(a, sv['d'], -16))], s, close=True))
    if view == 'front':
        D.d('seam', half((-g.SP[0] + 4, 110), [('L', (-40, 196)), ('L', (-100, 210))]))        # gun flap
    else:
        D.d('seam', half((-g.SP[0] - 2, 104), [('C', (-g.SP[0] + 10, 160), (-80, 220), (-40, 230)), ('C', (-20, 236), (20, 236), (40, 230)),
                                               ('C', (80, 220), (g.SP[0] - 10, 160), (g.SP[0] + 2, 104))]))      # storm shield
    for s in (1, -1):
        D.x(f'<path d="M{f(X(s * (g.B + 2)))} 330 C{f(X(s * (g.B + 14)))} 360 {f(X(s * (g.B + 10)))} 400 {f(X(s * (g.B + 4)))} 440" fill="none" stroke="#000" stroke-opacity="0" stroke-width="1"/>')
    shading(D, g)
    return D


def overcoat(view):
    D, g = start(view, neck='lapel', **{**COAT, 'L': 566, 'Bh': 152})
    tailored(view, D, g, depth=270, buttons=3, gorge=130, wide=1.1, pockets='flap', vent='centre')
    shading(D, g)
    return D


def peacoat(view):
    D, g = start(view, neck='lapel', **{**COAT, 'L': 486, 'Bh': 146})
    tailored(view, D, g, depth=210, db=True, buttons=6, gorge=104, wide=1.45, pockets='slash', chest=False, vent='centre')
    if view == 'back':
        D.d('panel', half((-56, 64), [('C', (-30, 50), (30, 50), (56, 64)), ('L', (90, 120)), ('C', (40, 134), (-40, 134), (-90, 120))], close=True))   # big collar
    shading(D, g)
    return D


# ─────────────────────────────────────────────────────────────────
# tanks & camis (sleeveless blocks)
# ─────────────────────────────────────────────────────────────────
def sleeveless(view, strap=40, strapX=60, front_neck=180, back_neck=130, arm=(124, 220), B=124, Bh=126, L=470,
               top=None, W=None, waistY=None, racer=False, hem='straight'):
    """Tank block: straps at the shoulder (strap width `strap`, inner edge at strapX)."""
    D = Drawing()
    ax, ay = arm
    ny = front_neck if view == 'front' else back_neck
    sx0, sx1 = strapX, strapX + strap
    st = top or HPS_Y + 4
    if racer and view == 'back':
        sx0, sx1 = 22, 22 + strap * .9
    segs = [('C', (sx0 * .7, ny), (sx0 - 2, st + 40), (sx0, st)), ('L', (sx1, st + 4)),
            ('C', (sx1 + 6, st + 70) if not (racer and view == 'back') else (sx1 + 30, st + 70), (ax - 30, ay - 10), (ax, ay))]
    if W:
        segs += [('C', (B, ay + 40), (W, waistY - 50), (W, waistY)), ('C', (W, waistY + 50), (Bh, L - 60), (Bh, L))]
    else:
        segs += [('C', (B, ay + 80), (Bh, L - 90), (Bh, L))]
    segs += [('L', (0, L))] if hem == 'straight' else [('C', (Bh * .8, L), (Bh * .4, L + 12), (0, L + 12))]
    D.o(sym((0, ny), segs))
    g = G()
    g.B, g.Bh, g.L, g.hem = B, Bh, L, 'straight'
    g.sx0, g.sx1, g.ny, g.st, g.ax, g.ay = sx0, sx1, ny, st, ax, ay
    return D, g


def tank_shading(D, g):
    D.light(half((-g.B * .5, g.ay + 10), [('C', (-g.B * .56, g.ay + 80), (-g.B * .56, g.L - 120), (-g.B * .5, g.L - 40))]), 28, .2)
    D.dark(half((g.B * .82, g.ay + 20), [('C', (g.B * .88, g.ay + 80), (g.Bh * .88, g.L - 120), (g.Bh * .84, g.L - 20))]), 22, .18)


def binding(D, g, off=8):
    D.d('stitch', *pair((g.sx0 + off * .6, g.st + 4), [('C', (g.sx0 + off, g.st + 40), (g.sx0 * .7, g.ny + off - 4), (0, g.ny + off))]))
    D.d('stitch', *pair((g.sx1 - off * .6, g.st + 6), [('C', (g.sx1 - off * .4, g.st + 70), (g.ax - 30 - off, g.ay - 10 - off), (g.ax - 4, g.ay - off))]))


def tank(view):
    D, g = sleeveless(view, strap=40, strapX=58, front_neck=168, back_neck=120)
    binding(D, g, 9)
    D.d('stitch', hem_line(g, 12))
    tank_shading(D, g)
    return D


def muscle_tank(view):
    # cut-off tee: full shoulders kept, armholes dropped deep
    D, g = sleeveless(view, strap=78, strapX=48, front_neck=108, back_neck=86, arm=(126, 290), B=130, Bh=130, L=472)
    neck_crew(D, g, view, 108, 10, 50) if view == 'front' else D.d('seam', half((-50, 74), [('C', (-30, 94), (30, 94), (50, 74))]))
    D.d('stitch', *pair((g.sx1 - 6, g.st + 8), [('C', (g.sx1 - 2, g.st + 90), (g.ax - 36, g.ay - 18), (g.ax - 4, g.ay - 10))]))
    D.d('stitch', hem_line(g, 12))
    tank_shading(D, g)
    return D


def cami(view):
    D = Drawing()
    B, L, top = 118, 430, 170
    # bodice with a gentle V neckline, spaghetti straps over the shoulders
    D.o(sym((0, top + (24 if view == 'front' else 4)), [('C', (30, top + 12), (60, top - 6), (88, top - 10)), ('C', (104, top - 12), (114, top + 10), (B, top + 40)),
                                                         ('C', (B + 4, 300), (B + 10, 380), (B + 12, L)), ('L', (0, L))]))
    for s in (1, -1):
        D.o(half((86, top - 8), [('C', (82, 120), (72, 90), (64, 70)), ('L', (70, 68)), ('C', (78, 90), (88, 120), (92, top - 9))], s, close=True))
    D.d('edge', half((-B + 2, top + 40), [('C', (-114, top + 10), (-104, top - 12), (-88, top - 10)), ('C', (-60, top - 6), (-30, top + 12), (0, top + (24 if view == 'front' else 4))),
                                          ('C', (30, top + 12), (60, top - 6), (88, top - 10)), ('C', (104, top - 12), (114, top + 10), (B - 2, top + 40))]))
    if view == 'front':
        D.d('seamL', *pair((0, top + 26), [('C', (30, top + 60), (40, top + 70), (60, top + 64))]))   # bust darts / seam
    D.d('stitch', f'M{X(-B - 10)} {L - 12} L{X(B + 10)} {L - 12}')
    D.light(half((-70, top + 30), [('C', (-76, 260), (-76, 330), (-72, L - 30))]), 26, .2)
    D.dark(half((96, top + 40), [('C', (104, 260), (108, 330), (108, L - 20))]), 20, .18)
    return D


def tube(view):
    D = Drawing()
    B, top, L = 122, 186, 386
    D.o(sym((0, top + 6), [('C', (60, top + 6), (B, top), (B + 2, top + 4)), ('C', (B + 6, 260), (B + 4, 330), (B + 2, L)), ('L', (0, L))]))
    for y in (top + 16, L - 16):
        D.d('seam', f'M{X(-B)} {y} C{X(-60)} {y + 4} {X(60)} {y + 4} {X(B)} {y}')
    D.d('rib', *[f'M{X(x)} {top + 8} L{X(x)} {top + 18}' for x in range(-112, 116, 10)])
    D.dark('M220 260 C260 266 340 266 380 260', 10, .1)
    D.light(half((-80, top + 30), [('C', (-84, 260), (-84, 320), (-80, L - 30))]), 26, .2)
    D.dark(half((100, top + 30), [('C', (106, 260), (106, 320), (104, L - 20))]), 20, .18)
    return D


def halter(view):
    D = Drawing()
    B, L = 120, 440
    if view == 'front':
        # triangle front rising to a neck strap; deeply cut-in armholes
        D.o(sym((0, 196), [('C', (14, 160), (30, 110), (38, 70)), ('L', (52, 64)), ('C', (54, 110), (70, 180), (B - 8, 240)),
                           ('C', (B + 2, 300), (B + 6, 380), (B + 6, L)), ('L', (0, L))]))
        D.d('edge', half((-38, 70), [('C', (-30, 110), (-14, 160), (0, 196)), ('C', (14, 160), (30, 110), (38, 70))]))
        D.d('seam', half((-36, 64), [('C', (-20, 56), (20, 56), (36, 64))]))
        D.d('stitch', *pair((50, 72), [('C', (52, 116), (66, 180), (B - 14, 240))]))
    else:
        # open back: just a low band, with the neck strap tied at the nape
        D.o(sym((0, 330), [('L', (B - 6, 320)), ('C', (B + 2, 360), (B + 6, 400), (B + 6, L)), ('L', (0, L))]))
        D.o('M282 60 C290 56 310 56 318 60 L316 76 C310 72 290 72 284 76 Z')
        D.x('<path d="M296 74 C290 100 284 130 280 160 M304 74 C310 100 318 130 322 160" fill="none" stroke="#6f6b63" stroke-width="4" stroke-linecap="round"/>')
        D.d('seam', f'M{X(-B + 6)} 334 L{X(B - 6)} 324')
    D.d('stitch', f'M{X(-B - 4)} {L - 12} L{X(B + 4)} {L - 12}')
    D.light(half((-70, 260), [('C', (-76, 300), (-76, 360), (-72, L - 30))]), 26, .2)
    D.dark(half((96, 260), [('C', (104, 300), (108, 360), (108, L - 20))]), 20, .18)
    return D


def crop_top(view):
    D, g = tee_base(view, B=126, Bh=124, L=330)
    neck_crew(D, g, view, 106, 10)
    shading(D, g)
    return D


def corset(view):
    D = Drawing()
    B, L, top = 122, 420, 180
    W = 102
    if view == 'front':
        # sweetheart neckline, boned panels, pointed basque at the waist
        D.o(sym((0, top + 20), [('C', (14, top - 8), (40, top - 20), (66, top - 14)), ('C', (96, top - 8), (112, top + 10), (B, top + 30)),
                                ('C', (B - 6, 280), (W, 320), (W + 4, 380)), ('C', (W + 8, 400), (W, L - 6), (W - 6, L - 4)),
                                ('L', (0, L + 22))]))
        for x in (0, 36, 72):
            D.d('seam', *pair((x, top - 4 if x else top + 22), [('C', (x * 0.98, 260), (x * .9, 340), (x * .9 + (0 if x else 0), L + (20 - x * .3)))])) if x else \
                D.d('seam', f'M{X(0)} {top + 22} L{X(0)} {L + 20}')
        D.d('hw', *[circle(X(0), top + 50 + i * 36, 3.4) for i in range(6)])
        D.d('edge', half((-B, top + 30), [('C', (-112, top + 10), (-96, top - 8), (-66, top - 14)), ('C', (-40, top - 20), (-14, top - 8), (0, top + 20)),
                                          ('C', (14, top - 8), (40, top - 20), (66, top - 14)), ('C', (96, top - 8), (112, top + 10), (B, top + 30))]))
        for s in (1, -1):
            D.o(half((80, top - 12), [('C', (78, 130), (72, 100), (66, 76)), ('L', (74, 74)), ('C', (82, 100), (88, 130), (92, top - 10))], s, close=True))
    else:
        D.o(sym((0, top + 10), [('C', (60, top + 8), (100, top + 14), (B, top + 30)),
                                ('C', (B - 6, 280), (W, 320), (W + 4, 380)), ('C', (W + 8, 400), (W, L - 6), (W - 6, L - 4)), ('L', (0, L))]))
        # lace-up back
        D.d('seam', f'M{X(-14)} {top + 12} L{X(-14)} {L}', f'M{X(14)} {top + 12} L{X(14)} {L}')
        D.d('hole', *[circle(X(s * 14), top + 28 + i * 32, 3.2) for s in (1, -1) for i in range(7)])
        lace = ' '.join(f'M{X(-14)} {top + 28 + i * 32} L{X(14)} {top + 60 + i * 32} M{X(14)} {top + 28 + i * 32} L{X(-14)} {top + 60 + i * 32}' for i in range(6))
        D.x(f'<path d="{lace}" fill="none" stroke="#6f6b63" stroke-width="2.4" stroke-linecap="round"/>')
        for s in (1, -1):
            D.o(half((80, top + 14), [('C', (78, 130), (72, 100), (66, 76)), ('L', (74, 74)), ('C', (82, 100), (88, 130), (92, top + 16))], s, close=True))
        D.d('seam', *pair((60, top + 12), [('C', (58, 260), (56, 340), (56, L))]))
    D.light(half((-70, top + 40), [('C', (-76, 260), (-70, 330), (-66, L - 30))]), 22, .2)
    D.dark(half((92, top + 40), [('C', (98, 260), (92, 330), (90, L - 20))]), 18, .2)
    return D


def bodysuit(view):
    # long-sleeve bodysuit: fitted body ending in a brief bottom with leg openings
    D = Drawing()
    g = body(view, dict(B=118, Bh=112, W=104, waistY=300, L=470, sleeve='long', sw=.86, neckW=52, neck='crew'))
    # replace the hem with a brief: from the hip curve in to the crotch
    o = g.outline
    hip = (112, 430)
    out = sym(g.start, _bodysuit_segs(g, view))
    D.o(out)
    sleeve_seams(D, g)
    D.d('stitch', cuff_line(g, 14, 1), cuff_line(g, 14, -1))
    neck_crew(D, g, view, 116 if view == 'front' else 82, 8, 52)
    D.d('stitch', *pair((112, 440), [('C', (90, 470), (50, 520), (26, 540))]))
    D.d('stitch', half((-22, 546), [('L', (22, 546))]))
    shading(D, g)
    return D


def _bodysuit_segs(g, view):
    B = 118
    o = dict(B=118, Bh=112, W=104, waistY=300, L=470, sleeve='long', sw=.86, neckW=52, neck='crew')
    g2 = body(view, {**o})
    # rebuild right-half segments without the hem
    wide = 52
    segs = [('C', (wide * .6, 82), (wide - 6, HPS_Y + 2), (wide, HPS_Y)), ('C', (wide + 20, HPS_Y + 6), (g2.SP[0] - 30, g2.SP[1] - 8), g2.SP)]
    sv = g2.SV
    segs += sv['outer'] + [('L', sv['CI'])] + sv['inner']
    AP = g2.AP
    leg = 60 if view == 'front' else 26                     # back is a cheekier cut
    segs += [('C', (AP[0], AP[1] + 40), (104, 250), (104, 300)), ('C', (104, 350), (114, 400), (114, 436)),
             ('C', (100, 470), (60, 520) if view == 'front' else (70, 540), (24, 548)), ('L', (0, 548))]
    return segs


def rib_tank(view):
    D, g = sleeveless(view, strap=30, strapX=50, front_neck=150, back_neck=110, B=118, Bh=116, W=110, waistY=320, L=466, arm=(118, 214))
    binding(D, g, 8)
    D.d('stitch', hem_line(g, 10))
    D.d('rib', *[f'M{X(x)} {g.ay - 40 + abs(x) * .2} L{X(x)} {g.L - 4}' for x in range(-104, 108, 12) if abs(x) > 4])
    tank_shading(D, g)
    return D


# ─────────────────────────────────────────────────────────────────
# activewear
# ─────────────────────────────────────────────────────────────────
def flatlock(D, d_list):
    D.d('stitch', *d_list)


def perf_tee(view):
    D, g = start(view, sleeve='short', B=128, L=470)
    raglan_seams(D, g, 78)
    neck_crew(D, g, view, 104, 8)
    D.d('stitch', cuff_line(g, 12, 1), cuff_line(g, 12, -1), hem_line(g, 12))
    # breathable mesh side panels
    D.d('mesh', *pair((g.AP[0] - 2, g.AP[1] + 4), [('C', (g.B - 20, 300), (g.Bh - 22, 380), (g.Bh - 18, g.L - 2)), ('L', (g.Bh, g.L)),
                                                    ('C', (g.Bh, 380), (g.B, 300), (g.AP[0], g.AP[1]))], close=True))
    shading(D, g)
    return D


def training_tank(view):
    D, g = sleeveless(view, strap=34, strapX=60, front_neck=160, back_neck=150, B=126, Bh=128, L=476, arm=(124, 250), racer=True)
    binding(D, g, 8)
    D.d('stitch', hem_line(g, 12))
    if view == 'back':
        D.d('stitch', *pair((26, g.st + 20), [('C', (40, 200), (70, 240), (110, 252))]))
    tank_shading(D, g)
    return D


def compression(view):
    D, g = start(view, neck='mock', B=116, Bh=110, W=104, waistY=320, L=470, sw=.82)
    # body-mapped panel seams and flatlock stitching
    D.d('stitch', *pair((40, 52), [('C', (70, 70), (100, 120), (g.AP[0], g.AP[1]))]))
    D.d('stitch', *pair((g.AP[0] - 4, g.AP[1] + 20), [('C', (80, 260), (60, 330), (50, g.L))]))
    D.d('stitch', cuff_line(g, 12, 1), cuff_line(g, 12, -1), hem_line(g, 12))
    D.d('seam', half((-44, 76), [('C', (-30, 82), (30, 82), (44, 76))]))
    shading(D, g, 1.1)
    return D


def sports_bra(view):
    D = Drawing()
    B, top, L = 118, 150, 330
    if view == 'front':
        D.o(sym((0, 206), [('C', (24, 196), (36, 150), (44, 96)), ('L', (82, 96)), ('C', (86, 150), (104, 196), (B, 224)),
                           ('C', (B + 2, 260), (B + 2, 300), (B, L)), ('L', (0, L))]))
        D.d('edge', half((-44, 96), [('C', (-36, 150), (-24, 196), (0, 206)), ('C', (24, 196), (36, 150), (44, 96))]))
        D.d('stitch', *pair((78, 100), [('C', (82, 150), (98, 196), (B - 4, 222))]))
    else:
        # racerback: straps meet in a Y between the shoulder blades
        D.o(sym((0, 238), [('L', (16, 238)), ('C', (24, 190), (34, 140), (44, 96)), ('L', (82, 96)), ('C', (70, 150), (50, 200), (60, 236)),
                           ('C', (80, 250), (110, 240), (B, 236)), ('C', (B + 2, 260), (B + 2, 300), (B, L)), ('L', (0, L))]))
        D.d('stitch', *pair((20, 236), [('C', (28, 190), (38, 140), (48, 100))]))
    D.d('seam', f'M{X(-B)} {L - 44} C{X(-60)} {L - 40} {X(60)} {L - 40} {X(B)} {L - 44}')     # underband
    D.d('rib', *[f'M{X(x)} {L - 40} L{X(x)} {L - 4}' for x in range(-108, 112, 12)])
    D.light(half((-70, 230), [('C', (-76, 260), (-76, 290), (-72, L - 50))]), 22, .2)
    D.dark(half((96, 230), [('C', (104, 260), (108, 290), (108, L - 50))]), 18, .18)
    return D


def run_jacket(view):
    D, g = start(view, neck='stand', B=128, Bh=124, L=470, sw=.92)
    sleeve_seams(D, g)
    D.d('seam', cuff_line(g, 14, 1), cuff_line(g, 14, -1), hem_line(g, 14))
    D.d('seam', half((-48, 82), [('C', (-30, 86), (30, 86), (48, 82))]))
    # reflective piping (accent) along the sleeve and back
    for s in (1, -1):
        sv = g.SV
        a, b = add(add(g.SP, sv['d'], 40), sv['n'], 6), add(add(sv['CO'], sv['d'], -30), sv['n'], 6)
        D.a(half(a, [('L', b), ('L', add(b, sv['n'], 3)), ('L', add(a, sv['n'], 3))], s, close=True))
    if view == 'front':
        zip_line(D, 52, g.L)
        zip_pocket(D, 34, 170, 84, 160, -1)
        zip_pocket(D, 72, 340, 94, 400, -1)
        zip_pocket(D, 72, 340, 94, 400, 1)
        D.d('stitch', *pair((g.AP[0] - 4, g.AP[1] + 30), [('C', (100, 300), (96, 380), (98, g.L))]))
    else:
        D.d('panel', half((-g.SP[0], 140), [('C', (-60, 156), (60, 156), (g.SP[0], 140)), ('L', (g.SP[0] - 6, 168)), ('C', (60, 184), (-60, 184), (-g.SP[0] + 6, 168))], close=True))
        D.a(half((-70, 300), [('L', (70, 300)), ('L', (70, 306)), ('L', (-70, 306))], close=True))
    shading(D, g)
    return D


def rash_guard(view):
    D, g = start(view, neck='crew', B=118, Bh=112, W=106, waistY=320, L=470, sw=.84, nw=44)
    neck_crew(D, g, view, 96, 10, 44)
    D.d('stitch', *pair((44, 74), [('C', (70, 80), (100, 120), (g.AP[0], g.AP[1]))]))        # raglan flatlock
    D.d('stitch', *pair((g.AP[0] - 4, g.AP[1] + 20), [('C', (90, 280), (80, 360), (76, g.L))]))
    D.d('stitch', cuff_line(g, 12, 1), cuff_line(g, 12, -1), hem_line(g, 14))
    shading(D, g, 1.1)
    return D


def jersey(view):
    D, g = start(view, sleeve='short', B=134, L=478, neckW=50)
    raglan_seams(D, g, 76)
    # contrast V-collar and sleeve cuffs (accent)
    if view == 'front':
        D.d('inner', half((-50, HPS_Y), [('C', (-46, 104), (-14, 140), (0, 156)), ('C', (14, 140), (46, 104), (50, HPS_Y)), ('C', (30, 82), (-30, 82), (-50, HPS_Y))], close=True))
        D.a(half((-58, HPS_Y - 2), [('C', (-54, 110), (-16, 156), (0, 172)), ('C', (16, 156), (54, 110), (58, HPS_Y - 2)), ('L', (50, HPS_Y)),
                                    ('C', (46, 104), (14, 140), (0, 156)), ('C', (-14, 140), (-46, 104), (-50, HPS_Y))], close=True))
    else:
        D.a(half((-58, HPS_Y - 2), [('C', (-30, 96), (30, 96), (58, HPS_Y - 2)), ('L', (50, HPS_Y + 4)), ('C', (30, 84), (-30, 84), (-50, HPS_Y + 4))], close=True))
    sv = g.SV
    for s in (1, -1):
        D.a(half(add(sv['CO'], sv['d'], 2), [('L', add(sv['CI'], sv['d'], 2)), ('L', add(sv['CI'], sv['d'], -16)), ('L', add(sv['CO'], sv['d'], -16))], s, close=True))
    D.d('mesh', *pair((g.AP[0] - 2, g.AP[1] + 4), [('C', (g.B - 22, 300), (g.Bh - 24, 380), (g.Bh - 20, g.L - 2)), ('L', (g.Bh, g.L)),
                                                    ('C', (g.Bh, 380), (g.B, 300), (g.AP[0], g.AP[1]))], close=True))
    D.d('stitch', hem_line(g, 14))
    shading(D, g)
    return D


def track_jacket(view):
    D, g = start(view, neck='stand', B=132, L=462, hem='blouson')
    cuffs(D, g, 34)
    rib_hem(D, g, 40)
    raglan_seams(D, g, 70)
    D.d('seam', half((-50, 80), [('C', (-30, 86), (30, 86), (50, 80))]))
    # side stripes (accent) running down each sleeve
    sv = g.SV
    for s in (1, -1):
        a = add(add(g.SP, (2, 4)), sv['n'], 10)
        b = add(add(sv['CO'], sv['d'], -34), sv['n'], 10)
        D.a(half(a, [('L', b), ('L', add(b, sv['n'], 14)), ('L', add(a, sv['n'], 14))], s, close=True))
    if view == 'front':
        zip_line(D, 52, g.L)
        zip_pocket(D, 76, 330, 96, 396, -1)
        zip_pocket(D, 76, 330, 96, 396, 1)
    shading(D, g)
    return D


def half_zip_run(view):
    D, g = start(view, neck='stand', B=120, Bh=116, W=112, waistY=320, L=470, sw=.88)
    raglan_seams(D, g, 70)
    D.d('seam', cuff_line(g, 16, 1), cuff_line(g, 16, -1), hem_line(g, 12))
    D.d('seam', half((-48, 82), [('C', (-30, 86), (30, 86), (48, 82))]))
    for s in (1, -1):                                                         # thumbholes
        p = add(add(g.SV['CI'], g.SV['n'], -16), g.SV['d'], -8)
        D.d('hole', f'M{f(X(s * p[0]) - 6)} {f(p[1])} C{f(X(s * p[0]) - 6)} {f(p[1] - 5)} {f(X(s * p[0]) + 6)} {f(p[1] - 5)} {f(X(s * p[0]) + 6)} {f(p[1])} Z')
    if view == 'front':
        zip_line(D, 52, 210)
        D.d('seamL', half((-9, 52), [('L', (-9, 212)), ('L', (9, 212)), ('L', (9, 52))]))
    shading(D, g)
    return D


TOPS = {
    'hoodie': hoodie, 'zipHoodie': zip_hoodie, 'crewneck': crewneck, 'quarterZip': quarter_zip, 'halfZip': half_zip,
    'pullover': pullover, 'cardigan': cardigan, 'turtleneck': turtleneck, 'mockNeck': mock_neck, 'vNeckSweater': v_neck_sweater,
    'sweaterVest': sweater_vest, 'polo': knit_polo, 'shawlCardigan': shawl_cardigan,
    'tshirt': tshirt, 'longSleeve': long_sleeve, 'pocketTee': pocket_tee, 'vNeckTee': v_neck_tee, 'ringer': ringer,
    'henley': henley, 'baseball': baseball_tee, 'graphic': graphic_tee, 'babyTee': baby_tee, 'mockTee': mock_tee,
    'scoopTee': scoop_tee, 'thermal': thermal,
    'buttonUp': button_up, 'oxford': oxford, 'dress': dress_shirt, 'flannel': flannel, 'camp': camp, 'overshirt': overshirt,
    'poloShirt': polo_shirt, 'rugby': rugby, 'western': western, 'work': work, 'blouse': blouse, 'peasant': peasant, 'tunic': tunic,
    'bomber': bomber, 'denimJacket': denim_jacket, 'varsity': varsity, 'coach': coach, 'windbreaker': windbreaker,
    'puffer': puffer, 'parka': parka, 'leather': leather, 'harrington': harrington, 'shacket': shacket, 'chore': chore,
    'anorak': anorak, 'fleece': fleece, 'rain': rain, 'gilet': gilet, 'blazer': blazer, 'trench': trench,
    'overcoat': overcoat, 'peacoat': peacoat,
    'tank': tank, 'muscleTank': muscle_tank, 'cami': cami, 'tube': tube, 'halter': halter, 'cropTop': crop_top,
    'corset': corset, 'bodysuit': bodysuit, 'ribTank': rib_tank,
    'perfTee': perf_tee, 'trainingTank': training_tank, 'compression': compression, 'sportsBra': sports_bra,
    'runJacket': run_jacket, 'rashGuard': rash_guard, 'jersey': jersey, 'trackJacket': track_jacket, 'halfZipRun': half_zip_run,
}

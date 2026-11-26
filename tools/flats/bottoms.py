"""Bottoms: front and back flats, 600x600, axis x=300 (coordinates are dx offsets).

Pants, jeans, joggers, leggings and overalls share one scale (waist half-width
~96, waist at y=44, hem at y≈552). Shorts are drawn on the same block and scaled
up 1.3x so they fill the frame; skirts share their own waist width."""
from lib import Drawing, sym, half, pair, path, circle, rect, f, pt, AX, bez, scale_drawing

X = lambda dx: AX + dx
TOP, WB = 44, 34


class P:
    pass


def leg_block(view, o):
    """Right half of a two-legged garment. Returns geometry dict and outline."""
    g = P()
    g.top = o.get('top', TOP)
    g.wb = o.get('wb', WB)
    g.Wx = o.get('Wx', 96)
    g.Hx = o.get('Hx', 118)
    g.Hy = o.get('Hy', 150)
    g.Cy = o.get('Cy', 200)
    g.Ky = o.get('Ky', 384)
    g.Kx = o.get('Kx', 108)
    g.KIx = o.get('KIx', 16)
    g.Ly = o.get('Ly', 552)
    g.HOx = o.get('HOx', 104)
    g.HIx = o.get('HIx', 18)
    g.split = o.get('split', 0)          # running-short side split height
    g.bulge = o.get('bulge', 0)          # baggy outward bow of the outer leg
    rise = -6 if view == 'back' else 0
    top = g.top + rise
    segs = [('L', (g.Wx, top)), ('C', (g.Wx + 8, top + 40), (g.Hx, g.Hy - 50), (g.Hx, g.Hy))]
    if o.get('short'):
        segs += [('C', (g.Hx + g.bulge * .4, g.Hy + 50), (g.HOx + g.bulge * .2, g.Ly - 40), (g.HOx, g.Ly - g.split))]
        if g.split:
            segs += [('Q', (g.HOx - 4, g.Ly - 4), (g.HOx - 22, g.Ly))]
        segs += [('L', (g.HIx, g.Ly)), ('C', (g.HIx - 2, g.Ly - 40), (14, g.Cy + 20), (0, g.Cy))]
    else:
        b = g.bulge
        segs += [('C', (g.Hx + b * .5, g.Hy + 70), (g.Kx + b, g.Ky - 90), (g.Kx + b * .6, g.Ky)),
                 ('C', (g.Kx + b * .2, g.Ky + 70), (g.HOx, g.Ly - 70), (g.HOx, g.Ly)),
                 ('L', (g.HIx, g.Ly)),
                 ('C', (g.HIx, g.Ly - 70), (g.KIx, g.Ky + 70), (g.KIx, g.Ky)),
                 ('C', (g.KIx, g.Ky - 90), (12, g.Cy + 40), (0, g.Cy))]
    g.outline = sym((0, top), segs)
    return g


def legx(g, y, inner=False):
    """Approximate x of the outer (or inner) leg edge at height y."""
    if inner:
        if y <= g.Cy:
            return 0
        t = (y - g.Cy) / (g.Ly - g.Cy)
        return g.KIx + (g.HIx - g.KIx) * max(0, (y - g.Ky) / (g.Ly - g.Ky)) if y > g.Ky else g.KIx * min(1, t * 2.2)
    if y <= g.Hy:
        return g.Wx + (g.Hx - g.Wx) * (y - g.top) / (g.Hy - g.top)
    if y <= g.Ky:
        return g.Hx + (g.Kx - g.Hx) * (y - g.Hy) / (g.Ky - g.Hy)
    return g.Kx + (g.HOx - g.Kx) * (y - g.Ky) / (g.Ly - g.Ky)


def legc(g, y):
    return (legx(g, y) + legx(g, y, True)) / 2


def start(view, **o):
    D = Drawing()
    g = leg_block(view, o)
    D.o(g.outline)
    return D, g


# ─────────────────────────────────────────────────────────────────
# details
# ─────────────────────────────────────────────────────────────────
def waistband(D, g, view, loops=True, button=True, style='seam', h=None):
    h = h or g.wb
    yb = g.top + h
    D.d(style, f'M{X(-g.Wx - 2)} {yb} L{X(g.Wx + 2)} {yb}')
    D.d('stitch', f'M{X(-g.Wx)} {yb - 5} L{X(g.Wx)} {yb - 5}', f'M{X(-g.Wx)} {g.top + 5} L{X(g.Wx)} {g.top + 5}')
    if loops:
        xs = (-78, -30, 30, 78) if view == 'front' else (-70, 0, 70)
        for x in xs:
            D.d('panel', rect(X(x) - 5, g.top - 2 - (6 if view == 'back' else 0) * 0, 10, h + 8, 2))
    if button and view == 'front':
        D.d('button', circle(X(14), g.top + h / 2, 5.5))


def fly(D, g, w=26, style='stitch'):
    y0 = g.top + g.wb
    D.d('seam', f'M{X(0)} {y0} L{X(0)} {g.Cy - 6}')
    D.d(style, half((w, y0), [('L', (w, g.Cy - 40)), ('C', (w, g.Cy - 18), (14, g.Cy - 10), (2, g.Cy - 10))]))


def slant_pockets(D, g, depth=74, x0=62):
    y0 = g.top + g.wb
    for s in (1, -1):
        D.d('edge', half((x0, y0), [('L', (g.Hx - 6, y0 + depth))], s))
        D.d('stitch', half((x0 + 8, y0), [('L', (g.Hx - 4, y0 + depth - 10))], s))


def jean_pockets(D, g, coin=True, rivets=True):
    y0 = g.top + g.wb
    for s in (1, -1):
        D.d('edge', half((52, y0), [('C', (58, y0 + 44), (84, y0 + 62), (g.Hx - 2, y0 + 64))], s))
        D.d('stitch', half((60, y0), [('C', (66, y0 + 38), (88, y0 + 54), (g.Hx - 2, y0 + 56))], s))
        if rivets:
            D.d('hw', circle(X(s * (g.Hx - 8)), y0 + 62, 3), circle(X(s * 54), y0 + 6, 3))
    if coin:
        D.d('seam', half((-96, y0), [('L', (-96, y0 + 30)), ('L', (-70, y0 + 32)), ('L', (-70, y0))]))


def jean_back(D, g, contrast=False):
    y0 = g.top + g.wb
    D.d('seam', half((-g.Wx - 4, y0 + 40), [('L', (0, y0 + 62)), ('L', (g.Wx + 4, y0 + 40))]))
    D.d('stitch', half((-g.Wx - 4, y0 + 48), [('L', (0, y0 + 70)), ('L', (g.Wx + 4, y0 + 48))]))
    D.d('seam', f'M{X(0)} {y0} L{X(0)} {g.Cy}')
    for s in (1, -1):
        D.d('seam', half((28, y0 + 74), [('L', (102, y0 + 68)), ('L', (104, y0 + 150)), ('L', (68, y0 + 168)), ('L', (34, y0 + 154)), ('Z',)][:-1], s, close=True))
        D.d('stitch', half((33, y0 + 80), [('L', (97, y0 + 74)), ('L', (99, y0 + 146)), ('L', (68, y0 + 161)), ('L', (39, y0 + 149)), ('L', (33, y0 + 80))], s))


def welt_back(D, g, button=True):
    y0 = g.top + g.wb
    D.d('seam', f'M{X(0)} {y0} L{X(0)} {g.Cy}')
    for s in (1, -1):
        D.d('panel', half((34, y0 + 44), [('L', (94, y0 + 42)), ('L', (94, y0 + 50)), ('L', (34, y0 + 52))], s, close=True))
        if button:
            D.d('button', circle(X(s * 64), y0 + 60, 3.6))
        D.d('seamL', half((64, y0), [('L', (66, y0 + 36))], s))                # back darts


def hems(D, g, off=12, style='stitch'):
    D.d(style, *pair((g.HOx - 1, g.Ly - off), [('L', (g.HIx + 1, g.Ly - off))]))


def crease(D, g):
    D.d('seamL', *pair((legc(g, g.Hy + 10), g.top + g.wb + 6), [('C', (legc(g, g.Cy), g.Cy), (legc(g, g.Ky), g.Ky), (legc(g, g.Ly - 1), g.Ly - 1))]))


def cargo_pocket(D, g, y=258, h=104, w=64, flap=True, side=(1, -1), bellow=True):
    for s in side:
        xo = legx(g, y + h / 2) - 4
        xa = xo - w
        D.d('seam', half((xa, y), [('L', (xo, y)), ('L', (xo + 2, y + h)), ('L', (xa, y + h)), ('Z',)][:-1], s, close=True))
        D.d('stitch', half((xa + 5, y + 6), [('L', (xa + 5, y + h - 6)), ('L', (xo - 4, y + h - 6))], s))
        if bellow:
            D.d('seamL', half((xa + 10, y + 34), [('L', (xa + 10, y + h - 2))], s))
        if flap:
            D.d('panel', half((xa - 4, y - 6), [('L', (xo + 3, y - 6)), ('L', (xo + 3, y + 26)), ('L', (xa - 4, y + 26))], s, close=True))
            D.d('hw', circle(X(s * (xa + xo) / 2), y + 16, 4))


def knee_panel(D, g, y0=330, y1=446, style='seam'):
    for s in (1, -1):
        a0, a1 = legx(g, y0) - 2, legx(g, y0, True) + 2
        b0, b1 = legx(g, y1) - 2, legx(g, y1, True) + 2
        D.d(style, half((a1, y0), [('L', (a0, y0))], s), half((b1, y1), [('L', (b0, y1))], s))
        D.d('stitch', half((a1, y0 + 6), [('L', (a0, y0 + 6))], s), half((b1, y1 - 6), [('L', (b0, y1 - 6))], s))


def elastic_waist(D, g, h=None, cord=True, view='front'):
    h = h or g.wb + 4
    yb = g.top + h
    D.d('seam', f'M{X(-g.Wx - 2)} {yb} L{X(g.Wx + 2)} {yb}')
    D.d('rib', *[f'M{X(x)} {g.top + 4} L{X(x * 1.02)} {yb - 3}' for x in range(-int(g.Wx) + 8, int(g.Wx) - 4, 10)])
    if cord and view == 'front':
        D.d('hole', circle(X(-10), g.top + h * .55, 3), circle(X(10), g.top + h * .55, 3))
        for s in (1, -1):
            x = X(s * 10)
            D.x(f'<path d="M{f(x)} {f(g.top + h * .55)} C{f(x + s * 6)} {f(yb + 20)} {f(x - s * 2)} {f(yb + 50)} {f(x + s * 6)} {f(yb + 80)}" fill="none" stroke="#6f6b63" stroke-width="5" stroke-linecap="round"/>')
            D.x(f'<path d="M{f(x)} {f(g.top + h * .55)} C{f(x + s * 6)} {f(yb + 20)} {f(x - s * 2)} {f(yb + 50)} {f(x + s * 6)} {f(yb + 80)}" fill="none" stroke="#eeebe4" stroke-width="3.2" stroke-linecap="round"/>')


def rib_cuffs(D, g, h=36):
    for s in (1, -1):
        D.d('seam', half((g.HOx - 1, g.Ly - h), [('L', (g.HIx + 1, g.Ly - h))], s))
        n = 6
        D.d('rib', *[half((g.HIx + (g.HOx - g.HIx) * i / n, g.Ly - h + 3), [('L', (g.HIx + (g.HOx - g.HIx) * i / n, g.Ly - 2))], s) for i in range(1, n)])


def gathers(D, g, y0, n=5):
    """Soft gathers above a cuff or elastic."""
    for s in (1, -1):
        for i in range(n):
            x = g.HIx + (g.HOx - g.HIx) * (i + .5) / n
            D.d('seamL', half((x, y0), [('C', (x + 2, y0 - 14), (x - 2, y0 - 26), (x + 1, y0 - 36))], s))


def leg_shading(D, g, strong=1.0):
    D.light(half((-legc(g, g.Hy) - 14, g.Hy - 40), [('C', (-legc(g, g.Cy) - 14, g.Cy + 60), (-legc(g, g.Ky) - 10, g.Ky), (-legc(g, g.Ly) - 10, g.Ly - 30))]), 34, .13 * strong)
    D.dark(half((g.Hx - 14, g.Hy), [('C', (g.Hx - 10, g.Cy + 80), (legx(g, g.Ky) - 12, g.Ky), (g.HOx - 12, g.Ly - 20))]), 22, .16 * strong)
    D.dark(half((0, g.Cy - 10), [('C', (16, g.Cy + 40), (g.KIx + 6, g.Ky - 40), (g.HIx + 8, g.Ly - 30))]), 18, .14 * strong)
    D.dark(half((0, g.Cy - 10), [('C', (-16, g.Cy + 40), (-g.KIx - 6, g.Ky - 40), (-g.HIx - 8, g.Ly - 30))]), 14, .1 * strong)
    D.dark(half((-40, g.Cy - 30), [('C', (-20, g.Cy - 14), (-8, g.Cy - 10), (0, g.Cy - 6))]), 10, .12 * strong)


def short_shading(D, g):
    D.light(half((-legc(g, g.Hy) - 14, g.Hy - 40), [('C', (-legc(g, g.Cy) - 14, g.Cy), (-legc(g, g.Ly) - 12, g.Ly - 40), (-legc(g, g.Ly) - 10, g.Ly - 16))]), 30, .13)
    D.dark(half((g.Hx - 14, g.Hy), [('C', (g.Hx - 12, g.Cy), (g.HOx - 14, g.Ly - 40), (g.HOx - 12, g.Ly - 10))]), 20, .16)
    D.dark(half((0, g.Cy - 10), [('C', (14, g.Cy + 20), (g.HIx + 6, g.Ly - 30), (g.HIx + 8, g.Ly - 10))]), 16, .14)


# ─────────────────────────────────────────────────────────────────
# pants & trousers
# ─────────────────────────────────────────────────────────────────
def chino_like(view, D, g, back='welt', pockets='slant', loops=True):
    waistband(D, g, view, loops)
    if view == 'front':
        fly(D, g)
        (slant_pockets if pockets == 'slant' else jean_pockets)(D, g)
    else:
        (welt_back if back == 'welt' else jean_back)(D, g)
    hems(D, g)


def chinos(view):
    D, g = start(view, HOx=98, HIx=22, Kx=104, KIx=18)
    chino_like(view, D, g)
    leg_shading(D, g)
    return D


def trousers(view):
    D, g = start(view, HOx=104, HIx=18, Kx=108, KIx=14)
    chino_like(view, D, g)
    crease(D, g)
    if view == 'front':
        D.d('panel', half((g.Wx - 2, g.top), [('L', (g.Wx + 14, g.top + 4)), ('L', (g.Wx + 14, g.top + g.wb - 4)), ('L', (g.Wx - 2, g.top + g.wb))], -1, close=True))  # extended tab
    leg_shading(D, g)
    return D


def cargo(view):
    D, g = start(view, Hx=124, Kx=118, HOx=108, HIx=16, KIx=10, bulge=6)
    chino_like(view, D, g)
    cargo_pocket(D, g)
    if view == 'back':
        D.d('seamL', *pair((60, 420), [('C', (62, 430), (66, 440), (70, 446))]))
    leg_shading(D, g)
    return D


def pleated(view):
    D, g = start(view, Hx=126, Kx=112, HOx=96, HIx=22, KIx=14, Wx=98)
    chino_like(view, D, g)
    crease(D, g)
    if view == 'front':
        for s in (1, -1):
            for x in (44, 66):
                D.d('seam', half((x, g.top + g.wb), [('C', (x + 1, g.top + g.wb + 30), (x + 2, g.top + g.wb + 60), (x + 4, g.top + g.wb + 80))], s))
    D.d('seam', *pair((g.HOx - 1, g.Ly - 34), [('L', (g.HIx + 1, g.Ly - 34))]))       # turn-up cuff
    leg_shading(D, g)
    return D


def carpenter(view):
    D, g = start(view, Hx=124, Kx=116, HOx=108, HIx=14, KIx=10)
    chino_like(view, D, g, back='jean', pockets='jean')
    if view == 'front':
        # tool pocket on the right leg, hammer loop on the left
        D.d('seam', half((60, 240), [('L', (g.Hx - 8, 236)), ('L', (g.Hx - 8, 330)), ('L', (60, 330))], 1))
        D.d('stitch', half((66, 246), [('L', (g.Hx - 14, 242))], 1))
        D.d('seamL', half((92, 240), [('L', (92, 330))], 1))
    else:
        pass
    D.d('panel', half((g.Hx - 22, 178), [('L', (g.Hx - 2, 178)), ('L', (g.Hx - 2, 236)), ('L', (g.Hx - 22, 236))], -1 if view == 'front' else 1, close=True))
    leg_shading(D, g)
    return D


def work_pants(view):
    D, g = start(view, Hx=122, Kx=114, HOx=106, HIx=16, KIx=10)
    chino_like(view, D, g)
    if view == 'front':
        knee_panel(D, g, 318, 452)
    leg_shading(D, g)
    return D


def wide_trousers(view):
    D, g = start(view, Hx=124, Kx=142, HOx=150, HIx=8, KIx=8, bulge=0)
    chino_like(view, D, g)
    crease(D, g)
    leg_shading(D, g)
    return D


def palazzo(view):
    D, g = start(view, Hx=128, Kx=162, HOx=180, HIx=4, KIx=4, wb=40)
    elastic_waist(D, g, 40, cord=False)
    # soft vertical drape folds
    for s in (1, -1):
        for x0, x1 in ((40, 30), (80, 100), (110, 150)):
            D.d('seamL', half((x0, 120), [('C', (x0 + 4, 260), (x1, 420), (x1, g.Ly - 4))], s))
    hems(D, g, 10)
    D.light(half((-70, 110), [('C', (-80, 260), (-100, 420), (-110, 540))]), 40, .12)
    D.dark(half((60, 200), [('C', (70, 300), (90, 420), (100, 540))]), 22, .14)
    D.dark(half((140, 200), [('C', (150, 300), (166, 420), (174, 540))]), 18, .12)
    return D


def parachute(view):
    D, g = start(view, Hx=126, Kx=128, HOx=100, HIx=22, KIx=10, bulge=18, Ly=548)
    elastic_waist(D, g, cord=True, view=view)
    gathers(D, g, g.Ly - 16, 5)
    D.d('seam', *pair((g.HOx - 1, g.Ly - 16), [('L', (g.HIx + 1, g.Ly - 16))]))
    for s in (1, -1):                                                         # toggles at the hem
        x = X(s * (g.HOx - 8))
        D.x(f'<path d="M{f(x)} {g.Ly - 10} C{f(x + s * 6)} {g.Ly + 4} {f(x + s * 4)} {g.Ly + 14} {f(x + s * 8)} {g.Ly + 22}" fill="none" stroke="#6f6b63" stroke-width="3" stroke-linecap="round"/>')
        D.x(f'<path d="M{f(x + s * 4)} {g.Ly + 20} l{s * 8} 0 l0 12 l{-s * 8} 0 z" fill="#2f2f2f"/>')
    cargo_pocket(D, g, 270, 96, 62)
    if view == 'front':
        slant_pockets(D, g)
    D.d('seamL', *pair((legc(g, 330) - 20, 330), [('C', (legc(g, 340), 350), (legc(g, 350) + 10, 352), (legc(g, 360) + 30, 348))]))   # knee darts
    leg_shading(D, g)
    return D


def cords(view):
    D, g = start(view, HOx=102, HIx=20, Kx=106, KIx=16)
    chino_like(view, D, g, back='jean', pockets='jean')
    # corduroy wales: faint vertical ribs
    for s in (1, -1):
        D.d('rib', *[half((legx(g, 200, True) + (legx(g, 200) - legx(g, 200, True)) * t, 210),
                          [('L', (g.HIx + (g.HOx - g.HIx) * t, g.Ly - 16))], s) for t in (.2, .4, .6, .8)])
    leg_shading(D, g)
    return D


def linen_pants(view):
    D, g = start(view, Hx=124, Kx=116, HOx=106, HIx=16, KIx=12, wb=38)
    elastic_waist(D, g, 38, cord=True, view=view)
    if view == 'front':
        slant_pockets(D, g, 70, 66)
    else:
        D.d('seam', f'M{X(0)} {g.top + 38} L{X(0)} {g.Cy}')
        D.d('seam', half((34, 120), [('L', (92, 118)), ('L', (92, 186)), ('L', (34, 188)), ('Z',)][:-1], -1, close=True))
    hems(D, g, 14)
    D.d('seamL', *pair((legc(g, 260), 250), [('C', (legc(g, 300) + 6, 320), (legc(g, 380) - 4, 400), (legc(g, 480), 520))]))
    leg_shading(D, g)
    return D


def overalls(view):
    D = Drawing()
    k = .86
    g = leg_block(view, dict(top=190, wb=26, Wx=100, Hx=122, Hy=262, Cy=304, Ky=440, Kx=112, KIx=14, Ly=556, HOx=106, HIx=16))
    # bib & straps
    if view == 'front':
        bib = sym((0, 70), [('L', (70, 70)), ('C', (74, 70), (76, 74), (76, 80)), ('L', (82, 190)), ('L', (100, 190)), ('L', (0, 190))])
        D.o(bib)
        for s in (1, -1):
            D.o(half((54, 74), [('C', (62, 50), (80, 26), (104, 8)), ('L', (128, 22)), ('C', (104, 40), (86, 60), (80, 82))], s, close=True))
        D.d('stitch', half((-68, 78), [('L', (68, 78)), ('L', (74, 186))]), half((-68, 78), [('L', (-74, 186))]))
        D.d('seam', half((-46, 92), [('L', (46, 92)), ('L', (46, 150)), ('L', (-46, 150)), ('L', (-46, 92))]))         # bib pocket
        D.d('stitch', half((-41, 98), [('L', (41, 98))]))
        for s in (1, -1):
            D.d('hw', rect(X(s * 62) - 11, 70, 22, 22, 4), circle(X(s * 98), 204, 6))
            D.d('hole', rect(X(s * 62) - 5, 76, 10, 10, 2))
    else:
        D.o(sym((0, 150), [('L', (60, 150)), ('L', (100, 190)), ('L', (0, 190))]))
        for s in (1, -1):
            D.o(half((14, 158), [('C', (40, 110), (70, 60), (104, 8)), ('L', (128, 22)), ('C', (96, 60), (66, 110), (44, 162))], s, close=True))
        D.d('stitch', half((-58, 156), [('L', (58, 156))]))
        D.d('panel', rect(X(-16), 152, 32, 40, 4))
    D.o(g.outline)
    waistband(D, g, view, loops=False, button=False)
    if view == 'front':
        fly(D, g, 24)
        jean_pockets(D, g, coin=False)
        D.d('seamL', *pair((g.Hx - 4, 200), [('L', (g.Hx - 4, 250))]))        # side button opening
    else:
        jean_back(D, g)
    D.d('seam', half((40, 330), [('L', (100, 326)), ('L', (100, 380)), ('L', (40, 380)), ('Z',)][:-1], 1 if view == 'front' else -1, close=True))  # tool pocket
    hems(D, g)
    D.d('panel', half((g.Hx - 18, 320), [('L', (g.Hx - 2, 320)), ('L', (g.Hx - 2, 372)), ('L', (g.Hx - 18, 372))], -1, close=True))   # hammer loop
    leg_shading(D, g)
    D.light('M250 100 C246 130 246 160 250 186', 26, .12)
    return D


# ─────────────────────────────────────────────────────────────────
# jeans
# ─────────────────────────────────────────────────────────────────
JEAN = dict(HOx=100, HIx=20, Kx=106, KIx=16)


def jean_base(view, **o):
    D, g = start(view, **{**JEAN, **o})
    waistband(D, g, view)
    if view == 'front':
        fly(D, g, 26)
        jean_pockets(D, g)
    else:
        jean_back(D, g)
    return D, g


def five_pocket(view):
    D, g = jean_base(view)
    hems(D, g, 12)
    leg_shading(D, g)
    D.d('seamL', *pair((legc(g, 230) - 18, 236), [('C', (legc(g, 230), 228), (legc(g, 230) + 10, 230), (legc(g, 230) + 24, 240))]))   # whiskers
    return D


def selvedge(view):
    D, g = jean_base(view, HOx=102, HIx=20, Ly=540)
    # rolled cuff showing the selvedge edge on the outseam
    for s in (1, -1):
        D.d('seam', half((g.HOx + 1, g.Ly - 40), [('L', (g.HIx - 1, g.Ly - 40))], s))
        D.d('edge', half((g.HOx - 6, g.Ly - 38), [('L', (g.HOx - 6, g.Ly - 2))], s))
        D.d('stitchW', half((g.HOx - 2, g.Ly - 38), [('L', (g.HOx - 2, g.Ly - 2))], s))
    D.d('stitchW', *pair((g.Hx - 3, g.Hy + 10), [('L', (g.HOx - 2, g.Ly - 42))]))             # selvedge outseam
    leg_shading(D, g)
    return D


def carpenter_jeans(view):
    D, g = jean_base(view, Hx=124, Kx=116, HOx=108, HIx=14, KIx=10)
    hems(D, g)
    if view == 'front':
        D.d('seam', half((58, 236), [('L', (g.Hx - 8, 232)), ('L', (g.Hx - 8, 326)), ('L', (58, 326))], 1))
        D.d('seamL', half((88, 236), [('L', (88, 326))], 1))
    D.d('panel', half((g.Hx - 22, 176), [('L', (g.Hx - 2, 176)), ('L', (g.Hx - 2, 234)), ('L', (g.Hx - 22, 234))], -1 if view == 'front' else 1, close=True))
    leg_shading(D, g)
    return D


def painter(view):
    D, g = jean_base(view, Hx=124, Kx=116, HOx=108, HIx=14, KIx=10)
    hems(D, g)
    if view == 'front':
        knee_panel(D, g, 316, 452)
    D.d('panel', half((g.Hx - 22, 176), [('L', (g.Hx - 2, 176)), ('L', (g.Hx - 2, 234)), ('L', (g.Hx - 22, 234))], -1 if view == 'front' else 1, close=True))
    leg_shading(D, g)
    return D


def cargo_jeans(view):
    D, g = jean_base(view, Hx=124, Kx=118, HOx=106, HIx=16, KIx=10, bulge=6)
    hems(D, g)
    cargo_pocket(D, g, 262, 100, 62)
    leg_shading(D, g)
    return D


def ripped(view):
    D, g = jean_base(view, HOx=96, HIx=22, Kx=104, KIx=18)
    hems(D, g)
    if view == 'front':
        # abraded knees: torn openings with cross threads
        for s, y, w in ((1, 372, 40), (-1, 388, 34), (1, 250, 22), (-1, 470, 20)):
            c = legc(g, y)
            D.d('inner', half((c - w / 2, y), [('C', (c - w / 4, y - 7), (c + w / 4, y - 7), (c + w / 2, y)), ('C', (c + w / 4, y + 5), (c - w / 4, y + 5), (c - w / 2, y))], s, close=True))
            D.d('ribW', *[half((c - w / 2 + w * t, y - 4), [('L', (c - w / 2 + w * t + 2, y + 4))], s) for t in (.25, .5, .75)])
        D.d('tintW', *[half((legc(g, y) - 20, y - 12), [('C', (legc(g, y), y - 20), (legc(g, y) + 20, y - 12), (legc(g, y) + 24, y)), ('C', (legc(g, y), y + 18), (legc(g, y) - 20, y + 14), (legc(g, y) - 20, y - 12))], s, close=True) for s, y in ((1, 372), (-1, 388))])
    leg_shading(D, g)
    return D


def elastic_jeans(view):
    D, g = start(view, **JEAN)
    elastic_waist(D, g, cord=True, view=view)
    if view == 'front':
        D.d('stitch', half((24, g.top + 40), [('L', (24, g.Cy - 40)), ('C', (24, g.Cy - 18), (14, g.Cy - 10), (2, g.Cy - 10))]))   # mock fly
        D.d('seam', f'M{X(0)} {g.top + 40} L{X(0)} {g.Cy - 6}')
        jean_pockets(D, g)
    else:
        jean_back(D, g)
    hems(D, g)
    leg_shading(D, g)
    return D


# ─────────────────────────────────────────────────────────────────
# shorts (drawn on the pants block, then scaled 1.3x)
# ─────────────────────────────────────────────────────────────────
SK = 1.3


def shorts(view, Ly=300, HOx=114, HIx=10, **o):
    o = {'top': 30, **o}
    D, g = start(view, short=True, Ly=Ly, HOx=HOx, HIx=HIx, **o)
    return D, g


def finish_short(D):
    return scale_drawing(D, SK, 300, 30)


def chino_shorts(view):
    D, g = shorts(view, 292)
    chino_like(view, D, g)
    short_shading(D, g)
    return finish_short(D)


def cargo_shorts(view):
    D, g = shorts(view, 340, HOx=122, HIx=8, Hx=124, bulge=4)
    chino_like(view, D, g)
    cargo_pocket(D, g, 230, 84, 60)
    short_shading(D, g)
    return finish_short(D)


def jorts(view):
    D, g = shorts(view, 300, HOx=120, HIx=8, Hx=122)
    waistband(D, g, view)
    if view == 'front':
        fly(D, g, 26)
        jean_pockets(D, g)
    else:
        jean_back(D, g)
    D.d('seam', *pair((g.HOx - 1, g.Ly - 24), [('L', (g.HIx + 1, g.Ly - 24))]))          # rolled hem
    D.d('stitch', *pair((g.HOx - 2, g.Ly - 18), [('L', (g.HIx + 2, g.Ly - 18))]))
    short_shading(D, g)
    return finish_short(D)


def athletic(view):
    D, g = shorts(view, 280, HOx=122, HIx=12, Hx=122, split=26)
    elastic_waist(D, g, cord=True, view=view)
    D.d('stitch', *pair((g.HOx - 22, g.Ly - 10), [('L', (g.HIx + 2, g.Ly - 10))]))
    D.d('seamL', *pair((g.Hx - 2, g.Hy + 20), [('L', (g.HOx - 8, g.Ly - g.split - 4))]))     # side panel seam
    if view == 'front':
        for s in (1, -1):
            D.d('edge', half((g.Hx - 26, g.top + 60), [('L', (g.Hx - 4, g.top + 130))], s))
    short_shading(D, g)
    return finish_short(D)


def board(view):
    D, g = shorts(view, 336, HOx=120, HIx=10, Hx=120, wb=26)
    # no loops; scalloped waistband with a lace-up fly
    D.d('seam', f'M{X(-g.Wx - 2)} {g.top + 26} L{X(g.Wx + 2)} {g.top + 26}')
    if view == 'front':
        D.d('seam', half((-12, g.top), [('L', (-12, g.top + 26))]), half((12, g.top), [('L', (12, g.top + 26))]))
        D.d('hole', *[circle(X(s * 18), g.top + 8 + k * 9, 2.6) for s in (1, -1) for k in range(3)])
        D.x(f'<path d="M{X(-18)} {g.top + 8} L{X(18)} {g.top + 17} M{X(18)} {g.top + 8} L{X(-18)} {g.top + 17} M{X(0)} {g.top + 22} C{X(-10)} {g.top + 50} {X(-4)} {g.top + 70} {X(-10)} {g.top + 96} M{X(0)} {g.top + 22} C{X(10)} {g.top + 50} {X(6)} {g.top + 70} {X(12)} {g.top + 94}" fill="none" stroke="#6f6b63" stroke-width="3" stroke-linecap="round"/>')
        D.d('seam', f'M{X(0)} {g.top + 26} L{X(0)} {g.Cy - 6}')
    else:
        D.d('seam', f'M{X(0)} {g.top + 26} L{X(0)} {g.Cy}')
        D.d('mesh', rect(X(36), 92, 60, 64, 6))                                    # vented back pocket
    # colour-block side panel (accent)
    for s in (1, -1):
        D.a(half((g.Hx - 2, g.Hy - 40), [('C', (g.Hx + 6, g.Hy + 40), (g.HOx + 4, g.Ly - 60), (g.HOx + 4, g.Ly + 2)), ('L', (g.HOx - 34, g.Ly + 2)),
                                         ('C', (g.HOx - 30, g.Ly - 80), (g.Hx - 26, g.Hy), (g.Hx - 2, g.Hy - 40))], s, close=True))
        D.d('seam', half((g.HOx - 32, g.Ly), [('C', (g.HOx - 28, g.Ly - 80), (g.Hx - 24, g.Hy), (g.Hx - 2, g.Hy - 40))], s))
    hems(D, g, 10)
    short_shading(D, g)
    return finish_short(D)


def sweat_shorts(view):
    D, g = shorts(view, 306, HOx=118, HIx=10, Hx=122)
    elastic_waist(D, g, cord=True, view=view)
    if view == 'front':
        slant_pockets(D, g, 64, 66)
    else:
        D.d('seam', half((30, 96), [('L', (90, 94)), ('L', (90, 150)), ('L', (30, 152)), ('Z',)][:-1], -1, close=True))
    D.d('seam', *pair((g.HOx - 1, g.Ly - 20), [('L', (g.HIx + 1, g.Ly - 20))]))
    short_shading(D, g)
    return finish_short(D)


def running(view):
    D, g = shorts(view, 252, HOx=124, HIx=14, Hx=122, split=44)
    elastic_waist(D, g, cord=True, view=view)
    D.d('stitch', *pair((g.HOx - 24, g.Ly - 8), [('L', (g.HIx + 2, g.Ly - 8))]))
    D.d('edge', *pair((g.HOx - 1, g.Ly - g.split - 2), [('Q', (g.HOx - 4, g.Ly - 6), (g.HOx - 22, g.Ly - 1))]))   # split hem binding
    if view == 'back':
        D.d('zip', half((-30, 100), [('L', (30, 100))]))
        D.d('seamL', half((-36, 94), [('L', (36, 94)), ('L', (36, 130)), ('L', (-36, 130)), ('Z',)][:-1], close=True))
    short_shading(D, g)
    return finish_short(D)


def bike(view):
    D, g = shorts(view, 344, HOx=88, HIx=18, Hx=108, Wx=94, wb=50, top=24)
    D.d('seam', f'M{X(-g.Wx - 2)} {g.top + 50} L{X(g.Wx + 2)} {g.top + 50}')        # high waistband
    D.d('stitch', *pair((g.Hx - 4, g.Hy - 20), [('C', (g.Hx - 20, g.Cy), (g.HOx - 30, g.Ly - 40), (g.HOx - 32, g.Ly - 2))]))   # flatlock panel seam
    D.d('stitch', *pair((g.HOx - 1, g.Ly - 12), [('L', (g.HIx + 1, g.Ly - 12))]))
    if view == 'back':
        D.d('seam', 'M270 130 C280 150 320 150 330 130')                              # contour seam
    short_shading(D, g)
    return finish_short(D)


def pleated_shorts(view):
    D, g = shorts(view, 316, HOx=124, HIx=8, Hx=124)
    chino_like(view, D, g)
    if view == 'front':
        for s in (1, -1):
            for x in (44, 64):
                D.d('seam', half((x, g.top + g.wb), [('C', (x + 1, g.top + g.wb + 30), (x + 2, g.top + g.wb + 50), (x + 4, g.top + g.wb + 70))], s))
    D.d('seam', *pair((g.HOx - 1, g.Ly - 26), [('L', (g.HIx + 1, g.Ly - 26))]))
    short_shading(D, g)
    return finish_short(D)


def training_shorts(view):
    D, g = shorts(view, 292, HOx=120, HIx=12, Hx=120, split=18)
    elastic_waist(D, g, cord=True, view=view)
    D.d('stitch', *pair((g.HOx - 18, g.Ly - 10), [('L', (g.HIx + 2, g.Ly - 10))]))
    D.d('mesh', *pair((g.Hx - 2, g.Hy), [('C', (g.Hx + 2, g.Cy), (g.HOx + 2, g.Ly - 50), (g.HOx, g.Ly - g.split - 2)), ('L', (g.HOx - 18, g.Ly - g.split - 2)),
                                         ('C', (g.HOx - 18, g.Ly - 60), (g.Hx - 18, g.Cy), (g.Hx - 18, g.Hy - 6))], close=True))
    if view == 'front':
        zip_pocket = half((-74, 160), [('L', (-50, 228))])
        D.d('edge', zip_pocket)
    short_shading(D, g)
    return finish_short(D)


def skort(view):
    D = Drawing()
    sk = skirt_shape(view, 92, 300, 152, top=30)
    D.o(sk)
    D.d('seam', f'M{X(-92)} 64 L{X(92)} 64')
    D.d('stitch', f'M{X(-92)} 58 L{X(92)} 58', f'M{X(-92)} 36 L{X(92)} 36')
    if view == 'front':
        # wrap-front panel with knife pleats; shorts hidden beneath
        for x in (-110, -70, -30, 30, 70, 110):
            D.d('seam', f'M{X(x * .6)} 66 L{X(x)} 300')
        D.d('edge', f'M{X(46)} 64 C{X(60)} 140 {X(90)} 240 {X(110)} 304')
    else:
        for x in (-110, -70, -30, 30, 70, 110):
            D.d('seam', f'M{X(x * .6)} 66 L{X(x)} 300')
        D.d('zip', f'M{X(0)} 30 L{X(0)} 120')
    D.d('stitch', f'M{X(-150)} 290 C{X(-80)} 296 {X(80)} 296 {X(150)} 290')
    skirt_shading(D, 92, 300, 152)
    return scale_drawing(D, SK, 300, 30)


# ─────────────────────────────────────────────────────────────────
# joggers & sweatpants
# ─────────────────────────────────────────────────────────────────
def jogger_base(view, cuffs=True, cord=True, **o):
    o = {**dict(Hx=120, Kx=104, KIx=14, HOx=76, HIx=24, Ly=548, wb=40), **o}
    D, g = start(view, **o)
    elastic_waist(D, g, 40, cord=cord, view=view)
    if cuffs:
        rib_cuffs(D, g, 34)
        gathers(D, g, g.Ly - 36, 4)
    return D, g


def joggers(view):
    D, g = jogger_base(view)
    if view == 'front':
        slant_pockets(D, g, 70, 66)
    else:
        D.d('seam', half((30, 104), [('L', (92, 102)), ('L', (92, 164)), ('L', (30, 166)), ('Z',)][:-1], -1, close=True))
    D.d('seamL', *pair((legc(g, 330) - 26, 324), [('C', (legc(g, 330), 336), (legc(g, 330) + 14, 338), (legc(g, 330) + 30, 330))]))
    leg_shading(D, g)
    return D


def sweatpants(view):
    D, g = jogger_base(view, Hx=124, Kx=114, KIx=12, HOx=92, HIx=20)
    if view == 'front':
        slant_pockets(D, g, 70, 66)
    leg_shading(D, g)
    return D


def track_pants(view):
    D, g = jogger_base(view, cuffs=False, Hx=122, Kx=110, KIx=14, HOx=94, HIx=22)
    # side stripes (accent) down the outseam and ankle zips
    for s in (1, -1):
        D.a(half((g.Hx - 2, g.Hy - 40), [('C', (g.Hx, g.Hy + 60), (g.Kx + 2, g.Ky - 80), (g.Kx, g.Ky)), ('C', (g.Kx, g.Ky + 60), (g.HOx + 2, g.Ly - 60), (g.HOx + 2, g.Ly + 2)),
                                         ('L', (g.HOx - 16, g.Ly + 2)), ('C', (g.HOx - 16, g.Ly - 60), (g.Kx - 16, g.Ky + 60), (g.Kx - 16, g.Ky)),
                                         ('C', (g.Kx - 14, g.Ky - 80), (g.Hx - 18, g.Hy + 60), (g.Hx - 18, g.Hy - 34))], s, close=True))
        D.d('zip', half((g.HOx - 22, g.Ly - 4), [('L', (g.HOx - 24, g.Ly - 80))], s))
    hems(D, g, 10)
    if view == 'front':
        for s in (1, -1):
            D.d('edge', half((g.Hx - 30, g.top + 60), [('L', (g.Hx - 26, g.top + 130))], s))
    leg_shading(D, g)
    return D


def lounge(view):
    D, g = jogger_base(view, cuffs=False, Hx=126, Kx=122, KIx=10, HOx=112, HIx=14)
    hems(D, g, 16)
    D.d('seamL', *pair((legc(g, 260), 240), [('C', (legc(g, 300) + 8, 320), (legc(g, 380) - 4, 420), (legc(g, 480), 530))]))
    leg_shading(D, g)
    return D


def cargo_jogger(view):
    D, g = jogger_base(view, Hx=122, Kx=108, bulge=4)
    if view == 'front':
        slant_pockets(D, g, 70, 66)
    cargo_pocket(D, g, 262, 96, 58)
    leg_shading(D, g)
    return D


def tech_pant(view):
    D, g = jogger_base(view, cuffs=False, Hx=118, Kx=102, KIx=16, HOx=78, HIx=24)
    D.d('seam', *pair((g.HOx - 1, g.Ly - 22), [('L', (g.HIx + 1, g.Ly - 22))]))         # bonded cuff
    D.d('panel', *pair((g.HOx - 14, g.Ly - 20), [('L', (g.HOx + 1, g.Ly - 20)), ('L', (g.HOx + 1, g.Ly - 4)), ('L', (g.HOx - 14, g.Ly - 4))], close=True))
    for s in (1, -1):
        c = legc(g, 360)
        D.d('seam', half((c - 30, 350), [('C', (c - 10, 366), (c + 10, 366), (c + 34, 352))], s))          # articulated knee
        D.d('seamL', half((c - 26, 372), [('C', (c - 8, 384), (c + 10, 384), (c + 30, 374))], s))
    if view == 'front':
        for s in (1, -1):
            D.d('edge', half((g.Hx - 34, g.top + 56), [('L', (g.Hx - 20, g.top + 134))], s))
            D.d('zip', half((g.Hx - 30, g.top + 60), [('L', (g.Hx - 18, g.top + 128))], s))
        D.d('zip', half((40, 250), [('L', (86, 250))], 1))
    leg_shading(D, g)
    return D


# ─────────────────────────────────────────────────────────────────
# skirts
# ─────────────────────────────────────────────────────────────────
SW = 104    # skirt waist half-width (shared)


def skirt_shape(view, W, L, Hm, top=44, curve=10, pencil=False):
    rise = -4 if view == 'back' else 0
    if pencil:
        segs = [('L', (W, top + rise)), ('C', (W + 12, top + 50), (Hm + 6, top + 110), (Hm + 4, top + 170)),
                ('C', (Hm + 2, L - 120), (Hm - 6, L - 40), (Hm - 8, L)), ('L', (0, L))]
    else:
        segs = [('L', (W, top + rise)), ('C', (W + 10, top + 40), (W + 26, top + 90), (Hm, L)),
                ('C', (Hm * .6, L + curve), (Hm * .3, L + curve), (0, L + curve))]
    return sym((0, top + rise), segs)


def skirt_shading(D, W, L, Hm, top=44):
    D.light(half((-W * .5, top + 60), [('C', (-W * .56, top + 150), (-Hm * .55, L - 100), (-Hm * .55, L - 20))]), 36, .13)
    D.dark(half((W * .8, top + 60), [('C', (W * .9, top + 150), (Hm * .86, L - 100), (Hm * .84, L - 10))]), 24, .16)


def skirt_band(D, W, top=44, h=34, zip_back=True, view='front'):
    D.d('seam', f'M{X(-W - 1)} {top + h} L{X(W + 1)} {top + h}')
    D.d('stitch', f'M{X(-W)} {top + h - 5} L{X(W)} {top + h - 5}')
    if view == 'back' and zip_back:
        D.d('zip', f'M{X(0)} {top + 2} L{X(0)} {top + 120}')


def a_line(view, L, Hm, pleats=0, slit=False, band=True, top=44):
    D = Drawing()
    D.o(skirt_shape(view, SW, L, Hm, top))
    if band:
        skirt_band(D, SW, top, view=view)
    D.d('stitch', f'M{X(-Hm + 6)} {L - 8} C{X(-Hm * .6)} {L + 2} {X(Hm * .6)} {L + 2} {X(Hm - 6)} {L - 8}')
    skirt_shading(D, SW, L, Hm, top)
    return D


def mini(view):
    D = a_line(view, 330, 168)
    if view == 'front':
        D.d('seamL', *pair((54, 80), [('L', (70, 160))]))                           # darts
    else:
        D.d('seamL', *pair((54, 80), [('L', (64, 150))]))
    return D


def knee(view):
    D = a_line(view, 450, 172)
    D.d('seamL', *pair((60, 80), [('C', (64, 200), (90, 340), (110, 450))]))      # panel seams
    return D


def midi(view):
    D = a_line(view, 520, 196)
    D.d('seamL', *pair((60, 80), [('C', (66, 220), (100, 380), (124, 522))]))
    D.dark(half((70, 300), [('C', (80, 380), (100, 450), (110, 516))]), 14, .12)
    D.dark(half((-60, 300), [('C', (-70, 380), (-90, 450), (-100, 516))]), 14, .08)
    return D


def maxi(view):
    D = Drawing()
    L, Hm = 566, 216
    D.o(skirt_shape(view, SW, L, Hm))
    # tiered maxi with gathered seams
    D.d('seam', f'M{X(-SW - 1)} 78 L{X(SW + 1)} 78')
    for y in (230, 390):
        w = SW + 26 + (Hm - SW - 26) * (y - 78) / (L - 78)
        D.d('seam', f'M{X(-w)} {y} C{X(-w * .5)} {y + 6} {X(w * .5)} {y + 6} {X(w)} {y}')
        D.d('seamL', *[f'M{X(x)} {y + 4} L{X(x * 1.04)} {y + 18}' for x in range(-int(w) + 14, int(w) - 8, 18)])
    D.d('stitch', f'M{X(-Hm + 6)} {L - 8} C{X(-Hm * .6)} {L + 2} {X(Hm * .6)} {L + 2} {X(Hm - 6)} {L - 8}')
    if view == 'back':
        D.d('zip', f'M{X(0)} 46 L{X(0)} 160')
    skirt_shading(D, SW, L, Hm)
    return D


def micro(view):
    D = Drawing()
    L, Hm = 270, 150
    D.o(skirt_shape(view, SW + 8, L, Hm, top=70))
    # low-rise with a contour band
    D.d('seam', f'M{X(-SW - 8)} 100 C{X(-60)} 104 {X(60)} 104 {X(SW + 8)} 100')
    D.d('stitch', f'M{X(-Hm + 6)} {L - 8} C{X(-Hm * .6)} {L + 2} {X(Hm * .6)} {L + 2} {X(Hm - 6)} {L - 8}')
    if view == 'back':
        D.d('zip', f'M{X(0)} 72 L{X(0)} 170')
    skirt_shading(D, SW, L, Hm, 70)
    return scale_drawing(D, 1.32, 300, 70)


def tennis(view):
    D = Drawing()
    L, Hm, top = 300, 184, 70
    D.o(skirt_shape(view, SW, L, Hm, top))
    D.d('seam', f'M{X(-SW - 1)} {top + 30} L{X(SW + 1)} {top + 30}')
    n = 14
    for i in range(1, n):
        u = -1 + 2 * i / n
        D.d('seam' if i % 2 else 'seamL', f'M{X(u * SW)} {top + 30} L{X(u * Hm)} {L + 8 * (1 - u * u)}')
    D.dark(half((-60, 200), [('L', (-80, 290))]), 10, .12)
    skirt_shading(D, SW, L, Hm, top)
    return scale_drawing(D, 1.3, 300, 70)


def denim_skirt(view):
    D = Drawing()
    L, Hm = 380, 140
    D.o(skirt_shape(view, SW, L, Hm, pencil=True))
    g = P()
    g.top, g.wb, g.Wx, g.Hx, g.Cy = 44, 34, SW, 122, 250
    waistband(D, g, view)
    if view == 'front':
        fly(D, g, 26)
        jean_pockets(D, g)
        D.d('seam', f'M{X(0)} 250 L{X(0)} {L}')
    else:
        jean_back(D, g)
        D.d('seam', f'M{X(0)} 250 L{X(0)} {L}')
    D.d('stitch', f'M{X(-Hm + 10)} {L - 12} L{X(Hm - 10)} {L - 12}')
    skirt_shading(D, SW, L, Hm)
    return scale_drawing(D, 1.18, 300, 44)


def cargo_skirt(view):
    D = Drawing()
    L, Hm = 510, 160
    D.o(skirt_shape(view, SW, L, Hm, pencil=True))
    g = P()
    g.top, g.wb, g.Wx, g.Hx, g.Cy = 44, 34, SW, 126, 230
    waistband(D, g, view)
    if view == 'front':
        fly(D, g, 26)
        slant_pockets(D, g)
    else:
        welt_back(D, g)
    for s in (1, -1):
        D.d('seam', half((70, 260), [('L', (140, 260)), ('L', (142, 360)), ('L', (72, 360)), ('Z',)][:-1], s, close=True))
        D.d('panel', half((66, 254), [('L', (144, 254)), ('L', (144, 284)), ('L', (66, 284))], s, close=True))
        D.d('hw', circle(X(s * 105), 272, 4))
    D.d('seam', f'M{X(0)} 230 L{X(0)} {L}')
    D.d('stitch', f'M{X(-Hm + 10)} {L - 12} L{X(Hm - 10)} {L - 12}')
    skirt_shading(D, SW, L, Hm)
    return D


def slip(view):
    D = Drawing()
    L, Hm = 520, 176
    D.o(skirt_shape(view, SW - 4, L, Hm, curve=6))
    D.d('seam', f'M{X(-SW + 3)} 66 L{X(SW - 3)} 66')
    D.d('rib', *[f'M{X(x)} 46 L{X(x)} 64' for x in range(-int(SW) + 10, int(SW) - 4, 10)])
    # bias-cut drape: long soft folds
    for s, x0, x1 in ((1, 40, 70), (-1, 50, 90), (1, 90, 140)):
        D.d('seamL', half((x0, 120), [('C', (x0 + 4, 260), (x1 - 10, 420), (x1, L - 4))], s))
    D.light(half((-50, 120), [('C', (-60, 260), (-80, 400), (-90, L - 20))]), 30, .2)
    D.light(half((30, 140), [('C', (36, 260), (50, 400), (56, L - 20))]), 16, .14)
    D.dark(half((90, 120), [('C', (110, 260), (130, 400), (146, L - 20))]), 22, .18)
    return D


def kilt(view):
    D = Drawing()
    L, Hm = 440, 168
    D.o(skirt_shape(view, SW, L, Hm, curve=4))
    skirt_band(D, SW, zip_back=False, view=view)
    if view == 'front':
        # flat wrap apron on the front, knife pleats at the sides
        D.d('edge', f'M{X(60)} 78 C{X(66)} 200 {X(80)} 330 {X(92)} {L + 2}')
        D.d('stitchW', f'M{X(54)} 80 C{X(60)} 200 {X(74)} 330 {X(86)} {L}')
        for x in (110, 140):
            D.d('seam', half((x * .7, 78), [('L', (x, L + 2))]), half((-x * .7, 78), [('L', (-x, L + 2))]))
        for y in (100, 150):
            D.d('panel', half((-SW - 2, y), [('L', (-60, y)), ('L', (-60, y + 14)), ('L', (-SW - 2, y + 14))], close=True))
            D.d('hw', rect(X(-72) - 8, y - 4, 16, 22, 3))
        D.x(f'<path d="M{X(82)} 380 l10 0 l2 16 l-14 0 z" fill="#b9b9b6" stroke="#6f6f6c" stroke-width="1"/>')       # kilt pin
    else:
        n = 12
        for i in range(1, n):
            u = -1 + 2 * i / n
            D.d('seam', f'M{X(u * SW)} 78 L{X(u * Hm)} {L + 4 * (1 - u * u)}')
    D.d('stitch', f'M{X(-Hm + 6)} {L - 10} L{X(Hm - 6)} {L - 10}')
    skirt_shading(D, SW, L, Hm)
    return D


# ─────────────────────────────────────────────────────────────────
# leggings
# ─────────────────────────────────────────────────────────────────
LEG = dict(Wx=94, Hx=110, Hy=150, Cy=206, Kx=74, Ky=392, KIx=24, HOx=52, HIx=24, Ly=556, top=30, wb=56)


def leggings_base(view, **o):
    D, g = start(view, **{**LEG, **o})
    D.d('seam', f'M{X(-g.Wx - 2)} {g.top + g.wb} C{X(-50)} {g.top + g.wb + 4} {X(50)} {g.top + g.wb + 4} {X(g.Wx + 2)} {g.top + g.wb}')
    D.d('stitch', *pair((g.HOx - 1, g.Ly - 12), [('L', (g.HIx + 1, g.Ly - 12))]))
    if view == 'front':
        D.d('seamL', half((-40, g.top + g.wb + 2), [('C', (-20, g.Cy - 40), (-6, g.Cy - 20), (0, g.Cy))]),
            half((40, g.top + g.wb + 2), [('C', (20, g.Cy - 40), (6, g.Cy - 20), (0, g.Cy))]))      # gusset
    else:
        D.d('seam', f'M{X(0)} {g.top + g.wb} L{X(0)} {g.Cy}')
        D.d('seamL', half((-80, 140), [('C', (-40, 170), (40, 170), (80, 140))]))        # contour yoke
    return D, g


def leg_light(D, g):
    D.light(half((-legc(g, g.Hy) - 10, g.Hy - 20), [('C', (-legc(g, g.Cy) - 10, g.Cy + 60), (-legc(g, g.Ky) - 6, g.Ky), (-legc(g, g.Ly) - 4, g.Ly - 30))]), 22, .11)
    D.dark(half((g.Hx - 12, g.Hy), [('C', (g.Hx - 10, g.Cy + 80), (legx(g, g.Ky) - 10, g.Ky), (g.HOx - 8, g.Ly - 20))]), 18, .18)
    D.dark(half((0, g.Cy - 10), [('C', (14, g.Cy + 40), (g.KIx + 4, g.Ky - 40), (g.HIx + 6, g.Ly - 30))]), 14, .14)


def leggings(view):
    D, g = leggings_base(view)
    D.d('stitch', *pair((g.Hx - 2, g.Hy - 10), [('C', (g.Hx - 6, g.Cy + 80), (legx(g, g.Ky) - 4, g.Ky), (g.HOx - 2, g.Ly - 14))]))   # flatlock outseam
    leg_light(D, g)
    return D


def yoga(view):
    D, g = leggings_base(view, Kx=76, KIx=22, HOx=96, HIx=10, Ly=556)
    if view == 'front':
        # fold-over crossover waistband
        D.d('seam', f'M{X(-g.Wx)} {g.top + 4} L{X(0)} {g.top + g.wb - 6} L{X(g.Wx)} {g.top + 4}')
    leg_light(D, g)
    return D


def run_tights(view):
    D, g = leggings_base(view, wb=44)
    # reflective panel (accent) down the calf, zip pocket at the back
    for s in (1, -1):
        D.a(half((legx(g, 420) - 4, 420), [('C', (legx(g, 470) - 2, 470), (g.HOx - 2, 520), (g.HOx - 1, g.Ly - 14)), ('L', (g.HOx - 12, g.Ly - 14)),
                                           ('C', (g.HOx - 12, 520), (legx(g, 470) - 14, 470), (legx(g, 420) - 18, 424))], s, close=True))
    D.d('stitch', *pair((g.Hx - 4, g.Hy), [('C', (g.Hx - 30, g.Cy + 60), (legc(g, g.Ky) + 10, g.Ky - 40), (legc(g, g.Ky), g.Ky + 20))]))
    if view == 'back':
        D.d('zip', half((-34, g.top + 24), [('L', (34, g.top + 24))]))
        D.d('seamL', half((-40, g.top + 16), [('L', (40, g.top + 16)), ('L', (40, g.top + 34)), ('L', (-40, g.top + 34)), ('Z',)][:-1], close=True))
    leg_light(D, g)
    return D


def compression_tights(view):
    D, g = leggings_base(view, wb=60, Kx=72, KIx=26, HOx=50, HIx=26)
    # graduated support panels: seams spiralling round the thigh and calf
    D.d('stitch', *pair((g.Hx - 2, g.Hy + 20), [('C', (g.Hx - 40, g.Cy + 60), (30, 300), (g.KIx + 2, 360))]))
    D.d('stitch', *pair((legx(g, 360) - 2, 360), [('C', (legc(g, 400), 420), (legc(g, 460) - 10, 470), (g.HIx + 2, 520))]))
    D.d('seam', *pair((legx(g, 392) - 1, 392), [('C', (legc(g, 392) + 10, 400), (legc(g, 392) - 10, 400), (legx(g, 392, True) + 1, 392))]))
    leg_light(D, g)
    return D


BOTTOMS = {
    'chinos': chinos, 'trousers': trousers, 'cargo': cargo, 'pleated': pleated, 'carpenter': carpenter, 'workPants': work_pants,
    'wideTrousers': wide_trousers, 'palazzo': palazzo, 'parachute': parachute, 'cords': cords, 'linenPants': linen_pants,
    'overalls': overalls, 'fivePocket': five_pocket, 'selvedge': selvedge, 'carpenterJeans': carpenter_jeans, 'painter': painter,
    'cargoJeans': cargo_jeans, 'ripped': ripped, 'elasticJeans': elastic_jeans, 'chinoShorts': chino_shorts,
    'cargoShorts': cargo_shorts, 'jorts': jorts, 'athletic': athletic, 'board': board, 'sweatShorts': sweat_shorts,
    'running': running, 'bike': bike, 'pleatedShorts': pleated_shorts, 'skort': skort, 'joggers': joggers,
    'sweatpants': sweatpants, 'trackPants': track_pants, 'lounge': lounge, 'cargoJogger': cargo_jogger, 'techPant': tech_pant,
    'mini': mini, 'knee': knee, 'midi': midi, 'maxi': maxi, 'micro': micro, 'tennis': tennis, 'denimSkirt': denim_skirt,
    'cargoSkirt': cargo_skirt, 'slip': slip, 'kilt': kilt, 'leggings': leggings, 'yoga': yoga, 'runTights': run_tights,
    'compressionTights': compression_tights, 'trainingShorts': training_shorts,
}

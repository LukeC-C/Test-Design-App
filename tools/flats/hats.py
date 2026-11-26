"""Hats: front and back elevations, 600x600, axis x=300."""
from lib import Drawing, sym, half, pair, path, circle, rect, band, centre, f, pt, AX

X = lambda dx: AX + dx


# ─────────────────────────────────────────────────────────────────
# shared shapes
# ─────────────────────────────────────────────────────────────────
def dome(w, top, base, dip=0, sq=.5, flat=0):
    """Symmetric crown: top centre → side → base centre. flat widens the top."""
    h = base - top
    return sym((0, top), [('C', (w * .74 + flat, top), (w, top + h * (1 - sq)), (w, base)),
                          ('C', (w, base + dip * .4), (w * .55, base + dip), (0, base + dip))])


def dome_side(w, top, base, t, sq=.5, flat=0):
    """x offset of the dome side at height fraction t (0=top, 1=base), approx."""
    from lib import bez
    h = base - top
    p = bez((0, top), (w * .5 + flat, top), (w, top + h * (1 - sq)), (w, base), t)
    return p


def arc_line(w, y, sag, side=None):
    """Curve across the hat from -w to +w through the centre sagging by `sag`."""
    return f'M{f(X(-w))} {f(y)} C{f(X(-w * .5))} {f(y + sag)} {f(X(w * .5))} {f(y + sag)} {f(X(w))} {f(y)}'


def band_shape(w0, y0, w1, y1, sag0, sag1):
    """Band between two across-curves (upper at y0 width w0, lower at y1 width w1)."""
    return (f'M{f(X(-w0))} {f(y0)} C{f(X(-w0 * .5))} {f(y0 + sag0)} {f(X(w0 * .5))} {f(y0 + sag0)} {f(X(w0))} {f(y0)} '
            f'L{f(X(w1))} {f(y1)} C{f(X(w1 * .5))} {f(y1 + sag1)} {f(X(-w1 * .5))} {f(y1 + sag1)} {f(X(-w1))} {f(y1)} Z')


def brim_ellipse(rx, yc, ry, curl=0, droop=0, back=0):
    """Brim seen from the front (slightly above): curl lifts the sides,
    droop lowers the front edge, back lifts the far edge."""
    return sym((0, yc - ry - back), [('C', (rx * .6, yc - ry - back), (rx, yc - ry * .5 - curl), (rx, yc - curl)),
                                     ('C', (rx, yc + ry * .5 - curl * .4), (rx * .6, yc + ry + droop), (0, yc + ry + droop))])


# ─────────────────────────────────────────────────────────────────
# caps
# ─────────────────────────────────────────────────────────────────
CW, CTOP, CBASE = 205, 126, 372


def cap(view, top=CTOP, w=CW, brim='curved', sq=.66, flat=0, button=True, panels=6,
        closure='snap', front_panel=False, mesh=False, crown=True, structured=True):
    D = Drawing()
    base = CBASE
    shapes = []
    if crown:
        shapes.append(dome(w, top, base, 30 if view == 'front' else 22, sq, flat))
    if view == 'front':
        if brim == 'curved':
            shapes.append(sym((0, base + 30), [('C', (w * .55, base + 30), (w + 2, base + 8), (w + 8, base + 4)),
                                               ('C', (w + 14, base + 18), (w * .64, base + 122), (0, base + 126))]))
        elif brim == 'flat':
            shapes.append(sym((0, base + 22), [('C', (w * .55, base + 22), (w + 6, base + 6), (w + 18, base + 4)),
                                               ('C', (w + 24, base + 14), (w * .62, base + 58), (0, base + 58))]))
        elif brim == 'short':
            shapes.append(sym((0, base + 28), [('C', (w * .55, base + 28), (w - 10, base + 8), (w - 4, base + 4)),
                                               ('C', (w, base + 12), (w * .6, base + 78), (0, base + 80))]))
        elif brim == 'tall':                                         # sport / sun visor
            shapes.append(sym((0, base + 26), [('C', (w * .55, base + 26), (w + 4, base + 6), (w + 12, base + 2)),
                                               ('C', (w + 18, base + 30), (w * .64, base + 150), (0, base + 156))]))
    else:
        # brim tips seen past the crown from behind
        if brim in ('curved', 'flat', 'tall'):
            shapes.append(sym((0, base - 8), [('L', (w + (16 if brim == 'flat' else 6), base - 6)),
                                              ('C', (w + 12, base + 6), (w, base + 14), (w - 30, base + 16)), ('L', (0, base + 16))]))
    for s in shapes:
        D.o(s)
    return D, base


def cap_front_details(D, w, top, base, panels=6, button=True, brim='curved', front_panel=False, sq=.42, flat=0, eyelets=True):
    yb = base + 30
    if panels == 6 and not front_panel:
        D.d('seam', f'M{X(0)} {top + 4} L{X(0)} {yb}')
    # side seams: from button out to the base
    D.d('seam', *pair((0, top + 2), [('C', (w * .44 + flat * .6, top + 6), (w * .74, top + 90), (w * .8, base + 18))]))
    if panels == 5:
        D.d('stitch', *pair((0, top + 10), [('C', (w * .3, top + 16), (w * .62, top + 110), (w * .68, base + 16))]))
    if button:
        D.d('button', f'M{X(-11)} {top + 4} C{X(-11)} {top - 8} {X(11)} {top - 8} {X(11)} {top + 4} Z')
    if eyelets:
        D.d('hole', circle(X(-w * .52), top + 64, 3.4), circle(X(w * .52), top + 64, 3.4))
    if brim in ('curved', 'short', 'tall'):
        for k, inset in enumerate((10, 20)):
            if brim == 'tall':
                d = sym((0, base + 26 + inset), [])
            D.d('stitch', f'M{X(-w + 6)} {base + 12 + inset * .4} C{X(-w * .62)} {base + 112 + (50 if brim == "tall" else 0) - inset * 1.1} '
                f'{X(w * .62)} {base + 112 + (50 if brim == "tall" else 0) - inset * 1.1} {X(w - 6)} {base + 12 + inset * .4}')
    elif brim == 'flat':
        D.d('stitch', f'M{X(-w)} {base + 14} C{X(-w * .6)} {base + 46} {X(w * .6)} {base + 46} {X(w)} {base + 14}')
    D.d('seam', arc_line(w, base + 4, 30))                                          # crown / brim join
    D.light(f'M{X(-w * .62)} {top + 70} C{X(-w * .5)} {top + 40} {X(-w * .3)} {top + 26} {X(-w * .1)} {top + 22}', 26, .22)
    D.dark(f'M{X(w * .7)} {top + 80} C{X(w * .9)} {top + 140} {X(w * .92)} {base - 40} {X(w * .9)} {base}', 22, .18)
    D.dark(f'M{X(-w * .9)} {base + 40} C{X(-w * .4)} {base + 70} {X(w * .4)} {base + 70} {X(w * .9)} {base + 40}', 16, .18)


def cap_back_details(D, w, top, base, closure='snap', button=True, mesh=False):
    D.d('seam', f'M{X(0)} {top + 4} L{X(0)} {base - 94}')
    D.d('seam', *pair((0, top + 2), [('C', (w * .44, top + 6), (w * .74, top + 90), (w * .8, base + 14))]))
    if button:
        D.d('button', f'M{X(-11)} {top + 4} C{X(-11)} {top - 8} {X(11)} {top - 8} {X(11)} {top + 4} Z')
    if closure != 'none':
        D.d('inner', f'M{X(-70)} {base + 22} C{X(-68)} {base - 50} {X(-40)} {base - 84} {X(0)} {base - 84} '
                     f'C{X(40)} {base - 84} {X(68)} {base - 50} {X(70)} {base + 22} Z')
        D.d('seam', f'M{X(-80)} {base + 22} C{X(-78)} {base - 56} {X(-44)} {base - 94} {X(0)} {base - 94} '
                    f'C{X(44)} {base - 94} {X(78)} {base - 56} {X(80)} {base + 22}')
    if closure == 'snap':
        D.d('panel', rect(X(-72), base - 4, 144, 22, 6))
        D.d('hw', circle(X(-40), base + 7, 4.5), circle(X(-20), base + 7, 4.5), circle(X(0), base + 7, 4.5), circle(X(20), base + 7, 4.5))
    elif closure == 'strap':
        D.d('panel', rect(X(-72), base - 2, 144, 18, 6))
        D.d('hw', rect(X(-10), base - 6, 26, 26, 3))
        D.d('hole', rect(X(-4), base, 14, 14, 2))
    elif closure == 'velcro':
        D.d('panel', rect(X(-72), base - 2, 144, 20, 6))
        D.d('tint', rect(X(-50), base + 1, 100, 14, 3))
    elif closure == 'elastic':
        D.d('panel', rect(X(-72), base - 2, 144, 18, 6))
        D.d('rib', *[f'M{X(x)} {base} L{X(x)} {base + 14}' for x in range(-64, 66, 8)])
    D.d('seamL', arc_line(w - 2, base - 6, 20))
    D.light(f'M{X(-w * .7)} {top + 80} C{X(-w * .5)} {top + 40} {X(-w * .3)} {top + 26} {X(-w * .1)} {top + 22}', 26, .2)
    D.dark(f'M{X(w * .72)} {top + 80} C{X(w * .9)} {top + 140} {X(w * .92)} {base - 40} {X(w * .9)} {base}', 22, .18)


def baseball(view):
    D, base = cap(view)
    if view == 'front':
        cap_front_details(D, CW, CTOP, base)
    else:
        cap_back_details(D, CW, CTOP, base, 'strap')
    return D


def dad(view):
    top, sq = 150, .6                                        # unstructured: lower, softer crown
    D, base = cap(view, top=top, sq=sq, w=CW - 4)
    w = CW - 4
    if view == 'front':
        cap_front_details(D, w, top, base, sq=sq)
        D.dark(f'M{X(-60)} {top + 40} C{X(-20)} {top + 70} {X(20)} {top + 70} {X(60)} {top + 40}', 14, .14)   # soft front collapse
    else:
        cap_back_details(D, w, top, base, 'strap')
        D.x(f'<path d="M{X(16)} {base + 8} C{X(24)} {base + 30} {X(30)} {base + 44} {X(28)} {base + 60}" fill="none" stroke="#5b564e" stroke-width="0"/>')
    return D


def snapback(view):
    top = 104
    D, base = cap(view, top=top, brim='flat', sq=.72, flat=10)
    if view == 'front':
        cap_front_details(D, CW, top, base, brim='flat', flat=10)
    else:
        cap_back_details(D, CW, top, base, 'snap')
    return D


def trucker(view):
    top = 100
    D, base = cap(view, top=top, brim='curved', sq=.72, flat=8)
    w = CW
    if view == 'front':
        # foam front panel and mesh side panels
        D.d('mesh', *pair((w * .5, top + 22), [('C', (w * .76, top + 60), (w * .96, top + 150), (w, base)),
                                               ('L', (w * .78, base + 18)),
                                               ('C', (w * .74, top + 170), (w * .62, top + 70), (w * .5, top + 22))], close=True))
        D.d('seam', *pair((w * .5, top + 22), [('C', (w * .62, top + 70), (w * .74, top + 170), (w * .78, base + 18))]))
        D.d('seam', f'M{X(0)} {top + 4} L{X(0)} {base + 30}')
        D.d('button', f'M{X(-11)} {top + 4} C{X(-11)} {top - 8} {X(11)} {top - 8} {X(11)} {top + 4} Z')
        D.d('stitch', f'M{X(-w + 6)} {base + 16} C{X(-w * .62)} {base + 90} {X(w * .62)} {base + 90} {X(w - 6)} {base + 16}')
        D.d('seam', arc_line(w, base + 4, 30))
        D.light(f'M{X(-w * .5)} {top + 70} C{X(-w * .4)} {top + 40} {X(-w * .3)} {top + 26} {X(-w * .1)} {top + 22}', 26, .22)
        D.dark(f'M{X(-w * .9)} {base + 40} C{X(-w * .4)} {base + 70} {X(w * .4)} {base + 70} {X(w * .9)} {base + 40}', 16, .18)
    else:
        D.d('mesh', dome(w - 1, top + 1, base, 21, .72, 8))
        cap_back_details(D, w, top, base, 'snap')
    return D


def fitted(view):
    top = 110
    D, base = cap(view, top=top, brim='flat', sq=.7, flat=6)
    if view == 'front':
        cap_front_details(D, CW, top, base, brim='flat', flat=6)
    else:
        cap_back_details(D, CW, top, base, 'none')
        D.d('stitch', arc_line(CW - 6, base - 12, 20))
    return D


def five_panel(view):
    top = 150
    D, base = cap(view, top=top, brim='short', sq=.7, flat=26)
    w = CW
    if view == 'front':
        cap_front_details(D, w, top, base, panels=5, button=False, brim='short', flat=26, eyelets=False)
        D.d('hole', circle(X(-w * .62), top + 70, 3.2), circle(X(w * .62), top + 70, 3.2))
    else:
        cap_back_details(D, w, top, base, 'strap', button=False)
    return D


def military(view):
    D = Drawing()
    top, base, w = 120, 372, 200
    # cadet cap: flat top, near-vertical sides that flare slightly at the top
    crown = sym((0, top), [('L', (w + 14, top + 6)), ('C', (w + 18, top + 8), (w + 16, top + 20), (w + 10, top + 40)),
                           ('L', (w, base)), ('C', (w, base + 12), (w * .55, base + (30 if view == 'front' else 22)), (0, base + (30 if view == 'front' else 22)))])
    D.o(crown)
    if view == 'front':
        D.o(sym((0, base + 30), [('C', (w * .55, base + 30), (w - 6, base + 8), (w, base + 4)),
                                  ('C', (w + 6, base + 12), (w * .6, base + 76), (0, base + 80))]))
        D.d('seam', f'M{X(-w - 12)} {top + 26} C{X(-w * .5)} {top + 34} {X(w * .5)} {top + 34} {X(w + 12)} {top + 26}')
        D.d('seam', *pair((w * .4, top + 30), [('L', (w * .5, base + 26))]))
        D.d('stitch', f'M{X(-w + 8)} {base + 16} C{X(-w * .6)} {base + 66} {X(w * .6)} {base + 66} {X(w - 8)} {base + 16}')
        D.d('seam', arc_line(w, base + 4, 30))
    else:
        D.o(sym((0, base - 8), [('L', (w + 6, base - 6)), ('C', (w + 10, base + 6), (w, base + 14), (w - 30, base + 16)), ('L', (0, base + 16))]))
        D.d('seam', f'M{X(-w - 12)} {top + 26} C{X(-w * .5)} {top + 34} {X(w * .5)} {top + 34} {X(w + 12)} {top + 26}')
        D.d('seam', f'M{X(0)} {top + 34} L{X(0)} {base - 64}')
        cap_back_details(D, w, top + 30, base, 'velcro', button=False)
    D.light(f'M{X(-w * .7)} {top + 60} L{X(-w * .7)} {base - 40}', 28, .2)
    D.dark(f'M{X(w * .86)} {top + 60} L{X(w * .86)} {base - 20}', 22, .16)
    return D


def visor_shape(view, tall=False):
    D = Drawing()
    w, base = CW, CBASE
    bandh = 64 if tall else 54
    bd = 166 if tall else 120
    if view == 'front':
        D.o(sym((0, base - bandh + 22), [('C', (w * .5, base - bandh + 22), (w, base - bandh + 4), (w, base - bandh)),
                                          ('L', (w, base)), ('C', (w + 8, base), (w + 18, base + 8), (w + 20, base + 18)),
                                          ('C', (w + 18, base + 50), (w * .64, base + bd - 4), (0, base + bd))]))
        D.d('seam', arc_line(w, base + 2, 28))
        if tall:
            D.d('tint', f'M{X(-w)} {base - bandh} C{X(-w * .5)} {base - bandh + 26} {X(w * .5)} {base - bandh + 26} {X(w)} {base - bandh} '
                        f'L{X(w)} {base} C{X(w * .5)} {base + 28} {X(-w * .5)} {base + 28} {X(-w)} {base} Z')    # terry sweatband
        D.d('stitch', arc_line(w - 4, base - bandh + 8, 24))
        for k, i in enumerate((12, 24)):
            D.d('stitch', f'M{X(-w - 6 + i * .4)} {base + 12 + i * .5} C{X(-w * .62)} {base + bd - 14 - i * 1.1} '
                          f'{X(w * .62)} {base + bd - 14 - i * 1.1} {X(w + 6 - i * .4)} {base + 12 + i * .5}')
        D.light(f'M{X(-w * .6)} {base + 44} C{X(-w * .3)} {base + 70} {X(w * .1)} {base + 74} {X(w * .3)} {base + 70}', 20, .2)
        D.dark(f'M{X(-w * .9)} {base - bandh + 30} C{X(-w * .5)} {base - bandh + 50} {X(w * .5)} {base - bandh + 50} {X(w * .9)} {base - bandh + 30}', 14, .14)
    else:
        D.o(sym((0, base - bandh + 14), [('C', (w * .5, base - bandh + 14), (w, base - bandh), (w + 14, base - bandh - 6)),
                                          ('C', (w + 26, base - bandh + 6), (w + 26, base), (w + 18, base + 6)),
                                          ('C', (w * .55, base + 18), (0, base + 18), (0, base + 18))]))
        D.d('seam', arc_line(w + 10, base - bandh + 6, 14))
        D.d('panel', rect(X(-70), base - bandh + 18, 140, bandh - 22, 6))
        D.d('hw', rect(X(-12), base - bandh + 16, 26, bandh - 18, 3))
        D.d('hole', rect(X(-6), base - bandh + 22, 14, bandh - 30, 2))
        D.dark(f'M{X(-w)} {base - 10} C{X(-w * .5)} {base + 6} {X(w * .5)} {base + 6} {X(w)} {base - 10}', 14, .16)
    return D


def visor(view):
    return visor_shape(view)


def sun_visor(view):
    return visor_shape(view, tall=True)


# ─────────────────────────────────────────────────────────────────
# flat cap & newsboy
# ─────────────────────────────────────────────────────────────────
def flat_cap(view):
    D = Drawing()
    w, top, base = 212, 210, 372
    if view == 'front':
        # low crown sloping forward over a short stiff brim
        D.o(sym((0, top), [('C', (w * .62, top - 2), (w + 6, top + 40), (w + 8, base - 30)),
                           ('C', (w + 8, base - 8), (w * .62, base + 26), (0, base + 30))]))
        D.o(sym((0, base + 22), [('C', (w * .6, base + 22), (w - 6, base), (w - 2, base - 6)),
                                  ('C', (w + 4, base + 6), (w * .56, base + 62), (0, base + 64))]))
        D.d('seam', f'M{X(-w + 4)} {base - 26} C{X(-w * .6)} {base + 20} {X(w * .6)} {base + 20} {X(w - 4)} {base - 26}')   # crown front edge over brim
        D.d('stitch', f'M{X(-w + 12)} {base + 4} C{X(-w * .58)} {base + 50} {X(w * .58)} {base + 50} {X(w - 12)} {base + 4}')
        D.d('seamL', *pair((w * .62, top + 10), [('C', (w * .86, top + 30), (w * .98, top + 70), (w, base - 40))]))
        D.light(f'M{X(-w * .7)} {top + 30} C{X(-w * .4)} {top + 12} {X(0)} {top + 10} {X(w * .3)} {top + 14}', 22, .22)
        D.dark(f'M{X(-w * .9)} {base - 10} C{X(-w * .4)} {base + 24} {X(w * .4)} {base + 24} {X(w * .9)} {base - 10}', 16, .2)
    else:
        D.o(sym((0, top - 18), [('C', (w * .62, top - 18), (w + 4, top + 30), (w + 6, base - 30)),
                                ('C', (w + 6, base - 4), (w * .62, base + 14), (0, base + 16))]))
        D.d('seam', f'M{X(0)} {top - 16} L{X(0)} {base + 14}')
        D.d('stitch', arc_line(w - 4, base - 12, 24))
        D.light(f'M{X(-w * .7)} {top + 20} C{X(-w * .4)} {top} {X(0)} {top - 4} {X(w * .3)} {top}', 22, .2)
        D.dark(f'M{X(w * .8)} {top + 40} C{X(w * .92)} {top + 80} {X(w * .94)} {base - 40} {X(w * .9)} {base - 10}', 18, .16)
    return D


def newsboy(view):
    D = Drawing()
    w, top, base = 226, 168, 372
    if view == 'front':
        # fuller eight-panel crown that puffs out over the brim, button on top
        D.o(sym((0, top), [('C', (w * .6, top - 4), (w + 14, top + 40), (w + 12, base - 50)),
                           ('C', (w + 10, base - 18), (w * .64, base + 22), (0, base + 26))]))
        D.o(sym((0, base + 18), [('C', (w * .56, base + 18), (w - 30, base - 4), (w - 26, base - 10)),
                                  ('C', (w - 20, base + 4), (w * .5, base + 62), (0, base + 64))]))
        for k in (0.0, .34, .72):
            D.d('seam', *pair((0, top + 2), [('C', (w * k * .5, top + 4), (w * k * .95, top + 60), (w * k * 1.05, base - 20 - k * 10))]))
        D.d('button', circle(X(0), top + 4, 10))
        D.d('seam', f'M{X(-w + 10)} {base - 30} C{X(-w * .6)} {base + 16} {X(w * .6)} {base + 16} {X(w - 10)} {base - 30}')
        D.d('stitch', f'M{X(-w + 40)} {base + 4} C{X(-w * .5)} {base + 50} {X(w * .5)} {base + 50} {X(w - 40)} {base + 4}')
        D.light(f'M{X(-w * .7)} {top + 40} C{X(-w * .5)} {top + 14} {X(-w * .2)} {top + 6} {X(w * .1)} {top + 8}', 24, .22)
        D.dark(f'M{X(-w * .9)} {base - 20} C{X(-w * .4)} {base + 20} {X(w * .4)} {base + 20} {X(w * .9)} {base - 20}', 18, .2)
    else:
        D.o(sym((0, top - 10), [('C', (w * .6, top - 12), (w + 14, top + 34), (w + 12, base - 50)),
                                ('C', (w + 10, base - 14), (w * .64, base + 10), (0, base + 12))]))
        for k in (0.0, .4, .78):
            D.d('seam', *pair((0, top - 8), [('C', (w * k * .5, top - 6), (w * k * .95, top + 60), (w * k * 1.05, base - 10 - k * 10))]))
        D.d('button', circle(X(0), top - 6, 10))
        D.d('stitch', arc_line(w - 8, base - 16, 24))
        D.light(f'M{X(-w * .7)} {top + 40} C{X(-w * .5)} {top + 10} {X(-w * .2)} {top} {X(w * .1)} {top + 2}', 24, .2)
        D.dark(f'M{X(w * .8)} {top + 50} C{X(w * .94)} {top + 90} {X(w * .94)} {base - 50} {X(w * .86)} {base - 10}', 18, .16)
    return D


# ─────────────────────────────────────────────────────────────────
# knit hats
# ─────────────────────────────────────────────────────────────────
def ribs(D, w, y0, y1, sag0=0, sag1=0, step=13, top_w=None):
    top_w = top_w or w
    lines = []
    n = int(2 * w / step)
    for i in range(1, n):
        u = -1 + 2 * i / n
        xa, xb = u * top_w, u * w
        lines.append(f'M{f(X(xa))} {f(y0 + sag0 * (1 - u * u))} L{f(X(xb))} {f(y1 + sag1 * (1 - u * u))}')
    D.d('rib', *lines)


def beanie_body(view, w=180, top=126, base=440, cuff=70, sq=.56, slouch=0, flat=0):
    D = Drawing()
    D.o(sym((0, top), [('C', (w * .62 + flat, top - 2), (w + 4, top + (base - top) * (1 - sq)), (w, base)),
                       ('C', (w, base + 10), (w * .55, base + 18), (0, base + 18))]))
    if cuff:
        D.d('seam', arc_line(w + 1, base - cuff, 18))
        ribs(D, w, base - cuff + 4, base + 6, 16, 12)
    ribs(D, w * .92, top + 40, base - cuff - 6, -10, 16, step=17, top_w=w * .5)
    # crown decreases
    D.d('seamL', *pair((0, top + 2), [('C', (w * .2, top + 4), (w * .4, top + 24), (w * .5, top + 44))]))
    D.light(f'M{X(-w * .6)} {top + 90} C{X(-w * .5)} {top + 50} {X(-w * .3)} {top + 30} {X(-w * .05)} {top + 24}', 28, .2)
    D.dark(f'M{X(w * .8)} {top + 100} C{X(w * .94)} {top + 160} {X(w * .96)} {base - 60} {X(w * .92)} {base}', 24, .18)
    if cuff:
        D.dark(arc_line(w, base - cuff + 6, 18), 10, .16)
    return D


def beanie(view):
    return beanie_body(view)


def watch_cap(view):
    # shallower, close-fitting fisherman fit with a deep cuff that sits above the ears
    return beanie_body(view, w=182, top=170, base=420, cuff=82, sq=.5)


def pom_beanie(view):
    D = beanie_body(view, top=170, base=450, cuff=74)
    # pom sits on top of the crown
    pom = ('M300 64 C330 58 352 72 356 96 C368 104 368 128 352 140 C350 162 326 176 300 172 '
           'C274 176 250 162 248 140 C232 128 232 104 244 96 C248 72 270 58 300 64 Z')
    D.outline.insert(0, pom)
    for a, b in [((268, 86), (290, 110)), ((320, 80), (306, 108)), ((262, 136), (288, 122)), ((338, 132), (312, 124)), ((300, 150), (300, 128))]:
        D.d('seamL', f'M{pt(a)} L{pt(b)}')
    D.light('M262 96 C270 82 286 76 300 76', 14, .25)
    return D


def slouch_beanie(view):
    D = Drawing()
    w, base = 178, 452
    # extra length gathers and drops towards the back: from the front it reads taller
    # with a soft fold leaning to one side
    s = 1 if view == 'front' else -1
    shape = path((0, base + 18), [('C', (-w * .55, base + 18), (-w, base + 10), (-w, base)),
                                  ('C', (-w - 6, 330), (-w - 4, 180), (-w * .58, 110)),
                                  ('C', (-w * .2, 60), (w * .44, 62), (w * .74, 100)),
                                  ('C', (w * .98, 134), (w + 8, 260), (w, base)),
                                  ('C', (w, base + 10), (w * .55, base + 18), (0, base + 18))], close=True, ox=AX, sx=s)
    D.o(shape)
    D.d('seam', arc_line(w, base - 40, 18))
    ribs(D, w, base - 36, base + 6, 16, 12)
    D.d('seamL', path((-w * .6, 150), [('C', (-w * .2, 110), (w * .3, 110), (w * .7, 150))], ox=AX, sx=s))       # fold
    D.dark(path((-w * .6, 168), [('C', (-w * .2, 130), (w * .3, 130), (w * .72, 170))], ox=AX, sx=s), 18, .18)
    D.light(path((-w * .6, 300), [('C', (-w * .64, 240), (-w * .5, 190), (-w * .3, 170))], ox=AX, sx=s), 26, .2)
    D.dark(path((w * .82, 220), [('C', (w * .94, 300), (w * .96, 380), (w * .92, base))], ox=AX, sx=s), 22, .16)
    ribs(D, w * .9, 200, base - 46, -10, 16, step=18, top_w=w * .7)
    return D


def balaclava(view):
    D = Drawing()
    w, top, base = 176, 90, 470
    neck = 150
    D.o(sym((0, top), [('C', (w * .62, top - 2), (w + 2, top + 70), (w, 300)),
                       ('C', (w - 2, 360), (w - 30, 400), (w - 34, 430)),
                       ('C', (w - 30, 470), (neck + 30, 520), (neck + 40, 536)),
                       ('C', (neck, 548), (60, 552), (0, 552))]))
    if view == 'front':
        D.d('inner', 'M300 178 C350 176 382 200 384 250 C386 310 360 368 300 376 C240 368 214 310 216 250 C218 200 250 176 300 178 Z')
        D.d('edge', 'M300 166 C358 164 396 194 398 250 C400 318 368 382 300 390 C232 382 200 318 202 250 C204 194 242 164 300 166 Z')
        ribs(D, w - 40, 470, 540, 10, 12, step=16)
    else:
        D.d('seam', f'M300 {top + 4} L300 520')
        ribs(D, w - 40, 470, 540, 10, 12, step=16)
        D.light(f'M{X(-w * .6)} {top + 90} C{X(-w * .5)} {top + 50} {X(-w * .3)} {top + 30} {X(-w * .05)} {top + 24}', 28, .2)
    D.d('seamL', arc_line(w - 44, 462, 14))
    D.light(f'M{X(-w * .78)} 180 C{X(-w * .86)} 240 {X(-w * .86)} 300 {X(-w * .8)} 350', 24, .2)
    D.dark(f'M{X(w * .82)} 180 C{X(w * .92)} 250 {X(w * .92)} 320 {X(w * .82)} 400', 24, .18)
    return D


def earflap(view):
    D = Drawing()
    w, top, base = 182, 126, 400
    D.o(sym((0, top), [('C', (w * .62, top - 2), (w + 4, top + 110), (w, base - 10)),
                       ('C', (w, base + 40), (w - 10, 470), (w - 40, 486)),        # ear flap
                       ('C', (w - 64, 496), (w - 96, 470), (w - 106, base + 24)),
                       ('C', (w - 120, base + 16), (60, base + 18), (0, base + 18))]))
    D.d('seam', *pair((w - 2, base - 30), [('C', (w * .6, base - 2), (w * .3, base + 4), (0, base + 6))]))
    D.d('stitch', *pair((w - 10, base - 18), [('C', (w - 6, base + 40), (w - 20, 466), (w - 42, 474)),
                                               ('C', (w - 64, 482), (w - 86, 462), (w - 94, base + 22))]))
    ribs(D, w * .9, top + 40, base - 30, -10, 10, step=17, top_w=w * .5)
    D.d('seamL', *pair((0, top + 2), [('C', (w * .2, top + 4), (w * .4, top + 24), (w * .5, top + 44))]))
    for s in (1, -1):
        x = X(s * (w - 42))
        D.x(f'<path d="M{f(x)} 484 C{f(x + s * 4)} 520 {f(x - s * 4)} 550 {f(x + s * 2)} 572" fill="none" stroke="#6f6b63" stroke-width="7" stroke-linecap="round"/>')
        D.x(f'<path d="M{f(x)} 484 C{f(x + s * 4)} 520 {f(x - s * 4)} 550 {f(x + s * 2)} 572" fill="none" stroke="#e9e6de" stroke-width="5" stroke-linecap="round"/>')
    D.light(f'M{X(-w * .6)} {top + 90} C{X(-w * .5)} {top + 50} {X(-w * .3)} {top + 30} {X(-w * .05)} {top + 24}', 28, .2)
    D.dark(f'M{X(w * .8)} {top + 100} C{X(w * .94)} {top + 160} {X(w * .96)} {base - 60} {X(w * .92)} {base}', 24, .18)
    return D


def headband(view):
    D = Drawing()
    w = 186
    # knit ear-warmer band seen on the head: a curved band, wider at the sides
    if view == 'front':
        D.o(f'M{X(-w)} 236 C{X(-w * .5)} 214 {X(w * .5)} 214 {X(w)} 236 C{X(w + 8)} 290 {X(w + 8)} 350 {X(w + 4)} 410 '
            f'C{X(w * .5)} 372 {X(-w * .5)} 372 {X(-w - 4)} 410 C{X(-w - 8)} 350 {X(-w - 8)} 290 {X(-w)} 236 Z')
        D.d('seamL', f'M{X(-18)} 224 C{X(-34)} 270 {X(-34)} 330 {X(-18)} 380 M{X(18)} 224 C{X(34)} 270 {X(34)} 330 {X(18)} 380')   # front twist
        D.d('seam', f'M{X(0)} 222 C{X(-14)} 270 {X(14)} 330 {X(0)} 380')
        ribs(D, w - 6, 240, 404, -22, -36, step=18)
    else:
        D.o(f'M{X(-w)} 236 C{X(-w * .5)} 256 {X(w * .5)} 256 {X(w)} 236 C{X(w + 8)} 290 {X(w + 8)} 350 {X(w + 4)} 400 '
            f'C{X(w * .5)} 380 {X(-w * .5)} 380 {X(-w - 4)} 400 C{X(-w - 8)} 350 {X(-w - 8)} 290 {X(-w)} 236 Z')
        D.d('seam', f'M{X(0)} 252 L{X(0)} 380')
        ribs(D, w - 6, 242, 398, 18, -18, step=18)
    D.light(f'M{X(-w * .9)} 280 C{X(-w * .6)} 266 {X(-w * .3)} 262 {X(-w * .05)} 262', 18, .22)
    D.dark(f'M{X(w * .5)} 350 C{X(w * .7)} 356 {X(w * .9)} 364 {X(w)} 370', 14, .16)
    return D


# ─────────────────────────────────────────────────────────────────
# brimmed hats
# ─────────────────────────────────────────────────────────────────
def brimmed(view, rx, yc, ry, crown, curl=0, droop=0, back=0, band=28, band_acc=True, cw=150):
    """crown: (wb, wt, top, shape). Brim first, crown on top. Returns D, base_y."""
    D = Drawing()
    if view == 'back':
        droop, back = -droop * .6 + 0, back
    D.o(brim_ellipse(rx, yc, ry, curl, droop, back))
    wb, wt, top, shape = crown
    base = yc + 4
    if shape == 'dent':          # fedora / trilby / panama: centre dent, pinched front
        if view == 'front':
            c = sym((0, top + 22), [('C', (wt * .3, top + 4), (wt * .7, top - 6), (wt, top + 8)),
                                    ('C', (wt + 14, top + 20), (wb, base - 120), (wb, base)),
                                    ('C', (wb, base + 10), (wb * .55, base + 16), (0, base + 16))])
        else:
            c = sym((0, top + 12), [('C', (wt * .4, top + 2), (wt * .8, top), (wt + 2, top + 12)),
                                    ('C', (wt + 14, top + 24), (wb, base - 120), (wb, base)),
                                    ('C', (wb, base + 8), (wb * .55, base + 12), (0, base + 12))])
    elif shape == 'flat':        # boater / porkpie: flat top
        c = sym((0, top), [('L', (wt - 8, top)), ('Q', (wt, top), (wt + 1, top + 8)),
                           ('L', (wb, base)), ('C', (wb, base + 10), (wb * .55, base + 16), (0, base + 16))])
    elif shape == 'round':       # bucket / sun hat / boonie
        c = sym((0, top), [('C', (wt * .7, top), (wt, top + 4), (wt + 6, top + 22)),
                           ('C', (wt + 14, top + 60), (wb, base - 40), (wb, base)),
                           ('C', (wb, base + 10), (wb * .55, base + 16), (0, base + 16))])
    elif shape == 'cattleman':   # cowboy: tall with a centre crease and side dents
        c = sym((0, top + 26), [('C', (wt * .3, top + 18), (wt * .5, top - 4), (wt * .8, top)),
                                ('C', (wt + 10, top + 4), (wt + 14, top + 30), (wt + 12, top + 60)),
                                ('C', (wb + 2, base - 80), (wb, base - 30), (wb, base)),
                                ('C', (wb, base + 10), (wb * .55, base + 16), (0, base + 16))])
    D.o(c)
    if band:
        bt = base - band
        # band follows the crown side (near-vertical at the base)
        D.a(f'M{X(-wb - 1)} {bt} C{X(-wb * .55)} {bt + 16} {X(wb * .55)} {bt + 16} {X(wb + 1)} {bt} '
            f'L{X(wb + 1)} {base} C{X(wb)} {base + 10} {X(wb * .55)} {base + 16} {X(0)} {base + 16} '
            f'C{X(-wb * .55)} {base + 16} {X(-wb)} {base + 10} {X(-wb - 1)} {base} Z')
        D.d('seamL', f'M{X(-wb)} {bt} C{X(-wb * .55)} {bt + 16} {X(wb * .55)} {bt + 16} {X(wb)} {bt}')
    D.d('seamL', f'M{X(-wb)} {base} C{X(-wb)} {base + 10} {X(-wb * .55)} {base + 16} {X(0)} {base + 16} '
                 f'C{X(wb * .55)} {base + 16} {X(wb)} {base + 10} {X(wb)} {base}')
    return D, base


def brim_shading(D, rx, yc, ry, wb, top, base, droop=0):
    D.light(f'M{X(-wb * .7)} {top + 50} C{X(-wb * .74)} {top + 90} {X(-wb * .76)} {base - 60} {X(-wb * .74)} {base - 30}', 26, .22)
    D.dark(f'M{X(wb * .72)} {top + 40} C{X(wb * .84)} {top + 90} {X(wb * .88)} {base - 60} {X(wb * .86)} {base - 20}', 22, .18)
    D.dark(f'M{X(-wb)} {base + 18} C{X(-wb * .5)} {base + 36} {X(wb * .5)} {base + 36} {X(wb)} {base + 18}', 16, .22)
    D.light(f'M{X(-rx * .86)} {yc + 4} C{X(-rx * .7)} {yc + ry * .8 + droop * .5} {X(-rx * .3)} {yc + ry + droop * .8} {X(0)} {yc + ry + droop - 4}', 12, .2)


def brim_stitch(D, rx, yc, ry, curl=0, droop=0, back=0, n=2, gap=10):
    for k in range(1, n + 1):
        i = gap * k
        D.d('stitch', f'M{X(-rx + i)} {yc - curl} C{X(-rx + i)} {yc + ry * .5 - curl * .4 - i * .3} {X(-(rx - i) * .6)} {yc + ry + droop - i} {X(0)} {yc + ry + droop - i} '
                      f'C{X((rx - i) * .6)} {yc + ry + droop - i} {X(rx - i)} {yc + ry * .5 - curl * .4 - i * .3} {X(rx - i)} {yc - curl}')


def fedora(view):
    rx, yc, ry, curl, droop = 232, 392, 46, 14, 16
    wb, wt, top = 150, 132, 160
    D, base = brimmed(view, rx, yc, ry, (wb, wt, top, 'dent'), curl, droop if view == 'front' else -10, 0 if view == 'front' else 10)
    if view == 'front':
        D.d('seam', *pair((wt * .28, top + 10), [('C', (wt * .34, top + 50), (wt * .42, top + 80), (wt * .5, top + 110))]))   # front pinch
        D.d('seamL', f'M{X(0)} {top + 22} L{X(0)} {top + 60}')
        D.dark(f'M{X(-wt * .2)} {top + 30} C{X(-wt * .3)} {top + 60} {X(-wt * .36)} {top + 80} {X(-wt * .42)} {top + 110}', 14, .18)
    else:
        D.d('hw', f'M{X(-wb + 8)} {base - 22} l20 -4 l2 20 l-20 2 z')                 # bow at the side
        D.d('seamL', f'M{X(0)} {top + 12} C{X(-4)} {top + 30} {X(4)} {top + 44} {X(0)} {top + 60}')
    brim_stitch(D, rx, yc, ry, curl, droop if view == 'front' else -10, n=1, gap=12)
    brim_shading(D, rx, yc, ry, wb, top, base, droop)
    return D


def trilby(view):
    # short, angled-down brim and a taller, tapered crown
    rx, yc, ry, curl, droop = 196, 396, 34, -4, 26
    wb, wt, top = 148, 112, 140
    D, base = brimmed(view, rx, yc, ry, (wb, wt, top, 'dent'), curl, droop if view == 'front' else -4, 0 if view == 'front' else 22, band=24)
    if view == 'front':
        D.d('seam', *pair((wt * .26, top + 10), [('C', (wt * .32, top + 50), (wt * .4, top + 90), (wt * .5, top + 130))]))
        D.dark(f'M{X(-wt * .2)} {top + 30} C{X(-wt * .3)} {top + 70} {X(-wt * .36)} {top + 100} {X(-wt * .42)} {top + 130}', 14, .18)
    else:
        D.d('seamL', f'M{X(0)} {top + 12} L{X(0)} {top + 60}')
    brim_stitch(D, rx, yc, ry, curl, droop if view == 'front' else -4, n=1, gap=8)
    brim_shading(D, rx, yc, ry, wb, top, base, droop)
    return D


def panama(view):
    rx, yc, ry, curl, droop = 246, 390, 50, 8, 10
    wb, wt, top = 150, 136, 164
    D, base = brimmed(view, rx, yc, ry, (wb, wt, top, 'dent'), curl, droop if view == 'front' else -6, 0 if view == 'front' else 8, band=34)
    if view == 'front':
        D.d('seam', *pair((wt * .3, top + 10), [('C', (wt * .36, top + 46), (wt * .44, top + 76), (wt * .52, top + 100))]))
    D.d('seamL', *[arc_line(rx - k, yc - 2 + k * .5, ry * .9 - k * .4) for k in (30, 60)])     # straw weave rings
    D.d('rib', *[arc_line(wb - 2, top + 50 + k * 26, 14) for k in range(4)])
    brim_shading(D, rx, yc, ry, wb, top, base, droop)
    return D


def porkpie(view):
    rx, yc, ry, curl = 206, 396, 38, 10
    wb, wt, top = 150, 146, 230
    D, base = brimmed(view, rx, yc, ry, (wb, wt, top, 'flat'), curl, 0, 10, band=30)
    # telescope crown: a groove inset round the flat top
    D.d('seam', f'M{X(-wt + 14)} {top + 10} C{X(-wt * .5)} {top + 20} {X(wt * .5)} {top + 20} {X(wt - 14)} {top + 10}')
    D.d('seamL', f'M{X(-wt + 4)} {top + 4} L{X(wt - 4)} {top + 4}')
    brim_stitch(D, rx, yc, ry, curl, 0, n=1, gap=10)
    brim_shading(D, rx, yc, ry, wb, top, base)
    return D


def cowboy(view):
    D = Drawing()
    rx, yc = 250, 360
    # wide brim curling up hard at the sides, dipping at front and back
    D.o(sym((0, yc - 30), [('C', (rx * .5, yc - 34), (rx * .8, yc - 40), (rx - 10, yc - 92)),
                           ('C', (rx - 4, yc - 104), (rx + 4, yc - 104), (rx + 4, yc - 90)),
                           ('C', (rx + 2, yc - 30), (rx * .8, yc + 40), (0, yc + 50))]))
    wb, wt, top = 146, 126, 120
    base = yc + 4
    D.o(sym((0, top + 34), [('C', (wt * .3, top + 24), (wt * .46, top - 2), (wt * .78, top)),
                            ('C', (wt + 10, top + 2), (wt + 16, top + 30), (wt + 12, top + 64)),
                            ('C', (wb + 2, base - 90), (wb, base - 40), (wb, base)),
                            ('C', (wb, base + 10), (wb * .55, base + 16), (0, base + 16))]))
    bt = base - 22
    D.a(f'M{X(-wb - 1)} {bt} C{X(-wb * .55)} {bt + 16} {X(wb * .55)} {bt + 16} {X(wb + 1)} {bt} '
        f'L{X(wb + 1)} {base} C{X(wb)} {base + 10} {X(wb * .55)} {base + 16} {X(0)} {base + 16} '
        f'C{X(-wb * .55)} {base + 16} {X(-wb)} {base + 10} {X(-wb - 1)} {base} Z')
    D.d('seamL', f'M{X(-wb)} {bt} C{X(-wb * .55)} {bt + 16} {X(wb * .55)} {bt + 16} {X(wb)} {bt}')
    D.d('seam', f'M{X(0)} {top + 34} L{X(0)} {top + 80}')                                         # centre crease
    D.d('seam', *pair((wt * .5, top + 20), [('C', (wt * .62, top + 60), (wt * .72, top + 90), (wt * .82, top + 120))]))   # side dents
    D.d('edge', f'M{X(-rx + 6)} {yc - 96} C{X(-rx + 4)} {yc - 30} {X(-rx * .8)} {yc + 36} {X(0)} {yc + 46} '
                f'C{X(rx * .8)} {yc + 36} {X(rx - 4)} {yc - 30} {X(rx - 6)} {yc - 96}')                  # bound brim edge
    if view == 'back':
        D.d('hw', circle(X(-wb + 20), bt + 10, 6))
    D.dark(f'M{X(-rx + 30)} {yc - 70} C{X(-rx * .8)} {yc - 10} {X(-wb - 10)} {yc + 10} {X(-wb + 10)} {yc + 20}', 18, .2)
    D.dark(f'M{X(rx - 30)} {yc - 70} C{X(rx * .8)} {yc - 10} {X(wb + 10)} {yc + 10} {X(wb - 10)} {yc + 20}', 18, .22)
    D.light(f'M{X(-wt * .6)} {top + 50} C{X(-wt * .7)} {top + 100} {X(-wt * .76)} {base - 60} {X(-wt * .74)} {base - 30}', 26, .22)
    D.dark(f'M{X(wt * .7)} {top + 40} C{X(wt * .84)} {top + 90} {X(wt * .88)} {base - 60} {X(wt * .86)} {base - 20}', 22, .18)
    return D


def boater(view):
    rx, yc, ry = 222, 392, 40
    wb, wt, top = 150, 150, 260
    D, base = brimmed(view, rx, yc, ry, (wb, wt, top, 'flat'), 0, 0, 0, band=46)
    D.d('seamL', f'M{X(-wt + 2)} {top + 2} L{X(wt - 2)} {top + 2}')
    D.d('seamL', *[arc_line(rx - k, yc - 2 + k * .4, ry * .9 - k * .3) for k in (24, 48)])
    if view == 'back':
        D.d('seamL', f'M{X(-wb + 30)} {base - 46} L{X(-wb + 30)} {base + 12}')                       # ribbon join
    D.light(f'M{X(-wt + 20)} {top + 6} L{X(wt - 60)} {top + 6}', 10, .3)
    brim_shading(D, rx, yc, ry, wb, top, base)
    return D


def sun_hat(view):
    rx, yc, ry, droop = 254, 380, 66, 30
    wb, wt, top = 132, 110, 196
    D, base = brimmed(view, rx, yc, ry, (wb, wt, top, 'round'), -16, droop, 0, band=26)
    # floppy brim: a soft wave in the edge
    D.d('seamL', f'M{X(-rx + 30)} {yc + 22} C{X(-rx * .6)} {yc + ry + 10} {X(-rx * .2)} {yc + ry + droop - 10} {X(0)} {yc + ry + droop - 16} '
                 f'C{X(rx * .2)} {yc + ry + droop - 10} {X(rx * .6)} {yc + ry + 10} {X(rx - 30)} {yc + 22}')
    D.dark(f'M{X(-rx * .5)} {yc + 40} C{X(-rx * .44)} {yc + 60} {X(-rx * .4)} {yc + 76} {X(-rx * .38)} {yc + 86}', 14, .16)
    D.dark(f'M{X(rx * .5)} {yc + 40} C{X(rx * .44)} {yc + 60} {X(rx * .4)} {yc + 76} {X(rx * .38)} {yc + 86}', 14, .18)
    brim_shading(D, rx, yc, ry, wb, top, base, droop)
    return D


def bucket(view):
    D = Drawing()
    wb, wt, top, base = 156, 128, 170, 352
    # brim slopes down all round: a trapezoid skirt
    D.o(sym((0, base - 4), [('L', (wb + 4, base - 4)), ('C', (wb + 30, base + 30), (wb + 56, base + 60), (wb + 64, base + 82)),
                            ('C', (wb + 40, base + 104), (wb * .6, base + 118), (0, base + 120))]))
    D.o(sym((0, top), [('C', (wt * .7, top), (wt, top + 2), (wt + 6, top + 18)),
                       ('C', (wt + 16, top + 60), (wb, base - 60), (wb, base)),
                       ('C', (wb, base + 8), (wb * .55, base + 14), (0, base + 14))]))
    D.d('seam', f'M{X(-wb)} {base} C{X(-wb)} {base + 8} {X(-wb * .55)} {base + 14} {X(0)} {base + 14} '
                f'C{X(wb * .55)} {base + 14} {X(wb)} {base + 8} {X(wb)} {base}')
    D.d('seam', f'M{X(-wt - 4)} {top + 14} C{X(-wt * .5)} {top + 24} {X(wt * .5)} {top + 24} {X(wt + 4)} {top + 14}')
    for k in (1, 2, 3, 4):
        y = base + 14 + k * 20
        e = wb + 10 + k * 12
        D.d('stitch', f'M{X(-e)} {y - 10} C{X(-e * .6)} {y + 8} {X(e * .6)} {y + 8} {X(e)} {y - 10}')
    if view == 'front':
        D.d('hole', circle(X(-wt * .7), top + 70, 4), circle(X(wt * .7), top + 70, 4))
    else:
        D.d('seamL', f'M{X(0)} {top + 20} L{X(0)} {base + 10}')
    D.light(f'M{X(-wb * .7)} {top + 50} C{X(-wb * .74)} {top + 90} {X(-wb * .76)} {base - 60} {X(-wb * .74)} {base - 30}', 26, .22)
    D.dark(f'M{X(wb * .72)} {top + 40} C{X(wb * .84)} {top + 90} {X(wb * .88)} {base - 60} {X(wb * .86)} {base - 20}', 22, .18)
    D.dark(f'M{X(-wb - 10)} {base + 26} C{X(-wb * .5)} {base + 44} {X(wb * .5)} {base + 44} {X(wb + 10)} {base + 26}', 16, .2)
    return D


def boonie(view):
    rx, yc, ry, droop = 240, 384, 50, 26
    wb, wt, top = 150, 132, 186
    D, base = brimmed(view, rx, yc, ry, (wb, wt, top, 'round'), -24, droop, 0, band=34)
    # webbing loops on the band, side vent eyelets, chin cord
    for x in (-110, -40, 40, 110):
        D.d('panel', rect(X(x - 7), base - 36, 14, 34, 2))
    D.d('hole', circle(X(-wb * .7), top + 70, 4), circle(X(wb * .7), top + 70, 4))
    D.d('stitch', f'M{X(-wt - 4)} {top + 20} C{X(-wt * .5)} {top + 30} {X(wt * .5)} {top + 30} {X(wt + 4)} {top + 20}')
    brim_stitch(D, rx, yc, ry, -24, droop, n=3, gap=12)
    for s in (1, -1):
        D.x(f'<path d="M{f(X(s * (wb - 6)))} {base + 6} C{f(X(s * 120))} 480 {f(X(s * 60))} 520 {f(X(0))} 528" fill="none" stroke="#6f6b63" stroke-width="3" stroke-linecap="round"/>')
    D.x(f'<path d="M{X(-8)} 520 L{X(8)} 520 L{X(6)} 540 L{X(-6)} 540 Z" fill="#8a8680"/>')
    brim_shading(D, rx, yc, ry, wb, top, base, droop)
    return D


def cloche(view):
    D = Drawing()
    w, top, base = 172, 120, 400
    # bell-shaped, deep crown with a short brim that flares down
    D.o(sym((0, top), [('C', (w * .66, top - 2), (w, top + 70), (w + 2, base - 60)),
                       ('C', (w + 4, base - 30), (w + 26, base + 10), (w + 40, base + 44)),
                       ('C', (w + 20, base + 60), (w * .6, base + 76), (0, base + 78))]))
    D.a(f'M{X(-w - 2)} {base - 70} C{X(-w * .55)} {base - 50} {X(w * .55)} {base - 50} {X(w + 2)} {base - 70} '
        f'L{X(w + 3)} {base - 40} C{X(w * .55)} {base - 18} {X(-w * .55)} {base - 18} {X(-w - 3)} {base - 40} Z')
    D.d('seamL', arc_line(w + 2, base - 70, 20), arc_line(w + 3, base - 40, 22))
    D.d('seam', arc_line(w + 4, base - 22, 30))
    brim_shading(D, w + 30, base + 30, 40, w, top, base - 40)
    if view == 'front':
        D.d('hw', f'M{X(w * .52)} {base - 64} l14 -6 l6 16 l-14 6 z')
    else:
        D.d('seamL', f'M{X(0)} {top + 10} L{X(0)} {base - 70}')
    return D


# ─────────────────────────────────────────────────────────────────
# specialty
# ─────────────────────────────────────────────────────────────────
def beret(view):
    D = Drawing()
    s = 1 if view == 'front' else -1
    # a flat round disc worn tilted: wide, soft overhang to one side
    shape = path((-188, 330), [('C', (-232, 300), (-220, 222), (-120, 196)),
                               ('C', (-20, 170), (160, 176), (228, 224)),
                               ('C', (268, 254), (262, 300), (230, 316)),
                               ('C', (206, 330), (186, 344), (170, 360)),
                               ('C', (100, 384), (-100, 384), (-170, 360)),
                               ('C', (-184, 352), (-188, 342), (-188, 330))], close=True, ox=AX, sx=s)
    D.o(shape)
    D.o(path((-8, 192), [('C', (-8, 172), (-2, 164), (6, 162)), ('L', (10, 166)), ('C', (6, 172), (8, 182), (8, 192))], close=True, ox=AX, sx=s))  # stalk
    D.d('edge', path((-170, 352), [('C', (-100, 374), (100, 374), (170, 352))], ox=AX, sx=s))                # leather band edge
    D.d('stitch', path((-174, 340), [('C', (-100, 362), (100, 362), (174, 340))], ox=AX, sx=s))
    D.dark(path((150, 300), [('C', (190, 290), (226, 270), (236, 250))], ox=AX, sx=s), 22, .2)
    D.dark(path((-170, 330), [('C', (-90, 350), (90, 350), (170, 330))], ox=AX, sx=s), 16, .2)
    D.light(path((-150, 250), [('C', (-100, 214), (-20, 200), (60, 204))], ox=AX, sx=s), 30, .22)
    return D


def bandana(view):
    D = Drawing()
    w = 186
    if view == 'front':
        # tied headscarf: cloth over the crown, folded edge across the forehead
        D.o(sym((0, 150), [('C', (w * .62, 148), (w + 4, 220), (w, 320)),
                           ('C', (w - 2, 350), (w - 10, 368), (w - 22, 372)),
                           ('C', (w * .6, 352), (w * .3, 346), (0, 346))]))
        D.d('edge', f'M{X(-w + 20)} 368 C{X(-w * .6)} 346 {X(-w * .3)} 338 {X(0)} 338 C{X(w * .3)} 338 {X(w * .6)} 346 {X(w - 20)} 368')
        D.d('seamL', f'M{X(-w + 10)} 344 C{X(-w * .6)} 322 {X(-w * .3)} 316 {X(0)} 316 C{X(w * .3)} 316 {X(w * .6)} 322 {X(w - 10)} 344')
        D.d('stitch', f'M{X(-w + 24)} 360 C{X(-w * .6)} 338 {X(-w * .3)} 330 {X(0)} 330 C{X(w * .3)} 330 {X(w * .6)} 338 {X(w - 24)} 360')
        D.dark(f'M{X(-w * .5)} 200 C{X(-w * .3)} 240 {X(-w * .2)} 270 {X(-w * .1)} 300', 14, .14)
        D.dark(f'M{X(w * .5)} 200 C{X(w * .3)} 240 {X(w * .2)} 270 {X(w * .1)} 300', 14, .14)
    else:
        # the knot at the nape and the triangle point / tails hanging below
        D.o(sym((0, 150), [('C', (w * .62, 148), (w + 4, 220), (w, 320)),
                           ('C', (w - 2, 340), (w - 16, 364), (w - 50, 374)),
                           ('C', (90, 382), (40, 390), (0, 470))]))
        D.o('M300 370 C330 368 342 380 338 398 C334 414 316 420 300 418 C284 420 266 414 262 398 C258 380 270 368 300 370 Z')   # knot
        D.o('M282 410 C270 440 250 470 236 500 L262 506 C276 476 290 446 300 420 Z')                                      # tails
        D.o('M318 410 C334 440 356 466 372 494 L348 504 C332 476 312 446 300 420 Z')
        D.d('seamL', 'M300 160 L300 368', 'M262 398 C280 392 320 392 338 398')
        D.d('seam', f'M{X(-w + 50)} 374 C{X(-90)} 382 {X(-40)} 390 {X(0)} 470 C{X(40)} 390 {X(90)} 382 {X(w - 50)} 374')
        D.dark('M290 380 C296 392 304 404 300 416', 10, .2)
    D.light(f'M{X(-w * .6)} 230 C{X(-w * .5)} 190 {X(-w * .3)} 166 {X(-w * .05)} 160', 28, .22)
    D.dark(f'M{X(w * .8)} 220 C{X(w * .94)} 260 {X(w * .96)} 300 {X(w * .9)} 340', 22, .18)
    return D


def trapper(view):
    D = Drawing()
    w, top, base = 190, 130, 370
    if view == 'front':
        D.o(sym((0, top), [('C', (w * .62, top - 2), (w + 4, top + 90), (w + 2, base - 50)),
                           ('L', (w + 20, base - 40)),                              # ear flap
                           ('C', (w + 30, base + 30), (w + 20, base + 110), (w - 20, base + 140)),
                           ('C', (w - 50, base + 150), (w - 76, base + 120), (w - 80, base + 40)),
                           ('C', (w - 90, base + 20), (w * .4, base + 36), (0, base + 40))]))
        # fur: turned-up front flap and lining edge of the ear flaps
        D.a(f'M{X(-w + 4)} {base - 96} C{X(-w * .5)} {base - 116} {X(w * .5)} {base - 116} {X(w - 4)} {base - 96} '
            f'L{X(w - 2)} {base - 30} C{X(w * .5)} {base + 40} {X(-w * .5)} {base + 40} {X(-w + 2)} {base - 30} Z')
        for s in (1, -1):
            D.a(path((w - 76, base + 40), [('C', (w - 72, base + 110), (w - 48, base + 140), (w - 20, base + 136)),
                                           ('C', (w - 40, base + 120), (w - 56, base + 90), (w - 60, base + 30)), ], close=True, ox=AX, sx=s))
        D.d('seamL', f'M{X(-w + 4)} {base - 96} C{X(-w * .5)} {base - 116} {X(w * .5)} {base - 116} {X(w - 4)} {base - 96}')
        D.d('seam', *pair((0, top + 2), [('C', (w * .3, top + 4), (w * .6, top + 40), (w * .66, base - 104))]))
    else:
        D.o(sym((0, top), [('C', (w * .62, top - 2), (w + 4, top + 90), (w + 2, base - 50)),
                           ('L', (w + 20, base - 40)),
                           ('C', (w + 30, base + 30), (w + 20, base + 110), (w - 20, base + 140)),
                           ('C', (w - 50, base + 150), (w - 76, base + 120), (w - 80, base + 70)),
                           ('C', (w - 80, base + 120), (w * .4, base + 130), (0, base + 130))]))   # neck flap
        D.d('seam', *pair((w - 80, base + 70), [('C', (w - 76, base + 40), (w * .4, base + 30), (0, base + 30))]))
        D.d('seam', f'M{X(0)} {top + 2} L{X(0)} {base + 28}')
        D.d('stitch', f'M{X(-w + 90)} {base + 110} C{X(-w * .4)} {base + 118} {X(w * .4)} {base + 118} {X(w - 90)} {base + 110}')
    D.d('stitch', *pair((w + 14, base - 30), [('C', (w + 22, base + 30), (w + 12, base + 104), (w - 20, base + 126))]))
    D.light(f'M{X(-w * .6)} {top + 70} C{X(-w * .5)} {top + 40} {X(-w * .3)} {top + 24} {X(-w * .05)} {top + 20}', 28, .2)
    D.dark(f'M{X(w * .8)} {top + 80} C{X(w * .94)} {top + 140} {X(w * .96)} {base - 80} {X(w * .92)} {base - 50}', 24, .18)
    return D


def durag(view):
    D = Drawing()
    w, top = 178, 120
    if view == 'front':
        D.o(sym((0, top), [('C', (w * .62, top - 2), (w + 4, top + 90), (w, 300)),
                           ('C', (w - 2, 340), (w - 10, 372), (w - 16, 392)),
                           ('C', (w * .5, 360), (w * .2, 352), (0, 352))]))
        D.d('seam', f'M{X(0)} {top + 2} L{X(0)} 348')                                                # centre seam
        D.d('edge', f'M{X(-w + 16)} 390 C{X(-w * .5)} 360 {X(-w * .2)} 352 {X(0)} 352 C{X(w * .2)} 352 {X(w * .5)} 360 {X(w - 16)} 390')
        D.d('stitch', f'M{X(-w + 18)} 374 C{X(-w * .5)} 344 {X(-w * .2)} 336 {X(0)} 336 C{X(w * .2)} 336 {X(w * .5)} 344 {X(w - 18)} 374')
    else:
        D.o(sym((0, top), [('C', (w * .62, top - 2), (w + 4, top + 90), (w, 300)),
                           ('C', (w - 2, 340), (w - 20, 370), (w - 40, 380)),
                           ('C', (80, 396), (40, 400), (0, 400))]))
        # long tails from the nape
        D.o('M270 384 C262 440 250 500 240 560 L280 562 C286 500 294 440 300 396 Z')
        D.o('M330 384 C338 440 350 500 360 560 L320 562 C314 500 306 440 300 396 Z')
        D.d('seam', f'M{X(0)} {top + 2} L{X(0)} 396')
        D.d('seamL', 'M300 396 L300 470', 'M262 400 C280 392 320 392 338 400')
        D.d('stitch', 'M246 552 L276 554 M324 554 L354 552')
        D.dark('M290 420 C284 470 278 520 272 556', 10, .16)
    D.light(f'M{X(-w * .6)} {top + 90} C{X(-w * .5)} {top + 50} {X(-w * .3)} {top + 30} {X(-w * .05)} {top + 24}', 28, .24)
    D.light(f'M{X(w * .3)} {top + 40} C{X(w * .5)} {top + 70} {X(w * .6)} {top + 110} {X(w * .64)} {top + 150}', 14, .14)
    D.dark(f'M{X(w * .8)} {top + 100} C{X(w * .94)} {top + 160} {X(w * .96)} 300 {X(w * .9)} 360', 24, .18)
    return D


HATS = {
    'baseball': baseball, 'dad': dad, 'snapback': snapback, 'trucker': trucker, 'fitted': fitted,
    'fivePanel': five_panel, 'military': military, 'flatCap': flat_cap, 'newsboy': newsboy, 'visor': visor,
    'beanie': beanie, 'watchCap': watch_cap, 'pomBeanie': pom_beanie, 'slouchBeanie': slouch_beanie,
    'balaclava': balaclava, 'earflap': earflap, 'headband': headband, 'bucket': bucket, 'boonie': boonie,
    'fedora': fedora, 'trilby': trilby, 'panama': panama, 'porkpie': porkpie, 'cowboy': cowboy, 'boater': boater,
    'sunHat': sun_hat, 'cloche': cloche, 'beret': beret, 'bandana': bandana, 'trapper': trapper,
    'sunVisor': sun_visor, 'durag': durag,
}

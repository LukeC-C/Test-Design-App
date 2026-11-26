"""Shoes: outer side profile, toe pointing right, ground at y=380, ~480 long."""
from lib import Drawing, path, circle, rect, bez, lerp, f, pt, band, centre

G = 380
XB, XT = 62, 546      # back of heel, toe tip


# ─────────────────────────────────────────────────────────────────
# helpers
# ─────────────────────────────────────────────────────────────────
def P(start, segs, close=False):
    return path(start, segs, close=close)


def sole_lower(F, t, spring, lugs=0, xb=XB, xt=XT, heel=0, heel_x=None):
    """Lower contour of a flat sole from the front top point F round the toe,
    along the ground and up the back to (xb+2, G-t). Returns segment list."""
    St = G - t
    segs = [('C', (xt + 4, F[1] + 3), (xt + 6, F[1] + t * .75), (xt - 8, G - spring * .55)),
            ('C', (xt - 34, G - 1), (xt - 72, G), (xt - 116, G))]
    gx0 = xb + 22
    if lugs:
        n = lugs
        x0, x1 = xt - 116, gx0
        step = (x0 - x1) / n
        for i in range(n):
            a = x0 - i * step
            segs += [('L', (a - step * .18, G)), ('L', (a - step * .3, G - 7)), ('L', (a - step * .7, G - 7)), ('L', (a - step * .82, G))]
        segs.append(('L', (gx0, G)))
    else:
        segs.append(('L', (gx0, G)))
    segs += [('C', (xb + 6, G), (xb - 3, G - 5), (xb - 3, G - t * .5)),
             ('C', (xb - 3, St + 6), (xb - 1, St), (xb + 2, St))]
    return segs


def sole_accent(F, t, spring, lugs=0, xb=XB, xt=XT):
    St = G - t
    segs = sole_lower(F, t, spring, lugs, xb, xt)
    segs += [('L', (xt - 150, St)), ('C', (xt - 80, St), (xt - 34, St - spring * .7), F)]
    return P(F, segs, True)


def lace_marks(D, pts, up=(10, -12), w=3.4):
    """Laces seen from the side: a short bar from each eyelet up over the instep."""
    for (x, y) in pts:
        d = f'M{f(x)} {f(y)} l{f(up[0])} {f(up[1])}'
        D.x(f'<path d="{d}" fill="none" stroke="#6f6b63" stroke-width="{f(w + 2)}" stroke-linecap="round"/>')
        D.x(f'<path d="{d}" fill="none" stroke="#f3f1ea" stroke-width="{f(w)}" stroke-linecap="round"/>')


def lace_bow(D, x, y, s=1.0):
    d = (f'M{f(x)} {f(y)} c{f(-14*s)} {f(-16*s)} {f(-30*s)} {f(-8*s)} {f(-20*s)} {f(4*s)} '
         f'M{f(x)} {f(y)} c{f(10*s)} {f(-18*s)} {f(28*s)} {f(-14*s)} {f(20*s)} {f(2*s)} '
         f'M{f(x)} {f(y)} c{f(-4*s)} {f(14*s)} {f(-12*s)} {f(26*s)} {f(-18*s)} {f(34*s)} '
         f'M{f(x)} {f(y)} c{f(4*s)} {f(14*s)} {f(4*s)} {f(26*s)} {f(10*s)} {f(36*s)}')
    D.x(f'<path d="{d}" fill="none" stroke="#6f6b63" stroke-width="5.4" stroke-linecap="round"/>')
    D.x(f'<path d="{d}" fill="none" stroke="#f3f1ea" stroke-width="3.4" stroke-linecap="round"/>')


def on_curve(p0, c1, c2, p3, n, t0=.08, t1=.92, off=(0, 0)):
    pts = []
    for i in range(n):
        t = t0 + (t1 - t0) * (i / max(1, n - 1))
        x, y = bez(p0, c1, c2, p3, t)
        pts.append((x + off[0], y + off[1]))
    return pts


def eyelets(D, pts, r=3.6):
    for x, y in pts:
        D.d('hole', circle(x, y, r))


# ─────────────────────────────────────────────────────────────────
# sneakers
# ─────────────────────────────────────────────────────────────────
def sneaker(cb, cl, tg, v, toe, t=34, spring=14, lugs=0, high=False, xb=XB, xt=XT):
    """Returns (D, info). cb: heel-top y, cl: collar dip y, tg: tongue top (x,y),
    v: vamp point where the lace line meets the toe box, toe: toe-box top y."""
    D = Drawing(600, 420)
    St = G - t
    F = (xt - 4, G - spring - t)
    tx, ty = tg
    instep = ((tx + 22, ty + 8), (tx + 70, ty + 40), (v[0] - 60, v[1] - 14), v)
    segs = [('C', (xb - 12, St - 34), (xb - 12, cb + 40), (xb + 6, cb)),
            ('C', (xb + 36, cb - 5), (xb + 72, cl), (xb + 122, cl)),
            ('C', (xb + 154, cl), (tx - 30, ty + 28), (tx - 8, ty + 4)),
            ('C', (tx - 2, ty - 2), (tx + 14, ty - 2), instep[0]),
            ('C', instep[1], instep[2], instep[3]),
            ('C', (v[0] + 60, v[1] + 10), (xt - 40, toe - 1), (xt - 12, toe + 12)),
            ('C', (xt + 4, toe + 22), (xt + 4, F[1] - 8), F)]
    segs += sole_lower(F, t, spring, lugs, xb, xt)
    D.o(P((xb + 2, St), segs, True))
    D.a(sole_accent(F, t, spring, lugs, xb, xt))
    return D, dict(St=St, F=F, instep=instep, segs=segs)


def lace_line(D, info, n, off=(-8, 16), bow=True, t0=.1, t1=.86):
    p0, c1, c2, p3 = info['instep']
    eye = on_curve(p0, c1, c2, p3, n, t0, t1, off)
    eyelets(D, eye)
    lace_marks(D, eye)
    if bow:
        lace_bow(D, eye[0][0] + 4, eye[0][1] - 10, .9)
    return eye


def eyestay(D, info, off=30, front=(0, 0)):
    p0, c1, c2, p3 = info['instep']
    o = lambda p: (p[0] - off * .4, p[1] + off)
    D.d('seam', P(o(p0), [('C', o(c1), o(c2), (p3[0] - 6 + front[0], p3[1] + off * .7 + front[1])),
                          ('C', (p3[0] + 8, p3[1] + off * .5), (p3[0] + 10, p3[1] + 6), (p3[0] + 6, p3[1] + 1))]))


def sneaker_common_shading(D, St, top=292):
    D.light(f'M100 {top + 8} C200 {top} 320 {top + 4} 440 {top + 18}', 18, .22)
    D.dark(f'M84 {St - 8} C200 {St - 6} 380 {St - 6} 520 {St - 12}', 12, .16)
    D.dark(f'M60 {St - 20} C56 {St - 60} 62 {St - 80} 70 {St - 96}', 12, .18)


def low_top():
    D, I = sneaker(cb=256, cl=274, tg=(262, 222), v=(402, 290), toe=300)
    St = I['St']
    lace_line(D, I, 5)
    eyestay(D, I)
    D.d('seam', 'M452 346 C454 324 466 306 486 300')                          # toe cap
    D.d('seam', 'M140 346 C128 318 108 288 84 264')                           # heel counter
    D.d('stitch', 'M76 270 C104 268 140 284 186 284 C208 284 222 272 232 260')  # collar padding
    D.d('stitch', 'M70 337 L530 337')
    D.d('seamL', 'M78 360 L520 360')
    sneaker_common_shading(D, St)
    return D


def mid_top():
    D, I = sneaker(cb=206, cl=222, tg=(250, 172), v=(402, 290), toe=300)
    St = I['St']
    lace_line(D, I, 7)
    eyestay(D, I)
    D.d('seam', 'M452 346 C454 324 466 306 486 300')
    D.d('seam', 'M142 346 C130 316 104 284 80 266')
    D.d('stitch', 'M74 222 C104 218 140 234 180 234 C206 234 218 222 228 208')
    D.d('seam', 'M66 246 C110 242 150 256 196 258')                           # padded ankle band
    D.d('stitch', 'M70 337 L530 337')
    D.d('seamL', 'M78 360 L520 360')
    sneaker_common_shading(D, St)
    return D


def high_top():
    D, I = sneaker(cb=150, cl=160, tg=(232, 112), v=(404, 292), toe=302, t=30)
    St = I['St']
    lace_line(D, I, 9, t0=.06, t1=.88)
    eyestay(D, I, off=26)
    D.d('seam', 'M442 350 C446 326 462 308 488 302')
    D.d('stitch', 'M70 166 C104 164 150 176 200 174')
    D.d('seam', 'M150 350 C134 300 100 260 74 238')
    D.d('stitch', 'M70 341 L532 341')
    D.d('seamL', 'M78 362 L522 362')
    sneaker_common_shading(D, St)
    D.light('M96 190 C100 240 110 280 130 310', 16, .18)
    return D


def runner():
    # heel-to-toe drop: thicker midsole at the heel, rockered toe
    D = Drawing(600, 420)
    xb, xt = 64, 548
    tH, tT, spring = 54, 30, 26
    StH, F = G - tH, (xt - 6, G - spring - tT)
    segs = [('C', (xb - 10, StH - 30), (xb - 14, 262), (xb - 2, 246)),            # heel counter + pull tab flare
            ('C', (xb + 4, 238), (xb + 20, 242), (xb + 40, 258)),
            ('C', (xb + 70, 278), (150, 282), (196, 274)),
            ('C', (226, 268), (236, 236), (256, 222)),
            ('C', (264, 216), (278, 218), (286, 226)),
            ('C', (330, 254), (360, 274), (408, 290)),
            ('C', (468, 306), (512, 308), (534, 318)),
            ('C', (546, 322), (546, F[1] - 2), F)]
    # midsole: front F → toe → ground → heel flare
    lower = [('C', (xt + 4, F[1] + 4), (xt + 2, F[1] + 18), (xt - 16, G - spring * .5)),
             ('C', (xt - 50, G - 2), (xt - 100, G), (xt - 150, G)),
             ('L', (xb + 28, G)),
             ('C', (xb + 4, G), (xb - 8, G - 10), (xb - 8, G - 26)),
             ('C', (xb - 8, StH + 8), (xb - 4, StH), (xb + 2, StH))]
    D.o(P((xb + 2, StH), segs + lower, True))
    acc_top = [('L', (300, G - 42)), ('C', (420, G - 36), (500, G - 40), F)]
    D.a(P(F, lower + acc_top, True))
    D.d('seamL', f'M{xb} {G - 14} L{xt - 40} {G - 14}')                      # outsole line
    D.d('seamL', 'M90 352 C160 344 220 344 270 352')                          # midsole sculpt
    lace_eye = on_curve((286, 226), (330, 254), (360, 274), (408, 290), 6, .06, .8, (-8, 16))
    eyelets(D, lace_eye, 3.2)
    lace_marks(D, lace_eye)
    lace_bow(D, lace_eye[0][0] + 4, lace_eye[0][1] - 10, .85)
    D.d('seam', 'M246 262 C300 286 356 306 404 318 C416 320 420 312 414 302')  # eyestay
    D.d('seam', 'M84 260 C100 290 120 316 150 334')                            # heel clip
    D.d('seam', 'M470 338 C472 322 484 312 506 312')                           # toe overlay
    D.d('stitch', 'M74 254 C100 270 140 278 190 278')
    D.light('M110 296 C200 290 320 296 440 316', 18, .22)
    D.dark('M80 330 C200 336 360 342 520 340', 12, .16)
    D.dark('M60 300 C56 280 58 262 64 250', 10, .18)
    return D


def basketball():
    D, I = sneaker(cb=170, cl=184, tg=(236, 128), v=(404, 288), toe=294, t=44, spring=12)
    St = I['St']
    lace_line(D, I, 8, t0=.06, t1=.86)
    eyestay(D, I, off=28)
    D.d('seam', 'M66 190 C110 186 160 198 214 196')                           # ankle collar pad
    D.d('seam', 'M72 214 C116 210 160 222 212 222')
    D.d('seam', 'M436 336 C440 316 460 300 490 296')                           # toe overlay
    D.d('seam', 'M110 336 C150 300 200 286 260 290 C300 292 330 308 350 336')  # side swoosh-free panel
    D.d('stitch', 'M70 328 L528 328')
    D.d('seamL', 'M76 356 L520 356')
    D.d('seamL', 'M76 368 L516 368')
    sneaker_common_shading(D, St, 286)
    D.light('M96 210 C100 250 110 280 130 300', 16, .18)
    return D


def skate():
    # puffy padded collar + tongue, low flat vulcanised sole with foxing tape
    D = Drawing(600, 420)
    xb, xt, t, spring = 60, 548, 32, 8
    St, F = G - t, (xt - 6, G - spring - t)
    segs = [('C', (xb - 12, St - 34), (xb - 14, 262), (xb + 2, 252)),
            ('C', (xb + 20, 240), (xb + 52, 246), (xb + 80, 262)),          # padded roll
            ('C', (xb + 110, 276), (170, 278), (200, 270)),
            ('C', (222, 262), (232, 228), (252, 212)),                       # thick tongue
            ('C', (266, 202), (288, 206), (294, 220)),
            ('C', (330, 252), (366, 278), (410, 292)),
            ('C', (470, 306), (514, 308), (536, 324)),
            ('C', (550, 334), (550, F[1] - 4), F)]
    lower = [('C', (xt + 4, F[1] + 4), (xt + 4, G - 8), (xt - 18, G - 2)),
             ('C', (xt - 40, G), (xt - 80, G), (xt - 120, G)),
             ('L', (xb + 18, G)),
             ('C', (xb + 4, G), (xb - 3, G - 6), (xb - 3, G - 16)),
             ('C', (xb - 3, St + 6), (xb, St), (xb + 2, St))]
    D.o(P((xb + 2, St), segs + lower, True))
    D.a(P(F, lower + [('L', (xt - 140, St)), ('C', (xt - 70, St), (xt - 30, St - 4), F)], True))
    D.d('edge', f'M{xb} {St + 9} L{xt - 4} {St + 7}')                           # foxing tape
    D.d('seamL', f'M{xb} {G - 8} L{xt - 20} {G - 8}')
    eye = on_curve((294, 220), (330, 252), (366, 278), (410, 292), 5, .08, .84, (-8, 16))
    eyelets(D, eye)
    lace_marks(D, eye)
    lace_bow(D, eye[0][0] + 4, eye[0][1] - 10, .9)
    D.d('seam', 'M256 262 C310 290 360 308 404 318 C418 320 422 310 414 300')
    D.d('seam', 'M70 266 C100 258 150 280 200 284')                            # padding seam
    D.d('stitch', 'M458 348 C460 326 474 312 498 308')                         # toe cap
    D.d('seam', 'M140 348 C130 320 110 292 84 270')
    D.light('M100 300 C200 294 320 300 440 314', 18, .22)
    D.dark(f'M80 {St - 8} C200 {St - 6} 380 {St - 6} 520 {St - 10}', 12, .16)
    D.light('M80 254 C110 248 150 262 180 268', 10, .22)
    return D


def slip_on():
    D = Drawing(600, 420)
    xb, xt, t, spring = 60, 548, 30, 8
    St, F = G - t, (xt - 6, G - spring - t)
    segs = [('C', (xb - 12, St - 30), (xb - 12, 272), (xb + 4, 262)),
            ('C', (xb + 40, 258), (xb + 90, 282), (200, 282)),
            ('C', (240, 282), (262, 268), (286, 262)),                         # low throat
            ('C', (320, 256), (370, 276), (410, 290)),
            ('C', (470, 306), (514, 308), (536, 324)),
            ('C', (550, 334), (550, F[1] - 4), F)]
    lower = [('C', (xt + 4, F[1] + 4), (xt + 4, G - 8), (xt - 18, G - 2)),
             ('C', (xt - 40, G), (xt - 80, G), (xt - 120, G)),
             ('L', (xb + 18, G)),
             ('C', (xb + 4, G), (xb - 3, G - 6), (xb - 3, G - 16)),
             ('C', (xb - 3, St + 6), (xb, St), (xb + 2, St))]
    D.o(P((xb + 2, St), segs + lower, True))
    D.a(P(F, lower + [('L', (xt - 140, St)), ('C', (xt - 70, St), (xt - 30, St - 4), F)], True))
    D.d('edge', f'M{xb} {St + 8} L{xt - 4} {St + 6}')
    D.d('seamL', f'M{xb} {G - 8} L{xt - 20} {G - 8}')
    D.d('panel', 'M244 278 L262 320 L280 270 Z')                               # elastic gore
    D.d('rib', 'M254 284 L262 312 M262 280 L266 306 M270 276 L270 300')
    D.d('seam', 'M232 284 C280 296 340 300 410 296')                           # vamp seam
    D.d('stitch', 'M72 268 C110 266 150 288 200 290')
    D.d('stitch', 'M456 348 C460 326 474 312 498 308')
    D.light('M100 304 C200 300 320 306 440 316', 18, .22)
    D.dark(f'M80 {St - 8} C200 {St - 6} 380 {St - 6} 520 {St - 10}', 12, .16)
    return D


def court():
    D, I = sneaker(cb=262, cl=280, tg=(268, 232), v=(404, 294), toe=304, t=30, spring=10)
    St = I['St']
    lace_line(D, I, 5)
    eyestay(D, I, off=24)
    D.d('seam', 'M136 350 C128 324 110 296 86 272')
    D.d('stitch', 'M74 276 C104 274 140 290 186 290 C208 290 222 280 232 268')
    D.d('stitch', 'M70 342 L534 342')                                          # cupsole stitch
    D.d('perf', 'M462 318 L500 318 M466 330 L506 330')                         # toe perforation
    D.light('M100 306 C200 302 320 306 440 320', 18, .22)
    D.dark(f'M84 {St - 8} C200 {St - 6} 380 {St - 6} 520 {St - 12}', 12, .14)
    return D


def trail():
    D, I = sneaker(cb=246, cl=266, tg=(258, 214), v=(404, 290), toe=298, t=40, spring=18, lugs=9)
    St = I['St']
    lace_line(D, I, 6)
    D.d('seam', 'M240 258 C300 290 356 310 404 320 C420 322 424 312 416 302')
    D.d('panel', 'M474 342 C478 326 492 314 512 312 C530 314 542 326 544 342 Z')  # toe bumper
    D.d('seam', 'M92 300 C150 322 220 334 300 338')                             # cage overlay
    D.d('seam', 'M84 262 C96 290 112 314 136 334')
    D.d('stitch', 'M74 262 C104 262 140 276 186 276')
    D.d('seamL', f'M70 {G - 18} L520 {G - 18}')
    sneaker_common_shading(D, St)
    return D


def training():
    D, I = sneaker(cb=254, cl=272, tg=(262, 220), v=(404, 290), toe=300, t=30, spring=10)
    St = I['St']
    lace_line(D, I, 5)
    eyestay(D, I)
    D.d('panel', 'M186 344 C200 310 230 286 266 270 L300 300 C270 314 250 330 244 344 Z')  # midfoot cage
    D.d('seam', 'M80 300 C100 320 120 336 140 346')                             # wide heel clip
    D.d('stitch', 'M76 268 C104 266 140 282 186 282')
    D.d('seamL', 'M440 350 C446 330 462 312 490 306')
    D.d('seamL', f'M70 {G - 12} L530 {G - 12}')
    sneaker_common_shading(D, St)
    return D


# ─────────────────────────────────────────────────────────────────
SHOES = {
    'lowTop': low_top, 'midTop': mid_top, 'highTop': high_top, 'runner': runner,
    'basketball': basketball, 'skate': skate, 'slipOn': slip_on, 'court': court,
    'trail': trail, 'training': training,
}


# ─────────────────────────────────────────────────────────────────
# generic bottom for flat / low-heeled shoes and boots
# ─────────────────────────────────────────────────────────────────
def bottom(F, t, spring=10, hh=None, xhb=150, xs=330, gap=10, lugs=0, xb=XB, xt=XT, welt=0):
    """Lower contour from the toe's sole-top point F to the back of the heel
    stack (xb, G-hh). Returns (segs, accent_path)."""
    hh = hh or t
    segs = [('C', (xt + 4 + welt, F[1] + 2), (xt + 6 + welt, F[1] + t * .8), (xt - 8, G - spring * .5)),
            ('C', (xt - 34, G - 1), (xt - 72, G), (xt - 116, G))]

    def ground(x0, x1, n):
        out = []
        if n:
            step = (x0 - x1) / n
            for i in range(n):
                a = x0 - i * step
                out += [('L', (a - step * .16, G)), ('Q', (a - step * .22, G - 8), (a - step * .34, G - 8)),
                        ('L', (a - step * .66, G - 8)), ('Q', (a - step * .78, G - 8), (a - step * .84, G))]
        out.append(('L', (x1, G)))
        return out

    if hh - t > 6 or gap:
        segs += ground(xt - 116, xs, lugs and max(2, lugs * 2 // 3))
        segs += [('C', (xs - 40, G), (xhb + 40, G - gap), (xhb + 8, G - gap)),
                 ('L', (xhb, G - gap)), ('L', (xhb, G))]
        segs += ground(xhb, xb + 12, lugs and max(1, lugs // 3))
    else:
        segs += ground(xt - 116, xb + 20, lugs)
    segs += [('C', (xb + 2, G), (xb - 3, G - 6), (xb - 3, G - hh * .5)),
             ('C', (xb - 3, G - hh + 6), (xb - 1, G - hh), (xb + 2, G - hh))]
    top = [('L', (xhb + 16, G - hh)), ('C', (xhb + 70, G - hh), (xs - 40, G - t), (xs, G - t)),
           ('L', (xt - 150, G - t)), ('C', (xt - 80, G - t), (xt - 34, F[1] + spring * .3), F)]
    acc = P(F, segs + top, True)
    return segs, acc


def heel_lines(D, xb, xhb, hh, n=3, gap=10):
    for i in range(1, n + 1):
        y = G - (hh - gap) * i / (n + 1)
        D.d('seamL', f'M{f(xb)} {f(y)} L{f(xhb)} {f(y)}')


def welt_stitch(D, t, x0=78, x1=528):
    y = G - t + 5
    D.d('stitch', f'M{x0} {y} L{x1} {y}')


def boot_shading(D, St, xf=240):
    D.light(f'M100 140 C96 200 100 260 120 300', 18, .2)
    D.light(f'M300 290 C380 296 440 304 500 318', 14, .2)
    D.dark(f'M90 {St - 10} C200 {St - 6} 380 {St - 6} 520 {St - 12}', 12, .16)
    D.dark(f'M{xf - 14} 150 C{xf - 10} 200 {xf} 240 {xf + 30} 270', 12, .14)


# ─────────────────────────────────────────────────────────────────
# boots
# ─────────────────────────────────────────────────────────────────
def chelsea():
    D = Drawing(600, 420)
    t, hh = 14, 30
    F = (XT - 4, G - 10 - t)
    low, acc = bottom(F, t, 10, hh, xhb=150, xs=330, gap=8)
    up = [('C', (52, 320), (54, 282), (66, 252)),
          ('C', (76, 228), (72, 180), (72, 128)),
          ('C', (120, 122), (190, 134), (238, 138)),
          ('C', (240, 190), (254, 240), (300, 268)),
          ('C', (346, 292), (404, 298), (452, 306)),
          ('C', (500, 312), (534, 318), (544, 338)),
          ('C', (548, 346), (547, 352), F)]
    D.o(P((XB + 2, G - hh), up + low, True))
    D.a(acc)
    D.d('panel', 'M166 133 C170 190 182 238 196 258 C210 236 218 190 220 138 Z')     # elastic gore
    D.d('rib', 'M178 140 L190 240 M193 141 L196 246 M207 142 L202 240')
    D.d('seam', 'M150 352 C146 300 124 268 96 252 C86 246 80 238 78 228')          # heel counter / back seam
    D.d('stitch', 'M240 152 C244 196 258 238 296 262')                               # front seam
    D.d('stitch', 'M160 136 C164 192 178 242 196 266 C214 244 226 192 228 140')
    welt_stitch(D, t, 150, 530)
    heel_lines(D, XB, 150, hh, 2, 8)
    D.x('<path d="M74 132 C70 100 100 98 104 130" fill="none" stroke="#5b564e" stroke-width="5" stroke-linecap="round"/>')
    boot_shading(D, G - t)
    return D


def combat():
    D = Drawing(600, 420)
    t, hh = 30, 40
    F = (XT - 4, G - 14 - t)
    low, acc = bottom(F, t, 14, hh, xhb=152, xs=330, gap=8, lugs=9)
    up = [('C', (50, 310), (54, 270), (66, 240)),
          ('C', (76, 214), (70, 150), (70, 70)),
          ('C', (120, 64), (190, 70), (232, 64)),                    # padded collar
          ('C', (244, 62), (254, 66), (256, 74)),
          ('C', (260, 150), (270, 220), (300, 252)),
          ('C', (330, 280), (380, 288), (420, 296)),
          ('C', (480, 304), (528, 310), (542, 330)),
          ('C', (548, 338), (548, F[1] - 4), F)]
    D.o(P((XB + 2, G - hh), up + low, True))
    D.a(acc)
    D.d('edge', 'M70 82 C120 78 190 84 236 78')                                     # collar pad seam
    D.d('seam', 'M232 80 C238 150 248 214 282 254 C310 282 350 294 384 300')        # eyestay
    D.d('seam', 'M152 336 C150 290 126 258 92 240')                                  # heel counter
    D.d('seam', 'M440 336 C446 316 462 302 490 298')                                 # toe cap
    D.d('stitch', 'M436 340 C442 312 460 296 494 292')
    welt_stitch(D, t, 150, 528)
    eye = [(246 + i * 2.2, 92 + i * 22) for i in range(7)] + [(278, 248), (302, 266)]
    eyelets(D, eye, 3.4)
    lace_marks(D, eye, up=(12, -6))
    D.x('<path d="M74 72 C70 40 98 38 102 70" fill="none" stroke="#5b564e" stroke-width="5" stroke-linecap="round"/>')
    boot_shading(D, G - t, 250)
    return D


def work_boot():
    D = Drawing(600, 420)
    t = 32
    F = (XT - 4, G - 8 - t)
    low, acc = bottom(F, t, 8, t, gap=0, welt=4)                         # flat wedge sole
    up = [('C', (50, 320), (54, 280), (66, 250)),
          ('C', (76, 226), (70, 170), (70, 118)),
          ('C', (110, 112), (180, 118), (226, 112)),
          ('C', (240, 110), (250, 114), (252, 122)),
          ('C', (256, 180), (266, 228), (300, 254)),
          ('C', (330, 276), (380, 284), (420, 290)),
          ('C', (480, 296), (528, 300), (542, 320)),
          ('C', (550, 330), (548, F[1] - 4), F)]
    D.o(P((XB + 2, G - t), up + low, True))
    D.a(acc)
    D.d('edge', 'M70 132 C110 128 180 134 228 128')                                 # padded collar
    D.d('seam', 'M228 134 C234 186 246 230 280 258 C310 280 350 292 384 296')
    D.d('seam', 'M392 300 C430 296 480 298 520 312 C532 318 538 326 540 334')      # moc-toe apron
    D.d('stitch', 'M394 307 C432 303 480 305 516 318')
    D.d('seam', 'M150 344 C148 300 126 264 92 248')
    D.d('stitch', f'M74 {G - t + 6} L534 {G - t + 6}')                               # welt
    eye = [(240, 140), (244, 166)] + [(252, 192), (262, 216), (280, 238), (304, 258)]
    for x, y in eye[:2]:
        D.d('hw', circle(x, y, 4))
    eyelets(D, eye[2:], 3.6)
    lace_marks(D, eye, up=(12, -6))
    boot_shading(D, G - t, 246)
    return D


def hiking():
    D = Drawing(600, 420)
    t, hh = 36, 44
    F = (XT - 4, G - 18 - t)
    low, acc = bottom(F, t, 18, hh, xhb=150, xs=320, gap=6, lugs=10)
    up = [('C', (50, 306), (54, 270), (64, 240)),
          ('C', (72, 214), (64, 180), (74, 150)),                    # scooped back
          ('C', (84, 136), (104, 140), (124, 150)),
          ('C', (160, 166), (210, 150), (236, 124)),                 # collar rises to the front
          ('C', (246, 116), (258, 118), (260, 128)),
          ('C', (266, 186), (276, 226), (304, 250)),
          ('C', (334, 274), (380, 284), (420, 292)),
          ('C', (480, 302), (528, 306), (540, 324)),
          ('C', (548, 332), (548, F[1] - 4), F)]
    D.o(P((XB + 2, G - hh), up + low, True))
    D.a(acc)
    D.d('panel', 'M452 340 C454 316 474 300 506 300 C528 302 540 314 540 326 L536 340 Z')   # toe rand
    D.d('panel', 'M70 290 C96 280 130 300 150 338 L80 338 Z')                       # heel rand
    D.d('seam', 'M236 140 C242 190 254 232 286 256 C314 280 354 292 390 298')
    D.d('edge', 'M76 164 C100 156 150 176 210 160')                                 # padded collar
    D.d('seam', 'M140 300 C200 280 260 284 330 300')                                # mid panel
    welt_stitch(D, t, 150, 520)
    eye = [(250, 146), (254, 172), (262, 198)] + [(276, 224), (296, 246), (320, 264)]
    for x, y in eye[:3]:
        D.d('hw', 'M{} {} l8 -3 l0 7 z'.format(f(x - 4), f(y - 1)))
    eyelets(D, eye[3:], 3.4)
    lace_marks(D, eye, up=(12, -6))
    D.x('<path d="M76 152 C68 120 96 116 102 146" fill="none" stroke="#5b564e" stroke-width="5" stroke-linecap="round"/>')
    boot_shading(D, G - t, 256)
    return D


def chukka():
    D = Drawing(600, 420)
    t, hh = 14, 28
    F = (XT - 4, G - 10 - t)
    low, acc = bottom(F, t, 10, hh, xhb=150, xs=330, gap=8)
    up = [('C', (52, 322), (54, 282), (66, 254)),
          ('C', (74, 236), (70, 210), (72, 176)),
          ('C', (110, 168), (180, 172), (222, 170)),                 # rounded shaft top
          ('C', (236, 170), (246, 174), (250, 184)),
          ('C', (264, 236), (290, 262), (330, 278)),
          ('C', (380, 294), (430, 298), (470, 304)),
          ('C', (510, 310), (536, 318), (544, 338)),
          ('C', (548, 346), (547, 352), F)]
    D.o(P((XB + 2, G - hh), up + low, True))
    D.a(acc)
    D.d('seam', 'M222 176 C228 230 244 270 280 300 C300 316 312 336 312 354')     # quarter (open lacing)
    D.d('stitch', 'M212 182 C218 232 234 272 268 300 C288 318 300 336 300 354')
    D.d('seam', 'M150 352 C146 310 124 280 92 266')
    welt_stitch(D, t, 150, 530)
    eye = [(238, 196), (250, 224), (266, 250)]
    eyelets(D, eye, 3.6)
    lace_marks(D, eye, up=(12, -6))
    lace_bow(D, 246, 186, .85)
    boot_shading(D, G - t, 248)
    return D


def desert():
    D = Drawing(600, 420)
    t = 26
    F = (XT - 4, G - 6 - t)
    low, acc = bottom(F, t, 6, t, gap=0, welt=2)                           # flat crepe wedge
    up = [('C', (50, 326), (56, 290), (68, 262)),
          ('C', (76, 240), (72, 214), (74, 184)),
          ('C', (110, 176), (176, 180), (218, 178)),
          ('C', (232, 178), (242, 182), (246, 192)),
          ('C', (260, 240), (286, 266), (326, 280)),
          ('C', (380, 294), (440, 296), (480, 304)),
          ('C', (516, 312), (540, 322), (546, 338)),
          ('C', (550, 344), (549, 348), F)]
    D.o(P((XB + 2, G - t), up + low, True))
    D.a(acc)
    D.d('seam', 'M218 184 C224 236 240 274 276 300 C298 316 306 334 304 352')
    D.d('stitch', 'M208 190 C214 238 230 276 264 302 C284 318 292 336 292 352')
    D.d('seamL', f'M76 {G - 12} C200 {G - 10} 400 {G - 10} 528 {G - 14}')           # crepe edge
    eye = [(236, 206), (250, 236)]
    eyelets(D, eye, 3.6)
    lace_marks(D, eye, up=(12, -6))
    lace_bow(D, 242, 196, .85)
    boot_shading(D, G - t, 246)
    return D


def cowboy():
    D = Drawing(600, 420)
    t = 12
    H = 58                                                           # underslung Cuban heel
    F = (XT + 2, G - 8 - t)
    up = [('C', (60, G - H - 30), (70, G - H - 80), (82, 250)),     # heel cup
          ('C', (94, 210), (76, 120), (78, 30)),                     # straight back of shaft
          ('C', (110, 34), (150, 62), (182, 64)),                    # scalloped top (dip at the side)
          ('C', (214, 62), (254, 34), (290, 26)),
          ('C', (292, 110), (282, 200), (306, 246)),                 # front of shaft into the instep
          ('C', (330, 284), (390, 296), (450, 310)),
          ('C', (500, 320), (540, 332), (556, 350)),                 # long snip toe
          ('C', (560, 354), (556, F[1] + 2), F)]
    low = [('C', (552, 364), (540, 372), (520, 374)),
           ('L', (400, G)),
           ('C', (340, G - 2), (250, G - H + 10), (176, G - H + 6)),   # shank arches up
           ('C', (160, G - H + 6), (156, G - H + 20), (150, G - 30)),  # forward-raked heel breast
           ('L', (146, G)), ('L', (86, G)),
           ('C', (80, G - 20), (72, G - H + 10), (70, G - H))]
    D.o(P((70, G - H), up + low, True))
    D.a(P((70, G - H), [('L', (176, G - H - 4)), ('C', (250, G - H - 2), (330, G - 12), (400, G - 10)),
                         ('L', (520, G - 12)), ('C', (540, G - 12), (552, G - 16), F)] + low[:1] + low[1:], True))
    D.d('seam', 'M290 40 C286 120 282 200 300 244')                                  # side seam of shaft
    D.d('stitch', 'M120 90 C150 130 200 130 240 100 M126 130 C160 170 210 168 244 136 M134 170 C170 206 214 202 246 176')
    D.d('seam', 'M300 250 C320 270 312 300 280 320 C250 340 220 350 180 352')        # vamp/counter seam
    D.d('stitch', 'M420 312 C450 300 490 310 520 330')                               # toe bug stitch
    D.d('seamL', 'M86 350 L148 350 M86 362 L147 362')
    D.x('<path d="M206 66 C200 40 226 34 232 58" fill="none" stroke="#5b564e" stroke-width="5" stroke-linecap="round"/>')
    D.light('M120 50 C110 150 120 220 140 270', 22, .2)
    D.dark('M270 50 C270 120 268 190 286 240', 14, .16)
    D.dark('M110 330 C200 340 380 352 520 360', 10, .16)
    D.light('M330 296 C400 304 460 316 520 334', 12, .2)
    return D


def moto():
    D = Drawing(600, 420)
    t, hh = 30, 40
    F = (XT - 4, G - 12 - t)
    low, acc = bottom(F, t, 12, hh, xhb=150, xs=330, gap=8, lugs=8)
    up = [('C', (50, 310), (54, 270), (66, 240)),
          ('C', (76, 210), (72, 140), (70, 58)),
          ('C', (130, 52), (210, 52), (262, 56)),
          ('C', (262, 140), (264, 214), (302, 250)),
          ('C', (336, 280), (390, 290), (432, 298)),
          ('C', (490, 306), (530, 312), (542, 330)),
          ('C', (548, 338), (548, F[1] - 4), F)]
    D.o(P((XB + 2, G - hh), up + low, True))
    D.a(acc)
    D.d('panel', 'M70 96 L262 92 L262 116 L70 120 Z')                                 # top strap
    D.d('panel', 'M250 262 C280 280 316 292 350 296 L344 320 C300 316 262 300 236 280 Z')   # instep strap
    D.d('hw', rect(222, 90, 26, 30, 3), rect(236, 270, 24, 28, 3))
    D.d('hole', rect(229, 97, 12, 16, 2), rect(243, 277, 10, 14, 2))
    D.d('seam', 'M152 336 C150 290 126 258 92 240')
    D.d('seam', 'M262 150 C262 200 268 230 290 250')
    welt_stitch(D, t, 150, 528)
    boot_shading(D, G - t, 262)
    return D


def rain_boot():
    D = Drawing(600, 420)
    t, hh = 20, 30
    F = (XT - 4, G - 10 - t)
    low, acc = bottom(F, t, 10, hh, xhb=150, xs=330, gap=8, lugs=7)
    up = [('C', (50, 316), (56, 274), (70, 246)),
          ('C', (84, 216), (66, 120), (62, 30)),                     # slightly flared shaft
          ('C', (140, 22), (240, 22), (300, 30)),
          ('C', (290, 120), (280, 200), (300, 244)),
          ('C', (330, 282), (400, 290), (450, 298)),
          ('C', (510, 306), (546, 318), (548, 338)),                 # round toe
          ('C', (549, 344), (548, 348), F)]
    D.o(P((XB + 2, G - hh), up + low, True))
    D.a(acc)
    D.d('edge', 'M64 46 C140 38 230 38 298 46')                                      # top binding
    D.d('panel', 'M274 46 L292 46 L288 112 L280 116 Z')                              # side gusset
    D.d('seamL', f'M70 {G - hh - 14} C200 {G - hh - 6} 400 {G - t - 12} 540 {G - t - 16}')   # moulded foxing line
    D.light('M110 50 C100 140 110 230 130 290', 26, .24)
    D.light('M360 296 C420 300 480 306 530 324', 14, .24)
    D.dark('M260 60 C256 140 262 210 284 250', 16, .16)
    D.dark('M90 340 C200 346 380 350 520 348', 10, .16)
    return D


def snow_boot():
    D = Drawing(600, 420)
    t, hh = 34, 42
    F = (XT - 4, G - 12 - t)
    low, acc = bottom(F, t, 12, hh, xhb=150, xs=330, gap=6, lugs=9)
    up = [('C', (46, 300), (50, 250), (62, 214)),
          ('C', (70, 186), (64, 150), (62, 94)),
          ('C', (60, 70), (80, 58), (120, 58)),                      # fur cuff
          ('L', (244, 58)),
          ('C', (276, 58), (284, 74), (280, 96)),
          ('C', (278, 160), (280, 216), (310, 248)),
          ('C', (340, 276), (400, 284), (444, 292)),
          ('C', (504, 300), (544, 312), (548, 334)),
          ('C', (550, 340), (549, F[1] - 2), F)]
    D.o(P((XB + 2, G - hh), up + low, True))
    D.a(acc)
    D.a('M60 98 C60 70 80 58 120 58 L244 58 C276 58 284 74 280 98 C230 104 120 104 60 98 Z')     # fur cuff
    D.a('M48 300 C60 280 120 270 200 276 C260 280 300 270 330 274 C400 282 470 290 520 300 C540 306 548 320 549 340 L549 350 L48 350 Z')  # rubber shell
    D.d('seam', 'M50 296 C120 270 200 278 250 278 C300 278 320 270 350 276 C420 286 480 294 530 302')
    D.d('stitch', 'M54 306 C120 282 200 290 250 290 C300 290 320 282 350 288 C420 298 480 306 528 314')
    D.d('seam', 'M262 104 C262 170 270 222 300 248')
    D.d('seamL', 'M62 100 C120 106 230 106 280 100')
    eye = [(270, 124), (272, 150), (276, 176), (284, 202), (298, 226)]
    eyelets(D, eye, 3.4)
    lace_marks(D, eye, up=(12, -6))
    D.light('M100 120 C96 170 98 220 110 260', 20, .2)
    D.dark('M250 112 C250 160 254 210 276 246', 14, .14)
    D.dark('M80 334 C200 340 380 344 520 340', 10, .14)
    return D


# ─────────────────────────────────────────────────────────────────
# heeled shoes
# ─────────────────────────────────────────────────────────────────
def heel_bottom(H, style, xb=66, xt=XT, toe_y=None):
    """Bottom contour for a heeled shoe, from the toe tip F round under the
    forepart, up the shank and around the heel back to the seat (xb, G-H).
    Also returns the foot line (top of the sole) for the accent."""
    F = (xt, toe_y or G - 10)
    seat = G - H
    segs = [('C', (xt + 2, F[1] + 4), (xt - 6, G), (xt - 26, G)), ('L', (400, G))]
    if style == 'wedge':
        segs += [('L', (xb + 18, G)), ('C', (xb + 4, G), (xb - 2, G - 8), (xb - 2, G - 20)),
                 ('C', (xb - 2, seat + 40), (xb - 4, seat + 12), (xb, seat))]
    else:
        segs += [('C', (330, G - 2), (250, seat + 12), (170, seat + 10))]
        if style == 'stiletto':
            segs += [('C', (130, seat + 30), (106, G - 90), (104, G - 8)), ('L', (104, G)), ('L', (92, G)), ('L', (92, G - 8)),
                     ('C', (90, G - 70), (78, seat + 30), (xb, seat))]
        elif style == 'pump':
            segs += [('C', (136, seat + 30), (114, G - 70), (110, G - 8)), ('L', (110, G)), ('L', (88, G)), ('L', (88, G - 8)),
                     ('C', (84, G - 60), (72, seat + 30), (xb, seat))]
        elif style == 'block':
            segs += [('C', (150, seat + 18), (138, seat + 40), (136, G - 6)), ('L', (136, G)), ('L', (80, G)), ('L', (80, G - 6)),
                     ('C', (76, seat + 40), (68, seat + 16), (xb, seat))]
        elif style == 'kitten':
            segs += [('C', (130, seat + 16), (112, G - 30), (114, G - 6)), ('L', (114, G)), ('L', (98, G)), ('L', (98, G - 6)),
                     ('C', (90, G - 26), (74, seat + 14), (xb, seat))]
        elif style == 'cone':
            segs += [('C', (148, seat + 24), (126, G - 60), (124, G - 6)), ('L', (124, G)), ('L', (92, G)), ('L', (92, G - 6)),
                     ('C', (86, G - 60), (72, seat + 24), (xb, seat))]
    foot = [('L', (166, seat + 2)), ('C', (246, seat + 4), (322, G - 8), (400, G - 8)), ('L', (xt - 30, G - 8)),
            ('C', (xt - 12, G - 8), (xt - 4, F[1] - 1), F)]
    return F, segs, foot


def heeled(H, style, up, toe_y=None, xb=66):
    D = Drawing(600, 420)
    F, low, foot = heel_bottom(H, style, xb, toe_y=toe_y)
    D.o(P((xb, G - H), up(F) + low, True))
    D.a(P((xb, G - H), foot + low, True))
    return D, F


def pump_upper(H, back=60, throat=(330, None), toe='pointed'):
    seat = G - H

    def up(F):
        ty = throat[1] or (seat + (G - seat) * .62 - 38)
        tip = [('C', (504, 334), (536, 352), F)] if toe == 'pointed' else \
              [('C', (510, 326), (540, 340), (544, 356)), ('C', (546, 362), (546, 366), F)]
        return [('C', (54, seat - 18), (54, seat - back + 18), (68, seat - back)),
                ('C', (110, seat - back + 4), (180, seat - 14), (240, ty - 20)),
                ('C', (280, ty - 2), (300, ty + 8), throat[0], ty),
                ('C', (380, ty - 8) if False else (380, ty + 2), (420, G - 64), (470, G - 50))] + tip
    return up


def _pump_up(H, back, tx, toe):
    seat = G - H
    ty = seat + (G - seat) * .74 - 46

    def up(F):
        s = [('C', (52, seat - 20), (52, seat - back + 18), (68, seat - back)),
             ('C', (120, seat - back + 4), (210, ty - 24), (tx, ty))]
        if toe == 'pointed':
            s += [('C', (tx + 56, ty - 4), (420, G - 78), (476, G - 62)), ('C', (510, G - 50), (534, G - 26), F)]
        elif toe == 'square':
            s += [('C', (tx + 56, ty - 6), (420, G - 80), (490, G - 70)), ('C', (524, G - 66), (536, G - 56), (538, G - 36)),
                  ('C', (539, G - 24), (538, G - 16), F)]
        else:
            s += [('C', (tx + 56, ty - 6), (420, G - 80), (486, G - 70)), ('C', (528, G - 62), (546, G - 40), (545, G - 24)),
                  ('C', (545, G - 16), (543, G - 13), F)]
        return s
    return up, ty


def pump():
    H = 120
    up, ty = _pump_up(H, 72, 320, 'pointed')
    D, F = heeled(H, 'pump', up)
    D.d('edge', f'M70 {G - H - 64} C120 {G - H - 62} 200 {ty - 28} 316 {ty + 2}')   # topline binding
    D.d('seamL', f'M96 {G - H + 4} C110 {G - H - 20} 96 {G - H - 40} 80 {G - H - 50}')
    D.light(f'M120 {G - H - 30} C220 {G - H} 330 {ty + 30} 480 {G - 30}', 16, .24)
    D.dark(f'M110 {G - H - 6} C220 {G - H + 30} 330 {G - 30} 500 {G - 16}', 10, .14)
    return D


def stiletto():
    H = 150
    up, ty = _pump_up(H, 70, 330, 'pointed')
    D, F = heeled(H, 'stiletto', up, toe_y=G - 8)
    D.d('edge', f'M70 {G - H - 62} C120 {G - H - 60} 200 {ty - 28} 326 {ty + 2}')
    D.d('seamL', f'M94 {G - H + 4} C108 {G - H - 20} 94 {G - H - 40} 78 {G - H - 48}')
    D.light(f'M120 {G - H - 30} C220 {G - H} 330 {ty + 30} 480 {G - 30}', 16, .24)
    D.dark(f'M110 {G - H - 6} C220 {G - H + 30} 330 {G - 30} 500 {G - 16}', 10, .14)
    return D


def block_heel():
    H = 110
    up, ty = _pump_up(H, 74, 316, 'square')
    D, F = heeled(H, 'block', up, toe_y=G - 12)
    D.d('edge', f'M70 {G - H - 66} C120 {G - H - 64} 200 {ty - 28} 312 {ty + 2}')
    D.d('seamL', f'M80 {G - 30} L136 {G - 30}')                                        # heel top-lift
    D.light(f'M120 {G - H - 30} C220 {G - H} 330 {ty + 30} 480 {G - 34}', 16, .24)
    D.dark(f'M110 {G - H - 6} C220 {G - H + 30} 330 {G - 30} 500 {G - 18}', 10, .14)
    return D


def kitten_heel():
    H = 56
    up, ty = _pump_up(H, 72, 316, 'pointed')
    D, F = heeled(H, 'kitten', up)
    D.d('edge', f'M70 {G - H - 64} C120 {G - H - 62} 200 {ty - 28} 312 {ty + 2}')
    D.d('seamL', f'M92 {G - H + 2} C104 {G - H - 20} 94 {G - H - 38} 78 {G - H - 48}')
    D.light(f'M120 {G - H - 30} C220 {G - H - 10} 330 {ty + 20} 480 {G - 34}', 16, .24)
    D.dark(f'M110 {G - H - 6} C220 {G - H + 10} 330 {G - 24} 500 {G - 16}', 10, .14)
    return D


def wedge_heel():
    H = 112
    up, ty = _pump_up(H, 74, 312, 'round')
    D, F = heeled(H, 'wedge', up, toe_y=G - 14)
    D.d('edge', f'M70 {G - H - 66} C120 {G - H - 64} 200 {ty - 28} 308 {ty + 2}')
    D.d('seamL', f'M70 {G - 10} L520 {G - 10}')
    D.light(f'M120 {G - H - 30} C220 {G - H} 330 {ty + 30} 480 {G - 34}', 16, .24)
    D.light(f'M90 {G - H + 30} C120 {G - 60} 200 {G - 30} 300 {G - 20}', 14, .16)
    return D


def heeled_sandal():
    H = 128
    seat = G - H
    D = Drawing(600, 420)
    F, low, foot = heel_bottom(H, 'block', 66, toe_y=G - 10)
    base = P((66, seat), foot + low, True)
    D.o(base)
    D.a(base)
    D.o(band((430, G - 10), (446, G - 40), (476, G - 62), (512, G - 66), 34, 26))     # wide toe strap
    D.o(band((72, seat + 2), (62, seat - 30), (70, seat - 66), (92, seat - 88), 26, 22))  # heel counter strap
    D.o(band((86, seat - 92), (140, seat - 100), (210, seat - 100), (262, seat - 84), 14))  # ankle strap
    D.d('hw', rect(212, seat - 108, 18, 24, 3))
    D.d('hole', rect(217, seat - 103, 8, 14, 2))
    D.d('seamL', f'M80 {G - 30} L136 {G - 30}')
    D.d('stitch', centre((440, G - 14), (454, G - 40), (480, G - 58), (508, G - 62)))
    D.light('M450 352 C470 334 490 326 510 324', 8, .24)
    return D


def ankle_boot():
    H = 100
    seat = G - H
    D = Drawing(600, 420)

    def up(F):
        return [('C', (54, seat - 20), (60, seat - 50), (70, seat - 70)),
                ('C', (80, seat - 90), (74, 120), (76, 92)),
                ('C', (120, 86), (190, 92), (236, 96)),
                ('C', (236, 150), (250, 220), (300, 262)),
                ('C', (340, 292), (420, 312), (480, 330)),
                ('C', (512, 340), (536, 352), F)]
    F, low, foot = heel_bottom(H, 'block', 66, toe_y=G - 10)
    low = [('C', (XT + 2, F[1] + 4), (XT - 6, G), (XT - 26, G)), ('L', (400, G)),
           ('C', (330, G - 2), (250, seat + 14), (170, seat + 10)),
           ('C', (148, seat + 22), (134, seat + 40), (132, G - 6)), ('L', (132, G)), ('L', (84, G)), ('L', (84, G - 6)),
           ('C', (78, seat + 40), (68, seat + 16), (66, seat))]
    D.o(P((66, seat), up(F) + low, True))
    D.a(P((66, seat), foot + low, True))
    D.d('zip', 'M108 98 C110 140 114 180 116 230')
    D.d('hw', rect(105, 98, 9, 18, 2))
    D.d('seam', 'M236 110 C240 170 256 226 300 266')
    D.d('seamL', f'M84 {G - 30} L132 {G - 30}')
    D.light('M150 110 C146 170 150 230 170 280', 20, .2)
    D.light('M330 296 C400 314 460 330 520 350', 12, .22)
    D.dark('M220 110 C222 170 236 220 280 260', 14, .14)
    return D


# ─────────────────────────────────────────────────────────────────
# dress shoes
# ─────────────────────────────────────────────────────────────────
def dress(throat=(250, 252), back=262, t=14, hh=30, toe=304, lace=True, collar_dip=280):
    D = Drawing(600, 420)
    F = (XT - 2, G - 8 - t)
    low, acc = bottom(F, t, 8, hh, xhb=146, xs=332, gap=8, welt=4)
    tx, ty = throat
    up = [('C', (52, G - hh - 30), (52, back + 30), (66, back)),
          ('C', (110, back + 2), (170, collar_dip), (tx - 30, collar_dip - 4)),
          ('C', (tx - 16, collar_dip - 8), (tx - 8, ty + 6), (tx, ty)),
          ('C', (tx + 50, ty + 22), (330, 286), (380, 292)),
          ('C', (440, 298), (500, toe + 6), (530, toe + 22)),
          ('C', (546, toe + 32), (548, F[1] - 6), F)]
    D.o(P((XB + 2, G - hh), up + low, True))
    D.a(acc)
    D.d('seamL', f'M70 {G - t - 1} L530 {G - t - 1}')
    D.d('stitch', f'M150 {G - t + 6} L534 {G - t + 6}')
    heel_lines(D, XB, 146, hh, 2, 8)
    D.light('M110 296 C200 292 300 296 420 300', 16, .22)
    D.light('M420 302 C470 306 510 314 530 324', 10, .26)
    D.dark(f'M90 {G - t - 10} C200 {G - t - 6} 380 {G - t - 6} 520 {G - t - 10}', 10, .16)
    return D, F


def oxford_shoe():
    D, F = dress()
    D.d('seam', 'M246 262 C270 286 300 300 330 300 C320 320 304 340 300 352')       # closed lacing: vamp over quarters
    D.d('stitch', 'M240 268 C262 290 290 304 318 306')
    D.d('seam', 'M140 352 C136 318 116 290 88 274')                                  # heel counter
    D.d('seam', 'M458 352 C460 326 474 308 498 304')                                 # cap toe
    D.d('stitch', 'M448 352 C450 324 466 304 492 298')
    eye = on_curve((250, 252), (300, 274), (330, 286), (380, 292), 4, .04, .5, (-4, 10))
    eyelets(D, eye, 2.8)
    lace_marks(D, eye, up=(8, -10), w=2.6)
    return D


def derby():
    D, F = dress(throat=(244, 246), t=16, toe=300)
    D.d('seam', 'M232 260 C252 290 290 306 332 310 C346 312 350 306 344 296')       # open lacing: quarter flap over vamp
    D.d('seam', 'M332 310 C320 324 306 340 302 350')
    D.d('stitch', 'M226 268 C246 296 284 314 326 318')
    D.d('seam', 'M140 350 C136 316 116 288 88 272')
    eye = on_curve((244, 246), (294, 270), (330, 284), (380, 292), 4, .06, .5, (-4, 12))
    eyelets(D, eye, 3)
    lace_marks(D, eye, up=(8, -10), w=2.6)
    return D


def brogue():
    D, F = dress(throat=(248, 250), toe=302)
    D.d('seam', 'M246 262 C270 286 300 300 330 300 C320 320 304 340 300 352')
    D.d('seam', 'M512 310 C470 300 440 312 426 330 C412 346 396 350 330 352')       # wingtip
    D.d('perf', 'M506 318 C470 308 446 320 432 336 C420 348 400 352 338 352')
    D.d('perf', 'M236 272 C262 294 294 308 324 306')
    D.d('perf', 'M138 344 C132 314 114 290 90 276')
    D.d('seam', 'M146 352 C142 316 120 286 92 270')
    D.d('perf', 'M490 326 L494 326 M500 330 L504 330 M488 336 L492 336')            # toe medallion
    eye = on_curve((248, 250), (300, 272), (330, 286), (380, 292), 4, .04, .5, (-4, 10))
    eyelets(D, eye, 2.8)
    lace_marks(D, eye, up=(8, -10), w=2.6)
    return D


def loafer_base(t=14, hh=26, back=268, throat=(262, 262), sole_dark=False):
    D = Drawing(600, 420)
    F = (XT - 2, G - 8 - t)
    low, acc = bottom(F, t, 8, hh, xhb=146, xs=332, gap=6 if hh > t else 0, welt=3)
    tx, ty = throat
    up = [('C', (52, G - hh - 30), (52, back + 30), (66, back)),
          ('C', (110, back + 4), (180, 290), (220, 286)),
          ('C', (240, 284), (250, ty + 6), (tx, ty)),
          ('C', (300, ty - 6), (340, 278), (400, 290)),
          ('C', (460, 300), (510, 306), (534, 322)),
          ('C', (548, 332), (548, F[1] - 6), F)]
    D.o(P((XB + 2, G - hh), up + low, True))
    D.a(acc)
    D.d('seam', 'M266 274 C320 272 380 286 430 296 C470 304 510 310 530 324')      # apron (moc) seam
    D.d('stitch', 'M268 282 C320 280 380 294 430 304 C470 312 506 318 526 330')
    D.d('seam', 'M136 352 C132 320 114 296 88 282')
    D.light('M110 304 C200 298 300 296 420 302', 16, .22)
    D.dark(f'M90 {G - t - 10} C200 {G - t - 6} 380 {G - t - 6} 520 {G - t - 10}', 10, .16)
    return D


def loafer():
    D = loafer_base()
    D.d('panel', 'M246 280 C258 268 284 266 304 270 L310 304 C290 304 266 306 252 312 Z')     # saddle strap
    welt_stitch(D, 14, 146, 532)
    heel_lines(D, XB, 146, 26, 2, 6)
    return D


def penny_loafer():
    D = loafer_base()
    D.d('panel', 'M246 280 C258 268 284 266 304 270 L310 304 C290 304 266 306 252 312 Z')
    D.d('hole', 'M266 286 C272 280 284 280 292 284 C286 292 274 294 266 286 Z')     # penny slot
    welt_stitch(D, 14, 146, 532)
    heel_lines(D, XB, 146, 26, 2, 6)
    return D


def horsebit():
    D = loafer_base(throat=(258, 266))
    D.d('hwLine', 'M262 270 C276 276 290 280 304 280')
    D.d('hw', circle(258, 278, 7), circle(306, 284, 7))
    D.d('hole', circle(258, 278, 3.4), circle(306, 284, 3.4))
    welt_stitch(D, 14, 146, 532)
    heel_lines(D, XB, 146, 26, 2, 6)
    return D


def monk():
    D, F = dress(throat=(262, 262), toe=304)
    D.d('seam', 'M262 266 C290 286 320 294 350 296 C332 316 316 336 312 352')       # vamp
    D.d('panel', 'M274 262 C252 264 220 274 196 288 L204 310 C232 296 262 290 296 288 Z')  # strap
    D.d('hw', rect(186, 284, 26, 28, 4))
    D.d('hole', rect(192, 290, 14, 16, 2))
    D.d('seam', 'M140 352 C136 318 116 290 88 274')
    D.d('seam', 'M458 352 C460 326 474 308 498 304')
    return D


def boat():
    D = loafer_base(t=22, hh=22, back=262, throat=(268, 256))
    D.d('ribW', 'M90 372 L520 372')
    for x in range(110, 520, 26):
        D.d('seamL', f'M{x} {G - 6} L{x + 6} {G - 14}')                          # siping
    eye = [(96, 272), (150, 284), (210, 284), (262, 264), (276, 260)]
    eyelets(D, eye, 3.4)
    d = 'M70 268 C110 272 160 290 210 286 C240 282 256 268 276 260'
    D.x(f'<path d="{d}" fill="none" stroke="#5f4b3a" stroke-width="5" stroke-linecap="round"/>')
    D.x('<path d="M276 260 C290 240 306 236 312 250 M276 260 C296 268 310 286 300 302 M276 260 C268 250 270 238 280 236" fill="none" stroke="#5f4b3a" stroke-width="4.4" stroke-linecap="round"/>')
    return D


def driver():
    D = loafer_base(t=8, hh=8, back=272, throat=(262, 264))
    # rubber pebbles running up the heel
    for x, y in [(70, 360), (74, 340), (82, 320), (100, 368), (130, 370), (160, 370), (190, 370), (380, 370), (410, 370), (440, 370), (470, 370)]:
        D.a(circle(x, y, 7))
    D.d('stitch', 'M140 350 C220 352 320 352 440 350')
    return D


# ─────────────────────────────────────────────────────────────────
# sandals, clogs, mules
# ─────────────────────────────────────────────────────────────────
def footbed(t, spring=6, hh=None, lugs=0, xhb=150, gap=0):
    F = (XT - 2, G - spring - t)
    low, acc = bottom(F, t, spring, hh or t, xhb=xhb, gap=gap, lugs=lugs)
    hh = hh or t
    top = [('L', (xhb + 16, G - hh)), ('C', (xhb + 70, G - hh), (290, G - t), (330, G - t)),
           ('L', (XT - 150, G - t)), ('C', (XT - 80, G - t), (XT - 34, F[1] + spring * .3), F)]
    return F, P((XB + 2, G - hh), list(__import__('lib').reverse(F, low)[1]) + [], False), acc, low, top


def base_shape(t, spring=6, hh=None, lugs=0, xhb=150, gap=0):
    F = (XT - 2, G - spring - t)
    low, acc = bottom(F, t, spring, hh or t, xhb=xhb, gap=gap, lugs=lugs)
    return acc


def slide():
    D = Drawing(600, 420)
    b = base_shape(34, 6)
    D.o(b)
    D.a(b)
    strap = 'M272 346 C276 300 300 262 346 252 C400 242 450 262 474 300 C484 316 488 332 488 346 Z'
    D.o(strap)
    D.d('seam', 'M282 346 C286 304 308 270 348 262 C396 254 440 270 462 304 C470 318 474 332 476 346')
    D.d('seamL', 'M70 356 C200 352 380 352 530 352')
    D.light('M310 286 C350 266 410 266 450 292', 14, .24)
    D.dark('M290 336 L470 336', 10, .14)
    return D


def flip_flop():
    D = Drawing(600, 420)
    b = base_shape(18, 4)
    D.o(b)
    D.a(b)
    D.o('M300 362 C330 330 380 306 432 300 C444 300 450 304 452 312 L456 362 L444 362 L440 316 C390 320 346 340 318 362 Z')
    D.d('hw', circle(446, 304, 6))
    D.d('seamL', 'M72 371 L534 371')
    D.light('M320 350 C350 326 390 312 430 308', 6, .3)
    return D


def sport_sandal():
    D = Drawing(600, 420)
    b = base_shape(36, 8, lugs=8)
    D.o(b)
    D.a(b)
    straps = [((448, 348), (452, 326), (462, 306), (480, 292), 30, 26),          # toe strap
              ((300, 346), (300, 314), (296, 282), (286, 254), 30, 26),          # instep strap
              ((86, 346), (80, 300), (86, 262), (104, 236), 28, 26)]             # heel strap
    for p0, c1, c2, p3, w, w1 in straps:
        D.o(band(p0, c1, c2, p3, w, w1))
    D.o(band((96, 240), (150, 230), (230, 226), (292, 250), 26))                  # ankle strap
    D.d('tint', band((180, 232), (200, 230), (220, 230), (242, 234), 22))         # hook-and-loop tab
    D.d('stitch', centre((300, 344), (300, 314), (296, 284), (286, 258)), centre((86, 344), (80, 300), (86, 264), (104, 240)),
        centre((448, 346), (452, 326), (462, 308), (480, 294)), centre((110, 236), (160, 226), (230, 222), (284, 246)))
    D.d('hw', rect(240, 222, 12, 30, 3))
    D.d('seamL', 'M68 352 L530 352')
    D.light('M120 232 C170 224 230 222 280 238', 8, .26)
    return D


def gladiator():
    D = Drawing(600, 420)
    b = base_shape(14, 6, hh=20, xhb=150, gap=4)
    D.o(b)
    D.a(b)
    D.o(band((84, 360), (80, 300), (80, 230), (84, 150), 22, 20))                 # heel spine
    for i, y in enumerate([340, 300, 262, 224, 186, 152]):
        x1 = 236 + i * 3 if i < 5 else 240
        D.o(band((86, y), (130, y - 4), (190, y - 6), (x1, y - 4 + (i * 2 if i < 3 else 0)), 16))
    D.o(band((236, 144), (238, 220), (258, 290), (300, 344), 22, 20))             # front T-strap
    D.o(band((420, 366), (430, 336), (450, 312), (480, 296), 24, 22))             # toe strap
    for y in [186, 224, 262]:
        D.d('hw', circle(84, y, 4))
    D.d('stitch', centre((236, 150), (238, 220), (258, 290), (296, 340)))
    D.d('seamL', 'M70 372 L536 372')
    return D


def clog():
    D = Drawing(600, 420)
    # moulded wooden base: tall heel, separate heel block, thick forepart
    base = ('M64 312 C120 312 180 314 230 322 C300 334 360 346 420 348 L520 348 C540 348 550 356 550 364 '
            'C550 374 542 380 528 380 L360 380 C320 380 290 374 262 364 L196 356 C190 356 186 360 186 366 L186 380 '
            'L74 380 C66 380 62 374 62 366 Z')
    D.o(base)
    D.a(base)
    D.o('M222 330 C228 296 250 268 290 256 C350 240 430 258 492 286 C528 302 546 324 548 348 L230 340 Z')   # leather upper
    for i in range(14):
        x = 240 + i * 22
        D.d('hw', circle(x, 338 + i * .7, 2.6))                                    # staples
    D.d('seamL', 'M64 330 C120 330 170 332 214 338 M190 366 L262 366')
    D.light('M270 272 C330 254 410 262 470 286', 16, .24)
    D.light('M90 322 C130 322 170 326 210 332', 8, .2)
    D.dark('M240 330 C340 336 440 342 530 346', 10, .16)
    return D


def mule():
    D = Drawing(600, 420)
    t, hh = 14, 30
    F = (XT - 2, G - 8 - t)
    low, acc = bottom(F, t, 8, hh, xhb=146, xs=332, gap=8)
    up = [('L', (200, G - hh - 6)),
          ('C', (220, G - hh - 10), (236, 300), (258, 278)),
          ('C', (290, 264), (340, 280), (400, 292)),
          ('C', (460, 302), (510, 306), (534, 322)),
          ('C', (548, 332), (548, F[1] - 6), F)]
    D.o(P((XB + 2, G - hh), up + low, True))
    D.a(acc)
    D.d('seamL', f'M70 {G - hh - 2} L210 {G - hh - 4}')
    D.d('stitch', 'M226 336 C238 310 250 292 266 284')
    D.d('seam', 'M270 276 C330 276 390 290 440 300')
    heel_lines(D, XB, 146, hh, 2, 8)
    D.light('M280 290 C340 288 420 296 500 310', 14, .22)
    D.dark(f'M230 {G - t - 10} C300 {G - t - 6} 400 {G - t - 6} 520 {G - t - 10}', 10, .16)
    return D


def espadrille():
    D = Drawing(600, 420)
    t = 30
    F = (XT - 2, G - 6 - t)
    low, acc = bottom(F, t, 6, t, gap=0)
    up = [('C', (52, G - t - 20), (54, 296), (68, 286)),
          ('C', (110, 288), (190, 300), (236, 296)),
          ('C', (256, 294), (264, 284), (280, 280)),
          ('C', (330, 272), (380, 284), (420, 292)),
          ('C', (476, 302), (520, 306), (536, 320)),
          ('C', (548, 330), (548, F[1] - 6), F)]
    D.o(P((XB + 2, G - t), up + low, True))
    D.a(acc)
    for i in range(1, 4):
        y = G - t + i * t / 4
        D.d('seamL', f'M66 {f(y)} C200 {f(y + 1)} 400 {f(y + 1)} 540 {f(y - 3)}')        # braided jute
    D.d('stitch', f'M70 {G - t - 5} L534 {G - t - 7}')
    D.d('seam', 'M286 290 C320 300 330 320 324 346')
    D.light('M330 300 C380 300 420 304 460 310', 12, .2)
    return D


def fisherman():
    D = Drawing(600, 420)
    t, hh = 16, 24
    F = (XT - 2, G - 8 - t)
    low, acc = bottom(F, t, 8, hh, xhb=146, xs=332, gap=6)
    up = [('C', (52, G - hh - 30), (52, 290), (66, 272)),
          ('C', (110, 268), (200, 262), (240, 258)),                  # ankle strap line
          ('C', (276, 254), (300, 268), (330, 280)),
          ('C', (400, 294), (480, 300), (530, 318)),
          ('C', (548, 328), (548, F[1] - 6), F)]
    D.o(P((XB + 2, G - hh), up + low, True))
    D.a(acc)
    for i, (x0, x1) in enumerate([(300, 330), (350, 380), (400, 430), (450, 478)]):
        y = 300 + i * 6
        D.d('hole', f'M{x0} {y} C{x0 + 6} {y - 10} {x1 - 6} {y - 10} {x1} {y} C{x1 - 6} {y + 34} {x0 + 6} {y + 34} {x0} {y} Z')  # woven cut-outs
    D.d('hole', 'M120 300 C140 290 180 288 210 296 C200 326 150 330 120 300 Z')   # heel window
    D.d('seam', 'M70 272 L242 260')
    D.d('hw', rect(222, 252, 20, 18, 3))
    D.light('M310 290 C380 296 460 306 520 322', 10, .2)
    return D


# ─────────────────────────────────────────────────────────────────
# flats
# ─────────────────────────────────────────────────────────────────
def flat(toe='round', back=298, throat=(318, 322), t=10, hh=18, vamp=316):
    D = Drawing(600, 420)
    F = (XT - 2, G - 6 - t)
    low, acc = bottom(F, t, 6, hh, xhb=140, xs=330, gap=4)
    tx, ty = throat
    up = [('C', (52, G - hh - 20), (54, back + 18), (66, back)),
          ('C', (120, back + 4), (200, ty - 4), (tx, ty)),
          ('C', (360, ty + 2), (390, vamp), (440, vamp + 2))]
    if toe == 'pointed':
        up += [('C', (490, vamp + 6), (530, 350), F)]
    else:
        up += [('C', (504, vamp + 4), (540, 326), (546, 344)), ('C', (549, 352), (548, F[1] - 3), F)]
    D.o(P((XB + 2, G - hh), up + low, True))
    D.a(acc)
    D.d('edge', f'M70 {back + 6} C120 {back + 10} 200 {ty + 2} {tx} {ty + 6}')
    D.light('M110 330 C200 332 300 334 440 330', 12, .2)
    D.dark(f'M90 {G - t - 10} C200 {G - t - 6} 380 {G - t - 6} 520 {G - t - 10}', 8, .14)
    return D


def ballet_flat():
    D = flat('round', back=300, throat=(320, 326), vamp=318)
    D.x('<path d="M326 324 C312 310 300 316 304 326 C300 336 312 340 326 328 C340 340 352 336 348 326 C352 316 340 310 326 324 Z" fill="#000" fill-opacity=".18" stroke="#000" stroke-opacity=".45" stroke-width="1.4"/>')
    return D


def mary_jane():
    D = flat('round', back=294, throat=(320, 318), t=14, hh=24, vamp=310)
    D.o(band((222, 318), (240, 296), (264, 278), (296, 262), 18, 16))               # instep strap
    D.d('button', circle(226, 312, 5.5))
    D.d('stitch', centre((232, 306), (248, 290), (268, 276), (292, 264)))
    return D


def pointed_flat():
    D = flat('pointed', back=300, throat=(316, 324), vamp=322)
    D.d('seamL', 'M320 328 C370 330 430 336 500 350')
    return D


SHOES.update({
    'chelsea': chelsea, 'combat': combat, 'workBoot': work_boot, 'hiking': hiking, 'chukka': chukka,
    'desert': desert, 'cowboyBoot': cowboy, 'moto': moto, 'rainBoot': rain_boot, 'snowBoot': snow_boot,
    'ankleBoot': ankle_boot, 'oxfordShoe': oxford_shoe, 'derby': derby, 'brogue': brogue, 'loafer': loafer,
    'pennyLoafer': penny_loafer, 'horsebit': horsebit, 'monk': monk, 'boat': boat, 'driver': driver,
    'slide': slide, 'flipFlop': flip_flop, 'sportSandal': sport_sandal, 'gladiator': gladiator, 'clog': clog,
    'mule': mule, 'espadrille': espadrille, 'fisherman': fisherman, 'pump': pump, 'stiletto': stiletto,
    'blockHeel': block_heel, 'kittenHeel': kitten_heel, 'wedgeHeel': wedge_heel, 'heeledSandal': heeled_sandal,
    'balletFlat': ballet_flat, 'maryJane': mary_jane, 'loaferFlat': pointed_flat,
})

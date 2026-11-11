"""Draw a Stream Deck + XL to scale, with the plugin's own faces on its keys and touch strip.

    python tools/deck-device.py <hwinfo-streamdeck>/.github/readme/hero.png public/assets

The faces come from the plugin's README board (36 keys and six dial faces, drawn by the plugin
with sample values). They are cut out and set where the hardware has them.

Geometry, in panel pixels (the device has one 1280 x 800 LCD behind the keys and the strip):
  keys and strip   Elgato's published layout, as in the plugin's DECK_PANELS[13]: 112 px keys at
                   x = 11 + 143c + floor(c/2), y = 32, 176, 318, 462; the strip 1200 x 100 at (40, 674)
  scale            Elgato gives the strip as 161 mm wide, so 1200 px = 161 mm (7.453 px per mm),
                   and the body as 205 mm wide
  body, glass,     measured on the photograph of the device (marketing/ in hwinfo-streamdeck),
  dial bay, dials  converted through the key pitch: 357.4 photo px = 143.4 panel px

The page shows the result 205 mm wide (see --deck in index.html). No logo is drawn.
Writes deck-plusxl-{880,1320,1760,2619}-v1.webp with a transparent ground. Needs Pillow and NumPy.
"""
import sys

import numpy as np
from PIL import Image, ImageDraw

VERSION = "v1"
PLATE = np.array([17, 19, 23])               # the README board's backdrop
S = 192 / 112                                 # output px per panel px: key faces keep their own pixels
SS = 2                                        # supersampling for the drawn parts

# panel pixels, origin at the LCD's top left
KEY, KEY_X, KEY_Y = 112, [11 + 143 * c + c // 2 for c in range(9)], [32, 176, 318, 462]
STRIP = (40, 674, 1200, 100)
BODY = (-124, -89, 1404, 1279)                # 1528 x 1368: 205 x 183.5 mm
BODY_R, CAP, CAP_R, FACE_R = 40, 118, 19, 17.5
GLASS = (-11, 622, 1291, 816)
BAY, BAY_R = (-31, 907, 1311, 1159), 36
KNOB_X0, KNOB_PITCH, KNOB_Y, KNOB_D = 633.6 - 2.5 * 210.7, 210.7, 1033, 86

COL = dict(body=(22, 24, 28), edge=(48, 53, 62), well=(4, 5, 6), glass=(3, 3, 4), glass_edge=(30, 33, 39),
           bay=(11, 12, 15), bay_edge=(5, 6, 7), knob=(27, 30, 35), knob_edge=(58, 63, 73), knob_top=(36, 40, 47))


def runs(mask):
    """Start and end of each run of True in a 1-D mask."""
    edges = np.flatnonzero(np.diff(np.concatenate([[0], mask.astype(np.int8), [0]])))
    return list(zip(edges[::2], edges[1::2]))


def faces(board):
    """The key faces (4 rows of 9) and the dial faces (6) of the README board, as RGB images."""
    a = np.asarray(board.convert("RGB")).astype(int)
    ink = np.abs(a - PLATE).max(axis=2) > 6
    rows = [r for r in runs(ink.any(axis=1)) if r[1] - r[0] > 60]
    assert len(rows) == 5, rows
    keys = []
    for top, bottom in rows[:4]:
        cols = [c for c in runs(ink[top:bottom].any(axis=0)) if c[1] - c[0] > 60]
        assert len(cols) == 9, cols
        keys.append([board.crop((l, top, r, bottom)).convert("RGB") for l, r in cols])
    top, bottom = rows[4]
    cols = [c for c in runs(ink[top:bottom].any(axis=0)) if c[1] - c[0] > 60]
    assert len(cols) == 6, cols
    dials = [board.crop((l, top, r, bottom)).convert("RGB") for l, r in cols]
    return keys, dials


def square_corners(face):
    """A dial face has rounded corners on the board; on the strip the six segments meet edge to
    edge. Fill what lies outside each corner's arc with the face's own background, read from the
    face's edge just beside the corner."""
    a = np.asarray(face).astype(int)
    out = a.copy()
    h, w = a.shape[:2]
    # the corner radius: how far along the top edge the board's backdrop runs before the face starts
    r = int(np.argmax(np.abs(a[0] - PLATE).max(axis=1) > 6)) + 2
    yy, xx = np.mgrid[0:r, 0:r]
    outside = np.hypot(xx - r, yy - r) > r - 2.5          # top-left corner; mirrored for the others
    for flip_y, flip_x in ((False, False), (False, True), (True, False), (True, True)):
        ys = slice(h - r, h) if flip_y else slice(0, r)
        xs = slice(w - r, w) if flip_x else slice(0, r)
        edge_y = h - 3 if flip_y else 2
        edge_x = slice(w - r - 10, w - r - 2) if flip_x else slice(r + 2, r + 10)
        fill = np.median(a[edge_y, edge_x], axis=0)
        mask = outside[::-1] if flip_y else outside
        mask = mask[:, ::-1] if flip_x else mask
        out[ys, xs][mask] = fill
    return Image.fromarray(out.astype(np.uint8))


def main(board_path, out_dir):
    board = Image.open(board_path)
    keys, dials = faces(board)
    ox, oy = -BODY[0], -BODY[1]
    W, H = round((BODY[2] - BODY[0]) * S), round((BODY[3] - BODY[1]) * S)

    def px(v, k=S * SS):
        return round(v * k)

    def box(x0, y0, x1, y1):
        return [px(x0 + ox), px(y0 + oy), px(x1 + ox), px(y1 + oy)]

    # the drawn parts, at 2x, then reduced
    art = Image.new("RGBA", (W * SS, H * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(art)
    d.rounded_rectangle(box(*BODY), px(BODY_R), fill=COL["edge"])
    d.rounded_rectangle([b + s for b, s in zip(box(*BODY), (4, 4, -4, -4))], px(BODY_R) - 4, fill=COL["body"])
    for y in KEY_Y:
        for x in KEY_X:
            c = (CAP - KEY) / 2
            d.rounded_rectangle(box(x - c, y - c, x + KEY + c, y + KEY + c), px(CAP_R), fill=COL["well"])
    d.rounded_rectangle(box(*GLASS), px(8), fill=COL["glass_edge"])
    d.rounded_rectangle([b + s for b, s in zip(box(*GLASS), (3, 3, -3, -3))], px(8) - 3, fill=COL["glass"])
    d.rounded_rectangle(box(*BAY), px(BAY_R), fill=COL["bay_edge"])
    d.rounded_rectangle([b + s for b, s in zip(box(*BAY), (4, 4, -4, -4))], px(BAY_R) - 4, fill=COL["bay"])
    for i in range(6):
        cx, r = KNOB_X0 + i * KNOB_PITCH, KNOB_D / 2
        d.ellipse(box(cx - r, KNOB_Y - r, cx + r, KNOB_Y + r), fill=COL["knob_edge"])
        d.ellipse([b + s for b, s in zip(box(cx - r, KNOB_Y - r, cx + r, KNOB_Y + r), (5, 5, -5, -5))], fill=COL["knob"])
        t = r * 0.74
        d.ellipse(box(cx - t, KNOB_Y - t, cx + t, KNOB_Y + t), fill=COL["knob_top"])
    out = art.resize((W, H), Image.LANCZOS)

    def rounded(size, radius):
        m = Image.new("L", (size[0] * SS, size[1] * SS), 0)
        ImageDraw.Draw(m).rounded_rectangle([0, 0, size[0] * SS - 1, size[1] * SS - 1], radius * SS, fill=255)
        return m.resize(size, Image.LANCZOS)

    # the faces, at their own pixels
    for r, y in enumerate(KEY_Y):
        for c, x in enumerate(KEY_X):
            face = keys[r][c]
            if face.size != (round(KEY * S), round(KEY * S)):
                face = face.resize((round(KEY * S), round(KEY * S)), Image.LANCZOS)
            out.paste(face, (round((x + ox) * S), round((y + oy) * S)), rounded(face.size, round(FACE_R * S)))
    sx, sy, sw, sh = STRIP
    strip = Image.new("RGB", (round(sw * S), round(sh * S)))
    for i, face in enumerate(dials):
        left, right = round(i * sw * S / 6), round((i + 1) * sw * S / 6)
        strip.paste(square_corners(face).resize((right - left, strip.height), Image.LANCZOS), (left, 0))
    out.paste(strip, (round((sx + ox) * S), round((sy + oy) * S)), rounded(strip.size, round(5 * S)))

    for width in (880, 1320, 1760, W):
        img = out if width == W else out.resize((width, round(H * width / W)), Image.LANCZOS)
        path = f"{out_dir}/deck-plusxl-{width}-{VERSION}.webp"
        img.save(path, "WEBP", quality=86, method=6)
        print(path, img.size)
    print(f"body {(BODY[2] - BODY[0]) / 7.453:.1f} x {(BODY[3] - BODY[1]) / 7.453:.1f} mm; "
          f"key {KEY / 7.453:.1f} mm on a {143.4 / 7.453:.1f} mm pitch; strip {sw / 7.453:.0f} x {sh / 7.453:.1f} mm")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])

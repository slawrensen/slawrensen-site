"""Put a plugin-drawn board on the site's board backdrop, with the site's margin.

    python tools/board-backdrop.py <board-in.png|webp> <public/assets/name-vN.webp>

The boards come from the plugin repositories on their own flat backdrops (near
black, blue-grey, navy), some with transparent rounded corners, each with a
different amount of empty space around the faces. The page draws all of them
on one colour, --board in index.html, with one margin.

This replaces only the backdrop. It is found by flood fill from the image
border, so a key or dial face that happens to contain the same colour is left
alone, and every face stays pixel-identical. Caption text drawn on the backdrop
has its anti-aliased edge shifted by the share of backdrop it contains. The
result is then trimmed to its content and padded by MARGIN of the content width.

Needs Pillow and NumPy. Give the output a new -vN name, add it to _headers and
redirect the old name in _redirects. The script prints the output size for the
width and height attributes.
"""
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

BOARD = np.array([16, 15, 12], dtype=np.int16)  # #100f0c, --board
MARGIN = 0.022  # of the content width, on every side


def mask_image(mask):
    return Image.fromarray((mask * 255).astype(np.uint8)).convert("L").copy()


def flatten(image):
    """Composite transparent corners onto the image's own backdrop colour."""
    if image.mode != "RGBA":
        return image.convert("RGB")
    rgba = np.asarray(image)
    opaque = rgba[rgba[..., 3] == 255][:, :3]
    edge = np.concatenate([rgba[0], rgba[-1], rgba[:, 0], rgba[:, -1]])
    edge = edge[edge[:, 3] == 255][:, :3]
    pool = edge if len(edge) else opaque
    colours, counts = np.unique(pool, axis=0, return_counts=True)
    backdrop = tuple(int(v) for v in colours[counts.argmax()])
    base = Image.new("RGB", image.size, backdrop)
    base.paste(image, mask=image.getchannel("A"))
    return base


def main(src, out):
    image = flatten(Image.open(src))
    width, height = image.size
    pixels = np.asarray(image).astype(np.int16)

    border = np.concatenate([pixels[0], pixels[-1], pixels[:, 0], pixels[:, -1]])
    colours, counts = np.unique(border, axis=0, return_counts=True)
    backdrop = colours[counts.argmax()]
    distance = np.abs(pixels - backdrop).max(axis=2)
    matches = distance <= 3

    flood = mask_image(matches)
    for x in range(0, width, 3):
        for y in (0, height - 1):
            if flood.getpixel((x, y)) == 255:
                ImageDraw.floodfill(flood, (x, y), 128)
    for y in range(0, height, 3):
        for x in (0, width - 1):
            if flood.getpixel((x, y)) == 255:
                ImageDraw.floodfill(flood, (x, y), 128)
    flooded = np.array(flood) == 128

    # Backdrop enclosed by caption letters (the counters of o, a, e) sits beside the flooded area.
    beside = np.asarray(mask_image(flooded).filter(ImageFilter.MaxFilter(13))) > 0
    solid = flooded | (matches & beside)
    rim = (np.asarray(mask_image(solid).filter(ImageFilter.MaxFilter(5))) > 0) & ~solid
    weight = np.clip(1 - distance / 40.0, 0, 1) * rim

    result = pixels.copy()
    result[solid] = BOARD
    result = result + (weight[..., None] * (BOARD - backdrop)).round().astype(np.int16)
    result = np.clip(result, 0, 255).astype(np.uint8)
    untouched = 100 * (~(result.astype(np.int16) - pixels).any(axis=2)).mean()

    # Trim to the content, then pad every side by the same share of the content width.
    content = ~solid
    rows = np.flatnonzero(content.any(axis=1))
    cols = np.flatnonzero(content.any(axis=0))
    trimmed = Image.fromarray(result).crop((cols[0], rows[0], cols[-1] + 1, rows[-1] + 1))
    pad = round(MARGIN * trimmed.width)
    board = Image.new("RGB", (trimmed.width + 2 * pad, trimmed.height + 2 * pad), tuple(int(v) for v in BOARD))
    board.paste(trimmed, (pad, pad))
    board.save(out, "WEBP", quality=90, method=6)

    print(f"{src}: backdrop {tuple(int(v) for v in backdrop)} -> {tuple(int(v) for v in BOARD)}, "
          f"{untouched:.1f}% of pixels untouched, margin {pad}px, "
          f'width="{board.width}" height="{board.height}"')


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])

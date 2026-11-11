"""Put a plugin-drawn board on the site's board backdrop.

    python tools/board-backdrop.py <board-in.webp|png> <public/assets/name-vN.webp>

The boards come from the plugin repositories on their own flat backdrops (near
black, blue-grey, navy). The page draws all of them on one colour, --board in
index.html. This replaces only that backdrop: it is found by flood fill from the
image border, so a key or dial face that happens to contain the same colour is
left alone, and every face stays pixel-identical. Caption text drawn on the
backdrop has its anti-aliased edge shifted by the share of backdrop it contains.

Needs Pillow and NumPy. Give the output a new -vN name, add it to _headers and
redirect the old name in _redirects.
"""
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

BOARD = np.array([16, 15, 12], dtype=np.int16)  # #100f0c, --board


def mask_image(mask):
    return Image.fromarray((mask * 255).astype(np.uint8)).convert("L").copy()


def main(src, out):
    image = Image.open(src).convert("RGB")
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
    print(f"{src}: backdrop {tuple(int(v) for v in backdrop)} -> {tuple(int(v) for v in BOARD)}, "
          f"{100 * solid.mean():.1f}% backdrop, {untouched:.1f}% of pixels untouched")
    Image.fromarray(result).save(out, "WEBP", quality=90, method=6)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])

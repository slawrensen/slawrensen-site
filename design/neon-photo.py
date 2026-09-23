"""Crops and grade of the hardware photograph for the neon-noir homepage.

The photograph is the product repository's master
(`marketing/hwinfo-streamdeckxlplus.png`, a Camera Raw develop of the Sony
A7 III capture of the plugin running on a Stream Deck + XL). Nothing is added
or moved. The grade only touches the shadows: dark, low-saturation areas
(the desk, the bezel, the room) are pulled towards a cool black so the lit
key screens carry the frame. Pixels brighter than the shadow threshold, which
includes every key and touch-strip screen, keep their original values.

    python design/neon-photo.py <master.png> public/assets [--preview]

Writes the versioned WebP files the page uses (see CROPS below).
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

# name: (left, top, right, bottom) in master pixels, then output widths.
CROPS = {
    # Desktop: the keys and the touch strip from the fifth column to the
    # device's right edge, where the amber and red demo keys sit. Starts
    # below the Elgato wordmark; ends on the bezel, before the desk.
    "neon-deck-v1": ((1560, 385, 3890, 2560), [960, 1440, 2000]),
    # Phone: a portrait cut of the right-hand columns, ending in the dark
    # gap above the touch strip so the words can rise out of black.
    "neon-keys-v1": ((2240, 385, 3730, 1990), [600, 900, 1200]),
    # One reading, 59.0 degrees C, on three keys: the first key of the deck
    # (normal), and the two demo keys set past their warn and critical
    # thresholds. Native resolution: the photograph has no more detail.
    # Each is a 340 px square centred on the key, whose rim spans about
    # 300 px; the page clips to the rim.
    "key-normal-v1": ((402, 439, 742, 779), [340]),
    "key-warn-v1": ((3269, 1116, 3609, 1456), [340]),
    "key-crit-v1": ((3269, 1478, 3609, 1818), [340]),
}


def grade(rgb: np.ndarray) -> np.ndarray:
    """Cool, crushed shadows; lit screens untouched."""
    x = rgb.astype(np.float32) / 255.0
    lum = 0.2126 * x[..., 0] + 0.7152 * x[..., 1] + 0.0722 * x[..., 2]
    # 1 in deep shadow, falling to 0 by 24 % luminance.
    m = np.clip((0.24 - lum) / 0.24, 0.0, 1.0) ** 0.75
    grey = lum[..., None].repeat(3, axis=2)
    cool = grey * np.array([0.78, 0.90, 1.12], dtype=np.float32) * 0.62
    out = x * (1.0 - m[..., None]) + cool * m[..., None]
    # Black point: the darkest 1.5 % of the range goes to black.
    out = np.clip((out - 0.015) / 0.985, 0.0, 1.0)
    return (out * 255.0 + 0.5).astype(np.uint8)


def main() -> None:
    src, out_dir = Path(sys.argv[1]), Path(sys.argv[2])
    out_dir.mkdir(parents=True, exist_ok=True)
    master = Image.open(src).convert("RGB")
    graded = Image.fromarray(grade(np.asarray(master)))
    if "--preview" in sys.argv:
        graded.resize((1100, round(1100 * master.height / master.width)), Image.LANCZOS).save(out_dir / "graded-preview.jpg", quality=88)
    for name, (box, widths) in CROPS.items():
        crop = graded.crop(box)
        for w in widths:
            h = round(w * crop.height / crop.width)
            suffix = "" if w == widths[-1] else f"-{w}"
            # Keys are small and seen up close: less compression.
            q = 88 if name.startswith("key-") else 74
            crop.resize((w, h), Image.LANCZOS).save(out_dir / f"{name}{suffix}.webp", quality=q, method=6)
            print(f"{name}{suffix}.webp {w}x{h}")


if __name__ == "__main__":
    main()

"""Cut the hero photograph from the photo master in the hwinfo-streamdeck repository.

    python tools/hero-crop.py <path/to/marketing/hwinfo-streamdeckxlplus-squared.png> public/assets

Keeps the full width and the band from 3.5% to 66.5% of the height: the Stream
Deck logo, the 36 keys and the touch strip. Writes deck-keys-{800,1400,2200}-v1.webp
for the srcset in index.html. No grading: the master's develop is used as it is.
Change the -vN when the bytes change.
"""
import sys

from PIL import Image

VERSION = "v1"
SIZES = ((800, 78), (1400, 78), (2200, 74))  # width, WebP quality


def main(master, out_dir):
    photo = Image.open(master).convert("RGB")
    width, height = photo.size
    band = photo.crop((0, int(0.035 * height), width, int(0.665 * height)))
    for target, quality in SIZES:
        size = (target, round(band.height * target / band.width))
        path = f"{out_dir}/deck-keys-{target}-{VERSION}.webp"
        band.resize(size, Image.LANCZOS).save(path, "WEBP", quality=quality, method=6)
        print(path, size)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])

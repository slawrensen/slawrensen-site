"""Cut the hero photographs from the photo master in the hwinfo-streamdeck repository.

    python tools/hero-crop.py <path/to/marketing/hwinfo-streamdeckxlplus-squared.png> public/assets

Two crops, for the <picture> in index.html:

  deck-keys-{800,1400,2200}-v1.webp   wide screens: the full width and 3.5% to 66.5% of the
                                       height (the Stream Deck logo, 36 keys, the touch strip)
  deck-keys-phone-{800,1200}-v1.webp  under 40em: the right-hand five columns of keys, cut
                                       between columns, so a key is about 60 px across on a phone

No grading: the master's develop is used as it is. Change the -vN when the bytes change.
"""
import sys

from PIL import Image

VERSION = "v1"
CROPS = (
    # name, box as fractions of the master (left, top, right, bottom), ((width, WebP quality), ...)
    ("deck-keys", (0.0, 0.035, 1.0, 0.665), ((800, 78), (1400, 78), (2200, 74))),
    ("deck-keys-phone", (0.441, 0.095, 0.905, 0.505), ((800, 78), (1200, 76))),
)


def main(master, out_dir):
    photo = Image.open(master).convert("RGB")
    width, height = photo.size
    for name, (left, top, right, bottom), sizes in CROPS:
        crop = photo.crop((int(left * width), int(top * height), int(right * width), int(bottom * height)))
        for target, quality in sizes:
            size = (target, round(crop.height * target / crop.width))
            path = f"{out_dir}/{name}-{target}-{VERSION}.webp"
            crop.resize(size, Image.LANCZOS).save(path, "WEBP", quality=quality, method=6)
            print(path, size)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])

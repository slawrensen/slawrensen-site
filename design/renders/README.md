# Key and dial faces

`public/assets/face-*-v1.webp` and `dial-*-v1.webp` are the plugin's own
renderer output, not drawings. `site-faces.mjs` produces them: it calls the
renderers in `src/ui/` of
[slawrensen/hwinfo-streamdeck](https://github.com/slawrensen/hwinfo-streamdeck)
with exactly the inputs of that repository's `scripts/contact-sheet.mjs`, and
rasterises the SVG they return at 3x density so the faces stay sharp on
high-density screens (the docs' contact sheet is 1x). The readings are the
contact sheet's fixed demo values.

To regenerate, from a checkout of the product repository at the release tag:

```
git clone --branch v1.6.0 https://github.com/slawrensen/hwinfo-streamdeck.git
cd hwinfo-streamdeck
npm ci --ignore-scripts
cp <this repo>/design/renders/site-faces.mjs scripts/
npx tsx scripts/site-faces.mjs <output dir>
```

Run it three times, with `<output dir> 1 -1x`, `<output dir> 2 -2x` and
`<output dir> 3`; the page serves all three through `srcset` (`-v1-144`,
`-v1-288` and `-v1` for keys; `-v1-233`, `-v1-466` and `-v1` for dials), so
each screen downloads only the density it shows. For a changed face, copy the
files into `public/assets/` under a new version (`-v2`) and add the old names
to `public/_redirects`. Rendered 2026-09-22 on Windows with
Segoe UI, as the documentation images were; each face matches the published
1x render to within 1.2/255 mean difference per channel when downscaled.

`deck-dials-v1-*.webp` and `deck-keys-v1-*.webp` are crops of the hardware
photograph master (`marketing/hwinfo-streamdeckxlplus.png` in the product
repository): keys and strip `(390, 390)–(3610, 2420)`, strip and dials
`(330, 1900)–(3770, 3330)`, resized with Lanczos, WebP quality 80.

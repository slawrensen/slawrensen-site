# The SL mark

`sl-mark.mjs` is the source of truth. It draws the letters as two stroked
paths on a 64-unit tile and writes `sl-mark.svg` and `sl-letters.json`
(the raw path data the site inlines). `specimen.html` shows the result at
16–256 px on dark and light grounds and as a circular avatar crop, next to the
previous favicon. Run `node design/mark/sl-mark.mjs` after changing a
parameter, then copy the path into `public/favicon.svg` and the inline marks.

## What was wrong before

Three renderings of "SL" disagreed: the favicon used SVG `<text>` in
Consolas 800; the header and footer used HTML text in the `--mono` font stack
(SF Mono, Cascadia Code, JetBrains Mono, Consolas, then `monospace`), so the
letters changed shape per platform; the docs hub uses a different "pulse"
avatar entirely (not changed here: it lives in another repository).

## What was kept

- The rounded tile at 64 units with corner radius 15.
- Dark letters on the light blue signal colour (`#5cb8ff` is the previous
  gradient's start colour, so the tile still reads as the same mark). The
  violet half of the gradient was dropped: a solid tile survives 16 px, print
  and forced colours better.
- A bold, squared, monospaced-feeling "SL".

## Geometry

| Parameter | Value | Reason |
| --- | --- | --- |
| Stroke | 6 | 20 % of cap height: close to the old Consolas Bold weight, and still 1.5 px at 16 px |
| Cap height | 30 | leaves 16.5–17.5 units of air above and below |
| S width / L width / gap | 19 / 15.5 / 5 | S slightly wider than L so the pair balances |
| S corner radius | 4.5 (centreline) | short straight verticals keep both counters open at 16 px and repeat the L's right angle; a fully round bowl (tested) closed the counters to pinholes |
| Caps / joins | butt / miter | flat terminals, crisp corner on the L |
| Optical offset | +1.125 x, −0.5 y | see below |

## Optical centring (measured)

Rasterised at 512 px in Chromium and measured with PIL. With the letters
geometrically centred, the ink centroid sits left of and below the tile
centre, because the L's foot and its open top-right corner put the mass
bottom-left. The offset was chosen so the midpoint of the ink bounding-box
centre and the ink centroid lands on the tile centre:

| | x | y |
| --- | --- | --- |
| Ink bounding-box centre | 33.12 | 31.50 |
| Ink centroid | 30.89 | 32.64 |
| Midpoint (target 32, 32) | 32.01 | 32.07 |

Resulting padding: left 13.38, right 11.12, top 16.5, bottom 17.5 units. The
left pad is larger by design: equal pads looked shifted left.

## The bracket

The L's corner (a vertical and a horizontal stroke meeting square) is the one
shape the site borrows from the mark: image frames, fact panels and the
current-section marker use an L-shaped corner at the mark's stroke-to-height
ratio. It is plain geometry, so it survives with animation, gradients and
shadows removed, and in forced-colours mode.

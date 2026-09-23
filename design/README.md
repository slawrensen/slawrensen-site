# Design notes

The homepage is a warm, dark graphic poster made entirely from the plugin's
own output. There are no photographs. Every key and dial face is drawn by the
plugin's renderers, the device around them is drawn to the proportions of
the real hardware, and every colour comes from the plugin's `themes.json`.
It is dark on every page, 404 included.

## Where things come from

- **Faces:** `render-faces.mjs` imports `src/ui/` from a checkout of
  [hwinfo-streamdeck](https://github.com/slawrensen/hwinfo-streamdeck) at
  the release tag. It draws:
  - the 36 keys and six dial faces that the product photograph's deck was
    showing, in each of the seven themes
  - one reading at normal, warn and critical
  - the 404 page's status key

  The readings are example values, and the page says so ("Example readings").
- **The device:** a Stream Deck + XL, redrawn by the same script from
  measurements of the product photograph
  (`marketing/hwinfo-streamdeckxlplus.png`, straightened by the 1.0° it was
  shot at). Every measurement is written at the top of the script:
  - body 3750 × 3358 px
  - 9 × 4 keys, 294 px each on a 357.4 px pitch
  - touch strip 2960 × 248 px (the 12:1 of its 1200 × 100 screen) in a
    glass panel
  - six knobs on a 525 px pitch in a recessed bay

  The Elgato wordmark is left off.
- **Colour:**
  - The page is the Paper theme turned over: its ink `#14120d` is the
    background, and its paper, softened to `#e2ddd1`, is the text (13:1).
  - It opens on Ember (`#e0912f`), the warmest theme. Its accent colours
    the button, the sparkline under the headline and the light behind the
    deck.
  - Picking another theme swaps the deck and moves that accent to the
    theme's own colour.
  - Amber `#e8940d` and the plugin's status-screen red `#ff5d52` mark the
    alert words.
- **Type:** Segoe UI, the face the plugin draws its keys in. Other systems
  use their own UI font.

```
cd <hwinfo-streamdeck checkout at the release tag>
npm ci
npx tsx <this repo>/design/render-faces.mjs <this repo>/public/assets
```

If a picture changes, write it under a new version instead of overwriting
it: files in `public/assets/` are cached as immutable for a year.

## Eye-safe dark

This follows the plugin's own screen rules:
- **No pure white:** it blooms and tires the eye. The brightest text is
  `#e2ddd1`.
- **No pure black page:** the background is warm `#14120d`.
- **No large bright areas:**
  - The light behind the deck is a dim ember disc, about 20% of the accent
    mixed into the background.
  - The alert keys, whole amber and red fields, stay small.
  - The only bright block is the main button.
- **Contrast:** every text colour is at least 5.5:1, and body text is 8:1
  or more.

## Word budget

The page stays between 80 and 120 visible words. The ceiling is 140, and it
counts navigation, captions, controls and the footer. Alt text, the skip link
and the visually hidden legend are not counted. The legal fine print is
exempt from the budget and counted separately.

| Region | Words |
| --- | --- |
| Header | 4 |
| Opening: kicker, headline, line, actions, requirements, theme names, caption | 46 |
| Product: name, benefit, facts, links, state labels | 27 |
| Maker: label, name, statement, links | 17 |
| Footer (copyright) | 3 |
| **Counted** | **97** |
| Legal fine print | 39 |

Before adding a word, take one out. Details belong behind the Docs link.

## Rules

- **One accent at a time:** the chosen theme's. The alert amber and red
  appear only where they mean an alert.
- **No script:** the theme picker is native radio buttons and CSS `:has()`.
  Browsers without `:has()` show the Ember deck with no picker.
- **Motion:** nothing moves on its own. The accent colour cross-fades when
  the theme changes, and even that is off under reduced motion.
- **Print:** the page prints as dark ink on white. The drawn device and key
  faces keep their own colours.

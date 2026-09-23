# Design notes

The homepage is a warm graphic poster made entirely from the plugin's own
output. There are no photographs. Every picture is drawn by the plugin's
renderers, and every colour comes from its `themes.json`.

## Where things come from

- **Pictures:** `render-faces.mjs` imports `src/ui/` from a checkout of
  [hwinfo-streamdeck](https://github.com/slawrensen/hwinfo-streamdeck) at
  the release tag. It draws:
  - the screens of a Stream Deck + in all seven themes
  - one reading at normal, warn and critical
  - the 404 page's status key

  The readings are fixed example values for one consistent machine, and the
  page says so ("Example readings").
- **The device body** around those screens (bezel and knobs) is plain CSS,
  a drawing rather than a photograph.
- **Colour:**
  - The page is set in the plugin's Paper theme: background `#e9e6de`, ink
    `#14120d`, label `#4a4740`, unit `#615d4f`, track `#cdc9bd`.
  - It opens on Ember, the warmest theme, whose accent `#e0912f` colours
    the sun, the sparkline under the headline and the knob ticks.
  - Picking another theme swaps the deck and moves that accent to the
    theme's own colour.
  - Amber `#e8940d` and red `#cb2114` are the plugin's global alert colours.
    Where they colour words on paper, they are deepened to 5:1 contrast.
- **Type:** Segoe UI, the face the plugin draws its keys in, so the words and
  the key faces match. Other systems fall back to their own UI font.

```
cd <hwinfo-streamdeck checkout at the release tag>
npm ci
npx tsx <this repo>/design/render-faces.mjs <this repo>/public/assets
```

If a picture changes, write it under a new version (`-v2`) instead of
overwriting it: files in `public/assets/` are cached as immutable for a year.

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
- **Motion:** nothing moves on its own. Accent colours cross-fade when the
  theme changes, and even that is off under reduced motion.

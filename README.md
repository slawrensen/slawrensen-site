# slawrensen.com

Static marketing site for Stephen Lawrensen: independent software for Windows and macOS. Single page, no build step, no dependencies, no JavaScript. HWiNFO Sensors and Mac Sensors serve their respective platforms on Elgato Stream Deck.

## Structure

```
public/
  index.html    the whole site: self-contained, inline CSS, no script
  404.html      not-found page, same tokens and typeface
  _headers      Cloudflare Pages security + cache headers
  _redirects    retired image names, kept resolving
  favicon.svg   the SL mark, letters as outlines
  robots.txt
  assets/       hero photograph (webp, three widths), plugin-drawn boards (webp),
                social card (jpg), touch icon (png), the typeface (woff2)
tools/          the two scripts that make the hero crops and the board backdrops
LICENSES/       licence of the bundled typeface
.github/workflows/pages-deployment.yaml   CI/CD
```

## Deploy

Push to `main`; GitHub Actions deploys `public/` to Cloudflare Pages via
`cloudflare/wrangler-action`. Live at <https://slawrensen.com>. `www` 301s to
the apex, and it is also served at <https://slawrensen.pages.dev>.

Manual deploy:

```
npx wrangler pages deploy public --project-name=slawrensen
```

## Local preview

```
python -m http.server 8791 --directory public
```

then open <http://localhost:8791/>.

## Design language

The page is built from the product. The first screen is one sentence, two
doors and a photograph of the keys large enough to read.

- **Colour** comes from the plugins' own Paper theme (`themes.json` in
  hwinfo-streamdeck), turned over: Paper's ink `#14120d` is the page, Paper's
  background `#e9e6de` is the headings and every filled control, and its track
  `#cdc9bd` is the body text. The page chrome has no hue of its own, so the
  only saturated colour on screen is on the keys.
- **The doors** in the hero (`.tile`) are drawn the way the plugin draws a
  key: label, value, unit, centred on a near-square Paper face. The same Paper
  keys are in the photograph beneath them.
- **Type:** Atkinson Hyperlegible Next (SIL OFL 1.1, variable 200-800), one
  34 KB file served from `/assets`. It was drawn to keep 0/O and 1/l/I apart,
  which suits a page about readouts. No text is smaller than 14 px.
- **Rows:** product specs and the principles share one form, `.spec`, a term
  and its description on a hairline. In a product, `.detail` sets the rows
  beside that product's second board. There are no cards.
- **Controls:** a filled control is Paper; every other button is an outline.
  Every filled control also has a border.
- **Motion:** a 120 ms colour change on hover and nothing else.
- **Breakpoints are in em**, so a larger default text size reflows the page
  the way a narrower window does.
- **Tokens** are the `:root` custom properties at the top of `index.html`.
  `404.html` repeats the few it needs.
- **Copy** follows `docs/release/COPY_RULES.md` in hwinfo-streamdeck.

## Images

- **Hero:** `tools/hero-crop.py` cuts two crops from the photo master in
  hwinfo-streamdeck (`marketing/`): the whole key area for wide screens and
  the right-hand five columns for phones, chosen by `<picture>`. It crops and
  resizes; it does not regrade.
- **Boards** are the plugins' own README art: `.github/readme/hero.png` and
  `keys.png` in hwinfo-streamdeck, and the two Mac Sensors boards cut from its
  README art. They arrive on different backdrops with different margins.
  `tools/board-backdrop.py` puts each on `--board` (`#100f0c`) with one margin
  and leaves every plugin-drawn face pixel-identical. Run it on any new board
  and copy the width and height it prints into the `<img>`.
- A board wider than about 1.6:1 gets `.pan`: under 42.5em it scrolls sideways
  at 760 px wide, so its faces stay legible on a phone. Its `.frame` carries
  `tabindex="0"`, `role="group"` and an `aria-label` naming the board, so a
  keyboard can pan it in Safari. The cost is a tab stop that does nothing at
  widths where the board does not scroll.
- A new or changed file in `public/assets/` carries `-vN` in its name and gets
  an `immutable` entry in `_headers`; the name it replaces gets a line in
  `_redirects`.

## Dark Reader and other forced dark modes

The page is dark already, so it opts out, and it is also built to survive a
tool that runs anyway.

- `<meta name="darkreader-lock">` is the first tag after the charset. Dark
  Reader's dynamic mode leaves a locked page alone. Its Filter and Static
  modes ignore the lock; the page stays legible in both. Static mode forces
  background colours and text colours but keeps background images, which is
  one more reason the page has no gradient fills.
- `<meta name="color-scheme" content="dark">` and `color-scheme:dark` on
  `:root` are what Dark Reader's own dark-site detection looks for. The
  content must stay exactly `dark`.
- No gradient fills, no `background-clip:text`, no transparent text, and no
  custom property that nests `var()` inside a gradient. Those are what Dark
  Reader blacked out on the previous design.
- The `html[data-darkreader-scheme]` rules at the end of the stylesheet apply
  only when Dark Reader has repainted the page despite the lock.

To check a change, load the released extension (the Chrome MV3 zip from Dark
Reader's GitHub releases) in a Chromium browser, turn off its "detect dark
theme" setting, and look at the page in Dynamic, Filter and Static modes. With
detection on, the extension skips the site altogether. The `darkreader` npm
package covers the remaining case: inject it with the lock tag removed. Dark
Reader for Safari on iOS is a closed build that could not be run here.

## Editing

- A plugin's version number appears three times: its tile in the hero, its
  `Version` row, and `softwareVersion` in the JSON-LD block.
- Add a product by copying an `<article class="band">` block and adding its
  tile to `.pick` in the hero.

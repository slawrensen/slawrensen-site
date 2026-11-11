# slawrensen.com

Static marketing site for Stephen Lawrensen: independent software for Windows and macOS. Single page, no build step, no dependencies, no JavaScript. HWiNFO Sensors and Mac Sensors serve their respective platforms on Elgato Stream Deck.

## Structure

```
public/
  index.html    the whole site: self-contained, inline CSS, no script
  404.html      styled 404 page, same tokens
  _headers      Cloudflare Pages security + cache headers
  _redirects    retired image names, kept resolving
  favicon.svg   brand mark
  robots.txt
  assets/       plugin-drawn boards (webp), device photo (webp), social card (jpg),
                the aura's two layers (svg)
tools/          the scripts that make the boards and the aura
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

A preview that leaves production alone:

```
npx wrangler pages deploy public --project-name=slawrensen --branch=<name>
```

## Local preview

```
python -m http.server 8791 --directory public
```

then open <http://localhost:8791/>.

## Design

Pure black, and the plugin's own colours. Tokens are the `:root` custom
properties at the top of `index.html`; `404.html` repeats the few it needs.

- **Colour:** `--bg` is `#000`. `--accent` (`#4cc2ff`) is the Void theme's
  accent and `--text`, `--faint`, `--line` and `--line-2` are Void and
  Graphite values from `themes.json` in hwinfo-streamdeck; the other greys sit
  on the same blue-grey hue. `--plate` (`#111317`) is the backdrop the plugin's
  README boards are drawn on. The page's own styles use no gradients; the aura's clouds are
  the plugin's.
- **Type:** the system sans and mono stacks. Nothing is smaller than 12 px.
- **The mark** is a key face: black, with the accent as the bar a key draws
  under its reading.
- **Motion:** colour changes on hover, a 160 ms fade on the photograph's
  lightbox, and the aura's drift when the aura is on. Reduced motion removes
  the last two.

## Layout

The page is fluid: it has no fixed column.

- **Type** grows with the window (`html{font-size}`): the reader's own size up
  to 1200 px wide, about 19 px at 1920, 21 px from 2560. Everything sized in
  rem follows it.
- **The column** (`--maxw`) is 94% of the window, between 70 and 104 rem.
- **Hero:** from 1440 px the deck stands beside the text. From 1000 px the
  headline and the lead share one band above it; narrower, everything stacks.
- **Products:** from 1440 px a product's words sit beside its pictures with
  the three setup steps side by side beneath; below that they stack as words,
  pictures, setup.
- **Phones:** one column. Wide boards pan sideways.

## The deck at life size

The hero is a Stream Deck + XL drawn to scale and shown at its real size
wherever the window is wide enough for it.

- `tools/deck-device.py` draws it. Keys and strip follow Elgato's published
  panel layout (the plugin's `DECK_PANELS[13]`); the scale comes from Elgato's
  figures of a 161 mm touch strip and a 205 mm body; the body, glass and dial
  bay come from the photograph of the device. The faces are cut from the
  plugin's README board, so they are the plugin's own drawing. No logo is drawn.
- `--deck` in `index.html` is `205mm` times `--true`. CSS has no true physical
  unit: its `mm` is 96 CSS px to the inch on every screen. `--true` (1.1333)
  corrects for the 109 CSS px to the real inch of a 27-inch 1440p or 4K
  monitor, a 34-inch ultrawide and most scaled laptop panels. The deck is true
  to size on those, about 19% large on a 24-inch 1080p panel and about 15%
  small on a MacBook. Nothing short of the reader measuring their screen can
  do better, and the page runs no script to ask.
- In a column narrower than the deck (a window under about 970 px) it shrinks
  to fit.

## Images

- **Boards** are the plugins' README art. `tools/board-backdrop.py` puts each
  on `--plate` with one margin, flattens transparent corners, and leaves every
  plugin-drawn face pixel-identical. Run it on any new board and copy the
  width and height it prints into the `<img>`.
- A wide board gets `.pan`: under 680 px it scrolls sideways at 780 px wide,
  so its faces stay legible on a phone. Its `.frame` carries `tabindex="0"`,
  `role="group"` and an `aria-label`, so a keyboard can pan it in Safari. The
  cost is a tab stop that does nothing at widths where the board does not
  scroll.
- **The photograph** in About opens larger when clicked. It is a `popover`
  element opened by a `popovertarget` button: the browser layers it above the
  page, dims the rest, and closes it on Escape or a click. No script; the
  2000 px file loads only when it is opened.
- A new or changed file in `public/assets/` carries `-vN` in its name and gets
  an `immutable` entry in `_headers`; the name it replaces gets a line in
  `_redirects`.

## The aura

A hidden option: the lamp marked Aura in the footer opens three choices,
Black (the default), Nebula, and Stars (the nebula with its stars).

- The picture is the plugin's own Nebula background, rendered by
  `tools/aura.mts` from `artScene()` in hwinfo-streamdeck's
  `src/ui/deck-art.ts` (Void theme, seed `slawrensen.com`). That code is on
  the 1.8 branch, which is not released; the page does not name the feature.
- Two fixed layers behind the page: `aura-nebula-v1.svg` (1.6 KB, the clouds)
  and `aura-stars-v2.svg` (5.5 KB). The plugin keeps every star out from
  under text. A page cannot, so only the scene's faint one-pixel stars are
  drawn; the brighter ones read as stray marks inside a sentence.
- It is CSS only: radio inputs and `:has()`. Nothing is fetched or painted
  while it is off, the choice is not stored, and it resets on reload. A
  browser without `:has()`, and forced-colours mode, do not get the control.
- The choices float above the lamp, out of the flow, so opening them moves
  nothing.
- The clouds drift by one `transform` over 60 seconds, which the compositor
  runs without repainting. With reduced motion set, they hold still. In
  Chromium at 1x, text over the fixed layers is smoothed in greyscale rather
  than subpixel colour while the aura is on.
- With the aura on, `--faint` steps up so small labels keep 4.5:1 over the
  brightest cloud.

## Dark Reader and other forced dark modes

The page is dark already, so it opts out, and it is also built to survive a
tool that runs anyway.

- `<meta name="darkreader-lock">` is the first tag after the charset. Dark
  Reader's dynamic mode leaves a locked page alone. Its Filter and Static
  modes ignore the lock; the page stays legible in both.
- `<meta name="color-scheme" content="dark">` and `color-scheme:dark` on
  `:root` are what Dark Reader's own dark-site detection looks for. The
  content must stay exactly `dark`.
- No gradient fills, no `background-clip:text`, no transparent text. Those are
  what Dark Reader blacked out before.

To check a change, load the released extension (the Chrome MV3 zip from Dark
Reader's GitHub releases) in a Chromium browser, turn off its "detect dark
theme" setting, and look at the page in Dynamic, Filter and Static modes. With
detection on, the extension skips the site altogether. Dark Reader for Safari
on iOS is a closed build that could not be run here.

## Editing

It is one HTML file. A plugin's version number appears twice: the link in its
`Requires` row, and `softwareVersion` in the JSON-LD block. Add a product by
copying a `.product` block.

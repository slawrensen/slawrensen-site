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

- **Colour:** `--bg` is `#000`. The neutrals and `--accent` (`#4cc2ff`) are
  the Void and Graphite themes from `themes.json` in hwinfo-streamdeck.
  `--plate` (`#111317`) is the graphite backdrop the plugin's README boards
  are drawn on. There are no gradients.
- **Type:** the system sans and mono stacks. Nothing is smaller than 12 px.
- **The mark** is a key face: black, with the accent as the bar a key draws
  under its reading.
- **Hero art** is the plugin's own deck render (`.github/readme/hero.png` in
  hwinfo-streamdeck), with a five-column crop on phones via `<picture>`.
- **Motion:** colour changes on hover. The only animation is the aura's
  drift, and only when the aura is on.

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
- A new or changed file in `public/assets/` carries `-vN` in its name and gets
  an `immutable` entry in `_headers`; the name it replaces gets a line in
  `_redirects`.

## The aura

A hidden option: the lamp marked Aura in the footer opens three choices,
Black (the default), Nebula, and Nebula + stars.

- The picture is the plugin's own Nebula background, rendered by
  `tools/aura.mts` from `artScene()` in hwinfo-streamdeck's
  `src/ui/deck-art.ts` (Void theme, seed `slawrensen.com`). That code is on
  the 1.8 branch, which is not released; the page does not name the feature.
- Two fixed layers behind the page: `aura-nebula-v1.svg` (1.6 KB, the clouds)
  and `aura-stars-v1.svg` (12.5 KB, the scene's stars).
- It is CSS only: radio inputs and `:has()`. Nothing is fetched or painted
  while it is off, the choice is not stored, and it resets on reload.
- The clouds drift by one `transform` over 90 seconds, which the compositor
  runs without repainting. With reduced motion set, they hold still.
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

It is one HTML file. A plugin's version number appears twice: the `v1.x` link
at the foot of its card, and `softwareVersion` in the JSON-LD block. Add a
product by copying a `.product` block.

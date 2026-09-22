# slawrensen.com

Home of slawrensen, the name Stephen Lawrensen publishes software under, and
of its first public product, HWiNFO Sensors for the Elgato Stream Deck.

One static page, no build step, no JavaScript, no runtime dependencies.
Cloudflare Pages serves `public/` as it is.

## Structure

```
public/                     everything that ships
  index.html                the site: inline CSS, no script (JSON-LD data only)
  404.html                  not-found page with ways back
  _headers                  security headers (CSP), cache policy
  _redirects                retired asset names -> current files
  favicon.svg               the SL mark (generated, see design/mark/)
  apple-touch-icon.png      the mark as a 180 px bitmap (generated)
  robots.txt
  assets/                   versioned images only: name-vN.ext
design/
  mark/                     SL mark source of truth, geometry notes, specimen
  explorations/             the three design directions compared in 2026-09
docs/redesign/              audit, claim sources, decision, validation, ledger
scripts/                    source checks and dev-only measurement tools
tests/                      Playwright tests run against the Pages emulator
.github/workflows/
  pages-deployment.yaml     deploy public/ on push to main (production)
  validate.yaml             pull-request checks (no secrets, no deploy)
```

## Editing content

Facts on the page (versions, requirements, figures) each have a source in
`docs/redesign/CLAIMS.md`. When the plugin releases, update the version in the
spec sheet, the principles section and the JSON-LD block together; the tests
fail if they disagree. Keep product faces and photographs real: crops of the
plugin's own renders or the hardware photograph, captioned as examples.

Design tokens (colour, type, spacing, the bracket) are the `:root` variables
at the top of `index.html`. Every text colour pair is at least 4.5:1; control
borders use `--control`, which is at least 3:1 on every surface.

## Images and caching

Files in `public/assets/` are cached for a year as immutable, so a file's
bytes must never change under its name. To change an image, save it under a
new version (`deck-keys-v2-900.webp`), point the page at it, and add the old
name to `_redirects` so external links keep resolving. `scripts/check-source.sh`
fails on an unversioned asset name.

## The mark

`design/mark/sl-mark.mjs` holds the SL geometry. After changing it, run
`npm run mark` and paste the new path data into the three inline SVGs in
`index.html` and `404.html`; a test checks they all match `favicon.svg`.

## Checks

```
npm ci
npx playwright install chromium firefox webkit
npm run check:source        # privacy/caching rules in public/ (also run by CI)
npm test                    # Playwright: Chromium, Firefox, WebKit
npm run test:local          # Chromium and WebKit only
npm run lighthouse          # 5 cold mobile runs, median and range
```

Tests run `public/` through `wrangler pages dev`, Cloudflare's own emulator, so
`_headers` and `_redirects` apply as on the edge. It does not reproduce
edge-only behaviour (compression choices, headers Cloudflare injects, zone
settings); the deploy job checks the live site for those.

## Local preview

```
npm run serve
```

then open <http://127.0.0.1:8788/>. The explorations need a server at the
repository root: `python -m http.server 8791`, then
<http://localhost:8791/design/explorations/a-instrument-house/>.

## Deploy

Pushing to `main` deploys: GitHub Actions runs the source checks, deploys
`public/` to Cloudflare Pages (a Direct Upload project, so branches and pull
requests never deploy), then checks the live page for injected trackers and
for the expected Content-Security-Policy. Live at <https://slawrensen.com>;
`www` 301s to the apex; also served at <https://slawrensen.pages.dev>.

Rollback: revert the merge commit on `main` and push, or promote the previous
deployment in the Cloudflare Pages dashboard (Deployments, then "Rollback to
this deployment").

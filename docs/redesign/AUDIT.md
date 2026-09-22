# Baseline audit: slawrensen.com before the redesign

Audited 2026-09-22 against `main` at `c9a5119`. The live page is byte-for-byte
the repository file (SHA-256 `50bf5ecd…899d` for both `public/index.html` and
the HTML served by https://slawrensen.com/).

Evidence (screenshots, metrics JSON, Lighthouse JSON) is in the evidence branch
described in `LEDGER.md`, folder `before/`.

## Environment

Windows 10 IoT Enterprise LTSC 2021 (19044), Git Bash + PowerShell 7, Node
24.16.0, Python 3.12.10, gh 2.94.0, Playwright 1.63.0 (Chromium 153.0.8010.12,
Firefox and WebKit builds 1543/2359), Google Chrome 153.0.8010.52, wrangler
4.136.3 (`pages dev` emulator for `_headers`/`_redirects`).

## Architecture (reconfirmed)

- Static. Cloudflare Pages **Direct Upload** project `slawrensen` (API: `source`
  is null, so no Git integration and no branch preview builds). Every one of the
  last ten deployments is `ad_hoc` from `main`, made by the GitHub Actions
  workflow, which triggers only on push to `main` and manual dispatch.
- `public/index.html`: one 45,973-byte file with inline CSS and about 8 KB of
  inline vanilla JS (scroll progress bar, reveal-on-scroll, section tracking,
  canvas "oscilloscope", animated fake readouts). No runtime dependencies.
- `_headers`: strict CSP (`default-src 'none'`, inline style/script allowed),
  HSTS, nosniff, frame denial, Permissions-Policy; `no-cache` HTML; one-year
  immutable caching for versioned images. `_redirects`: six retired image names
  301 to current versions.
- The deploy workflow greps `public/` for external scripts, fetching links,
  `@import`, absolute CSS URLs, network calls and storage, then re-fetches the
  live page after deploy to catch edge-injected beacons.
- No tests existed. There was nothing to run before editing beyond that grep,
  which is embedded in the deploy job. It passes on the baseline.

## Measurements (local Pages emulator, Chromium 153)

| Measure | Baseline |
| --- | --- |
| HTML | 45,973 B raw; ~11.9 KB brotli |
| Inline JS | ~8.1 KB raw |
| Eager requests | HTML + one 79 KB WebP (two further WebPs lazy) |
| Cross-origin requests, cookies, storage | 0, none, none |
| Console errors (home) | 0 (404 page logs the expected 404 for itself) |
| Horizontal overflow 320–3440 px | none |
| CLS | 0 |
| axe-core 4.13 (WCAG 2.0–2.2 A/AA + best practice) | 0 violations; colour contrast "incomplete" on 57–63 nodes over gradients |
| Lighthouse 13.5 mobile, 5 cold runs | Performance 100; LCP 1.89 s (1.886–1.891); FCP 0.86 s; TBT 0; CLS 0; transfer 248 KB; SEO 92 |

Lighthouse's only SEO failure, `robots-txt`, is an artefact of the strict CSP:
the audit fetches `/robots.txt` from inside the page and `connect-src 'none'`
blocks it. The file itself is valid and served with 200.

## Layer 1: brand

Observations
- The maker's name does not appear anywhere on the page. The About section
  says "I am slawrensen". Structured data names the author "slawrensen".
- Visual language: near-black dashboard, blue-to-violet gradient headline,
  dot grid, ruler-tick rails, a canvas oscilloscope, glowing chips, a
  scroll-progress bar, a pinging "SIGNAL OK" lamp. Remove the SL tile and the
  page is a generic dark "developer tool" template.
- The SL mark exists in three drifting renderings: the favicon draws "SL" as
  SVG `<text>` in Consolas at weight 800; the header and footer marks draw it
  as HTML text in whatever the `--mono` stack resolves to (SF Mono, Cascadia
  Code, JetBrains Mono, Consolas); the docs hub uses an unrelated "pulse"
  avatar. The letterforms therefore change by platform.

Design judgements
- The strongest brand asset is not on the homepage's surface: the product
  documentation's habit of saying exactly how sure it is (four confidence
  levels on hardware support, a performance log that names its harness,
  published hashes for an unsigned binary). The site says "honest" instead of
  showing this.

## Layer 2: product experience

Observations
- First viewport (1440×900 and 390×844) shows no product image, only a
  headline, gradient buttons and two animated fake readouts.
- The primary CTA "Get HWiNFO Sensors" scrolls to `#products`; the actual
  Marketplace link is at the end of a long product card (about 5,000 px down
  on a 390 px phone, after three large images).
- Requirements are split across chips ("Windows x64", "Stream Deck 6.9+"); the
  Windows 10 floor and the HWiNFO requirement are only in setup prose.
- Support paths: GitHub Issues appears once, inside About. Troubleshooting,
  FAQ and hardware-compatibility pages are not surfaced as a help path.
- Good and preserved: real product imagery, the three-step setup, the
  12-hour-timer note, attribution, trademark notice, the photo caption.

## Layer 3: engineering

Reproducible defects
1. **Content hidden in print/PDF before scrolling.** Load the page, do not
   scroll, print: 15 `[data-reveal]` elements (Principles, About, product
   card) are `opacity:0` in print media. Reproduced with Playwright
   `emulateMedia({media:'print'})`: 15 hidden elements; after scrolling, 0.
2. **Fabricated readouts presented as live.** The hero cards animate "CPU PKG
   ~56 °C" and "GPU FAN ~1176 RPM" every 2.2 s with green status dots and no
   "example" label. They are `aria-hidden`, so sighted visitors alone see
   numbers that look like a live reading of something.
3. **Stale, unscoped statistic.** "PARSE 5.9 µs" is from PERF.md's 2026-07-22
   entry; the 1.6.0 release entry measures 8.5 µs mean over 548 readings, on
   one machine, for the shared-memory path only.
4. **Future-tense promises.** "The same four rules apply to everything on this
   site, and everything that comes next" commits unreleased products to
   no-network, MIT and free.

Observations (not defects)
- Cloudflare's edge adds `Report-To`/`NEL` headers to live responses; the
  host necessarily receives request data. "Built with no trackers and no
  cookies" is true of the page and says nothing about the host; the redesign
  states both.
- The local emulator joins both matching `Cache-Control` rules for versioned
  assets (`public, max-age=86400, public, max-age=31536000, immutable`); the
  live edge returns only the immutable value. The redesign detaches the
  one-day rule for versioned files so both agree.
- The canvas animation is well behaved (pauses offscreen and when hidden,
  respects reduced motion, including changes mid-session), but it is ~4 KB
  of JS for decoration.

Unknowns
- Physical Safari, iOS and Android devices: not available here.
- Screen-reader output: NVDA and JAWS are not installed; Windows Narrator is
  present but was not driven for the baseline. Only the accessibility tree
  was inspected.
- Field Core Web Vitals: the site has no RUM by design; none exist.

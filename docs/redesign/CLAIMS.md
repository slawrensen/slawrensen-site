# Claim-to-source record

Every factual statement the redesigned site makes, where it comes from, and
how precise it is allowed to be. Sources were read on 2026-09-22 from public
material only: the `slawrensen/hwinfo-streamdeck` repository at tag `v1.6.0`
(commit `2ca44e9`), its GitHub release, the live docs at
docs.slawrensen.com, and the live Elgato Marketplace listing.

Rule for maintainers: a claim on the site must have a row here. Change the
row when the source changes; remove the claim when the source goes away.

## Identity

| Claim on site | Source | Notes |
| --- | --- | --- |
| Made by Stephen Lawrensen | `LICENSE` ("Copyright (c) 2026 Stephen Lawrensen"); plugin `manifest.json` `"Author": "Stephen Lawrensen"`; docs.slawrensen.com page title | Public, first-party. |
| "Systems engineer" (self-description) | docs.slawrensen.com: "Systems engineer. I build tools I needed and ship them." | Stephen's own public wording. No employer, location, history or portrait is published or implied. |
| Sole maintainer ("I am its only maintainer") | `SECURITY.md`: "I am the only maintainer" | Not "one person makes all of it": the plugin bundles third-party components (NOTICE.md). |
| slawrensen is the brand; github.com/slawrensen | Marketplace "by slawrensen"; GitHub account | |

## HWiNFO Sensors for Stream Deck

| Claim | Source | Status / precision |
| --- | --- | --- |
| Current release 1.6.0 (1.6.0.0) | GitHub release `v1.6.0`, published 2026-09-05; Marketplace "Version 1.6, Sep 7, 2026" | Released. Pre-releases `1.6.90`–`1.6.92` (individual reading colours, issue #31) are **previews, not released**: the site must not describe them. |
| Windows 10 or later, x64 only | `manifest.json` OS windows min 10; README "Windows only"; FAQ "64-bit (x64) Windows" | |
| Stream Deck app 6.9 or later | `manifest.json` Software.MinimumVersion 6.9; Marketplace "Stream Deck 6.9 or later" | |
| Needs HWiNFO (free or Pro) with Shared Memory Support or Gadget reporting | README Requirements; FAQ | HWiNFO is a separate program by REALiX; not bundled. |
| Free HWiNFO switches Shared Memory off after 12 hours; plugin falls back to Gadget and returns | README data-source table; FAQ | |
| Keys on Stream Deck models with screen keys (Studio and Galleon 100 SD untested); one to four readings per key; sparkline, bar or ring on the single layout | README "Sensor Reading"; manifest tooltip; docs `hardware.md` | Not "any Stream Deck": the FAQ says so, but the compatibility matrix claims no support for Studio or Galleon, and a pedal has no screen. The matrix is the stricter source. |
| Dials on Stream Deck + and + XL: rotate, push, touch; session min/max | README "Sensor Dial" | |
| Seven themes, including Paper, a high-contrast light theme | README "Themes" | Names: Void, Graphite, Ultraviolet, Midnight, Forest, Ember, Paper. |
| Warn (amber) and critical (red) alert palettes are global, never tinted per theme | README "Alerts override everything" | |
| Status screens name the problem and the fix; a frozen value turns into "Not updating" after 15 s | README "Key states you might see"; `status-screens.png` | "Not updating" after 15 s without a new HWiNFO poll (FAQ note). |
| Value 21:1, label 5.5:1, unit 4.2:1 contrast on the default theme | README "The display system" | Default (Void) theme only. |
| Polls once per second by default (250 ms–5 s), one reader regardless of key count | README "More notes" | |
| One shared-memory poll of 548 live readings (copy and decode) takes 8.5 µs mean (8.7 µs p95), 1,000 iterations | `PERF.md` entry "2026-09-04: 1.6.0.0 release candidate" | One machine, shared-memory path only (the Gadget fallback measures about 2.6 ms). Stated with that scope and linked to PERF.md at tag v1.6.0. **Replaces the old site's unsourced "PARSE 5.9 µs"**, which came from an earlier (2026-07-22) entry. |
| Plugin makes no network requests; its only connection is the local WebSocket to the Stream Deck app; no telemetry | `SECURITY.md` "What the plugin touches"; FAQ "Privacy"; `NOTICE.md` (ws client to the local app) | A claim about **this plugin**, not about the website or future products. |
| Native addon is unsigned; every release since 1.4.0 publishes SHA-256 hashes | `SECURITY.md`; v1.6.0 release notes | Pack SHA-256 `57fdf219…`, 284,995 bytes. GitHub downloads match byte for byte; Marketplace copies are repackaged by Elgato (SECURITY.md), and the page says so. |
| Download size about 285 KB | GitHub release asset 284,995 B; Marketplace "284.68 KB" | Rounded. |
| Physically verified on Stream Deck + XL; other models SDK-simulated or "compatible with limitations" | docs `hardware.md` compatibility matrix | Do not say "works on every Stream Deck" without that qualifier. |
| MIT licence, free, open source | `LICENSE`; Marketplace "Free" | For this product only. |
| Ground-up TypeScript rewrite inspired by shayne/hwinfo-streamdeck, no code shared | README; `NOTICE.md` | Keep attribution link to NOTICE.md. |
| Install from the Elgato Marketplace or the `.streamDeckPlugin` on GitHub Releases | README Quick start; release notes | Both links verified 200 on 2026-09-22. |
| Support through GitHub Issues; security reports privately via GitHub advisories | README; `SECURITY.md` | No email address is published; none is invented. |
| Photograph: Stream Deck + XL running the plugin, Sony A7 III, nothing staged | `marketing/README.md`; docs `hardware.md` | Real hardware, real output. |
| Key-face images are real renderer output | README "Real output only"; `scripts/contact-sheet.mjs` | Rendered by the plugin's renderers with the contact sheet's inputs at tag v1.6.0, rasterised at 3x (`design/renders/`); status screens are crops of `docs/assets/img/status-screens.png`. The values are fixed demo values typed into the contact-sheet script (56.3, 44.1, 1762, 95.4, 87, 104), **not** live readings and not the visitor's. Corrected after review: an earlier draft said they came from the author's machine. |
| Photograph dated 25 July 2026 | previous site caption (commit history, July 2026) | Taken before 1.6.0; captioned with its date. Both coloured keys in it are demo keys. |
| Paper theme: high-contrast light theme for bright rooms and low vision | README "Themes" | Restored after review (the first draft dropped it). |
| HWiNFO Control key drives dials from any key | README "HWiNFO Control" | Restored after review. |

## Website (this repository)

| Claim | Source | Notes |
| --- | --- | --- |
| No analytics, no cookies, no third-party scripts or fonts | `public/`, `_headers` CSP `default-src 'none'`, deploy-workflow source scan and live scan | Enforced in CI; see `scripts/check-source.sh`. |
| The host still receives each request, and Cloudflare asks browsers to report failed connections (Network Error Logging) | Cloudflare Pages serves the site; live responses carry Cloudflare `Report-To`/`NEL` headers pointing at `a.nel.cloudflare.com` (2026-09-22) | The footer says both. NEL is a Cloudflare zone setting, not something `_headers` controls. |
| Source is public | github.com/slawrensen/slawrensen-site (public) | |

## Removed or corrected from the previous site

| Previous claim | Problem | Resolution |
| --- | --- | --- |
| Animated "CPU PKG 56.3 °C / GPU FAN 1176 RPM" hero readouts | Fabricated, animated values with no label; can read as the visitor's hardware | Removed. Real renders only, captioned as example output. |
| "SIGNAL OK" footer lamp | Decorative status with no referent | Removed. |
| "PARSE 5.9 µs" micro-stat | Stale (current 8.5 µs) and without scope | Replaced by the scoped, linked figure above. |
| "ADS 0", "PHONES HOME NEVER" micro-stats | Decorative numbers styled as measurements | Removed; the plugin privacy statement is stated in words with its source. |
| "The same four rules apply to everything on this site, and everything that comes next" | Promises about unreleased future products | Removed. Principles are shown as evidence from the one released product. |
| "Every line is on GitHub" (as a general rule) | Generalises one product's licence to all work | Scoped to HWiNFO Sensors. |
| JSON-LD author `"name": "slawrensen"` | Maker not named | Author is Stephen Lawrensen; brand stays slawrensen. |

# Validation report

Local validation of the production candidate. Hosted CI, hosted preview and
production are reported separately at the end; nothing here was deployed.

## What was validated

| | |
| --- | --- |
| Commit | `aa37fe335afe51cee4782974c23a36388ccb7345` on `redesign/2026-09` (later commits change only `docs/`) |
| Working tree | clean (0 changes) when the checks ran |
| Started | 2026-09-22T18:39:37Z |
| Host | Windows 10 IoT Enterprise LTSC 2021 (19044), Node 24.16.0 |
| Engines | Playwright 1.63.0: Chromium 153.0.8010.12 (headless shell), WebKit 26.6. Google Chrome 153.0.8010.52 for Lighthouse. Edge 153.0.4234.48 and Chrome 153 used by a reviewer for privacy spot checks |
| Server | `wrangler pages dev` 4.136.3 (Cloudflare's Pages emulator: `_headers`, `_redirects`, brotli) |

Production files (SHA-256 of the files as committed, LF line endings):

| File | SHA-256 |
| --- | --- |
| `public/index.html` | `c0a1e2e74f72ca02d93e989d2b07124046ad4ad0b09dd37c4f1242464abd6fff` |
| `public/404.html` | `ef3a729940ff1124b8fbd5264532400efd02fe3edd7a74d83066188946128122` |
| `public/_headers` | `1f5b5879368e2acbb0793e35f9d7ec604fd2049e6a8d50ba17746697f2e9547f` |
| `public/_redirects` | `ab9fb9767be99997f5569d9c0d4817d16482589116f4858ca609bed0e231154e` |
| `public/favicon.svg` | `0c8660ec674404d74dbb88856c7f726587e8782d36bc062b0070b2d946b729f7` |
| `public/apple-touch-icon.png` | `531d3792bf2dd510e0816d0712ebdb05980d220dbc4ec4ba9e3bd435febb9d14` |

The full list of 75 files is in the evidence branch (`final/public-sha256.txt`).
To confirm nothing that ships changed after validation:
`git diff --stat aa37fe3..HEAD -- public tests scripts` prints nothing.

## Commands and exit codes

| Command | Exit | Result |
| --- | --- | --- |
| `sh scripts/check-source.sh` | 0 | no external requests, no scripts, no storage, every asset versioned |
| `npx playwright test --project=chromium --project=webkit` | 0 | 104 passed, 22 skipped |
| `node design/mark/sl-mark.mjs && git diff --exit-code design/mark public/favicon.svg` | 0 | mark regenerates byte-identically |
| `LH_CHROME=… node scripts/lighthouse.mjs --root public --runs 5` | 0 | see Performance |
| `node scripts/capture.mjs --root public --pages /,/missing-page --engines chromium,webkit --full` | 0 | 28 runs, no overflow, no cross-origin requests, no page errors (the 404 page logs its own 404 status, as expected) |

The 22 skips are by design: server, content and budget checks run once (in
Chromium); WebKit, like Safari's default, does not Tab to links, so the
link-order and sticky-header focus tests run in Chromium; forced-colours
emulation exists only in Chromium. **Firefox did not run locally**: Playwright's Firefox build fails
to start on this host with a Windows side-by-side error
(`mozglue` assembly), so the first Firefox run is the pull request's CI.

## What the tests cover

`tests/` (Playwright, against the emulator): security headers and exact
cache policy per file; retired-asset redirects; 404 status and links;
same-origin-only requests over a full visit with every control used, no
cookies, storage or service worker, no console errors; no executable script;
examples labelled as examples; the website privacy note naming the host;
no horizontal overflow from 320 to 3440 px; WCAG 1.4.12 text spacing; 200 %
text at desktop width and 150–200 % text on phones; first viewport carries
headline, byline and install path; Install and Help reachable in the nav at
every width; wide screens bounded and centred; the sticky header (tablet and
up) never covering the focused element or an anchor target, with the skip
link on top, and a static header on phones; all seven themes named; the
plugin's no-ads, no-telemetry statement in the hero and description; axe (WCAG 2.0–2.2 A/AA and
best practice) on both pages at two widths and in every comparison state;
landmarks and heading outline; alt text; keyboard order, visible and
unobscured focus; the radio group by keyboard in both engines; every
comparison option showing exactly its face with a loaded image; rendering
without JavaScript; print; zero animations with and without reduced motion;
forced colours (control borders, bracket, focus distinct from selection);
every image loading at 1x, 2x and 3x; every `src`/`srcset` candidate
existing; payload budgets; structured data agreeing with the page; version,
tag link and pinned document links agreeing; one mark geometry everywhere;
removed and corrected claims staying out.

Mutation check: each defect found in review was re-introduced on purpose
(missing 2x hero image, broken Ring face, the old forced-colours rule, a
non-wrapping phone nav, the "any Stream Deck" claim, the skip link under the
sticky header) and each made its test fail before being restored.

## Performance and budgets

Lab numbers from one machine; not field data, and no telemetry was added to
get any. Lighthouse 13.5.0, default mobile settings (Moto G Power emulation,
simulated slow 4G, 4x CPU), 5 cold runs each, median (range):

| | Before (`c9a5119`) | After (`aa37fe3`) |
| --- | --- | --- |
| Performance score | 100 (100–100) | 100 (100–100) |
| LCP | 1.89 s (1.886–1.891) | 1.03 s (1.025–1.246) |
| FCP | 0.86 s | 0.72 s |
| TBT | 0 ms | 0 ms |
| CLS | 0 | 0 |
| Transfer (Lighthouse) | 248 KB | 143 KB |
| Accessibility / Best practices / SEO | 100 / 100 / 92 | 100 / 100 / 92 |

SEO 92 in both: the only failing audit is `robots-txt`, which Lighthouse
fetches from inside the page, where `connect-src 'none'` blocks it. The file
itself is valid.

Budgets:

| Budget | Limit | Before | After |
| --- | --- | --- | --- |
| Framework runtime | none | none | none |
| Application JavaScript (compressed) | ≤ 20 KB | 2.7 KB brotli (7.7 KB raw) | 0 |
| HTML + CSS + JS, brotli | ≤ 100 KB | 12.0 KB | 10.1 KB |
| Eager first load, 390×844 @3x (median of 3) | ≤ 500 KB | 247 KB | 234 KB |
| Eager first load, 1440×900 @2x | ≤ 500 KB | 247 KB | 332 KB |
| Eager first load, 1920×1080 @1x | ≤ 500 KB | 247 KB | 192 KB |

("Eager" is what Chromium fetches before any scrolling, which includes
`loading="lazy"` images inside its load-ahead distance.) On high-density
screens the page now spends more than the old one, by choice: key and dial
faces are served at 3x so the legibility comparison is sharp; `srcset`
keeps 1x screens on the 1x files. An earlier cut with 1x faces measured
172/206/145 KB but looked soft on phones and HiDPI laptops.

## Accessibility

Automated: axe-core 4.13 finds 0 violations on `/` and the 404 page at 390
and 1440 px in Chromium and WebKit, and in all six comparison states. Zero
automated violations do not establish conformance.

Manual (independent reviewer, Chromium and WebKit, on the earlier cut
`71d065f`; the later changes are covered by the automated tests above): 38 Tab stops in logical
order, each with a 2 px ring, in view, no trap; skip link moves focus into
main; radio arrows work in both engines with a focus indicator on every step;
lowest text contrast 5.66:1, control borders 3.54–3.91:1, focus ring 7.8:1 or
more; reflow clean at 320 px and at 1280 px/400 %; print is black on white
with all faces; missing fonts (Arial, Georgia fallbacks) hold; alt text
checked against the actual images.

Not covered: real screen readers (NVDA and JAWS are not installed; Windows
Narrator is present but was not driven), real Windows High Contrast (only
Chromium emulation), physical iOS/Android devices and system text scaling
(emulated only), Safari with "Press Tab to highlight each item" enabled,
speech input. Playwright WebKit is not Safari and not an iPhone.

## Privacy

On a full visit with every control used, all requests are same-origin in
Chromium and WebKit (final head, automated; a reviewer also spot-checked
Chrome 153 and Edge 153 on `71d065f`): no cookies, local or session
storage, IndexedDB, caches or service worker, no CSP violations. The emulator
delivers `default-src 'none'; script-src 'none'` as written. The live edge
also adds Cloudflare's `Report-To`/`NEL` headers (Network Error Logging); the
footer now says so. Turning NEL off is a Cloudflare zone setting and was not
changed.

## Independent review

Three read-only reviewers ran in parallel (brand and content,
implementation, browser/accessibility/privacy), each asked to refute the
release claim; after the repairs, a fourth compared the candidate with the
original site. Dispositions:

| Finding | Source | Disposition |
| --- | --- | --- |
| "any Stream Deck" overstates the compatibility matrix | content | fixed; regression-tested |
| Example values attributed to "the author's machine" (they are typed-in demo values) | content | fixed; CLAIMS.md corrected |
| "a frozen value is never presented as live" contradicts the ~15 s window | content | fixed |
| 8.5 µs lacked the shared-memory scope | content | fixed; PERF.md link pinned to v1.6.0 |
| Hash check does not apply to Marketplace copies | content | fixed |
| "One person makes all of it" beyond "only maintainer" | content | fixed |
| No quick Help route in the nav | content | fixed (Help → `#support`) |
| Footer "no third-party requests" vs Cloudflare NEL | content, implementation | copy fixed; NEL itself is a zone setting, left for the owner |
| Paper theme, Control key and photo date dropped without reason | content | restored |
| "Alerts you can read across the room" unsourced | content | reworded |
| Broken 2x hero image would pass every test | implementation | test added; mutation-checked |
| Faces 3–6 untested | implementation | test added; mutation-checked |
| No visible radio focus in forced colours | implementation, a11y | fixed (selection as system fill); test added |
| `html{font-size:17px}` overrides the user's default size | implementation | fixed (percent) |
| Version bump updates only 3 of 6 places | implementation | test for version/tag/pinned links; README lists all six |
| VALIDATION.md and the evidence branch did not exist yet | implementation | this file; evidence branch published with the PR |
| Split `<script`, `on*=`, `javascript:` not caught by the source check | implementation | fixed; negative-tested |
| Header nav and captions break with enlarged text on phones | a11y | fixed; tests at 360–412 px, 150–200 % |
| Print hides the callout pins; 404 prints light text | a11y | fixed; tested |
| Evidence links 26 px tall | a11y | raised to 44 px |
| Headline "Software for people who care…" is generic | content (preference) | kept: it is the brand-level line; the kicker names the product and the byline names the maker |
| Key faces are soft on high-DPI screens (144 px sources) | a11y, final comparison | fixed: re-rendered at 1x/2x/3x by the plugin's own renderers (`design/renders/`), served by `srcset` |
| "No ads, no telemetry" disappeared from the hero and meta description | final comparison | fixed, scoped to the plugin; tested |
| Header no longer sticky on a longer page | final comparison | sticky on tablet and desktop, with focus and anchors kept clear of it (tested); static on phones by design, where a sticky two-row header covers a seventh of the screen and, with enlarged text, the focused element |
| Only two of seven themes shown; device and dials no longer pictured | final comparison | all seven themes shown by name; a photograph of the real touch strip and dials added |
| "Updated every second" dropped | final comparison | restored in the specification, with its range |
| Before screenshots show Principles and About blank | final comparison | the old page hides them until scrolled (defect 1 in AUDIT.md); `before-reduced-motion/` adds full captures with the content visible |
| Skip link hidden under the new sticky header | caught by the new test | fixed (z-index); mutation-checked |
| Page is longer on phones (6,387 → 8,966 px at 390) | final comparison | accepted: the extra length is the themes, dials photo, status screens and support list; the install path and help are in the first screen and the nav |
| 301s from `_redirects` inherit the one-year immutable header | implementation (risk) | documented in `_redirects`: never delete or reuse a redirect target |
| Pins cover the hero alt text when images fail | a11y (cosmetic) | accepted |

## Hosted CI, preview and production

- **Hosted CI (exact head):** the draft pull request's `Validate` workflow
  (ubuntu-latest; Chromium, Firefox, WebKit). First run (run 35769230582, on
  `2274254`): 146 passed, 42 skipped, 1 failed. Firefox ran for the first time
  with no failures. The failure was a test race: WebKit on Linux had not yet
  started a `loading="lazy"` image that the test had scrolled past. The test
  now scrolls each visible image into view and then requires it to load (it
  still fails on a missing file, checked by mutation). `public/` did not
  change. The result of the rerun is on the pull request.
- **Hosted preview:** not performed. It would need a `wrangler pages deploy
  --branch` upload, which this work was not authorised to make.
- **Live edge:** not verified for the new files. The deploy workflow checks
  the live CSP and scans for injected scripts after a deploy to `main`.
- **Production:** unchanged. `https://slawrensen.com/` still serves `c9a5119`.

## Deploy and rollback

Deploy: merge the pull request to `main`; `pages-deployment.yaml` runs the
source check, uploads `public/`, then verifies the live page (no injected
scripts, expected CSP). Rollback: revert the merge commit and push, or use
"Rollback to this deployment" on the previous deployment in the Cloudflare
Pages dashboard. The old image files and redirects are still in `public/`, so
a rollback leaves no dangling URLs.

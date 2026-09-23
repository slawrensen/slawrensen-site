# Evidence: neon-noir homepage (branch `redesign/neon-noir`)

Screenshots and checks for the pull request. This orphan branch is never
merged and never deployed; it keeps images out of the site's history.

- `before/`: the live site, `main` at `c9a5119`. Its `index.html` was
  byte-identical to https://slawrensen.com/ when captured on 2026-09-22
  (same SHA-256).
- `after/`: branch `redesign/neon-noir`. Includes Normal, Warn and Critical
  key states at 1440 and 390 px, forced colours, print (PDF), reduced motion,
  WebKit full pages, and `checks.txt` (word counts, axe, keyboard, forced
  colours, print, motion, request origins, first-load bytes).
- `compare/`: full-page length side by side at 1440 and 390 px, and the
  three key states.
- `report.json`: visible word counts and page heights for both.

Captured on Windows 10 with Playwright (Chromium 153.0.8010.12 headless shell,
WebKit 26.6). Both pages were served locally from `public/` with the same
static server. Page heights and word counts are from the captures. A word is
any visible run of text with a letter or digit in it. Legal fine print is
counted apart, and the skip link and alt text are not counted.

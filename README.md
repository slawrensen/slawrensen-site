# Evidence: cozy homepage (branch `redesign/cozy`)

Screenshots and checks for the pull request. This orphan branch is never
merged and never deployed.

- `before/`: the live site, `main` at `c9a5119`. Its `index.html` was
  byte-identical to https://slawrensen.com/ when captured on 2026-09-22.
- `after/`: branch `redesign/cozy`, including:
  - the page with each of the seven themes picked (`chromium-theme-*`)
  - the alert keys at 2x, and the 404 page
  - forced colours, print (PDF) and reduced motion
  - WebKit full pages
  - `checks.txt`: word counts, axe in every theme at two widths, keyboard,
    forced colours, print, motion, overflow from 320 to 3440 px, request
    origins, and first-load bytes
- `compare/`: full-page length side by side at 1440 px, the seven themes,
  and `proportions.jpg`: the drawn Stream Deck + XL beside and over the
  straightened product photograph, at the same scale.


Captured on Windows 10 with Playwright (Chromium 153.0.8010.12 headless shell,
WebKit 26.6). Both pages were served locally from `public/`. A word is any
visible run of text with a letter or digit. Legal fine print is counted
apart; the skip link and alt text are not counted.

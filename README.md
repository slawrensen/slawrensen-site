# Evidence: slawrensen.com redesign, September 2026

This orphan branch holds screenshots, metrics and logs for the redesign in
branch `redesign/2026-09`. It is kept apart so `main` does not carry ~18 MB of
images in its history. It is never merged and never deployed.

Captured on Windows 10 (19044) with Playwright 1.63.0 (Chromium
153.0.8010.12 headless shell, WebKit 26.6), pages served by `wrangler pages
dev` 4.136.3. Local paths in JSON are replaced by `<repo>` and `<scratch>`.

| Folder | What |
| --- | --- |
| `before/` | The live site as it was (`main` at `c9a5119`, byte-identical to https://slawrensen.com/ on 2026-09-22): Chromium at 320, 360, 390, 768, 1440, 1920 and 3440 px, first viewport and `-full` page, home and 404; `metrics.json` (requests, overflow, console, CLS); `lighthouse.json` (5 cold mobile runs) |
| `explorations/` | The three directions at matched 390×844 and 1440×900, first viewport and full page; A's comparison control set to "Four"; C's theme stage switched to Paper (Chromium and WebKit) |
| `after/` | The candidate at commit `aa37fe3`: Chromium and WebKit at every width above, home and 404; forced colours (dark and light, radio focused); print media (full page and PDF); the comparison control on "Four"; `metrics.json` |
| `before-reduced-motion/` | The original at 390 and 1440 px with `prefers-reduced-motion: reduce`, which makes its reveal-on-scroll sections visible in a full-page capture (the plain `before/` full pages show them blank, which is the old page's print/capture defect) |
| `final/` | Final validation of `aa37fe3`: `head.txt`, `dirty.txt`, `started.txt`, `check-source.txt`, `exit-codes.txt`, `playwright.txt` (104 passed, 22 skipped), `lighthouse.txt` and `lighthouse-after.json` (5 cold mobile runs), `eager.txt` (first-load transfer before/after, median of 3), `sizes.txt`, `public-sha256.txt` (every validated production file) |

The written reports are under `docs/redesign/` in branch `redesign/2026-09`:
`AUDIT.md`, `CLAIMS.md`, `DECISION.md`, `VALIDATION.md`, `LEDGER.md`.

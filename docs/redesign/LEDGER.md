# Redesign task ledger (September 2026)

Branch `redesign/2026-09`, started from `main` at `c9a5119`. Screenshots,
metrics and Lighthouse JSON live on the orphan branch `evidence/redesign-2026-09`
(kept off `main` so the history stays small); paths below are relative to it.

| # | Task | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Environment, repo, deploy triggers established | done | `AUDIT.md` (Environment, Architecture); Pages API: Direct Upload, no Git integration |
| 2 | Baseline: live = repo, screenshots at 7 widths, metrics, axe, Lighthouse | done | `before/` |
| 3 | Brand / product / engineering audit; claim record | done | `AUDIT.md`, `CLAIMS.md` |
| 4 | Canonical SL mark, measured optical centring | done | `design/mark/README.md` |
| 5 | Three explorations on a shared asset kit and fact set | done | `design/explorations/`, `explorations/` |
| 6 | Comparison and decision (A, Instrument House) | done | `DECISION.md` |
| 7 | Production candidate: page, 404, icons, headers, checks | done | `public/`, `scripts/check-source.sh` |
| 8 | Tests: Playwright (Chromium, WebKit locally; + Firefox in CI) | done | `tests/`, `VALIDATION.md` |
| 9 | Independent adversarial review (3 reviewers) and repair; independent before/after comparison and repair | done | `VALIDATION.md` (Independent review) |
| 10 | Final validation at `aa37fe3`, before/after evidence | done | `VALIDATION.md`, `after/`, `final/` |
| 11 | Feature branch and evidence branch pushed, draft PR opened | see PR | PR description; hosted CI on the PR |
| 12 | Production deploy | not started: needs the owner's approval to merge | README "Deploy" |

Resuming: read `VALIDATION.md` last section for the latest state. Nothing in
this work merges to `main` or deploys; production publication is a separate
approval.

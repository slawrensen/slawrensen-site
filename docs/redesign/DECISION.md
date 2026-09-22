# Three directions, one decision

The three explorations live in `design/explorations/` and run from any static
server at the repository root (for example the `site` configuration in
`.claude/launch.json`, then `/design/explorations/<name>/`). They share one
asset kit (`design/explorations/assets/`, crops of the plugin's real renders
and the real photograph) and the same verified facts from `CLAIMS.md`, so the
comparison is about design, not content. Matched screenshots at 390×844 and
1440×900, first viewport and full page, are in the evidence branch under
`explorations/`.

## How they differ

| Dimension | A. Instrument House | B. The Lawrensen Index | C. After Hours |
| --- | --- | --- | --- |
| Composition | Asymmetric folio: text 5/12, annotated photograph 7/12; then an edited catalogue whose entries alternate shape | Name masthead across the page, then an author column beside vertical dossiers | Full-bleed photograph with text laid over it; then a sequence of exhibits and one lit "room" |
| Hierarchy | Product and install first, maker as a byline and a closing section | Maker first, product second | Product image first, maker at the end |
| Typography | System sans (Segoe UI Variable / SF), tight display tracking; mono only for real figures | Serif masthead and dossier titles (Iowan / Charter / Sitka), sans body | Wide uppercase DIN (Bahnschrift / DIN Alternate), sans body |
| Image treatment | One photograph in an L-bracket frame with numbered callouts; key faces at true relative size | Photograph as a plate with a strip of faces; contrasting scales | Photograph as the whole opening, darkened; faces staged on colour sampled from them |
| Navigation | Top bar with an explicit Install action | Index column (desktop) that folds into a row (mobile) | Transparent bar over the photograph |
| Signature interaction | Radio group comparing one to four readings, bar and ring, enlarged beside a key-sized copy, with legibility facts | Native `details` expansions for Install, Evidence, Help; addressable by URL | Radio group switching the theme; the stage takes that key's background, text and accent |
| JavaScript | none | 9 lines (open `details` from the URL hash and before printing) | none |

They differ materially in all six listed dimensions.

## Scores

Structured judgements from inspecting the renders, not user research. 1–10.

| Criterion (weight) | A | B | C |
| --- | --- | --- | --- |
| Brand specificity (25 %) | 7.5 | 8 | 7 |
| Product clarity (25 %) | 9 | 6.5 | 8.5 |
| Visual execution (20 %) | 7.5 | 7 | 7.5 |
| Accessibility (15 %) | 8.5 | 8.5 | 7 |
| Performance and maintainability (15 %) | 9 | 8 | 7 |
| **Weighted** | **8.25** | **7.50** | **7.48** |

What drove the numbers:

- **Product clarity.** At 1440×900, A shows the headline, the maker, what the
  product does, the Marketplace button, the requirements and an annotated
  photograph in one view. C does the same on mobile better than anyone (photo,
  headline and CTA in the first 844 px) but its desktop nav is unreadable where
  it crosses bright keys. B's product image starts below the fold on both
  sizes and installation is one expansion away.
- **Brand specificity.** B is the most personal and has the best idea for
  honesty (an "editorial" tag separating explanation from documented fact).
  A's identity comes from the mark's own geometry (the L bracket) and from
  pairing each principle with its evidence. C's identity comes from the
  product's colours.
- **Accessibility.** C lays body text and the nav over a photograph, so
  contrast depends on a gradient and on where the image crops at each width.
- **Maintainability.** A and C need no JavaScript. C's stage colours are
  sampled from the renders by hand and go stale if the themes change; its
  full-bleed opening needs a larger photograph to stay sharp at 1920 px and
  above. B's serif masthead changes metrics per platform (Sitka on Windows,
  Iowan on Apple), which is where its line breaks were least stable.

## The strongest case against each

- **A.** It is closest to the page it replaces: another dark product page for
  a hardware tool. The bracket is quiet enough that many visitors will not
  consciously notice it, and Stephen appears as a byline and a closing section
  rather than as the voice of the page.
- **B.** An index with one released product is thin, and the format invites
  padding it with unreleased work later. It puts the name ahead of the thing
  most visitors came to install; the Stream Deck owner has to find the product
  under a masthead about a person they do not know yet.
- **C.** Remove the logo and it is a gaming-peripheral landing page. The
  drama costs bytes (a full-bleed photograph must be large to stay sharp on
  wide screens), costs legibility (text over image), and puts the maker last.

## Decision: A, Instrument House

A is the direction that serves both audiences without trading one away: the
first-time visitor gets the product, its requirements and the install path in
one view, and the returning user gets an explicit Install and Help path. It
makes Stephen visible where it matters (the byline under the headline, a full
maker section in his own public words) without making the page about him. Its
distinctiveness is built from things only this brand has: the SL mark's
geometry, the plugin's real output and the evidence behind each claim. It
needs no JavaScript, which is the most direct way to be consistent with a site
whose argument is "no unnecessary software overhead".

Rejected trade-offs, kept out rather than averaged in:

- B's serif masthead: a second type voice would split A's instrument
  character. What was kept is B's rule, not its look: the redesigned page
  labels demonstrations as examples and scopes every figure.
- C's full-bleed photograph and theme-tinted stage: attractive, but they
  compete with the product's own screens for attention and add weight.

What A must fix before it ships (found in this comparison):

1. Callout pins covered readings; move them into the gaps between keys.
2. The maker section needs the same weight as a product entry, not a
   footnote.
3. Check wide viewports (1920, 3440) for a composed rather than stranded
   layout.
4. Serve the 900 px photograph to phones; only large screens get 1600 px.

## References

No external reference sites were used. The guiding sources were the WCAG 2.2
text, web.dev's Core Web Vitals thresholds, and the plugin's own written
display rules (contrast ratios, fixed anchors, true-black backgrounds), which
the page borrows as principles rather than as visuals.

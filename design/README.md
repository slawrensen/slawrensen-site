# Design notes

The homepage is photographic and neon-noir, and it keeps its words to a
minimum. The rule is: **visuals lead, copy cuts.**

## Word budget

The whole homepage has 80 to 120 visible words, with 140 as the hard ceiling.
That count covers navigation, captions, controls and the footer. Legal
fine print and accessibility-only text (alt text, the visually hidden
legend) are exempt. Nothing is hidden to get under the count.

| Region | Words at 1440 px | Ceiling |
| --- | --- | --- |
| Header | 4 | |
| Opening: kicker, headline, line, actions, requirements, photo caption | 37 | headline 2–6, line 12 |
| Product: name, benefit, key states, caption, facts, links | 34 | heading 1–3, benefit 10, caption 8 |
| Maker: heading, statement, links | 17 | statement 12 |
| Footer (copyright) | 3 | |
| **Counted** | **95** | 120 |
| Legal fine print (exempt) | 45 | |

Phones count 91, because the opening's photo caption is not shown there;
the product caption already says the keys are photographed. Before adding a
word, remove one. Detailed documentation belongs behind a link to
docs.slawrensen.com, not on the homepage.

## Colour and light

- One neon, `--neon` (#3cc8ff), for the headline's last word, the primary
  action, links, and the SL mark drawn as a neon tube.
- One counter-accent, `--hot` (#ff4b2e), the product's critical red. It
  appears only where a reading goes critical: the word "red" and the
  Critical key state. Amber belongs to the product's Warn state and
  appears nowhere else.
- Everything else is black, black chrome and white. No glowing borders.
- The page runs no JavaScript and needs no motion. The only transition is
  the key-state crossfade, and it switches off under reduced motion.

## Photographs

Every image is a crop of one photograph: the plugin running on a Stream
Deck + XL, the product repository's master
`marketing/hwinfo-streamdeckxlplus.png` (Sony A7 III). Nothing is staged,
added or moved. `neon-photo.py` makes the crops and grades only the shadows
towards a cool black; the lit key and touch-strip screens keep their
original pixels. The three keys in the product section are real keys from
that photograph showing the same 59.0 °C reading, one normal and two set
past demo warn and critical thresholds (their labels say "demo").

```
python design/neon-photo.py <path to hwinfo-streamdeckxlplus.png> public/assets
```

Crop boxes and output widths are listed at the top of the script. If a crop
changes, write it under a new version (`-v2`) instead of overwriting
the old file: files in `public/assets/` are cached as immutable for a year.

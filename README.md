# slawrensen.com

Static site for Stephen Lawrensen's software, published as slawrensen.
Single page, no build step, no dependencies, no JavaScript. Its product is
HWiNFO Sensors for the Elgato Stream Deck.

## Structure

```
public/
  index.html    the whole site, self-contained (inline CSS, no script)
  _headers      Cloudflare Pages security + cache headers
  favicon.svg   brand mark
  robots.txt
  404.html      styled 404 page
  assets/       photo crops (webp), social card (jpg), older images kept for redirects
design/
  README.md       word budget, colour rules, where the photographs come from
  neon-photo.py   crops and grades the hardware photograph into assets/
.github/workflows/pages-deployment.yaml   CI/CD
```

## Deploy

Push to `main`; GitHub Actions deploys `public/` to Cloudflare Pages via
`cloudflare/wrangler-action`. Live at <https://slawrensen.com> — `www` 301s to
the apex, and it is also served at <https://slawrensen.pages.dev>.

Manual deploy:

```
npx wrangler pages deploy public --project-name=slawrensen
```

## Local preview

```
python -m http.server 8791 --directory public
```

then open <http://localhost:8791/>.

## Editing

It is one HTML file. Design tokens (colour, type, gutters) live in the
`:root` CSS variables at the top. The page has a word budget: read
`design/README.md` before adding copy.

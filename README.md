# slawrensen.com

Static marketing site for Stephen Lawrensen — independent software for the
Windows desktop. Single page, no build step, no dependencies. Product 01 is
HWiNFO Sensors for the Elgato Stream Deck.

## Structure

```
public/
  index.html    the whole site — self-contained (inline CSS + a few lines of JS)
  _headers      Cloudflare Pages security + cache headers
  favicon.svg   brand mark
  robots.txt
  assets/hwinfo-sensors.png
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

It is one HTML file. Design tokens (colour, spacing, type scale) live in the
`:root` CSS variables at the top. Add a product by copying the `.product`
block and bumping `Products / 02`.

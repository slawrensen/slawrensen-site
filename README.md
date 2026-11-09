# slawrensen.com

Personal site of Stephen Lawrensen: Mac Sensors and HWiNFO Sensors, Stream Deck plugins for macOS and Windows. Single page, no build step, no dependencies, no JavaScript.

## Structure

```
public/
  index.html    the whole site, self-contained (inline CSS, no JavaScript)
  _headers      Cloudflare Pages security + cache headers
  favicon.svg   brand mark
  robots.txt
  404.html      styled 404 page
  assets/       desk photo and its key close-up (webp), Mac Sensors board (webp), social card (jpg)
.github/workflows/pages-deployment.yaml   CI/CD
```

## Deploy

Push to `main`; GitHub Actions deploys `public/` to Cloudflare Pages via
`cloudflare/wrangler-action`. Live at <https://slawrensen.com>; `www` 301s to
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

It is one HTML file. Design tokens (color, type and column width) live in the
`:root` CSS variables at the top. The page is dark only. Add a product by copying an `article.product`
block. Images carry a version in the filename; when the bytes change, bump the
version and add the old name to `_redirects`.

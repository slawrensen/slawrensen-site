#!/bin/sh
# Source checks for public/: the site's privacy and caching rules, enforced.
#
#   sh scripts/check-source.sh        (CI runs this before every deploy)
#
# The site promises no third-party requests, no storage and no cookies, and
# runs no JavaScript. Those promises are only worth something if the build
# fails when the source stops keeping them.
set -u
cd "$(dirname "$0")/.." || exit 2
fail=0
check() { # pattern, human description
  if grep -REn "$1" public --include='*.html' --include='*.css'; then
    echo "::error::$2"
    fail=1
  fi
}
check '<script[^>]+src=' 'external or separate <script src> found - the page must stay self-contained'
# Only relations that actually fetch something. rel=canonical and
# rel=icon (relative) are absolute-URL-bearing but request-free.
check '<link[^>]+rel="?(stylesheet|preload|prefetch|preconnect|dns-prefetch|modulepreload)' 'a fetching <link> (stylesheet/preload/preconnect) found'
check '@import' 'CSS @import found - would create an extra request'
check 'url\((https?:)?//' 'absolute url() reference found in CSS'
check 'fetch\(|XMLHttpRequest|navigator\.sendBeacon|new WebSocket' 'network call found in page script'
check 'document\.cookie|localStorage|sessionStorage|serviceWorker' 'client-side storage, cookie or service-worker use found'

# The CSP says script-src 'none'. Anything that would run script is blocked in
# the browser, so catch it here instead: every <script is a JSON-LD data block
# (counted, so a tag split across lines still fails), and there are no inline
# event handlers or javascript: URLs.
for f in $(find public -name '*.html'); do
  all=$(grep -o '<script' "$f" | wc -l)
  data=$(grep -o '<script type="application/ld+json">' "$f" | wc -l)
  if [ "$all" -ne "$data" ]; then
    echo "::error::$f: executable <script> found - the site runs no JavaScript (see the CSP in public/_headers)"
    fail=1
  fi
done
check '[[:space:]]on[a-z]+[[:space:]]*=' 'inline event handler (on*=) found - the CSP blocks script'
check 'javascript:' 'javascript: URL found - the CSP blocks script'

# /assets/* is cached for a year as immutable, which is only safe when the
# bytes behind a name never change: every file there needs a version.
for f in public/assets/*; do
  case "$(basename "$f")" in
    *-v[0-9]*.*) ;;
    *) echo "::error::unversioned asset name: $f (rename to name-vN.ext; see public/_headers)"; fail=1 ;;
  esac
done

if [ "$fail" = "1" ]; then
  echo "Source check FAILED (see errors above)."
  exit 1
fi
echo "Source is self-contained: no external requests, no scripts, no storage, no cookies; every asset is versioned."

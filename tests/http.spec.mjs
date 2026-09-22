// Server-level behaviour: security headers, caching, redirects, 404.
// Browser-independent, so it runs once (in the chromium project).
import { test, expect } from '@playwright/test';
import fs from 'node:fs';

test.skip(({ browserName }) => browserName !== 'chromium', 'server behaviour: checked once');

const ASSETS = fs.readdirSync('public/assets');
const REDIRECTS = fs.readFileSync('public/_redirects', 'utf8').split('\n')
  .map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
  .map((l) => l.split(/\s+/)).map(([from, to, code]) => ({ from, to, code: Number(code) }));

test('home page carries the security headers and revalidates', async ({ request }) => {
  const r = await request.get('/');
  expect(r.status()).toBe(200);
  const h = r.headers();
  const csp = h['content-security-policy'];
  expect(csp).toContain("default-src 'none'");
  expect(csp).toContain("script-src 'none'");
  expect(csp).toContain("img-src 'self'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).not.toMatch(/report-(uri|to)/);
  expect(h['x-frame-options']).toBe('DENY');
  expect(h['x-content-type-options']).toBe('nosniff');
  expect(h['strict-transport-security']).toContain('max-age=31536000');
  expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(h['permissions-policy']).toContain('camera=()');
  expect(h['cache-control']).toBe('no-cache, must-revalidate');
  expect(h['set-cookie']).toBeUndefined();
});

test('every asset is versioned and cached once, as immutable', async ({ request }) => {
  expect(ASSETS.length).toBeGreaterThan(0);
  for (const name of ASSETS) {
    expect(name, `${name} needs a version in its name`).toMatch(/-v\d+/);
    const r = await request.get(`/assets/${name}`);
    expect(r.status(), name).toBe(200);
    // One Cache-Control value, not two joined rules.
    expect(r.headers()['cache-control'], name).toBe('public, max-age=31536000, immutable');
  }
});

test('fixed-name icons are served and cached for a day', async ({ request }) => {
  for (const [path, type] of [['/favicon.svg', 'image/svg+xml'], ['/apple-touch-icon.png', 'image/png']]) {
    const r = await request.get(path);
    expect(r.status(), path).toBe(200);
    expect(r.headers()['content-type'], path).toContain(type);
    expect(r.headers()['cache-control'], path).toBe('public, max-age=86400');
  }
});

test('retired asset names redirect to files that exist', async ({ request }) => {
  expect(REDIRECTS.length).toBeGreaterThan(0);
  for (const { from, to, code } of REDIRECTS) {
    const r = await request.get(from, { maxRedirects: 0 });
    expect(r.status(), from).toBe(code);
    expect(new URL(r.headers().location, 'http://x').pathname, from).toBe(to);
    const target = await request.get(to);
    expect(target.status(), `${from} -> ${to}`).toBe(200);
  }
});

test('an unknown path gets the 404 page with ways back', async ({ request, page }) => {
  const r = await request.get('/no-such-page');
  expect(r.status()).toBe(404);
  await page.goto('/no-such-page');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nothing lives at this address.');
  for (const href of ['/', '/#products', '/#install', 'https://docs.slawrensen.com/hwinfo-streamdeck/']) {
    await expect(page.locator(`a[href="${href}"]`).first()).toBeVisible();
  }
});

test('robots.txt allows crawling', async ({ request }) => {
  const r = await request.get('/robots.txt');
  expect(r.status()).toBe(200);
  expect(await r.text()).toContain('Allow: /');
});

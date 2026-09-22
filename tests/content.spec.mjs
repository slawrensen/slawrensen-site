// Content integrity: links go where they should, facts agree with each other,
// the mark has one geometry, and claims removed for being unsupported stay gone.
import { test, expect } from '@playwright/test';
import fs from 'node:fs';

test.skip(({ browserName }) => browserName !== 'chromium', 'content checks: browser-independent');

const html = fs.readFileSync('public/index.html', 'utf8');

// Every outbound destination must be one of the verified ones (docs/redesign/CLAIMS.md).
const ALLOWED = [
  /^https:\/\/marketplace\.elgato\.com\/product\/hwinfo-sensors-82436166-3d61-4527-9034-8fdf16d92c54$/,
  /^https:\/\/docs\.slawrensen\.com\/(hwinfo-streamdeck\/([a-z-]+\.html)?)?$/,
  /^https:\/\/github\.com\/slawrensen(\/(hwinfo-streamdeck|slawrensen-site)(\/.*)?)?$/,
  /^https:\/\/github\.com\/shayne\/hwinfo-streamdeck$/,
];

test('in-page links land on real targets; outbound links are verified destinations', async ({ page }) => {
  await page.goto('/');
  const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
  for (const href of hrefs) {
    if (href.startsWith('#')) {
      await expect(page.locator(href), href).toHaveCount(1);
    } else if (href.startsWith('/')) {
      expect(['/', '/#products', '/#install']).toContain(href);
    } else {
      expect(ALLOWED.some((re) => re.test(href)), `unverified destination ${href}`).toBe(true);
    }
  }
  // No link opens a new window: ordinary links, the visitor decides.
  expect(await page.$$eval('a[target]', (as) => as.length)).toBe(0);
});

test('structured data agrees with the page', async ({ page }) => {
  await page.goto('/');
  const ld = JSON.parse(await page.$eval('script[type="application/ld+json"]', (s) => s.textContent));
  expect(ld.author).toEqual({ '@type': 'Person', name: 'Stephen Lawrensen', url: 'https://github.com/slawrensen' });
  expect(ld.license).toBe('https://opensource.org/licenses/MIT');
  const specRelease = await page.locator('.sheet .row').filter({ has: page.locator('dt', { hasText: /^Release$/ }) }).locator('dd').innerText();
  expect(specRelease.startsWith(ld.softwareVersion)).toBe(true);
  await expect(page.locator('#principles')).toContainText(`Version ${ld.softwareVersion}`);
  // Release notes and version-specific documents point at the same tag.
  const tag = `v${ld.softwareVersion}`;
  const notes = page.locator('a[href*="/releases/tag/"]');
  await expect(notes).toHaveAttribute('href', `https://github.com/slawrensen/hwinfo-streamdeck/releases/tag/${tag}`);
  await expect(notes).toContainText(ld.softwareVersion);
  for (const doc of ['PERF.md', 'SECURITY.md']) {
    const hrefs = await page.$$eval(`a[href$="/${doc}"]`, (as) => as.map((a) => a.getAttribute('href')));
    expect(hrefs.length, doc).toBeGreaterThan(0);
    for (const h of hrefs) expect(h, doc).toBe(`https://github.com/slawrensen/hwinfo-streamdeck/blob/${tag}/${doc}`);
  }
});

test('the SL mark has one geometry everywhere', async () => {
  const favicon = fs.readFileSync('public/favicon.svg', 'utf8');
  const d = favicon.match(/<path d="([^"]+)"/)[1];
  const generated = JSON.parse(fs.readFileSync('design/mark/sl-letters.json', 'utf8')).d;
  expect(d).toBe(generated);
  for (const file of ['public/index.html', 'public/404.html']) {
    const paths = [...fs.readFileSync(file, 'utf8').matchAll(/<svg viewBox="0 0 64 64"[^>]*>.*?<path d="([^"]+)"/g)].map((m) => m[1]);
    expect(paths.length, file).toBeGreaterThan(0);
    for (const p of paths) expect(p, file).toBe(d);
  }
});

test('claims removed as unsupported do not come back', () => {
  for (const stale of [
    // removed from the previous site (docs/redesign/CLAIMS.md)
    '5.9 µs', 'SIGNAL OK', 'PHONES HOME', 'everything that comes next', 'Every line is on GitHub', 'CPU PKG', 'GPU FAN',
    // corrected after review: over-claims against the product's own documentation
    'any Stream Deck', "author's machine", 'One person makes all of it', 'never presented as a live one', 'read across the room',
  ]) {
    expect(html.includes(stale), stale).toBe(false);
  }
});

test('the maker is named, and the brand stays lowercase', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.byline')).toContainText('Built by Stephen Lawrensen');
  await expect(page.locator('#about h2')).toHaveText('Stephen Lawrensen');
  const brand = await page.$$eval('.brand span', (s) => s.map((x) => x.textContent));
  expect(new Set(brand)).toEqual(new Set(['slawrensen']));
});

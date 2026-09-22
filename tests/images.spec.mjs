// Images: every picture on the page actually loads at the pixel densities
// visitors have, and every srcset candidate the browser might pick exists.
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { scrollThrough, FACE_OPTIONS, chooseFace } from './helpers.mjs';

for (const [w, h, dpr] of [[390, 844, 3], [1440, 900, 1], [1440, 900, 2], [2560, 1440, 2]]) {
  test(`every image loads at ${w}x${h}@${dpr}x`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
    const page = await ctx.newPage();
    await page.goto('/');
    await scrollThrough(page);
    for (const name of FACE_OPTIONS) await chooseFace(page, name);
    // A lazy image only loads once it nears the viewport, and how early is up
    // to the engine, so bring each visible image into view the way a reader
    // would, then require it to load. A missing file never gets pixels and
    // still fails after the timeout.
    const imgs = page.locator('img');
    for (let i = 0; i < await imgs.count(); i++) {
      const img = imgs.nth(i);
      if (!(await img.isVisible())) continue;
      await img.scrollIntoViewIfNeeded();
      await expect.poll(() => img.evaluate((el) => el.complete && el.naturalWidth > 0),
        { message: await img.getAttribute('src'), timeout: 10_000 }).toBe(true);
    }
    const hero = await page.$eval('.folio img', (i) => ({ src: i.currentSrc, w: i.naturalWidth }));
    expect(hero.w, hero.src).toBeGreaterThan(0);
    await ctx.close();
  });
}

test('every src and srcset candidate in the pages exists', async ({ request, browserName }) => {
  test.skip(browserName !== 'chromium', 'server check: once');
  const urls = new Set();
  for (const file of ['public/index.html', 'public/404.html']) {
    const html = fs.readFileSync(file, 'utf8');
    for (const m of html.matchAll(/\ssrc="([^"]+)"/g)) urls.add(m[1]);
    for (const m of html.matchAll(/srcset="([^"]+)"/g)) for (const c of m[1].split(',')) urls.add(c.trim().split(/\s+/)[0]);
  }
  expect(urls.size).toBeGreaterThan(10);
  for (const u of urls) {
    const r = await request.get(u);
    expect(r.status(), u).toBe(200);
    expect(r.headers()['content-type'], u).toMatch(/^image\//);
  }
});

// Payload budgets (docs/redesign/VALIDATION.md): no application JavaScript,
// at most 100 KB compressed HTML/CSS/JS, at most 500 KB eager first load.
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import zlib from 'node:zlib';

test.skip(({ browserName }) => browserName !== 'chromium', 'transfer sizes measured in Chromium');

test('HTML, CSS and JS stay inside the compressed budget', () => {
  for (const file of ['public/index.html', 'public/404.html']) {
    const raw = fs.readFileSync(file);
    const br = zlib.brotliCompressSync(raw).length;
    expect(br, `${file} brotli bytes`).toBeLessThanOrEqual(100 * 1024);
    const js = [...raw.toString().matchAll(/<script(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('');
    expect(js.length, `${file} application JavaScript`).toBe(0);
  }
});

for (const [w, h, dpr] of [[390, 844, 3], [1440, 900, 2], [1920, 1080, 1]]) {
  test(`eager first load at ${w}x${h}@${dpr}x stays under 500 KB`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
    const page = await ctx.newPage();
    const responses = [];
    page.on('requestfinished', async (req) => { const s = await req.sizes(); responses.push({ url: req.url(), bytes: s.responseBodySize + s.responseHeadersSize }); });
    await page.goto('/', { waitUntil: 'networkidle' });
    const total = responses.reduce((a, r) => a + r.bytes, 0);
    test.info().annotations.push({ type: 'eager', description: `${total} B in ${responses.length} requests: ${responses.map((r) => new URL(r.url).pathname).join(', ')}` });
    expect(total).toBeLessThanOrEqual(500 * 1024);
    await ctx.close();
  });
}

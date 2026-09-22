// Screenshot + load-metrics harness.
//
//   node scripts/capture.mjs --root public --out <dir> [--pages /,/missing]
//        [--base http://127.0.0.1:8791]  (use an already-running server instead)
//        [--engines chromium,firefox,webkit] [--viewports 390x844,1440x900]
//        [--nojs] [--reduce] [--full]
//
// Serves --root through wrangler's Pages emulator, loads each page at each
// viewport in each engine, and writes <engine>-<page>-<w>x<h>[-full].jpg plus
// metrics.json (console errors, page errors, every request with its origin
// and decoded size, cumulative layout shift, horizontal overflow).
import { chromium, firefox, webkit } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { startPagesServer } from './lib/pages-server.mjs';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => {
  if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]);
  return acc;
}, []));

const root = path.resolve(args.root || 'public');
const out = path.resolve(args.out || 'capture-out');
const pages = String(args.pages || '/').split(',');
const engines = String(args.engines || 'chromium').split(',');
const viewports = String(args.viewports || '320x720,360x800,390x844,768x1024,1440x900,1920x1080,3440x1440')
  .split(',').map((v) => { const [w, h] = v.split('x').map(Number); return { width: w, height: h }; });
const port = Number(args.port || 8790);
const types = { chromium, firefox, webkit };

fs.mkdirSync(out, { recursive: true });
const server = args.base
  ? { url: String(args.base).replace(/\/?$/, '/'), stop() {} }
  : await startPagesServer(root, port);
const report = { root, startedAt: new Date().toISOString(), server: server.url, options: args, runs: [] };

try {
  for (const name of engines) {
    const browser = await types[name].launch();
    report[`${name}Version`] = browser.version();
    for (const pg of pages) {
      for (const vp of viewports) {
        const context = await browser.newContext({
          viewport: vp, deviceScaleFactor: 1,
          javaScriptEnabled: !args.nojs,
          reducedMotion: args.reduce ? 'reduce' : 'no-preference',
        });
        const page = await context.newPage();
        const consoleMsgs = [], pageErrors = [], requests = [];
        page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) consoleMsgs.push(`${m.type()}: ${m.text()}`); });
        page.on('pageerror', (e) => pageErrors.push(String(e)));
        page.on('requestfinished', async (req) => {
          const res = await req.response();
          let bytes = null;
          try { bytes = (await res.body()).length; } catch { /* redirects have no body */ }
          requests.push({ url: req.url(), type: req.resourceType(), status: res && res.status(), bytes });
        });
        page.on('requestfailed', (req) => requests.push({ url: req.url(), type: req.resourceType(), failed: req.failure()?.errorText }));
        if (name === 'chromium') {
          await page.addInitScript(() => {
            window.__cls = 0;
            try {
              new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; })
                .observe({ type: 'layout-shift', buffered: true });
            } catch { /* engine without layout-shift entries */ }
          });
        }
        await page.goto(server.url.replace(/\/$/, '') + pg, { waitUntil: 'load' });
        await page.waitForTimeout(900);
        const slug = pg === '/' ? 'home' : pg.replace(/^\/|\/$/g, '').split('/').pop().replace(/[^a-z0-9-]+/gi, '');
        const tag = `${name}-${slug}-${vp.width}x${vp.height}${args.reduce ? '-reduce' : ''}${args.nojs ? '-nojs' : ''}`;
        await page.screenshot({ path: path.join(out, `${tag}.jpg`), type: 'jpeg', quality: 82 });
        if (args.full) {
          // Scroll through once so lazy images load before the full-page capture.
          await page.evaluate(async () => {
            for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight / 2) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
            scrollTo(0, 0);
          });
          await page.waitForTimeout(700);
          await page.screenshot({ path: path.join(out, `${tag}-full.jpg`), type: 'jpeg', quality: 72, fullPage: true });
        }
        const layout = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          scrollHeight: document.documentElement.scrollHeight,
          cls: window.__cls ?? null,
          cookies: document.cookie,
          localStorageKeys: (() => { try { return Object.keys(localStorage); } catch { return 'unavailable'; } })(),
        }));
        const origin = new URL(server.url).origin;
        report.runs.push({
          engine: name, page: pg, viewport: vp, screenshot: `${tag}.jpg`,
          horizontalOverflow: layout.scrollWidth > layout.clientWidth,
          ...layout, consoleMsgs, pageErrors,
          crossOrigin: requests.filter((r) => !r.url.startsWith(origin) && !r.url.startsWith('data:')),
          requests: requests.map((r) => ({ ...r, url: r.url.replace(origin, '') })),
          totalDecodedBytes: requests.reduce((s, r) => s + (r.bytes || 0), 0),
        });
        await context.close();
      }
    }
    await browser.close();
  }
} finally {
  server.stop();
}
fs.writeFileSync(path.join(out, 'metrics.json'), JSON.stringify(report, null, 2));
const bad = report.runs.filter((r) => r.horizontalOverflow || r.pageErrors.length || r.consoleMsgs.length || r.crossOrigin.length);
console.log(`${report.runs.length} runs -> ${out}`);
for (const r of report.runs) {
  console.log(`${r.engine.padEnd(8)} ${r.page.padEnd(10)} ${String(r.viewport.width).padStart(4)}x${r.viewport.height}` +
    `  h=${r.scrollHeight}  overflow=${r.horizontalOverflow}  cls=${r.cls === null ? 'n/a' : r.cls.toFixed(4)}` +
    `  req=${r.requests.length}  bytes=${r.totalDecodedBytes}  xorigin=${r.crossOrigin.length}  console=${r.consoleMsgs.length}  errors=${r.pageErrors.length}`);
}
if (bad.length) console.log(`\n${bad.length} run(s) with overflow, errors, console messages or cross-origin requests; see metrics.json`);

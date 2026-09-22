// Repeatable lab performance runs.
//
//   node scripts/lighthouse.mjs [--root public] [--runs 5] [--out file.json]
//
// Serves --root through wrangler's Pages emulator (brotli, _headers applied)
// and runs Lighthouse's default mobile configuration: Moto G Power
// emulation, simulated slow-4G throttling and 4x CPU slowdown, a fresh
// headless Chrome profile per run (cold cache). Reports median and range.
// These are lab numbers from one machine, not field Core Web Vitals.
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { startPagesServer } from './lib/pages-server.mjs';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const root = path.resolve(opt('root', 'public'));
const runs = Number(opt('runs', 5));
const out = opt('out', null);
const port = Number(opt('port', 8793));

const server = await startPagesServer(root, port);
const results = [];
try {
  for (let i = 0; i < runs; i++) {
    // LH_CHROME picks a Chrome binary; the default is Playwright's pinned
    // Chromium build. (On some Windows hosts chrome-launcher cannot spawn the
    // Playwright binary; point LH_CHROME at an installed Chrome there.)
    const chrome = await chromeLauncher.launch({
      chromePath: process.env.LH_CHROME || chromium.executablePath(),
      chromeFlags: ['--headless=new', '--no-first-run', '--disable-extensions'],
    });
    try {
      const r = await lighthouse(server.url, { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] });
      const a = r.lhr.audits;
      results.push({
        performance: r.lhr.categories.performance.score * 100,
        accessibility: r.lhr.categories.accessibility.score * 100,
        bestPractices: r.lhr.categories['best-practices'].score * 100,
        seo: r.lhr.categories.seo.score * 100,
        fcp: a['first-contentful-paint'].numericValue,
        lcp: a['largest-contentful-paint'].numericValue,
        tbt: a['total-blocking-time'].numericValue,
        cls: a['cumulative-layout-shift'].numericValue,
        si: a['speed-index'].numericValue,
        transferBytes: a['total-byte-weight'].numericValue,
        requests: a['network-requests'].details.items.length,
        lcpElement: a['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.node?.snippet ?? null,
        failedAudits: Object.values(r.lhr.categories).flatMap((c) => c.auditRefs)
          .map((ref) => a[ref.id]).filter((x) => x && x.score !== null && x.score < 1 && x.scoreDisplayMode !== 'informative' && x.scoreDisplayMode !== 'notApplicable' && x.scoreDisplayMode !== 'manual')
          .map((x) => `${x.id} (${x.score})`),
        lighthouseVersion: r.lhr.lighthouseVersion,
        userAgent: r.lhr.environment.hostUserAgent,
      });
    } finally {
      // On Windows Chrome can still hold its temp profile when chrome-launcher
      // tries to delete it; a leftover temp dir is harmless.
      try { await chrome.kill(); } catch { /* EPERM on the temp profile */ }
    }
  }
} finally {
  server.stop();
}

const median = (xs) => { const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const keys = ['performance', 'accessibility', 'bestPractices', 'seo', 'fcp', 'lcp', 'tbt', 'cls', 'si', 'transferBytes', 'requests'];
const summary = Object.fromEntries(keys.map((k) => {
  const xs = results.map((r) => r[k]);
  return [k, { median: median(xs), min: Math.min(...xs), max: Math.max(...xs) }];
}));
const report = { root, runs, settings: 'lighthouse default mobile (Moto G Power, simulated slow 4G, 4x CPU)', lighthouseVersion: results[0]?.lighthouseVersion, userAgent: results[0]?.userAgent, lcpElement: results[0]?.lcpElement, summary, results };
if (out) fs.writeFileSync(out, JSON.stringify(report, null, 2));
console.log(`Lighthouse ${report.lighthouseVersion}, ${runs} cold runs, ${report.settings}`);
for (const k of keys) {
  const s = summary[k];
  const f = (v) => (k === 'cls' ? v.toFixed(3) : Math.round(v));
  console.log(`  ${k.padEnd(14)} median ${String(f(s.median)).padStart(7)}   range ${f(s.min)}-${f(s.max)}`);
}
console.log(`  LCP element: ${report.lcpElement}`);
console.log(`  Audits below 1 (first run): ${results[0]?.failedAudits.join(', ') || 'none'}`);

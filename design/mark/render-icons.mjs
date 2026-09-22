// Rasterise the canonical mark for platforms that need a bitmap.
//
//   node design/mark/render-icons.mjs     writes public/favicon.svg and
//                                          public/apple-touch-icon.png
//
// Uses Playwright's Chromium (a dev dependency) to draw the SVG from
// sl-mark.mjs; nothing is redrawn by hand or by an image generator.
import { chromium } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { svg } from './sl-mark.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
fs.writeFileSync(path.join(repo, 'public', 'favicon.svg'), svg());
const size = 180; // iOS home-screen icon; iOS rounds the corners itself
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
await page.setContent(`<body style="margin:0">${svg({ square: true, title: false }).replace('<svg ', `<svg width="${size}" height="${size}" `)}</body>`);
await page.screenshot({ path: path.join(repo, 'public', 'apple-touch-icon.png'), clip: { x: 0, y: 0, width: size, height: size } });
await browser.close();
console.log('wrote public/favicon.svg and public/apple-touch-icon.png');

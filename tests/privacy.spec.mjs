// The website's own privacy claims, checked in the browser: no third-party
// requests, no cookies, no storage, no service worker, no script running.
import { test, expect } from '@playwright/test';
import { scrollThrough, watch, FACE_OPTIONS, chooseFace } from './helpers.mjs';

test('a full visit makes only same-origin requests and leaves no state', async ({ page, baseURL }) => {
  const seen = watch(page);
  await page.goto('/');
  await scrollThrough(page);
  for (const name of FACE_OPTIONS) await chooseFace(page, name);
  await page.waitForLoadState('networkidle');

  const origin = new URL(baseURL).origin;
  const foreign = seen.requests.filter((u) => !u.startsWith(origin) && !u.startsWith('data:'));
  expect(foreign, 'requests to other origins').toEqual([]);
  expect(seen.pageErrors).toEqual([]);
  expect(seen.consoleErrors).toEqual([]);

  const state = await page.evaluate(async () => ({
    cookie: document.cookie,
    local: localStorage.length,
    session: sessionStorage.length,
    sw: 'serviceWorker' in navigator ? (await navigator.serviceWorker.getRegistrations()).length : 0,
  }));
  expect(state).toEqual({ cookie: '', local: 0, session: 0, sw: 0 });
  expect(await page.context().cookies()).toEqual([]);
});

test('no executable script is present', async ({ page }) => {
  await page.goto('/');
  const scripts = await page.evaluate(() => [...document.scripts].map((s) => s.type || 'text/javascript'));
  expect(scripts).toEqual(['application/ld+json']);
});

test('demonstration values are labelled as examples, not as the visitor\'s hardware', async ({ page }) => {
  await page.goto('/');
  const products = page.locator('#products');
  await expect(products).toContainText('The readings are fixed example values; this page does not read your machine.');
  await expect(page.locator('.folio figcaption')).toContainText('the numbers are that machine\'s, not yours');
});

test('the website privacy note names the host instead of implying nobody sees a request', async ({ page }) => {
  await page.goto('/');
  const note = page.locator('footer');
  await expect(note).toContainText('no analytics, cookies, trackers or third-party requests');
  await expect(note).toContainText('your request, including your IP address, reaches Cloudflare');
});

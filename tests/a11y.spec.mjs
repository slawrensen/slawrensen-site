// Accessibility and resilience: axe, structure, keyboard, the comparison
// control, focus visibility, and rendering without script, in print, with
// reduced motion and in forced colours.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { scrollThrough, FACE_OPTIONS, chooseFace, invisibleCount } from './helpers.mjs';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

for (const [path, w, h] of [['/', 1440, 900], ['/', 390, 844], ['/missing', 1440, 900], ['/missing', 390, 844]]) {
  test(`axe finds no violations on ${path} at ${w}px`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto(path);
    await scrollThrough(page);
    const r = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });
}

test('axe finds no violations in every comparison state', async ({ page }) => {
  await page.goto('/');
  for (const name of FACE_OPTIONS) {
    await chooseFace(page, name);
    const r = await new AxeBuilder({ page }).include('#products').withTags(TAGS).analyze();
    expect(r.violations.map((v) => v.id), name).toEqual([]);
  }
});

test('landmarks, one h1 and an unbroken heading outline', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('header')).toHaveCount(1);
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('footer')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveCount(1);
  const levels = await page.$$eval('h1,h2,h3,h4,h5,h6', (hs) => hs.map((x) => Number(x.tagName[1])));
  for (let i = 1; i < levels.length; i++) expect(levels[i] - levels[i - 1], `heading jump at #${i}`).toBeLessThanOrEqual(1);
  for (const id of ['products', 'install', 'principles', 'about', 'support']) await expect(page.locator(`#${id}`)).toHaveCount(1);
});

test('every image has a text alternative, and only duplicates are silent', async ({ page }) => {
  await page.goto('/');
  await scrollThrough(page);
  const imgs = await page.$$eval('img', (xs) => xs.map((i) => ({ src: i.getAttribute('src'), alt: i.getAttribute('alt'), cls: i.className, loaded: i.complete && i.naturalWidth > 0 })));
  for (const i of imgs) {
    expect(i.alt, i.src).not.toBeNull();
    if (i.alt === '') expect(i.cls, `${i.src} is silent but not a duplicate`).toBe('small');
  }
});

test('keyboard: skip link first, visible focus, and the install path within reach', async ({ page, browserName }) => {
  // Safari, and Playwright's WebKit, do not move Tab through links unless the
  // user turns that on, so link order is checked in Chromium and Firefox.
  test.skip(browserName === 'webkit', 'WebKit tabs to form controls only by default');
  await page.goto('/');
  await page.keyboard.press('Tab');
  const active = await page.evaluate(() => document.activeElement.className);
  expect(active).toBe('skip');
  expect(await page.locator('.skip').isVisible()).toBe(true);
  const order = [];
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement; const cs = getComputedStyle(el.matches('input') ? document.querySelector(`label[for="${el.id}"]`) : el); const r = el.getBoundingClientRect();
      return { name: (el.getAttribute('aria-label') || el.textContent || el.id).trim().replace(/\s+/g, ' '), outline: cs.outlineStyle, ow: parseFloat(cs.outlineWidth), top: r.top, bottom: r.bottom, vh: innerHeight };
    });
    order.push(info.name);
    expect(info.outline, `focus ring on ${info.name}`).not.toBe('none');
    expect(info.ow, `focus ring width on ${info.name}`).toBeGreaterThanOrEqual(2);
    expect(info.top >= -1 && info.bottom <= info.vh + 1, `${info.name} is scrolled into view`).toBe(true);
  }
  expect(order.slice(0, 7)).toEqual(['slawrensen home', 'HWiNFO Sensors', 'Principles', 'About', 'Help', 'Install', 'Stephen Lawrensen']);
  expect(order).toContain('Get it on the Elgato Marketplace');
});

test('the sticky header never hides the focused element or an anchor target (WCAG 2.4.11)', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit tabs to form controls only by default');
  for (const [w, h] of [[768, 1024], [1440, 900]]) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/');
    const header = await page.locator('header.top').boundingBox();
    expect(await page.$eval('header.top', (e) => getComputedStyle(e).position)).toBe('sticky');
    let stops = 0;
    for (let i = 0; i < 80; i++) {
      await page.keyboard.press('Tab');
      const f = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const r = el.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + Math.min(8, r.width / 2), r.top + Math.min(8, r.height / 2));
        const target = el.matches('input') ? document.querySelector(`label[for="${el.id}"]`) : el;
        return { skip: el.matches('.skip'), inHeader: !!el.closest('header'), top: r.top, bottom: r.bottom, topmost: !!hit && (target.contains(hit) || hit.contains(target)), name: (el.textContent || el.id).trim().slice(0, 40) };
      });
      if (!f) break;
      stops++;
      if (f.skip) expect(f.topmost, `skip link is on top of the header at ${w}px`).toBe(true);
      else if (!f.inHeader) expect(f.top, `${f.name} at ${w}px is below the sticky header`).toBeGreaterThanOrEqual(header.height - 1);
    }
    expect(stops).toBeGreaterThan(30);
    for (const id of ['products', 'install', 'support', 'principles', 'about']) {
      await page.goto(`/#${id}`);
      const t = await page.locator(`#${id}`).boundingBox();
      expect(t.y, `#${id} lands below the header at ${w}px`).toBeGreaterThanOrEqual(header.height - 1);
    }
  }
});

test('on phones the header scrolls away instead of covering the page', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  expect(await page.$eval('header.top', (e) => getComputedStyle(e).position)).toBe('static');
});

test('the comparison is a native radio group that works from the keyboard', async ({ page }) => {
  await page.goto('/');
  const group = page.getByRole('group', { name: 'Show a key holding' });
  await expect(group.getByRole('radio')).toHaveCount(6);
  const visible = () => page.$$eval('.face', (fs) => fs.filter((f) => getComputedStyle(f).display !== 'none').map((f) => f.dataset.f));
  const ring = () => page.evaluate(() => { const e = document.activeElement; return getComputedStyle(document.querySelector(`label[for="${e.id}"]`)).outlineStyle; });
  expect(await visible()).toEqual(['1']);
  // Reach the group with Tab, as a keyboard user does (every engine stops on it).
  for (let i = 0; i < 40 && (await page.evaluate(() => document.activeElement.id)) !== 'f1'; i++) await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement.id)).toBe('f1');
  expect(await ring(), 'focus ring on arrival').toBe('solid');
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: 'Two' })).toBeChecked();
  expect(await visible()).toEqual(['2']);
  expect(await ring(), 'focus ring after an arrow key').toBe('solid');
  // Wrap-around at the ends differs by engine (WebKit stops), so stay inside.
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('radio', { name: 'Two' })).toBeChecked();
  expect(await visible()).toEqual(['2']);
});

test('every comparison option shows exactly its own face, with a loaded image', async ({ page }) => {
  await page.goto('/');
  for (const [i, name] of FACE_OPTIONS.entries()) {
    await chooseFace(page, name);
    const shown = await page.$$eval('.face', (fs) => fs.filter((f) => getComputedStyle(f).display !== 'none').map((f) => f.dataset.f));
    expect(shown, name).toEqual([String(i + 1)]);
    const big = page.locator(`.face[data-f="${i + 1}"] img.big`);
    await expect(big).toBeVisible();
    await expect.poll(() => big.evaluate((img) => img.complete && img.naturalWidth), { message: `${name} image loads` }).toBeGreaterThan(0);
    await expect(page.locator(`.face[data-f="${i + 1}"] h4`)).toHaveText(name === 'One reading' ? 'One reading' : new RegExp(`^${name}`));
  }
});

test('without JavaScript every section and the first face are visible', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/');
  for (const id of ['products', 'install', 'principles', 'about']) await expect(page.locator(`#${id}`)).toBeVisible();
  await expect(page.locator('.face[data-f="1"]')).toBeVisible();
  expect(await invisibleCount(page)).toBe(0);
  await ctx.close();
});

test('print shows every face and nothing is left invisible', async ({ page }) => {
  await page.goto('/');
  await page.emulateMedia({ media: 'print' });
  const faces = await page.$$eval('.face', (fs) => fs.filter((f) => getComputedStyle(f).display !== 'none').length);
  expect(faces).toBe(6);
  expect(await invisibleCount(page)).toBe(0);
  const ink = await page.$eval('h1', (h) => getComputedStyle(h).color);
  expect(ink).toBe('rgb(0, 0, 0)');
  // The numbered notes refer to pins on the photograph, so the pins print too.
  expect(await page.$$eval('.pin', (ps) => ps.filter((p) => getComputedStyle(p).display !== 'none').length)).toBe(4);
});

test('the 404 page prints dark text on white', async ({ page }) => {
  await page.goto('/missing');
  await page.emulateMedia({ media: 'print' });
  expect(await page.$eval('h1', (h) => getComputedStyle(h).color)).toBe('rgb(0, 0, 0)');
});

test('nothing animates, with or without reduced motion', async ({ browser }) => {
  for (const reducedMotion of ['no-preference', 'reduce']) {
    const ctx = await browser.newContext({ reducedMotion });
    const page = await ctx.newPage();
    await page.goto('/');
    await scrollThrough(page);
    await chooseFace(page, 'Four');
    expect(await page.evaluate(() => document.getAnimations().length), reducedMotion).toBe(0);
    await ctx.close();
  }
});

test('forced colours keep control boundaries and the bracket', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced-colors emulation is Chromium-only in Playwright');
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/');
  const b = await page.$eval('.btn-primary', (e) => getComputedStyle(e).borderTopStyle);
  expect(b).toBe('solid');
  const bracket = await page.$eval('.folio .bracket', (e) => getComputedStyle(e, '::before').borderLeftStyle);
  expect(bracket).toBe('solid');
});

test('forced colours: the radio group shows focus distinctly from selection', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced-colors emulation is Chromium-only in Playwright');
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/');
  const label = page.locator('label[for="f1"]');
  const style = () => label.evaluate((l) => { const cs = getComputedStyle(l); return `${cs.outlineStyle} ${cs.outlineWidth} ${cs.backgroundColor}`; });
  const unfocused = await style();
  await page.locator('#f1').focus();
  const focused = await style();
  expect(focused, 'focus must change something visible').not.toBe(unfocused);
  expect(focused.startsWith('solid')).toBe(true);
});

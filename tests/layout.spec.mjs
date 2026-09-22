// Responsive layout: no sideways scrolling from 320 px to ultrawide, reflow
// under enlarged text and WCAG text-spacing overrides, composed wide screens.
import { test, expect } from '@playwright/test';
import { scrollThrough } from './helpers.mjs';

const WIDTHS = [
  [320, 720], [360, 800], [390, 844], [768, 1024], [1024, 768],
  [1440, 900], [1920, 1080], [2560, 1440], [3440, 1440],
];

async function overflow(page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const wide = [...document.querySelectorAll('body *')]
      .filter((el) => { const r = el.getBoundingClientRect(); return r.width && (r.right > vw + 1 || r.left < -1); })
      .filter((el) => !el.closest('.skip'))
      .map((el) => `${el.tagName.toLowerCase()}.${el.className || ''} ${Math.round(el.getBoundingClientRect().right)}`);
    return { scroll: document.documentElement.scrollWidth - vw, wide: wide.slice(0, 5) };
  });
}

for (const [w, h] of WIDTHS) {
  test(`no horizontal overflow at ${w}x${h}`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/');
    await scrollThrough(page);
    const o = await overflow(page);
    expect(o.scroll, JSON.stringify(o.wide)).toBeLessThanOrEqual(0);
    expect(o.wide).toEqual([]);
  });
}

test('the 404 page fits at 320 px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/missing');
  expect((await overflow(page)).scroll).toBeLessThanOrEqual(0);
});

test('WCAG 1.4.12 text spacing does not clip or overflow', async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.addStyleTag({ content: '*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important} p{margin-bottom:2em!important}' });
    const o = await overflow(page);
    expect(o.scroll, `width ${width}: ${JSON.stringify(o.wide)}`).toBeLessThanOrEqual(0);
  }
});

for (const [w, pct] of [[360, 150], [390, 175], [412, 200], [360, 200]]) {
  test(`phone at ${w} px with text at ${pct}%: nothing runs off-screen`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: 800 });
    await page.goto('/');
    await page.addStyleTag({ content: `html{font-size:${pct}%!important}` });
    const o = await overflow(page);
    expect(o.scroll, JSON.stringify(o.wide)).toBeLessThanOrEqual(0);
    expect(o.wide).toEqual([]);
    const install = await page.locator('nav.primary a.cta').boundingBox();
    expect(install.x + install.width).toBeLessThanOrEqual(w);
  });
}

test('the nav offers Install and Help at every width', async ({ page }) => {
  for (const w of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width: w, height: 800 });
    await page.goto('/');
    for (const [name, href] of [['Install', '#install'], ['Help', '#support']]) {
      const link = page.locator('nav.primary').getByRole('link', { name, exact: true });
      await expect(link, `${name} at ${w}`).toBeVisible();
      await expect(link).toHaveAttribute('href', href);
      const b = await link.boundingBox();
      expect(b.x >= 0 && b.x + b.width <= w, `${name} inside the viewport at ${w}`).toBe(true);
      expect(b.height, `${name} target height`).toBeGreaterThanOrEqual(44);
    }
  }
});

test('text at 200% of the default size still reflows at desktop width', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await page.addStyleTag({ content: 'html{font-size:200%!important}' });
  const o = await overflow(page);
  expect(o.scroll, JSON.stringify(o.wide)).toBeLessThanOrEqual(0);
});

test('first viewport carries the product, the maker and the install path', async ({ page }) => {
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/');
    const inView = async (loc) => { const b = await loc.boundingBox(); return !!b && b.y >= 0 && b.y + b.height <= h; };
    expect(await inView(page.getByRole('heading', { level: 1 })), `h1 at ${w}`).toBe(true);
    expect(await inView(page.locator('.byline')), `byline at ${w}`).toBe(true);
    expect(await inView(page.getByRole('link', { name: 'Get it on the Elgato Marketplace' }).first()), `CTA at ${w}`).toBe(true);
  }
  // On desktop the photograph is in the first view as well.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const photo = await page.locator('.folio img').boundingBox();
  expect(photo.y + photo.height / 2).toBeLessThan(900);
});

test('wide screens keep a centred, bounded column', async ({ page }) => {
  for (const w of [1920, 3440]) {
    await page.setViewportSize({ width: w, height: 1200 });
    await page.goto('/');
    const box = await page.locator('.hero .wrap').boundingBox();
    expect(box.width).toBeLessThanOrEqual(1680);
    expect(box.width / w, 'the column still uses a real share of the screen').toBeGreaterThan(0.45);
    expect(Math.abs(box.x + box.width / 2 - w / 2)).toBeLessThan(2);
  }
});

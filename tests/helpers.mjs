// Shared helpers for the page tests.

// Scroll the whole page in steps so lazy images load, then return to the top.
export async function scrollThrough(page) {
  await page.evaluate(async () => {
    const step = Math.max(200, Math.floor(innerHeight * 0.8));
    for (let y = 0; y <= document.documentElement.scrollHeight; y += step) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    scrollTo(0, 0);
  });
  await page.waitForLoadState('networkidle');
}

// Record every request, console error, page error and CSP violation.
export function watch(page) {
  const seen = { requests: [], consoleErrors: [], pageErrors: [] };
  page.on('request', (req) => seen.requests.push(req.url()));
  page.on('console', (m) => { if (m.type() === 'error') seen.consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => seen.pageErrors.push(String(e)));
  return seen;
}

export const FACE_OPTIONS = ['One reading', 'Two', 'Three', 'Four', 'Bar', 'Ring'];

// Choose a comparison option the way a visitor does: by its visible label.
export async function chooseFace(page, name) {
  const i = FACE_OPTIONS.indexOf(name) + 1;
  await page.locator(`label[for="f${i}"]`).click();
}

// Elements rendered fully transparent, other than the visually hidden radio
// inputs behind the comparison labels. Catches reveal-on-scroll regressions.
export function invisibleCount(page) {
  return page.$$eval('main *', (els) => els.filter((e) => getComputedStyle(e).opacity === '0' && !(e.matches('input[type=radio]'))).length);
}

// Playwright runs the production files (public/) through wrangler's Cloudflare
// Pages emulator, so _headers and _redirects apply as they do on the edge.
// Edge-only behaviour (zone settings, compression choices, injected headers)
// is not reproduced; the deploy workflow checks the live site for that.
//
//   npm test                         all projects
//   npx playwright test --project=chromium --project=webkit
//
// Firefox is configured for CI; on hosts where Playwright's Firefox build
// cannot start, run the other projects.
import { defineConfig, devices } from '@playwright/test';

const port = 8799;

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['github']] : [['list']],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 } } },
    { name: 'webkit', use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: `node node_modules/wrangler/bin/wrangler.js pages dev public --port ${port} --ip 127.0.0.1 --log-level warn`,
    url: `http://127.0.0.1:${port}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 90_000,
    env: { WRANGLER_SEND_METRICS: 'false', NO_COLOR: '1' },
  },
});

import {defineConfig} from '@playwright/test';

const baseURL = 'http://127.0.0.1:8765';

export default defineConfig({
  testDir: './tests',
  testMatch: '*.spec.mjs',
  timeout: 60000,
  use: {baseURL, browserName:'chromium', headless:true},
  // Playwright waits for a real HTTP response before executing page.goto().
  // This eliminates the race between a background server and the first test.
  // A developer can reuse their own server locally, but CI must start its own.
  webServer: {
    command: 'python -m http.server 8765 --bind 127.0.0.1',
    url: baseURL + '/',
    timeout: 30000,
    reuseExistingServer: !process.env.CI
  },
  reporter: [['list'], ['html',{open:'never'}]]
});

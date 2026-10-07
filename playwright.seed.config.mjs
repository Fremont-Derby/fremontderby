import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './browser/jfl', testMatch: 'provisional-seeds.spec.js', fullyParallel: false, workers: 1,
  timeout: 30_000, expect: { timeout: 5000 }, retries: 0,
  outputDir: 'test-results/provisional-seeds',
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://jfl.fremontderby.com', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [{ name: 'seed-chromium', use: { ...devices['Desktop Chrome'] } }],
});

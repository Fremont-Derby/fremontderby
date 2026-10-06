import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './browser/jfl',
  testMatch: 'free-agents-recovery.spec.js',
  fullyParallel: false,
  workers: 1,
  timeout: 20_000,
  expect: { timeout: 5_000 },
  retries: 0,
  reporter: 'list',
  outputDir: 'test-results/free-agents',
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://jfl.fremontderby.com', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
});

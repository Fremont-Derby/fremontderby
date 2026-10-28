import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './jfl', testMatch: 'scoring-session-boundary.spec.js',
  workers: 1, retries: 0, timeout: 15000, expect: { timeout: 5000 },
  reporter: 'list', outputDir: '../test-results/scoring-session',
  use: { trace: 'off', screenshot: 'off', video: 'off' },
});

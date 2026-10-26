import { test, expect } from '@playwright/test';
import { assumePersona } from './persona.js';

test('persona setup recovers from one observed throttle through Profile UI', async ({ page, request }) => {
  const health = await request.get('/health/environment');
  expect(health.ok()).toBeTruthy();
  const environment = await health.json();
  expect(environment).toMatchObject({ environment: 'jfl', expectedSupabaseSchema: 'jfl', ok: true });
  if (process.env.PLAYWRIGHT_EXPECTED_SHA) expect(environment.versionTag).toBe(process.env.PLAYWRIGHT_EXPECTED_SHA);
  let observed = false;
  let fulfilled = 0;
  const observe = (response) => {
    if (new URL(response.url()).pathname === '/api/test-persona' && response.status() === 429) observed = true;
  };
  page.on('response', observe);
  const endpoint = '**/api/test-persona';
  await page.route(endpoint, async (route) => {
    if (route.request().method() === 'GET' && !observed) {
      fulfilled += 1;
      await route.fulfill({ status: 429, headers: { 'retry-after': '1' },
        contentType: 'application/json', body: '{"error":"Synthetic persona throttle"}' });
    } else await route.continue();
  });
  try {
    const result = await assumePersona(page, 'Player A');
    expect(fulfilled).toBeGreaterThan(0);
    expect(observed).toBe(true);
    expect(result.retries).toBeGreaterThan(0);
    await expect(page.locator('[data-test-persona-banner]')).toContainText('Player A');
  } finally {
    await page.unroute(endpoint);
    page.off('response', observe);
  }
});

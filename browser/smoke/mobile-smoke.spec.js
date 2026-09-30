import { test, expect } from '@playwright/test';
import { expectLaneIdentity } from '../fixtures/environment.js';

test('JFL Test Drive remains usable at the primary phone viewport', async ({ page, request }) => {
  await expectLaneIdentity(request);
  await page.goto('/demo');

  const start = page.getByRole('link', { name: /Start as captain/ });
  await expect(start).toBeVisible();
  const target = await start.boundingBox();
  expect(target?.height).toBeGreaterThanOrEqual(44);

  const viewport = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(viewport.innerWidth).toBe(390);
  expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.innerWidth);
});

import { test, expect } from '@playwright/test';
import { assumePersona } from './persona.js';
import { readQaResultsAccess } from './qa-results-access.js';

test('noncaptain result denial survives one observed edge throttle and proves application error', async ({ page }) => {
  await assumePersona(page, 'Player A');
  let intercepted = false;
  await page.route('**/api/me/jfl-qa-results', async (route) => {
    if (intercepted) return route.continue();
    intercepted = true;
    await route.fulfill({ status: 429, headers: { 'retry-after': '2' },
      contentType: 'text/html', body: '<!doctype html><title>Temporarily busy</title>' });
  });
  expect(await readQaResultsAccess(page)).toEqual({ status: 403, hasRaces: false,
    error: 'Only an active captain of this QA matchup can read its results.' });
  expect(intercepted).toBe(true);
});

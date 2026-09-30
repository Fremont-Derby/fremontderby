import { test, expect } from '@playwright/test';
import { expectLaneIdentity } from '../fixtures/environment.js';

test('JFL exposes the safe public Test Drive in desktop Chromium', async ({ page, request }) => {
  await expectLaneIdentity(request);
  await page.goto('/demo');

  await expect(page).toHaveTitle(/Test Drive the App/);
  await expect(page.getByRole('heading', { name: 'Test Drive the App' })).toBeVisible();
  await expect(page.getByText('FICTIONAL PLAYERS AND RESULTS')).toBeVisible();
  await expect(page.getByRole('link', { name: /Start as captain/ })).toBeVisible();
});

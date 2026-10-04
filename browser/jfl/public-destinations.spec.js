import { test, expect } from '@playwright/test';

test('signed-out phone destinations retain public actions and private captain boundaries', async ({ browser, request }) => {
  const expectedSha = process.env.PLAYWRIGHT_EXPECTED_SHA;
  expect(expectedSha, 'Supply the exact deployed SHA for public browser proof').toMatch(/^[a-f0-9]{40}$/);
  const health = await request.get('/health/environment');
  expect(health.ok()).toBe(true);
  expect(await health.json()).toMatchObject({ environment: 'jfl', expectedSupabaseSchema: 'jfl',
    ok: true, versionTag: expectedSha });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    const page = await context.newPage();
    const response = await page.goto('/free-agents');
    expect(response.status()).toBe(200);
    await expect(page.getByRole('heading', { name: 'Free agents', exact: true })).toBeVisible();
    await expect(page.locator('[data-free-state]')).toContainText('Sign in on Profile');
    await expect(page.locator('[data-captain-workspace]')).toBeHidden();
    for (const [name, href] of [['Open Profile', '/profile'], ['Open Schedule', '/schedule'], ['Browse Teams', '/teams']]) {
      await expect(page.getByRole('link', { name, exact: true })).toHaveAttribute('href', href);
    }
    for (const [path, heading] of [['/players', 'Players'], ['/playoffs', 'Playoffs']]) {
      const destination = await page.goto(path);
      expect(destination.status()).toBe(200);
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
      await expect(page.locator('a[href="/trades"]')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
    const retired = await request.get('/trades');
    expect(retired.status()).toBe(404);
  } finally {
    await context.close();
  }
});

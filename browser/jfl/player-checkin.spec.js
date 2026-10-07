import { test, expect } from '@playwright/test';
import { assumePersona } from './persona.js';

const qaSeason = '18580000-1000-4000-8000-000000000000';

async function openCheckin(page) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await page.goto('/availability');
    const card = page.locator(`[data-group-key^="${qaSeason}|"]`);
    await expect.poll(async () =>
      (await page.locator('[data-status]').getAttribute('data-tone') === 'ok'
        && await card.locator('[data-value="available"]').isEnabled({ timeout: 1000 }).catch(() => false))
      || (await page.locator('[data-status]').getAttribute('data-tone') === 'error'
        && await page.locator('[data-recovery]').getByRole('button', { name: 'Try again' }).isVisible())).toBe(true);
    if (await page.locator('[data-status]').getAttribute('data-tone') === 'ok') return card;
    await expect(page.locator('[data-status]')).toContainText('temporarily busy');
    await page.waitForTimeout(16_000);
  }
  throw new Error('Player check-in did not load after bounded UI retries');
}

test('phone player can retry a throttled date check-in and reopen the saved response', async ({ browser, request }) => {
  const health = await request.get('/health/environment');
  expect(health.ok()).toBeTruthy();
  const environment = await health.json();
  expect(environment).toMatchObject({ environment: 'jfl', expectedSupabaseSchema: 'jfl', ok: true });
  if (process.env.PLAYWRIGHT_EXPECTED_SHA) expect(environment.versionTag).toBe(process.env.PLAYWRIGHT_EXPECTED_SHA);
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    const page = await context.newPage();
    await assumePersona(page, 'Player A');
    let card = await openCheckin(page);
    const priorState = await card.getAttribute('data-state');
    const endpoint = `**/api/seasons/${qaSeason}/availability/me`;
    let injected = false;
    await page.route(endpoint, async (route) => {
      if (route.request().method() === 'PUT' && !injected) {
        injected = true;
        await route.fulfill({ status: 429, contentType: 'application/json', body: '{"error":"Synthetic throttle"}' });
      } else await route.continue();
    });
    await card.locator('[data-value="available"]').click();
    await expect(page.locator('[data-status]')).toContainText('temporarily busy');
    expect(injected).toBe(true);
    await expect(card).toHaveAttribute('data-state', priorState);
    await expect(card.locator('[data-value="available"]')).toBeEnabled();
    await expect(card.locator('[data-row-status]')).toContainText('temporarily busy');
    await page.unroute(endpoint);
    // Space the real save from the initial read; the injected request did not
    // touch the backend. Only this supported UI action mutates QA availability.
    await page.waitForTimeout(12_000);
    await card.locator('[data-value="available"]').click();
    await expect(card).toHaveAttribute('data-state', 'available');
    await expect(card.locator('[data-value="available"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(card.locator('[data-value="available"]')).toBeEnabled();
    await page.waitForTimeout(12_000);
    card = await openCheckin(page);
    await expect(card).toHaveAttribute('data-state', 'available');
    await expect(card.locator('[data-value="available"]')).toHaveAttribute('aria-pressed', 'true');
  } finally {
    await context.close();
  }
});

import { expect } from '@playwright/test';

export async function openQaResults(page, expectedLabel) {
  let cooldown = null;
  const observe = (response) => {
    if (new URL(response.url()).pathname === '/api/me/jfl-qa-results' && response.status() === 429) {
      const parsed = Number(response.headers()['retry-after']);
      cooldown = Number.isFinite(parsed) && parsed > 0 ? Math.ceil(parsed) : 15;
    }
  };
  page.on('response', observe);
  try {
    await page.goto('/scorecard');
    const state = page.locator('[data-qa-result-state]');
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await expect.poll(async () => (await state.textContent()) === expectedLabel || cooldown !== null).toBe(true);
      if ((await state.textContent()) === expectedLabel) return;
      expect(cooldown, 'Only observed HTTP429 permits results UI recovery').not.toBeNull();
      expect(cooldown, 'Do not shorten an excessive edge cooldown').toBeLessThanOrEqual(60);
      console.info(`QA results UI recovery after HTTP429; cooldown=${cooldown}s.`);
      await page.waitForTimeout((cooldown + 1) * 1000);
      cooldown = null;
      await page.getByRole('button', { name: 'Refresh results', exact: true }).click();
    }
    await expect(state).toHaveText(expectedLabel);
  } finally {
    page.off('response', observe);
  }
}

export async function readQaResultsAccess(page) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const result = await page.evaluate(async () => {
      const response = await fetch('/api/me/jfl-qa-results', {
        headers: { authorization: 'Bearer '+sessionStorage.getItem('fd.accessToken') },
      });
      if (response.status === 429) return { status: 429, retryAfter: response.headers.get('retry-after') };
      const body = await response.json().catch(() => ({}));
      return { status: response.status, error: body.error, hasRaces: Object.hasOwn(body, 'races') };
    });
    if (result.status !== 429) return result;
    const parsed = Number(result.retryAfter);
    const seconds = Number.isFinite(parsed) && parsed > 0 ? Math.ceil(parsed) : 15;
    expect(seconds, 'Do not shorten an excessive edge cooldown').toBeLessThanOrEqual(60);
    console.info(`QA result access recovery after HTTP429; cooldown=${seconds}s.`);
    await page.waitForTimeout((seconds + 1) * 1000);
  }
  throw new Error('QA result authorization read remained throttled after bounded retries');
}

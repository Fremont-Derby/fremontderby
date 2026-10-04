import { expect } from '@playwright/test';

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

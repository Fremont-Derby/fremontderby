import { test, expect } from '@playwright/test';
import { observeAvailabilityThrottle } from './fixture-throttle.js';

// All document/API traffic is intercepted; these tests never touch a live fixture.
for (const kind of ['qualified', 'missing', 'unrelated']) test(`fixture recovery ${kind} actual browser429`, async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  let requests = 0;
  await context.route('**/*', route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/') return route.fulfill({ contentType: 'text/html', body: '<title>Fixture cooldown</title>' });
    requests += 1;
    return route.fulfill({ status: requests === 1 ? 429 : 200, headers: kind === 'missing' ? {} : { 'retry-after': '1' }, contentType: 'text/plain', body: 'Synthetic response' });
  });
  const tracker = observeAvailabilityThrottle(page, 'qa');
  try {
    await page.goto('https://fixture-policy.test/');
    const path = kind === 'unrelated' ? '/api/me/notifications' : '/api/me/teams';
    const observed = page.waitForResponse(response => new URL(response.url()).pathname === path);
    expect(await page.evaluate(path => fetch(path).then(response => response.status), path)).toBe(429);
    await observed;
    if (kind === 'qualified') {
      const start = Date.now();
      await tracker.wait();
      expect(Date.now() - start).toBeGreaterThanOrEqual(1900);
      expect(await page.evaluate(() => fetch('/api/me/teams').then(response => response.status))).toBe(200);
      expect(requests).toBe(2);
    } else {
      await expect(tracker.wait()).rejects.toThrow(kind === 'missing' ? /validated positive/ : /observed matching/);
      expect(requests).toBe(1);
    }
  } finally { tracker.dispose(); await context.close(); }
});

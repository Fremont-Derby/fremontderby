import { test, expect } from '@playwright/test';
import { renderJflNotificationsPage } from '../../src/jflNotificationsPage.js';

const sourceMode = process.env.PLAYWRIGHT_NOTICES_SOURCE === '1';
const notices = [
  { id: 'read', title: 'Older read notice', kind: 'league_update', readAt: '2026-10-01T00:00:00Z', createdAt: '2026-10-01T00:00:00Z', href: '/schedule?season=synthetic' },
  { id: 'new', title: 'Recent unread notice', kind: 'lineup_ready', readAt: null, createdAt: '2026-10-03T00:00:00Z', href: '/lineup?season=synthetic' },
  { id: 'old', title: 'Older unread notice', body: '<script>synthetic text only</script>', readAt: null, createdAt: '2026-10-02T00:00:00Z', href: '//untrusted.invalid' },
];

async function openNotices(browser, request, mobile, initial = { notifications: notices }, initialStatus = 200, heldInitial = false) {
  if (!sourceMode) {
    expect(process.env.PLAYWRIGHT_EXPECTED_SHA).toMatch(/^[a-f0-9]{40}$/);
    const health = await request.get('/health/environment');
    expect(health.ok()).toBe(true);
    expect(await health.json()).toMatchObject({ environment: 'jfl', expectedSupabaseSchema: 'jfl', ok: true, versionTag: process.env.PLAYWRIGHT_EXPECTED_SHA });
  }
  const context = await browser.newContext({ baseURL: sourceMode ? 'https://notices.test' : process.env.PLAYWRIGHT_BASE_URL || 'https://jfl.fremontderby.com',
    viewport: mobile ? { width: 320, height: 844 } : { width: 1280, height: 900 }, isMobile: mobile, hasTouch: mobile });
  await context.addInitScript(() => sessionStorage.setItem('fd.accessToken', 'synthetic-intercept-only'));
  const page = await context.newPage();
  const reads = [];
  const writes = [];
  let first = true;
  await context.route('**/api/**', async route => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    if (path !== '/api/me/notifications' && !path.startsWith('/api/me/notifications/')) return route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
    if (req.method() !== 'GET') { writes.push({ path, route }); return; }
    reads.push(route);
    if (first && !heldInitial) {
      first = false;
      await route.fulfill({ status: initialStatus, contentType: 'application/json', body: JSON.stringify(initial) });
    }
  });
  if (sourceMode) await page.route('https://notices.test/notifications', route => route.fulfill({ contentType: 'text/html', body: renderJflNotificationsPage() }));
  await page.goto('/notifications');
  await expect.poll(() => reads.length).toBe(1);
  return { page, context, reads, writes, respond: (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) }) };
}

for (const mobile of [false, true]) {
  const device = mobile ? '320px phone' : 'desktop';
  test(`list failure recovers with explicit reload and no writes (${device})`, async ({ browser, request }) => {
    const f = await openNotices(browser, request, mobile, { error: 'Synthetic list unavailable' }, 502);
    try {
      await expect(f.page.locator('[data-status]')).toContainText('Synthetic list unavailable');
      await expect(f.page.locator('[data-mark-all]')).toBeDisabled();
      await expect(f.page.locator('[data-reload-notices]')).toBeEnabled();
      await f.page.locator('[data-reload-notices]').click();
      await expect.poll(() => f.reads.length).toBe(2);
      await expect(f.page.locator('[data-reload-notices]')).toBeDisabled();
      await f.respond(f.reads[1], { notifications: notices });
      await expect(f.page.locator('.notice-card')).toHaveCount(3);
      await expect(f.page.locator('[data-status]')).toHaveText('2 unread notices');
      expect(f.writes).toHaveLength(0);
    } finally { await f.context.close(); }
  });
  test(`pending initial load blocks marks and populated notices preserve semantics (${device})`, async ({ browser, request }) => {
    const f = await openNotices(browser, request, mobile, {}, 200, true);
    try {
      await expect(f.page.locator('[data-mark-all]')).toBeDisabled();
      await expect(f.page.locator('[data-reload-notices]')).toBeDisabled();
      await f.respond(f.reads[0], { notifications: notices });
      await expect(f.page.locator('.notice-card h2')).toHaveText(['Recent unread notice', 'Older unread notice', 'Older read notice']);
      await expect(f.page.locator('.notice-card').nth(1)).toContainText('<script>synthetic text only</script>');
      expect(await f.page.locator('.notice-card script').count()).toBe(0);
      await expect(f.page.locator('.notice-card').nth(1).locator('a')).toHaveCount(0);
      await expect(f.page.locator('.notice-card').first().locator('a')).toHaveAttribute('href', '/lineup?season=synthetic');
      await expect(f.page.locator('[data-mark-all]')).toBeEnabled();
      await f.page.locator('[data-reload-notices]').click();
      await expect.poll(() => f.reads.length).toBe(2);
      await expect(f.page.locator('.notice-card')).toHaveCount(0);
      await expect(f.page.locator('[data-mark-all]')).toBeDisabled();
      await f.respond(f.reads[1], { notifications: [] });
      await expect(f.page.locator('[data-list]')).toContainText('No notices yet');
      await expect(f.page.locator('[data-mark-all]')).toBeDisabled();
      expect(f.writes).toHaveLength(0);
      if (mobile) expect(await f.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    } finally { await f.context.close(); }
  });
  for (const all of [false, true]) {
    test(`confirmed ${all ? 'all' : 'individual'} read distinguishes failed reload and recovers without replay (${device})`, async ({ browser, request }) => {
      const f = await openNotices(browser, request, mobile);
      try {
        await expect(f.page.locator('.notice-card')).toHaveCount(3);
        await f.page.locator(all ? '[data-mark-all]' : '.notice-card button').first().click();
        await expect.poll(() => f.writes.length).toBe(1);
        expect(f.writes[0].path).toBe(all ? '/api/me/notifications/read-all' : '/api/me/notifications/new/read');
        await expect(f.page.locator('[data-mark-all]')).toBeDisabled();
        for (const button of await f.page.locator('.notice-card button').all()) await expect(button).toBeDisabled();
        await expect(f.page.locator('[data-reload-notices]')).toBeDisabled();
        await f.page.evaluate(() => {
          for (const button of document.querySelectorAll('.notice-card button,[data-mark-all],[data-reload-notices]')) button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });
        await f.respond(f.writes[0].route, all ? { updated: 2 } : { notification: { id: 'new', readAt: '2026-10-06T00:00:00Z' } });
        await expect.poll(() => f.reads.length).toBe(2);
        await f.respond(f.reads[1], { error: 'Synthetic reload unavailable' }, 502);
        await expect(f.page.locator('[data-status]')).toContainText(all ? 'Notices marked read.' : 'Notice marked read.');
        await expect(f.page.locator('[data-status]')).toContainText('Current notices could not be reloaded');
        await expect(f.page.locator('.notice-card')).toHaveCount(0);
        await expect(f.page.locator('[data-mark-all]')).toBeDisabled();
        await f.page.locator('[data-reload-notices]').click();
        await expect.poll(() => f.reads.length).toBe(3);
        await f.respond(f.reads[2], { notifications: notices.map(n => ({ ...n, readAt: all || n.id === 'new' ? '2026-10-06T00:00:00Z' : n.readAt })) });
        await expect(f.page.locator('[data-status]')).toHaveText(all ? 'Up to date' : '1 unread notice');
        expect(f.writes).toHaveLength(1);
      } finally { await f.context.close(); }
    });
    test(`unconfirmed ${all ? 'all' : 'individual'} read requires reload before more writes (${device})`, async ({ browser, request }) => {
      const f = await openNotices(browser, request, mobile);
      try {
        await expect(f.page.locator('.notice-card')).toHaveCount(3);
        await f.page.locator(all ? '[data-mark-all]' : '.notice-card button').first().click();
        await expect.poll(() => f.writes.length).toBe(1);
        await f.writes[0].route.abort('failed');
        await expect(f.page.locator('[data-status]')).toContainText('Read state could not be confirmed');
        await expect(f.page.locator('[data-status]')).toContainText('Reload notices to check current state');
        await expect(f.page.locator('[data-mark-all]')).toBeDisabled();
        await expect(f.page.locator('.notice-card')).toHaveCount(0);
        expect(f.reads).toHaveLength(1);
        await f.page.locator('[data-reload-notices]').click();
        await expect.poll(() => f.reads.length).toBe(2);
        await f.respond(f.reads[1], { notifications: [] });
        await expect(f.page.locator('[data-status]')).toHaveText('Up to date');
        expect(f.writes).toHaveLength(1);
      } finally { await f.context.close(); }
    });
  }
  for (const invalid of [
    { all: true, body: { updated: -1 } },
    { all: true, body: { updated: '2' } },
    { all: false, body: { notification: { id: 'old', readAt: '2026-10-06T00:00:00Z' } } },
    { all: false, body: { notification: { id: 'new', readAt: null } } },
  ]) {
    test(`unconfirmed successful ${invalid.all ? 'all ' + invalid.body.updated : 'individual ' + invalid.body.notification.id} response blocks more marks (${device})`, async ({ browser, request }) => {
      const f = await openNotices(browser, request, mobile);
      try {
        await expect(f.page.locator('.notice-card')).toHaveCount(3);
        await f.page.locator(invalid.all ? '[data-mark-all]' : '.notice-card button').first().click();
        await expect.poll(() => f.writes.length).toBe(1);
        await f.respond(f.writes[0].route, invalid.body);
        await expect(f.page.locator('[data-status]')).toContainText('Read state could not be confirmed');
        await expect(f.page.locator('[data-status]')).not.toContainText('marked read.');
        await expect(f.page.locator('[data-mark-all]')).toBeDisabled();
        await expect(f.page.locator('[data-reload-notices]')).toBeEnabled();
        expect(f.reads).toHaveLength(1);
        expect(f.writes).toHaveLength(1);
      } finally { await f.context.close(); }
    });
  }
  test(`malformed success stays unavailable and auth denial retains Profile recovery (${device})`, async ({ browser, request }) => {
    const f = await openNotices(browser, request, mobile, {});
    try {
      await expect(f.page.locator('[data-status]')).toContainText('Notices could not be loaded');
      await expect(f.page.locator('[data-list]')).not.toContainText('No notices yet');
      await expect(f.page.locator('[data-mark-all]')).toBeDisabled();
      await f.page.locator('[data-reload-notices]').click();
      await expect.poll(() => f.reads.length).toBe(2);
      await f.respond(f.reads[1], {}, 401);
      await expect(f.page.locator('[data-status]')).toHaveText('Sign in on Profile to see your notices.');
      await expect(f.page.locator('[data-list] a')).toHaveAttribute('href', '/profile');
      expect(f.writes).toHaveLength(0);
    } finally { await f.context.close(); }
  });
}

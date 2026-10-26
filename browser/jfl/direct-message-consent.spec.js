import { test, expect } from '@playwright/test';
import router from '../../src/routerEntry.js';

const sourceMode = process.env.PLAYWRIGHT_CONSENT_SOURCE === '1';
async function openPrivacy(browser, request, mobile, { failLoad = false } = {}) {
  if (!sourceMode) {
    expect(process.env.PLAYWRIGHT_EXPECTED_SHA).toMatch(/^[a-f0-9]{40}$/);
    const health = await request.get('/health/environment');
    expect(await health.json()).toMatchObject({ environment: 'jfl', ok: true,
      expectedSupabaseSchema: 'jfl', versionTag: process.env.PLAYWRIGHT_EXPECTED_SHA });
  }
  const origin = sourceMode ? 'https://jfl.consent.test' : process.env.PLAYWRIGHT_BASE_URL || 'https://jfl.fremontderby.com';
  const context = await browser.newContext({ baseURL: origin,
    viewport: mobile ? { width: 320, height: 844 } : { width: 1280, height: 900 }, isMobile: mobile, hasTouch: mobile });
  await context.addInitScript(() => sessionStorage.setItem('fd.accessToken', 'synthetic-consent-A'));
  const page = await context.newPage();
  const values = new Map();
  const writes = [], held = [];
  let holdMethod = '', failSave = false;
  await context.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    const token = route.request().headers().authorization;
    const respond = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
    if (path === '/api/me/direct-message-consent') {
      if (method === 'PUT') writes.push(route.request().postDataJSON());
      const finish = () => {
        if (method === 'GET' && failLoad) { failLoad = false; return respond({ error: 'Unavailable' }, 503); }
        if (method === 'PUT' && failSave) { failSave = false; return respond({ error: 'Unavailable' }, 403); }
        if (method === 'PUT') values.set(token, route.request().postDataJSON().directMessages);
        return respond({ directMessages: values.get(token) || false });
      };
      if (holdMethod === method) { holdMethod = ''; held.push({ route, finish }); return; }
      return finish();
    }
    if (path === '/api/direct-conversations/synthetic-private-history/messages/read') {
      expect(method).toBe('POST'); return respond({});
    }
    expect(method, 'Only consent and synthetic read markers may write in this regression').toBe('GET');
    if (path === '/api/me/profile') return respond({ profile: { display_name: 'Synthetic player', teams: [], seasons: [] } });
    if (path === '/api/me/message-notification-summary') return respond({ unreadCount: 0, previews: [] });
    if (path === '/api/me/direct-message-inbox') return respond({ conversations: [{
      conversation_id: 'synthetic-private-history', other_player_id: 'synthetic-other',
      other_display_name: 'Synthetic other player', season_name: 'Synthetic QA', can_send: false,
      blocked_by_me: false, unread_count: 0,
    }] });
    if (path === '/api/me/direct-message-candidates') return respond({ candidates: [] });
    if (['/api/me/chat-threads', '/api/me/league-chat-threads', '/api/me/matchup-chat-threads'].includes(path)) return respond({ threads: [] });
    if (path === '/api/direct-conversations/synthetic-private-history/messages') return respond({ messages: [{
      message_id: 'synthetic-message', body: 'Private participant history', author_display_name: 'Synthetic other player',
      created_at: '2026-10-01T12:00:00Z', is_own: false,
    }] });
    if (path === '/api/me/player-contact') return respond({ contact: { hasPhone: false } });
    return respond({}, 404);
  });
  await context.route('**/auth/**', route => route.fulfill({ status: 401, body: '{}' }));
  if (sourceMode) {
    const html = await (await router.fetch(new Request(`${origin}/profile`), { ENVIRONMENT: 'jfl' }, {})).text();
    await page.route(`${origin}/profile`, route => route.fulfill({ contentType: 'text/html', body: html }));
    const messages = await (await router.fetch(new Request(`${origin}/messages`), { ENVIRONMENT: 'jfl' }, {})).text();
    await page.route(`${origin}/messages`, route => route.fulfill({ contentType: 'text/html', body: messages }));
  }
  await page.goto('/profile');
  const toggle = page.locator('[data-dm-consent-toggle]'), save = page.locator('[data-dm-consent-save]');
  const status = page.locator('[data-dm-consent-status]'), reload = page.locator('[data-dm-consent-reload]');
  await expect(status).toHaveText(failLoad ? /Could not confirm/ : /OFF|Could not confirm/);
  return { context, page, toggle, save, status, reload, writes, held,
    hold: method => { holdMethod = method; }, failSave: () => { failSave = true; },
    switchAccount: () => page.evaluate(() => {
      sessionStorage.setItem('fd.accessToken', 'synthetic-consent-B');
      window.dispatchEvent(new Event('fd:session-changed'));
    }) };
}

for (const mobile of [false, true]) {
  const device = mobile ? 'phone' : 'desktop';
  test(`opted-out thread preserves private history and safety controls (${device})`, async ({ browser, request }) => {
    const f = await openPrivacy(browser, request, mobile);
    try {
      await f.page.goto('/messages');
      await expect(f.page.locator('[data-message-list]')).toContainText('Private participant history');
      await expect(f.page.locator('[data-message-input]')).toBeDisabled();
      await expect(f.page.locator('[data-block]')).toBeVisible();
      await expect(f.page.getByRole('button', { name: 'Report', exact: true })).toBeVisible();
      expect(f.writes).toHaveLength(0);
    } finally { await f.context.close(); }
  });
  test(`default OFF; ON and OFF persist across Profile reload (${device})`, async ({ browser, request }) => {
    const f = await openPrivacy(browser, request, mobile);
    try {
      await expect(f.toggle).not.toBeChecked();
      await expect(f.save).toBeEnabled();
      await f.toggle.check(); await f.save.click();
      await expect(f.status).toHaveText('Direct messages are ON.');
      await f.page.reload(); await expect(f.toggle).toBeChecked();
      await f.toggle.uncheck(); await f.save.click();
      await expect(f.status).toHaveText('Direct messages are OFF.');
      await f.page.reload(); await expect(f.toggle).not.toBeChecked();
      expect(f.writes).toEqual([{ directMessages: true }, { directMessages: false }]);
      expect(await f.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await expect(f.page.locator('[data-dm-consent]')).toContainText('required league notices remain available');
    } finally { await f.context.close(); }
  });
  test(`load failure locks changes and Reload recovers (${device})`, async ({ browser, request }) => {
    const f = await openPrivacy(browser, request, mobile, { failLoad: true });
    try {
      await expect(f.status).toContainText('Could not confirm');
      await expect(f.toggle).toBeDisabled(); await expect(f.save).toBeDisabled();
      await f.reload.click(); await expect(f.status).toHaveText('Direct messages are OFF.');
      await expect(f.toggle).toBeEnabled(); expect(f.writes).toHaveLength(0);
    } finally { await f.context.close(); }
  });
  test(`unconfirmed save locks changes and explicit Reload recovers (${device})`, async ({ browser, request }) => {
    const f = await openPrivacy(browser, request, mobile);
    try {
      f.failSave(); await f.toggle.check(); await f.save.click();
      await expect(f.status).toContainText('Could not confirm');
      await expect(f.save).toBeDisabled();
      await f.reload.click(); await expect(f.status).toHaveText('Direct messages are OFF.');
      await expect(f.toggle).not.toBeChecked();
    } finally { await f.context.close(); }
  });
  for (const method of ['GET', 'PUT']) {
    test(`delayed ${method} cannot overwrite another account's privacy (${device})`, async ({ browser, request }) => {
      const f = await openPrivacy(browser, request, mobile);
      try {
        await f.toggle.check(); await f.save.click(); await expect(f.status).toHaveText('Direct messages are ON.');
        f.hold(method);
        if (method === 'PUT') { await f.toggle.uncheck(); await f.save.click(); }
        else await f.reload.click();
        await expect.poll(() => f.held.length).toBe(1);
        await f.switchAccount(); await expect(f.status).toHaveText('Direct messages are OFF.');
        await f.held[0].finish();
        await f.page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        await expect(f.status).toHaveText('Direct messages are OFF.'); await expect(f.toggle).not.toBeChecked();
        await expect(f.save).toBeEnabled();
      } finally { await f.context.close(); }
    });
  }
  test(`pending save rejects repeated submission (${device})`, async ({ browser, request }) => {
    const f = await openPrivacy(browser, request, mobile);
    try {
      f.hold('PUT'); await f.toggle.check(); await f.save.click();
      await expect.poll(() => f.held.length).toBe(1);
      await f.page.locator('[data-dm-consent-form]').evaluate(form => {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      });
      expect(f.writes).toHaveLength(1); await expect(f.toggle).toBeDisabled();
      await f.held[0].finish(); await expect(f.status).toHaveText('Direct messages are ON.');
    } finally { await f.context.close(); }
  });
}

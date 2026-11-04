import { test, expect } from '@playwright/test';
import router from '../../src/routerEntry.js';

const sourceMode = process.env.PLAYWRIGHT_RETIREMENT_SOURCE === '1';
const ids = { league: 'synthetic-season', team: 'synthetic-team', direct: 'synthetic-direct' };
async function open(browser, request, mobile, { signedIn = true, allOff = false } = {}) {
  if (!sourceMode) {
    expect(process.env.PLAYWRIGHT_EXPECTED_SHA).toMatch(/^[a-f0-9]{40}$/);
    expect(await (await request.get('/health/environment')).json()).toMatchObject({
      environment: 'jfl', ok: true, expectedSupabaseSchema: 'jfl', versionTag: process.env.PLAYWRIGHT_EXPECTED_SHA });
  }
  const origin = sourceMode ? 'https://retirement.test' : process.env.PLAYWRIGHT_BASE_URL || 'https://jfl.fremontderby.com';
  const context = await browser.newContext({ baseURL: origin, viewport: mobile ? { width: 320, height: 844 } : { width: 1280, height: 900 },
    isMobile: mobile, hasTouch: mobile });
  if (signedIn) await context.addInitScript(() => sessionStorage.setItem('fd.accessToken', 'synthetic-intercept-only'));
  const page = await context.newPage();
  const calls = [], sends = [];
  await context.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname, method = route.request().method();
    calls.push(path);
    expect(path, 'Retired discovery, history, and writes are never requested by the page').not.toMatch(/matchup|team-matches/);
    const respond = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (path === '/api/test-persona') return respond({}, 404);
    if (path === '/api/admin/chat-reports') return respond({ error: 'League admin access required' }, 403);
    if (path === '/api/me/message-notification-summary') return respond({ unreadCount: 0, previews: [] });
    if (path === '/api/me/direct-message-candidates') return respond({ candidates: [] });
    if (path === '/api/me/chat-threads') return respond({ threads: allOff ? [] : [{ team_id: ids.team, team_name: 'Synthetic team', season_name: 'QA' }] });
    if (path === '/api/me/league-chat-threads') return respond({ threads: allOff ? [] : [{ season_id: ids.league, season_name: 'QA', can_send: true }] });
    if (path === '/api/me/direct-message-inbox') return respond({ conversations: allOff ? [] : [{
      conversation_id: ids.direct, other_player_id: 'synthetic-peer', other_display_name: 'Synthetic peer', season_name: 'QA', can_send: true }] });
    if (path.endsWith('/messages/read')) return respond({});
    if (path.endsWith('/messages')) {
      if (method === 'POST') {
        sends.push({ path, body: route.request().postDataJSON() });
        return respond({ message: {} }, 201);
      }
      return respond({ messages: [{ message_id: 'synthetic-history', body: 'Supported channel history',
        author_display_name: 'Synthetic player', created_at: '2026-10-01T12:00:00Z', is_own: true }] });
    }
    throw new Error('Unexpected intercepted endpoint ' + path);
  });
  await context.route('**/auth/**', route => route.fulfill({ status: 401, body: '{}' }));
  if (sourceMode) {
    const html = await (await router.fetch(new Request(origin + '/messages?matchup=legacy'), { ENVIRONMENT: 'jfl' }, {})).text();
    await page.route(origin + '/messages?matchup=legacy', route => route.fulfill({ contentType: 'text/html', body: html }));
  }
  await page.goto('/messages?matchup=legacy');
  await expect(page.locator('[data-matchup-retired]')).toBeVisible();
  await expect(page.locator('[data-matchup-retired]')).toContainText('Matchup chat is retired');
  await expect(page.locator('[data-matchup-retired] a[href="/schedule"]')).toBeVisible();
  await expect(page.locator('[data-thread-key^="matchup:"]')).toHaveCount(0);
  return { context, page, calls, sends };
}
for (const mobile of [false, true]) {
  const device = mobile ? '320px phone' : 'desktop';
  test('legacy deep link explains retirement when signed out (' + device + ')', async ({ browser, request }) => {
    const f = await open(browser, request, mobile, { signedIn: false });
    try {
      await expect(f.page.locator('[data-signed-out]')).toBeVisible();
      await expect(f.page.locator('[data-signed-out]')).not.toContainText('open this matchup thread');
      expect(f.sends).toEqual([]);
    } finally { await f.context.close(); }
  });
  test('all social channels OFF cannot resurrect legacy matchup contact (' + device + ')', async ({ browser, request }) => {
    const f = await open(browser, request, mobile, { allOff: true });
    try {
      await expect(f.page.locator('[data-message-list]')).toContainText('No conversations yet');
      await expect(f.page.locator('[data-message-input]')).toBeDisabled();
      await expect(f.page.locator('[data-status]')).toContainText('Matchup chat is retired');
      await f.page.reload();
      await expect(f.page.locator('[data-message-input]')).toBeDisabled();
      expect(f.sends).toEqual([]);
      expect(f.calls.some(path => /matchup|team-matches/.test(path))).toBe(false);
    } finally { await f.context.close(); }
  });
  test('three supported channels remain usable after legacy link (' + device + ')', async ({ browser, request }) => {
    const f = await open(browser, request, mobile);
    try {
      await expect(f.page.locator('[data-message-list]')).toContainText('Supported channel history');
      const root = mobile ? '.fd-mobile-inbox' : '[data-thread-list]';
      for (const channel of ['league', 'team', 'direct']) {
        await f.page.locator(root + ' [data-thread-key="' + channel + ':' + ids[channel] + '"]').click();
        await expect(f.page.locator('[data-message-input]')).toBeEnabled();
        await f.page.locator('[data-message-input]').fill('Synthetic supported ' + channel);
        await f.page.locator('[data-message-input]').press('Enter');
        await expect(f.page.locator('[data-status]')).toHaveText('Sent');
      }
      expect(f.sends).toHaveLength(3);
      expect(f.sends.every(send => !send.path.includes('team-matches'))).toBe(true);
      expect(await f.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    } finally { await f.context.close(); }
  });
}

import { test, expect } from '@playwright/test';
import { renderChatPage } from '../../src/chatPage.js';
import { injectMessagesTheme } from '../../src/messagesTheme.js';

const sourceMode = process.env.PLAYWRIGHT_MESSAGES_SOURCE === '1';
const teamA = '11111111-1111-4111-8111-111111111111';
const teamB = '22222222-2222-4222-8222-222222222222';
const message = (body, index = 0) => ({ message_id: `synthetic-${body}-${index}`,
  body, author_display_name: 'Synthetic teammate', created_at: '2026-10-01T12:00:00Z', is_own: true });

async function openMessages(browser, request, mobile) {
  if (!sourceMode) {
    expect(process.env.PLAYWRIGHT_EXPECTED_SHA).toMatch(/^[a-f0-9]{40}$/);
    const health = await request.get('/health/environment');
    expect(health.ok()).toBe(true);
    expect(await health.json()).toMatchObject({ environment: 'jfl', ok: true,
      expectedSupabaseSchema: 'jfl', versionTag: process.env.PLAYWRIGHT_EXPECTED_SHA });
  }
  const context = await browser.newContext({ baseURL: sourceMode ? 'http://messages.test' :
    process.env.PLAYWRIGHT_BASE_URL || 'https://jfl.fremontderby.com',
    viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 },
    isMobile: mobile, hasTouch: mobile });
  // This fake session is confined to intercepted requests. No private history or
  // mutation is sent to a server; only the deployed page HTML is read live.
  await context.addInitScript(() => sessionStorage.setItem('fd.accessToken', 'synthetic-intercept-only'));
  const page = await context.newPage();
  const held = [];
  let holdNext = false;
  let older = false;
  const writes = [];
  await context.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    let body = {};
    const respond = data => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
    if (route.request().method() !== 'GET') {
      writes.push(path);
      expect(path.endsWith('/messages/read'), 'Never send real message writes in this regression').toBe(true);
      return respond({});
    }
    if (path === '/api/me/chat-threads') body = { threads: [
      { team_id: teamA, team_name: 'Regression Team A', season_name: 'Synthetic' },
      { team_id: teamB, team_name: 'Regression Team B', season_name: 'Synthetic' },
    ] };
    else if (path === '/api/me/direct-message-inbox') body = { conversations: [] };
    else if (path === '/api/me/direct-message-candidates') body = { candidates: [] };
    else if (path === '/api/me/league-chat-threads' || path === '/api/me/matchup-chat-threads') body = { threads: [] };
    else if (path === '/api/admin/chat-reports') {
      return route.fulfill({ status: 403, contentType: 'application/json', body: '{"error":"League admin access required"}' });
    } else if (path.endsWith('/messages')) {
      const isA = path.includes(teamA);
      body = { messages: older && isA ? Array.from({ length: 50 }, (_, i) => message('A history', i)) : [message(isA ? 'A current' : 'B current')] };
      if (isA && (holdNext || url.searchParams.has('before'))) {
        holdNext = false;
        held.push({ route, respond });
        return;
      }
    } else {
      throw new Error(`Unexpected intercepted endpoint: ${path}`);
    }
    return respond(body);
  });
  if (sourceMode) {
    const html = await (await injectMessagesTheme(new Response(renderChatPage(),
      { headers: { 'content-type': 'text/html' } }))).text();
    await page.route('http://messages.test/messages', route => route.fulfill({ contentType: 'text/html', body: html }));
  }
  await page.goto('/messages');
  await expect(page.locator('[data-message-list]')).toContainText('A current');
  const select = async id => {
    const root = mobile ? '.fd-mobile-inbox' : '[data-thread-list]';
    await page.locator(`${root} [data-thread-key="team:${id}"]`).click();
  };
  return { context, page, held, writes, select, hold: () => { holdNext = true; }, paginate: () => { older = true; } };
}

async function settleResponse(page, response) {
  await response.finished();
  // Allow body parsing/rendering to complete before checking absence of leaks.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

for (const mobile of [false, true]) {
  test(`pending history cannot block or overwrite a new conversation (${mobile ? 'phone' : 'desktop'})`, async ({ browser, request }) => {
    const fixture = await openMessages(browser, request, mobile);
    try {
      fixture.hold();
      await fixture.select(teamA);
      await expect.poll(() => fixture.held.length).toBe(1);
      await fixture.select(teamB);
      await expect(fixture.page.locator('[data-message-list]')).toContainText('B current');
      const firstStale = fixture.page.waitForResponse(r => r.url().includes(teamA) && r.url().includes('/messages'));
      await fixture.held[0].respond({ messages: [message('A stale')] });
      await settleResponse(fixture.page, await firstStale);
      await expect(fixture.page.locator('[data-message-list]')).not.toContainText('A stale');
      await expect(fixture.page.locator('[data-status]')).toHaveText('Messages loaded');
      // Returning to A creates a new request generation, even for the same key.
      fixture.hold();
      await fixture.select(teamA);
      await expect.poll(() => fixture.held.length).toBe(2);
      await fixture.select(teamB);
      await expect(fixture.page.locator('[data-message-list]')).toContainText('B current');
      await fixture.select(teamA);
      await expect(fixture.page.locator('[data-message-list]')).toContainText('A current');
      const staleResponse = fixture.page.waitForResponse(r => r.url().includes(teamA) && r.url().includes('/messages'));
      await fixture.held[1].respond({ messages: [message('Earlier A generation')] });
      await settleResponse(fixture.page, await staleResponse);
      await expect(fixture.page.locator('[data-message-list]')).toContainText('A current');
      await expect(fixture.page.locator('[data-message-list]')).not.toContainText('Earlier A generation');
    } finally { await fixture.context.close(); }
  });

  test(`late pagination stays in its original conversation (${mobile ? 'phone' : 'desktop'})`, async ({ browser, request }) => {
    const fixture = await openMessages(browser, request, mobile);
    try {
      fixture.paginate();
      await fixture.select(teamA);
      await expect(fixture.page.locator('[data-message-list] article')).toHaveCount(50);
      await fixture.page.locator('[data-load-older]').click();
      await expect.poll(() => fixture.held.length).toBe(1);
      await fixture.select(teamB);
      await expect(fixture.page.locator('[data-message-list]')).toContainText('B current');
      const staleResponse = fixture.page.waitForResponse(r => r.url().includes('before='));
      await fixture.held[0].respond({ messages: [message('A older private context')] });
      await settleResponse(fixture.page, await staleResponse);
      await expect(fixture.page.locator('[data-message-list]')).not.toContainText('A older private context');
      await expect(fixture.page.locator('[data-message-list] article')).toHaveCount(1);
      await expect(fixture.page.locator('[data-load-older]')).toBeHidden();
      await expect(fixture.page.locator('[data-chat-name]')).toHaveText('Regression Team B');
    } finally { await fixture.context.close(); }
  });
}

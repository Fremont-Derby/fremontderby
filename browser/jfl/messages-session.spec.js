import { test, expect } from '@playwright/test';
import { renderChatPage } from '../../src/chatPage.js';

const sourceMode = process.env.PLAYWRIGHT_MESSAGES_SOURCE === '1';
test.setTimeout(60_000);
const team = '11111111-1111-4111-8111-111111111111';
const origin = sourceMode ? 'https://session.messages.test' : process.env.PLAYWRIGHT_BASE_URL || 'https://jfl.fremontderby.com';

async function fixture(browser, request, mobile, holdInitial = false) {
  if (!sourceMode) {
    expect(process.env.PLAYWRIGHT_EXPECTED_SHA).toMatch(/^[a-f0-9]{40}$/);
    expect(await (await request.get('/health/environment')).json()).toMatchObject({
      ok: true, environment: 'jfl', expectedSupabaseSchema: 'jfl', versionTag: process.env.PLAYWRIGHT_EXPECTED_SHA,
    });
  }
  const context = await browser.newContext({ baseURL: origin, viewport: mobile ? { width: 320, height: 844 } : { width: 1280, height: 900 } });
  await context.addInitScript(() => {
    sessionStorage.setItem('fd.accessToken', 'synthetic-A');
    const original = window.fetch;
    window.fetch = async (...args) => {
      const response = await original(...args);
      if (window.holdBody && String(args[0]).includes('/api/me/chat-threads')) {
        window.holdBody = false;
        const text = response.text.bind(response);
        response.text = async () => {
          const body = await text();
          window.bodyHeld = true;
          await new Promise(resolve => { window.releaseBody = resolve; });
          return body;
        };
      }
      return response;
    };
  });
  const held = [], sends = [], reads = [], refreshes = [];
  let hold = holdInitial, expired = false, holdRefresh = false;
  await context.route('**/auth/v1/token?grant_type=refresh_token', async route => {
    expect(route.request().postDataJSON()).toEqual({ refresh_token: 'synthetic-refresh-A' });
    const respond = () => route.fulfill({ json: { access_token: 'synthetic-A-refreshed', refresh_token: 'synthetic-refresh-A-new' } });
    refreshes.push({ respond });
    if (!holdRefresh) await respond();
  });
  await context.route('**/api/**', async route => {
    const req = route.request(), path = new URL(req.url()).pathname;
    const actor = req.headers().authorization?.match(/Bearer synthetic-(A|B)/)?.[1] || 'none';
    const respond = (body, status = 200) => route.fulfill({ status, json: body });
    if (req.method() === 'GET') reads.push({ path, actor });
    else if (path.endsWith('/messages')) { sends.push({ route, actor, body: req.postDataJSON() }); return; }
    else if (path.endsWith('/messages/read')) return respond({});
    else throw new Error('Unexpected intercepted mutation ' + path);
    if (expired && req.headers().authorization === 'Bearer synthetic-A' && path.startsWith('/api/me/')) return respond({}, 401);
    if (path === '/api/test-persona') return respond({}, 404);
    if (path === '/api/me/message-notification-summary') return respond({ unreadCount: 0, previews: [] });
    if (path === '/api/me/chat-threads') {
      const body = { threads: [{ team_id: team, team_name: actor + ' synthetic team', season_name: 'Synthetic' }] };
      if (hold) { hold = false; held.push({ respond, body }); return; }
      return respond(body);
    }
    if (path === '/api/me/direct-message-inbox') return respond({ conversations: [] });
    if (path === '/api/me/direct-message-candidates') return respond({ candidates: [] });
    if (path.endsWith('chat-threads')) return respond({ threads: [] });
    if (path === '/api/admin/chat-reports') return respond({ error: 'League admin access required' }, 403);
    if (path.endsWith('/messages')) return respond({ messages: [{ message_id: actor + '-synthetic', body: actor + ' private synthetic history',
      author_display_name: 'Synthetic', created_at: '2026-10-25T12:00:00Z', is_own: false }] });
    throw new Error('Unexpected intercepted read ' + path);
  });
  const page = await context.newPage();
  if (sourceMode) await page.route(origin + '/messages', route => route.fulfill({ contentType: 'text/html', body: renderChatPage({
    ENVIRONMENT: 'jfl', SUPABASE_URL: 'https://refresh.messages.test', SUPABASE_PUBLISHABLE_KEY: 'synthetic-public-key',
  }) }));
  await page.goto('/messages');
  const change = async (actor, event = 'fd:session-changed') => page.evaluate(({ actor, event }) => {
    if (actor) sessionStorage.setItem('fd.accessToken', 'synthetic-' + actor);
    else sessionStorage.removeItem('fd.accessToken');
    window.dispatchEvent(new Event(event));
  }, { actor, event });
  const history = actor => page.locator('[data-message-list]').getByText(actor + ' private synthetic history', { exact: true });
  const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  if (holdInitial) await expect.poll(() => held.length).toBe(1);
  else await expect(history('A')).toBeVisible();
  return { page, context, change, history, held, sends, reads, refreshes, settle,
    hold: () => { hold = true; }, expire: (held = false) => { expired = true; holdRefresh = held; } };
}

for (const mobile of [false, true]) {
  const device = mobile ? 'phone320' : 'desktop';
  for (const event of ['fd:session-changed', 'storage', 'focus']) {
    test(`Messages ${event} clears old history, draft and report before new identity (${device})`, async ({ browser, request }) => {
      const f = await fixture(browser, request, mobile);
      try {
        await f.page.locator('[data-message-input]').fill('A unsent synthetic draft');
        await f.page.locator('[data-report-message]').click();
        await f.page.locator('[data-report-details]').fill('A synthetic report draft');
        f.hold();
        await f.change('B', event);
        await expect(f.history('A')).toBeHidden();
        await expect(f.page.locator('[data-message-list]')).toBeEmpty();
        await expect(f.page.locator('[data-message-input]')).toHaveValue('');
        await expect(f.page.locator('[data-message-input]')).toBeDisabled();
        await expect(f.page.locator('[data-report-dialog]')).not.toHaveAttribute('open', '');
        await expect(f.page.locator('[data-report-details]')).toHaveValue('');
        await expect.poll(() => f.held.length).toBe(1);
        await f.held[0].respond(f.held[0].body);
        await expect(f.history('B')).toBeVisible();
        await expect(f.page.locator('[data-chat-name]')).toHaveText('B synthetic team');
        expect(f.sends).toHaveLength(0);
      } finally { await f.context.close(); }
    });
  }

  test(`Messages delayed body and rapid A-B-A cannot revive the earlier A (${device})`, async ({ browser, request }) => {
    const f = await fixture(browser, request, mobile);
    try {
      await f.page.evaluate(() => { window.holdBody = true; });
      await f.change('B');
      await expect.poll(() => f.page.evaluate(() => window.bodyHeld)).toBe(true);
      f.hold();
      await f.change('A');
      await expect.poll(() => f.held.length).toBe(1);
      await f.page.evaluate(() => window.releaseBody());
      await f.settle();
      await expect(f.history('A')).toBeHidden();
      await expect(f.page.locator('[data-message-input]')).toBeDisabled();
      await f.held[0].respond(f.held[0].body);
      await expect(f.history('A')).toBeVisible();
    } finally { await f.context.close(); }
  });

  for (const status of [200, 401]) test(`Messages old HTTP${status} cannot affect new identity (${device})`, async ({ browser, request }) => {
    const f = await fixture(browser, request, mobile, true);
    try {
      await f.change('B');
      await expect(f.history('B')).toBeVisible();
      await f.held[0].respond(f.held[0].body, status);
      await f.settle();
      await expect(f.history('A')).toBeHidden();
      await expect(f.history('B')).toBeVisible();
      expect(await f.page.evaluate(() => sessionStorage.getItem('fd.accessToken'))).toBe('synthetic-B');
    } finally { await f.context.close(); }
  });

  test(`Messages old send finalizer cannot unlock the new pending send (${device})`, async ({ browser, request }) => {
    const f = await fixture(browser, request, mobile);
    try {
      const input = f.page.locator('[data-message-input]');
      await input.fill('A outgoing synthetic'); await input.press('Enter');
      await expect.poll(() => f.sends.length).toBe(1);
      await f.change('B');
      await expect(f.history('B')).toBeVisible();
      await input.fill('B outgoing synthetic'); await input.press('Enter');
      await expect.poll(() => f.sends.length).toBe(2);
      await f.sends[0].route.fulfill({ status: 401, json: {} });
      await f.settle();
      await expect(input).toBeDisabled();
      await expect(input).toHaveValue('B outgoing synthetic');
      await f.page.locator('[data-composer]').evaluate(form => form.dispatchEvent(new Event('submit', { cancelable: true })));
      expect(f.sends).toHaveLength(2);
      await f.sends[1].route.fulfill({ status: 201, json: { message: {} } });
      await expect(input).toHaveValue('');
      await expect(input).toBeEnabled();
      expect(f.sends.map(row => row.actor)).toEqual(['A', 'B']);
    } finally { await f.context.close(); }
  });

  test(`Messages signout clears content and rejects pending bodies (${device})`, async ({ browser, request }) => {
    const f = await fixture(browser, request, mobile);
    try {
      f.hold(); await f.change('B');
      await expect.poll(() => f.held.length).toBe(1);
      await f.change('');
      await expect(f.page.locator('[data-signed-out]')).toBeVisible();
      await f.held[0].respond(f.held[0].body);
      await f.settle();
      await expect(f.history('A')).toBeHidden();
      await expect(f.page.locator('[data-message-list]')).toBeEmpty();
      await expect(f.page.locator('[data-message-input]')).toBeDisabled();
      expect(f.sends).toHaveLength(0);
    } finally { await f.context.close(); }
  });

  test(`Messages same-session events do not discard drafts or duplicate pending loads (${device})`, async ({ browser, request }) => {
    const f = await fixture(browser, request, mobile);
    try {
      f.hold(); await f.change('B');
      await expect.poll(() => f.held.length).toBe(1);
      const count = f.reads.length;
      for (const event of ['focus', 'storage', 'fd:session-changed']) await f.change('B', event);
      await f.settle();
      expect(f.reads.length).toBe(count);
      await f.held[0].respond(f.held[0].body);
      await expect(f.history('B')).toBeVisible();
      await f.page.locator('[data-message-input]').fill('Same actor unsent draft');
      for (const event of ['focus', 'storage', 'fd:session-changed']) await f.change('B', event);
      await f.settle();
      await expect(f.page.locator('[data-message-input]')).toHaveValue('Same actor unsent draft');
    } finally { await f.context.close(); }
  });

  test(`Messages detects a changed token before sending an old draft without an event (${device})`, async ({ browser, request }) => {
    const f = await fixture(browser, request, mobile);
    try {
      const input = f.page.locator('[data-message-input]');
      await input.fill('A draft must never send as B');
      f.hold();
      await f.page.evaluate(() => sessionStorage.setItem('fd.accessToken', 'synthetic-B'));
      await input.press('Enter');
      await expect.poll(() => f.held.length).toBe(1);
      await expect(input).toHaveValue(''); await expect(input).toBeDisabled();
      await expect(f.page.locator('[data-message-list]')).toBeEmpty();
      expect(f.sends).toHaveLength(0);
      await f.held[0].respond(f.held[0].body);
      await expect(f.history('B')).toBeVisible();
    } finally { await f.context.close(); }
  });

  test(`Messages concurrent expired reads share a refresh and retain the same-session draft (${device})`, async ({ browser, request }) => {
    const f = await fixture(browser, request, mobile);
    try {
      await f.page.evaluate(() => sessionStorage.setItem('fd.refreshToken', 'synthetic-refresh-A'));
      await f.page.locator('[data-message-input]').fill('Same identity draft survives refresh');
      f.expire();
      // Fault-injection entry point into the existing read controller; no live
      // traffic or claim of mobile Refresh discoverability is made here.
      await f.page.locator('[data-refresh]').dispatchEvent('click');
      await expect.poll(() => f.page.evaluate(() => sessionStorage.getItem('fd.accessToken'))).toBe('synthetic-A-refreshed');
      await expect(f.history('A')).toBeVisible();
      await expect(f.page.locator('[data-status]')).toHaveText('Messages ready');
      await expect(f.page.locator('[data-message-input]')).toHaveValue('Same identity draft survives refresh');
      expect(f.refreshes).toHaveLength(1); expect(f.sends).toHaveLength(0);
    } finally { await f.context.close(); }
  });

  test(`Messages stale refresh cannot replace a newer session (${device})`, async ({ browser, request }) => {
    const f = await fixture(browser, request, mobile);
    try {
      await f.page.evaluate(() => sessionStorage.setItem('fd.refreshToken', 'synthetic-refresh-A'));
      f.expire(true);
      await f.page.locator('[data-refresh]').dispatchEvent('click');
      await expect.poll(() => f.refreshes.length).toBe(1);
      await f.change('B'); await expect(f.history('B')).toBeVisible();
      await f.page.locator('[data-message-input]').fill('B new private draft');
      await f.refreshes[0].respond(); await f.settle();
      expect(await f.page.evaluate(() => sessionStorage.getItem('fd.accessToken'))).toBe('synthetic-B');
      await expect(f.history('A')).toBeHidden(); await expect(f.history('B')).toBeVisible();
      await expect(f.page.locator('[data-message-input]')).toHaveValue('B new private draft');
      expect(f.sends).toHaveLength(0);
    } finally { await f.context.close(); }
  });
}

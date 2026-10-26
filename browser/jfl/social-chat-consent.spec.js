import { test, expect } from '@playwright/test';
import router from '../../src/routerEntry.js';

const sourceMode = process.env.PLAYWRIGHT_CONSENT_SOURCE === '1';
async function openPrivacy(browser, request, mobile, channel, { failLoad = false } = {}) {
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
    if (path.startsWith('/api/me/social-chat-consent/')) {
      const requestedChannel = path.split('/').pop();
      const valueKey = token + ':' + requestedChannel;
      if (method === 'PUT') writes.push(route.request().postDataJSON());
      const finish = () => {
        if (requestedChannel === channel && method === 'GET' && failLoad) { failLoad = false; return respond({ error: 'Unavailable' }, 503); }
        if (requestedChannel === channel && method === 'PUT' && failSave) { failSave = false; return respond({ error: 'Unavailable' }, 403); }
        if (method === 'PUT') values.set(valueKey, route.request().postDataJSON().enabled);
        return respond({ enabled: values.get(valueKey) || false });
      };
      if (requestedChannel === channel && holdMethod === method) { holdMethod = ''; held.push({ route, finish }); return; }
      return finish();
    }
    if (path === '/api/me/direct-message-consent') return respond({ directMessages: false });
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
  const toggle = page.locator('[data-social-' + channel + '-consent-toggle]'), save = page.locator('[data-social-' + channel + '-consent-save]');
  const status = page.locator('[data-social-' + channel + '-consent-status]'), reload = page.locator('[data-social-' + channel + '-consent-reload]');
  await expect(status).toHaveText(failLoad ? /Could not confirm/ : /OFF|Could not confirm/);
  return { context, page, toggle, save, status, reload, writes, held,
    hold: method => { holdMethod = method; }, failSave: () => { failSave = true; },
    switchAccount: () => page.evaluate(() => {
      sessionStorage.setItem('fd.accessToken', 'synthetic-consent-B');
      window.dispatchEvent(new Event('fd:session-changed'));
    }) };
}

for (const channel of ['general', 'team']) {
for (const mobile of [false, true]) {
  const device = channel + (mobile ? ' phone' : ' desktop');
  test(`enabling or disabling one channel preserves the other and DM (${device})`, async ({ browser, request }) => {
    const f = await openPrivacy(browser, request, mobile, channel);
    try {
      const other = channel === 'team' ? 'general' : 'team';
      const otherToggle = f.page.locator('[data-social-' + other + '-consent-toggle]');
      const otherSave = f.page.locator('[data-social-' + other + '-consent-save]');
      const otherStatus = f.page.locator('[data-social-' + other + '-consent-status]');
      await f.toggle.check(); await f.save.click();
      await expect(f.status).toContainText('is ON.');
      await expect(otherToggle).not.toBeChecked();
      await otherToggle.check(); await otherSave.click(); await expect(otherStatus).toContainText('is ON.');
      await f.page.reload(); await expect(f.toggle).toBeChecked(); await expect(otherToggle).toBeChecked();
      await f.toggle.uncheck(); await f.save.click(); await expect(f.status).toContainText('is OFF.');
      await f.page.reload(); await expect(f.toggle).not.toBeChecked(); await expect(otherToggle).toBeChecked();
      await expect(f.page.locator('[data-dm-consent-toggle]')).not.toBeChecked();
    } finally { await f.context.close(); }
  });
  test(`default OFF; ON and OFF persist across Profile reload (${device})`, async ({ browser, request }) => {
    const f = await openPrivacy(browser, request, mobile, channel);
    try {
      await expect(f.toggle).not.toBeChecked();
      await expect(f.save).toBeEnabled();
      await expect(f.page.locator('[data-dm-consent-toggle]')).not.toBeChecked();
      await expect(f.page.locator('[data-social-' + (channel === 'team' ? 'general' : 'team') + '-consent-toggle]')).not.toBeChecked();
      await f.toggle.check(); await f.save.click();
      await expect(f.status).toHaveText(channel === 'team' ? 'Team Chat is ON.' : 'General Chat is ON.');
      await f.page.reload(); await expect(f.toggle).toBeChecked();
      await f.toggle.uncheck(); await f.save.click();
      await expect(f.status).toHaveText(channel === 'team' ? 'Team Chat is OFF.' : 'General Chat is OFF.');
      await f.page.reload(); await expect(f.toggle).not.toBeChecked();
      expect(f.writes).toEqual([{ enabled: true }, { enabled: false }]);
      expect(await f.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await expect(f.page.locator('[data-dm-consent]')).toContainText('required league notices remain available');
    } finally { await f.context.close(); }
  });
  test(`load failure locks changes and Reload recovers (${device})`, async ({ browser, request }) => {
    const f = await openPrivacy(browser, request, mobile, channel, { failLoad: true });
    try {
      await expect(f.status).toContainText('Could not confirm');
      await expect(f.toggle).toBeDisabled(); await expect(f.save).toBeDisabled();
      await f.reload.click(); await expect(f.status).toHaveText(channel === 'team' ? 'Team Chat is OFF.' : 'General Chat is OFF.');
      await expect(f.toggle).toBeEnabled(); expect(f.writes).toHaveLength(0);
    } finally { await f.context.close(); }
  });
  test(`unconfirmed save locks changes and explicit Reload recovers (${device})`, async ({ browser, request }) => {
    const f = await openPrivacy(browser, request, mobile, channel);
    try {
      f.failSave(); await f.toggle.check(); await f.save.click();
      await expect(f.status).toContainText('Could not confirm');
      await expect(f.save).toBeDisabled();
      await f.reload.click(); await expect(f.status).toHaveText(channel === 'team' ? 'Team Chat is OFF.' : 'General Chat is OFF.');
      await expect(f.toggle).not.toBeChecked();
    } finally { await f.context.close(); }
  });
  for (const method of ['GET', 'PUT']) {
    test(`delayed ${method} cannot overwrite another account's privacy (${device})`, async ({ browser, request }) => {
      const f = await openPrivacy(browser, request, mobile, channel);
      try {
        await f.toggle.check(); await f.save.click(); await expect(f.status).toHaveText(channel === 'team' ? 'Team Chat is ON.' : 'General Chat is ON.');
        f.hold(method);
        if (method === 'PUT') { await f.toggle.uncheck(); await f.save.click(); }
        else await f.reload.click();
        await expect.poll(() => f.held.length).toBe(1);
        await f.switchAccount(); await expect(f.status).toHaveText(channel === 'team' ? 'Team Chat is OFF.' : 'General Chat is OFF.');
        await f.held[0].finish();
        await f.page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        await expect(f.status).toHaveText(channel === 'team' ? 'Team Chat is OFF.' : 'General Chat is OFF.'); await expect(f.toggle).not.toBeChecked();
        await expect(f.save).toBeEnabled();
      } finally { await f.context.close(); }
    });
  }
  test(`pending save rejects repeated submission (${device})`, async ({ browser, request }) => {
    const f = await openPrivacy(browser, request, mobile, channel);
    try {
      f.hold('PUT'); await f.toggle.check(); await f.save.click();
      await expect.poll(() => f.held.length).toBe(1);
      await f.page.locator('[data-social-' + channel + '-consent-form]').evaluate(form => {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      });
      expect(f.writes).toHaveLength(1); await expect(f.toggle).toBeDisabled();
      await f.held[0].finish(); await expect(f.status).toHaveText(channel === 'team' ? 'Team Chat is ON.' : 'General Chat is ON.');
    } finally { await f.context.close(); }
  });
}


}


// Focused HTTP429 recovery regressions for all three production controllers.
import { enhanceProfileDirectMessageConsent } from '../../src/profileDirectMessageConsentEnhancer.js';
import { enhanceProfileSocialChatConsent } from '../../src/profileSocialChatConsentEnhancer.js';

const source = process.env.PLAYWRIGHT_CONSENT_SOURCE === '1';
const channels = [
  { key: 'dm', path: '/api/me/direct-message-consent', field: 'directMessages' },
  { key: 'social-general', path: '/api/me/social-chat-consent/general', field: 'enabled' },
  { key: 'social-team', path: '/api/me/social-chat-consent/team', field: 'enabled' },
];

async function open(browser, request, channel, mobile) {
  if (!source) {
    expect(process.env.PLAYWRIGHT_EXPECTED_SHA).toMatch(/^[a-f0-9]{40}$/);
    expect(await (await request.get('/health/environment')).json()).toMatchObject({
      ok: true, environment: 'jfl', expectedSupabaseSchema: 'jfl', versionTag: process.env.PLAYWRIGHT_EXPECTED_SHA,
    });
  }
  const origin = source ? 'https://consent.test' : process.env.PLAYWRIGHT_BASE_URL || 'https://jfl.fremontderby.com';
  const context = await browser.newContext({ baseURL: origin,
    viewport: { width: mobile ? 320 : 1280, height: 900 }, isMobile: mobile, hasTouch: mobile });
  await context.addInitScript(() => sessionStorage.setItem('fd.accessToken', 'synthetic-A'));
  const page = await context.newPage();
  await page.clock.install({ time: new Date('2026-10-25T05:00:00Z') });
  const values = new Map(channels.map(c => [c.key, true]));
  const writes = [], reads = [];
  let failure;
  await context.route('**/api/**', async route => {
    const req = route.request(), c = channels.find(c => new URL(req.url()).pathname === c.path);
    if (!c) {
      expect(req.method(), 'Only synthetic consent endpoints may write').toBe('GET');
      return route.fulfill({ json: {} });
    }
    if (req.method() === 'PUT') writes.push({ key: c.key, body: req.postDataJSON() });
    else reads.push(c.key);
    if (c.key === channel.key && failure?.method === req.method()) {
      const f = failure; failure = undefined;
      return route.fulfill({ status: f.status || 429,
        headers: f.header === null ? {} : { 'Retry-After': f.header },
        contentType: 'text/html', body: 'PRIVATE ERROR BODY MUST NOT DISPLAY' });
    }
    if (req.method() === 'PUT') values.set(c.key, req.postDataJSON()[c.field]);
    return route.fulfill({ json: { [c.field]: values.get(c.key) } });
  });
  await context.route('**/auth/**', route => route.fulfill({ status: 401, json: {} }));
  if (source) {
    let html = new Response('<html><body><section class="stack" data-authenticated-content hidden></section></body></html>',
      { headers: { 'content-type': 'text/html' } });
    html = await enhanceProfileDirectMessageConsent(html);
    html = await enhanceProfileSocialChatConsent(html);
    const body = await html.text();
    await page.route(origin + '/profile', route => route.fulfill({ contentType: 'text/html', body }));
  }
  await page.goto('/profile');
  // The real Profile session controller hides this section for synthetic tokens.
  // API interception and the production consent controllers are the proof scope.
  await page.locator('[data-authenticated-content]').evaluate(el => { el.hidden = false; });
  const el = suffix => page.locator(`[data-${channel.key}-consent-${suffix}]`);
  await expect(el('toggle')).toBeChecked();
  await expect(el('save')).toBeEnabled();
  return { page, context, el, writes, reads, values,
    fail: (method, header, status) => { failure = { method, header, status }; } };
}

for (const channel of channels) for (const mobile of [false, true]) {
  const name = `${channel.key} ${mobile ? 'phone320' : 'desktop'}`;
  for (const method of ['PUT', 'GET']) for (const format of ['seconds', 'date']) {
    test(`throttled ${method} ${format} requires wait, readback and explicit save (${name})`, async ({ browser, request }) => {
      const f = await open(browser, request, channel, mobile);
      try {
        const header = format === 'seconds' ? '10' : await f.page.evaluate(() => new Date(Date.now() + 10000).toUTCString());
        f.fail(method, header);
        if (method === 'PUT') { await f.el('toggle').uncheck(); await f.el('save').click(); }
        else await f.el('reload').click();
        await expect(f.el('status')).toContainText('Wait 10 seconds');
        if (method === 'PUT') await expect(f.el('status')).toContainText('Save was not confirmed');
        await expect(f.el('status')).not.toContainText('PRIVATE');
        await expect(f.el('toggle')).toBeDisabled();
        await expect(f.el('save')).toBeDisabled();
        await expect(f.el('reload')).toBeDisabled();
        const count = f.writes.length, reads = f.reads.length;
        await f.el('reload').evaluate(el => el.dispatchEvent(new Event('click')));
        await f.el('save').evaluate(el => {
          el.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          el.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        });
        await f.page.clock.fastForward(11000);
        await expect(f.el('reload')).toBeEnabled();
        await expect(f.el('save')).toBeDisabled();
        expect(f.writes).toHaveLength(count); expect(f.reads).toHaveLength(reads);
        expect(f.values.get(channel.key), 'Rejected OFF must leave the authoritative ON value intact').toBe(true);
        await f.el('reload').click();
        await expect(f.el('toggle')).toBeChecked(); await expect(f.el('save')).toBeEnabled();
        expect(f.writes).toHaveLength(count);
        await f.el('toggle').uncheck(); await f.el('save').click();
        await expect(f.el('status')).toContainText('OFF.');
        expect(f.values.get(channel.key)).toBe(false);
        for (const other of channels.filter(c => c !== channel)) {
          expect(f.values.get(other.key)).toBe(true);
          await expect(f.page.locator(`[data-${other.key}-consent-toggle]`)).toBeChecked();
        }
        expect(f.writes.every(w => w.key === channel.key)).toBe(true);
        expect(await f.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      } finally { await f.context.close(); }
    });
  }
  test(`account change invalidates throttle timer (${name})`, async ({ browser, request }) => {
    const f = await open(browser, request, channel, mobile);
    try {
      f.fail('PUT', '10'); await f.el('toggle').uncheck(); await f.el('save').click();
      await expect(f.el('status')).toContainText('Wait 10 seconds');
      await f.page.evaluate(() => {
        sessionStorage.setItem('fd.accessToken', 'synthetic-B');
        window.dispatchEvent(new Event('fd:session-changed'));
      });
      await expect(f.el('toggle')).toBeChecked(); await expect(f.el('save')).toBeEnabled();
      await expect(f.el('status')).toContainText('ON.');
      await f.page.clock.fastForward(11000);
      await expect(f.el('status')).toContainText('ON.');
      expect(f.writes).toHaveLength(1);
    } finally { await f.context.close(); }
  });
  test(`invalid retry headers and non429 errors never claim saved or expose response (${name})`, async ({ browser, request }) => {
    const f = await open(browser, request, channel, mobile);
    try {
      for (const header of [null, '-10', 'NaN', '999999999999', '2garbage', 'Sun, 25 Oct 2020 05:00:00 GMT']) {
        f.fail('PUT', header); await f.el('toggle').uncheck(); await f.el('save').click();
        await expect(f.el('status')).toContainText('Wait before selecting Reload');
        await expect(f.el('status')).not.toContainText('PRIVATE');
        await expect(f.el('save')).toBeDisabled();
        await f.el('reload').click(); await expect(f.el('toggle')).toBeChecked();
      }
      f.fail('PUT', '10', 403); await f.el('toggle').uncheck(); await f.el('save').click();
      await expect(f.el('status')).toHaveText('Could not confirm messaging privacy. Reload to try again.');
      await expect(f.el('save')).toBeDisabled(); await expect(f.el('reload')).toBeEnabled();
    } finally { await f.context.close(); }
  });
}

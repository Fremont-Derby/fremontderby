import { test, expect } from '@playwright/test';
import { assumePersona } from './persona.js';

// #3575: the trusted live-fixture job already supplies this opt-in and exact
// deployment SHA. Public PRs must never mutate hosted persona preferences.
test.skip(process.env.PLAYWRIGHT_LIVE_SEASON_READBACK !== '1',
  'Live persona preferences are exercised only by the trusted JFL fixture job.');
test.use({ trace: 'off', screenshot: 'off', video: 'off' });

const channels = [
  { key: 'general', prefix: 'social-general', path: '/api/me/social-chat-consent/general', field: 'enabled' },
  { key: 'team', prefix: 'social-team', path: '/api/me/social-chat-consent/team', field: 'enabled' },
  { key: 'direct', prefix: 'dm', path: '/api/me/direct-message-consent', field: 'directMessages' },
];
const readThrottles = new WeakMap();

async function cooldown(page, response) {
  expect(response.status(), 'Only observed HTTP429 permits recovery').toBe(429);
  const header = response.headers()['retry-after'];
  const numeric = header?.trim() ? Number(header) : NaN;
  const parsed = Number.isFinite(numeric) ? numeric : Math.ceil((Date.parse(header) - Date.now()) / 1000);
  const seconds = Number.isFinite(parsed) && parsed > 0 ? Math.ceil(parsed) : 15;
  expect(seconds, 'Excessive Retry-After must fail closed').toBeLessThanOrEqual(60);
  console.info(`Live consent HTTP429 recovery; cooldown=${seconds + 1}s.`);
  await page.waitForTimeout((seconds + 1) * 1000);
}

async function read(page, channel) {
  const reload = page.locator(`[data-${channel.prefix}-consent-reload]`);
  const toggle = page.locator(`[data-${channel.prefix}-consent-toggle]`);
  // Use the page's confirmed state instead of manufacturing extra GETs. A fresh
  // navigation already loads every channel through the production controller.
  const priorThrottle = readThrottles.get(page)?.get(channel.path);
  if (priorThrottle) {
    readThrottles.get(page).delete(channel.path);
    await cooldown(page, priorThrottle);
  }
  await expect.poll(async () => await toggle.isEnabled() || await reload.isEnabled()).toBe(true);
  if (await toggle.isEnabled()) return toggle.isChecked();
  for (let attempt = 0; attempt < 4; attempt++) {
    await expect(reload).toBeEnabled();
    const pending = page.waitForResponse(response => new URL(response.url()).pathname === channel.path
      && response.request().method() === 'GET');
    await reload.click();
    const response = await pending;
    if (response.status() === 429) {
      expect(attempt, 'Consent read recovery exhausted').toBeLessThan(3);
      await cooldown(page, response);
      continue;
    }
    expect(response.status(), 'Consent read must succeed without bypass').toBe(200);
    const body = await response.json();
    expect(typeof body[channel.field]).toBe('boolean');
    await expect(page.locator(`[data-${channel.prefix}-consent-toggle]`)).toBeEnabled();
    return body[channel.field];
  }
  throw new Error('Consent read remained unavailable');
}

async function snapshot(page) {
  const values = {};
  for (const channel of channels) values[channel.key] = await read(page, channel);
  return values;
}

async function save(page, channel, desired, label = 'Admin Captain') {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (await read(page, channel) === desired) return;
    await expect(page.locator('[data-test-persona-banner]')).toContainText(label);
    await page.locator(`[data-${channel.prefix}-consent-toggle]`).setChecked(desired);
    const pending = page.waitForResponse(response => new URL(response.url()).pathname === channel.path
      && response.request().method() === 'PUT');
    await page.locator(`[data-${channel.prefix}-consent-save]`).click();
    const response = await pending;
    if (response.status() === 429) {
      // A rejected save locks the form. Recover an authoritative GET before any
      // new explicit selection/Save action; never replay an uncertain mutation.
      await expect(page.locator(`[data-${channel.prefix}-consent-status]`)).toContainText('Could not confirm');
      await expect(page.locator(`[data-${channel.prefix}-consent-save]`)).toBeDisabled();
      await cooldown(page, response);
      if (await read(page, channel) === desired) return;
      expect(attempt, 'Explicit consent save recovery exhausted').toBeLessThan(2);
      console.info('Rejected consent save reread; reselecting the intended value through Profile.');
      continue;
    }
    expect(response.status(), 'Consent save must be confirmed').toBe(200);
    expect((await response.json())[channel.field]).toBe(desired);
    expect(await read(page, channel)).toBe(desired);
    return;
  }
}

for (const [device, viewport] of [['phone', { width: 320, height: 844 }], ['desktop', { width: 1280, height: 900 }]]) {
  test(`live three-channel consent persists independently and original values are restored (${device})`, async ({ browser, request }) => {
    const sha = process.env.PLAYWRIGHT_EXPECTED_SHA || '';
    expect(sha).toMatch(/^[a-f0-9]{40}$/);
    const health = await request.get('/health/environment');
    expect(await health.json()).toMatchObject({ ok: true, environment: 'jfl',
      expectedSupabaseSchema: 'jfl', versionTag: sha });
    const context = await browser.newContext({ viewport, isMobile: device === 'phone', hasTouch: device === 'phone' });
    const page = await context.newPage();
    readThrottles.set(page, new Map());
    page.on('response', response => {
      if (response.request().method() !== 'GET') return;
      const path = new URL(response.url()).pathname;
      if (!channels.some(channel => channel.path === path)) return;
      if (response.status() >= 400) readThrottles.get(page).set(path, response);
      else if (response.ok()) readThrottles.get(page).delete(path);
    });
    let original;
    try {
      await assumePersona(page, 'Admin Captain');
      const identity = await page.evaluate(async () => {
        const response = await fetch('/api/test-persona', { headers: {
          authorization: 'Bearer ' + sessionStorage.getItem('fd.accessToken'),
        } });
        const body = await response.json();
        return { status: response.status, environment: body.environment, key: body.current?.key };
      });
      expect(identity).toEqual({ status: 200, environment: 'jfl', key: 'admin-captain' });
      original = await snapshot(page);
      for (const channel of channels) {
        const desired = { ...original, [channel.key]: !original[channel.key] };
        await save(page, channel, desired[channel.key]);
        expect(await snapshot(page)).toEqual(desired);
        await page.reload();
        await expect(page.locator('[data-test-persona-banner]')).toContainText('Admin Captain');
        expect(await snapshot(page)).toEqual(desired);
        await save(page, channel, original[channel.key]);
        expect(await snapshot(page)).toEqual(original);
      }
    } finally {
      try {
        if (original) {
          for (const channel of channels) await save(page, channel, original[channel.key]);
          expect(await snapshot(page), 'Synthetic persona original consent values restored').toEqual(original);
          console.info('Synthetic persona original consent values restored and verified.');
        }
      } finally {
        await context.close();
      }
    }
  });
}

// #3579: normal Messages UI delivery between the two existing private QA captains.
// Cleanup uses the same authenticated report/moderation API as the product UI.
// Only this run's exact synthetic marker may be reported or soft-removed.
const directFixture = {
  season: '18580000-1000-4000-8000-000000000000',
  sender: '18580000-2000-4000-8000-000000000002',
  recipient: '18580000-2000-4000-8000-000000000003',
};

async function actorRequest(page, path, method = 'GET', body) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const result = await page.evaluate(async ({ path, method, body }) => {
      const response = await fetch(path, { method, headers: {
        authorization: 'Bearer ' + sessionStorage.getItem('fd.accessToken'), 'content-type': 'application/json',
      }, ...(body ? { body: JSON.stringify(body) } : {}) });
      let parsed = null;
      try { parsed = await response.json(); } catch { /* Inspect status before any JSON requirement; never log the body. */ }
      return { status: response.status, retry: response.headers.get('Retry-After'), body: parsed };
    }, { path, method, body });
    // Never replay a mutation, including one with an unknown network outcome.
    if (method !== 'GET' || result.status !== 429) {
      if (!result.body || typeof result.body !== 'object') throw new Error('Synthetic messaging response was not JSON; HTTP ' + result.status);
      return result;
    }
    const seconds = Number(result.retry);
    expect(Number.isFinite(seconds) && seconds > 0 && seconds <= 60, 'Qualified read Retry-After required').toBe(true);
    await page.waitForTimeout((seconds + 1) * 1000);
  }
  throw new Error('Synthetic messaging read remained throttled');
}

async function openQualifiedMessages(page, href, conversation = false) {
  const rejected = [];
  const corePaths = new Set(['/messages', '/api/me/chat-threads', '/api/me/direct-message-inbox',
    '/api/me/league-chat-threads', '/api/me/direct-message-candidates']);
  const observe = response => {
    const path = new URL(response.url()).pathname;
    if (response.request().method() === 'GET' && response.status() >= 400
      && (corePaths.has(path) || path.startsWith('/api/direct-conversations/') && path.endsWith('/messages'))) rejected.push(response);
  };
  page.on('response', observe);
  const ready = async () => {
    const control = page.locator(conversation ? '[data-message-input]' : '[data-new-message]');
    return await control.count() > 0 && await control.isEnabled() && await page.locator('[data-chat-layout]').isVisible()
      && (conversation || await page.locator('[data-candidate-select] option[value=\"' + directFixture.season + '|' + directFixture.recipient + '\"]').count() === 1);
  };
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      rejected.length = 0;
      await page.goto(href);
      await expect.poll(async () => await ready() || rejected.length > 0
        || await page.locator('[data-page-state]').isVisible(), { timeout: 15_000 }).toBe(true);
      if (await ready()) return;
      expect(rejected.length, 'A failed Messages load needs captured endpoint/status evidence before recovery').toBeGreaterThan(0);
      let wait = 0;
      for (const response of rejected) {
        const path = new URL(response.url()).pathname;
        const header = response.headers()['retry-after'];
        const numeric = header?.trim() ? Number(header) : NaN;
        const seconds = Number.isFinite(numeric) ? Math.ceil(numeric) : Math.ceil((Date.parse(header) - Date.now()) / 1000);
        console.info('Messages qualification GET ' + path + ': HTTP ' + response.status()
          + '; bounded Retry-After=' + (Number.isFinite(seconds) && seconds > 0 && seconds <= 60 ? seconds : 'unqualified'));
        expect(response.status(), 'Only an observed GET429 permits explicit read recovery').toBe(429);
        expect(Number.isFinite(seconds) && seconds > 0 && seconds <= 60, 'Validated bounded Retry-After required; do not guess').toBe(true);
        wait = Math.max(wait, seconds);
      }
      expect(attempt, 'Messages read recovery exhausted; preserve the blocker').toBeLessThan(2);
      await page.waitForTimeout((wait + 1) * 1000);
      // Reopen the same authenticated read path. Never recreate a conversation or replay a send.
    }
  } finally { page.off('response', observe); }
}

for (const [device, viewport] of [['desktop', { width: 1280, height: 900 }], ['phone', { width: 320, height: 844 }]]) {
  test(`live synthetic direct message persists and exact marker is removed (${device})`, async ({ browser, request }) => {
    test.setTimeout(600_000);
    const sha = process.env.PLAYWRIGHT_EXPECTED_SHA || '';
    expect(sha).toMatch(/^[a-f0-9]{40}$/);
    expect(await (await request.get('/health/environment')).json()).toMatchObject({
      ok: true, environment: 'jfl', expectedSupabaseSchema: 'jfl', versionTag: sha,
    });
    const actors = [];
    const markerId = crypto.randomUUID();
    const marker = 'JFL synthetic delivery acceptance ' + markerId;
    let conversationId, sendAttempted = false, cleanupVerified = false;
    try {
      for (const [label, key, player] of [
        ['Admin Captain', 'admin-captain', directFixture.sender],
        ['Regular Captain', 'regular-captain', directFixture.recipient],
      ]) {
        const context = await browser.newContext({ viewport, isMobile: device === 'phone', hasTouch: device === 'phone' });
        const page = await context.newPage();
        page.setDefaultTimeout(15_000);
        const actor = { context, page, player, label };
        actors.push(actor);
        readThrottles.set(page, new Map());
        page.on('response', response => {
          if (response.request().method() !== 'GET') return;
          const path = new URL(response.url()).pathname;
          if (!channels.some(channel => channel.path === path)) return;
          if (response.status() >= 400) readThrottles.get(page).set(path, response);
          else if (response.ok()) readThrottles.get(page).delete(path);
        });
        await assumePersona(page, label);
        const identity = await actorRequest(page, '/api/test-persona');
        expect(identity.status).toBe(200);
        expect(identity.body.environment === 'jfl' && identity.body.current?.key === key, 'Exact synthetic actor required').toBe(true);
        const profile = await actorRequest(page, '/api/me/profile');
        expect(profile.status).toBe(200);
        expect(profile.body.profile?.id === player, 'Exact fixed QA player required').toBe(true);
        actor.original = await snapshot(page);
      }
      const [sender, recipient] = actors;
      const direct = channels.find(channel => channel.key === 'direct');
      for (const actor of actors) {
        await save(actor.page, direct, true, actor.label);
        expect(await snapshot(actor.page)).toEqual({ ...actor.original, direct: true });
      }
      const candidates = await actorRequest(sender.page, '/api/me/direct-message-candidates');
      expect(candidates.status).toBe(200);
      expect(candidates.body.candidates?.filter(candidate => candidate.season_id === directFixture.season
        && candidate.player_id === directFixture.recipient).length,
      'Supported candidate must be the exact recipient in the fixed private QA season').toBe(1);
      const reverse = await actorRequest(recipient.page, '/api/me/direct-message-candidates');
      expect(reverse.status).toBe(200);
      expect(reverse.body.candidates?.some(candidate => candidate.season_id === directFixture.season
        && candidate.player_id === directFixture.sender), 'Both synthetic captains must be mutually discoverable').toBe(true);

      await openQualifiedMessages(sender.page, '/messages');
      const form = sender.page.locator(device === 'phone' ? '[data-mobile-new-direct]' : '[data-new-direct]');
      if (device === 'phone') await sender.page.getByRole('button', { name: 'Message a player', exact: true }).click();
      else await sender.page.locator('[data-new-message]').click();
      await form.locator('select').selectOption(directFixture.season + '|' + directFixture.recipient);
      const start = sender.page.waitForResponse(response => new URL(response.url()).pathname === '/api/direct-conversations'
        && response.request().method() === 'POST');
      await form.getByRole('button', { name: 'Start message', exact: true }).click();
      const started = await start;
      expect(started.status(), 'Conversation creation must be confirmed without write replay').toBe(201);
      expect(started.request().postDataJSON()).toEqual({ seasonId: directFixture.season, playerId: directFixture.recipient });
      const conversation = (await started.json()).conversation;
      conversationId = conversation.conversation_id;
      expect(conversationId).toMatch(/^[a-f0-9-]{36}$/);
      await openQualifiedMessages(sender.page, '/messages?direct=' + encodeURIComponent(conversationId), true);
      await expect(sender.page.locator('[data-thread-select]')).toHaveValue('direct:' + conversationId);
      const input = sender.page.locator('[data-message-input]');
      await expect(input).toBeEnabled();
      await input.fill(marker);
      const pending = sender.page.waitForResponse(response => new URL(response.url()).pathname === `/api/direct-conversations/${conversationId}/messages`
        && response.request().method() === 'POST');
      console.info('Synthetic-only recovery IDs: run=' + markerId + '; conversation=' + conversationId);
      sendAttempted = true;
      await sender.page.locator('[data-composer]').getByRole('button', { name: 'Send', exact: true }).click();
      const sent = await pending;
      expect(sent.status(), 'Send must be confirmed; never blindly replay a message').toBe(201);
      expect(Boolean((await sent.json()).message), 'Confirmed message required').toBe(true);
      await openQualifiedMessages(recipient.page, '/messages?direct=' + encodeURIComponent(conversationId), true);
      await expect(recipient.page.locator('[data-thread-select]')).toHaveValue('direct:' + conversationId);
      await expect(recipient.page.locator('[data-message-list] .message-body').filter({ hasText: marker })).toHaveText(marker);
      await openQualifiedMessages(recipient.page, '/messages?direct=' + encodeURIComponent(conversationId), true);
      await expect(recipient.page.locator('[data-thread-select]')).toHaveValue('direct:' + conversationId);
      await expect(recipient.page.locator('[data-message-list] .message-body').filter({ hasText: marker })).toHaveText(marker);
      expect(await recipient.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      console.info('Exact synthetic recipient received marker and refresh confirmed persistence.');
    } finally {
      const errors = [];
      const [sender, recipient] = actors;
      try {
        if (sendAttempted && conversationId && sender && recipient) {
          const messages = await actorRequest(recipient.page, `/api/direct-conversations/${conversationId}/messages?limit=50`);
          expect(messages.status).toBe(200);
          const exact = messages.body.messages?.filter(message => message.body === marker) || [];
          expect(exact.length, 'Exactly one marker must be recovered before cleanup').toBe(1);
          const messageId = exact[0].message_id;
          console.info('Synthetic-only cleanup message ID=' + messageId);
          expect(exact[0].is_own, 'Recipient must not be the synthetic sender').toBe(false);
          const report = await actorRequest(recipient.page, '/api/chat-reports', 'POST', {
            messageType: 'direct', messageId, reason: 'other', details: 'Synthetic acceptance marker cleanup only',
          });
          expect(report.status, 'Report is sent once; unknown results must not be replayed').toBe(201);
          const reports = await actorRequest(sender.page, '/api/admin/chat-reports?limit=100');
          expect(reports.status).toBe(200);
          const exactReport = reports.body.reports?.filter(row => row.message_id === messageId && row.message_body === marker) || [];
          expect(exactReport.length, 'Only the exact marker report may be resolved').toBe(1);
          const removed = await actorRequest(sender.page, `/api/admin/chat-reports/${exactReport[0].report_id}/resolve`, 'POST', {
            resolution: 'resolved', note: 'Synthetic acceptance marker cleanup only', removeMessage: true,
          });
          expect(removed.status, 'Exact-marker moderation must be confirmed without replay').toBe(200);
          for (const actor of actors) {
            const after = await actorRequest(actor.page, `/api/direct-conversations/${conversationId}/messages?limit=50`);
            expect(after.status).toBe(200);
            expect(after.body.messages?.some(message => message.message_id === messageId || message.body === marker),
              'Soft-removed marker must disappear from both participant reads').toBe(false);
          }
          cleanupVerified = true;
          console.info('Only the exact synthetic marker was soft-removed; report/audit/conversation rows may remain.');
        }
      } catch (error) { errors.push(error); }
      for (const actor of actors) {
        try {
          if (actor.original) {
            await actor.page.goto('/profile');
            await save(actor.page, channels.find(channel => channel.key === 'direct'), actor.original.direct, actor.label);
            expect(await snapshot(actor.page), 'All original channel values restored').toEqual(actor.original);
            console.info('Synthetic direct-delivery actor original consent values restored and verified.');
          }
        } catch (error) { errors.push(error); }
        finally { await actor.context.close(); }
      }
      if (sendAttempted && !cleanupVerified) console.info('Exact synthetic marker cleanup remains unverified; no other message was touched.');
      if (errors.length) throw new AggregateError(errors, 'Synthetic delivery cleanup or preference restoration failed');
    }
  });
}

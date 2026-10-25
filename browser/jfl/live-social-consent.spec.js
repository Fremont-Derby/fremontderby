import { test, expect } from '@playwright/test';
import { assumePersona } from './persona.js';

// #3575: the trusted live-fixture job already supplies this opt-in and exact
// deployment SHA. Public PRs must never mutate hosted persona preferences.
test.skip(process.env.PLAYWRIGHT_LIVE_SEASON_READBACK !== '1',
  'Live persona preferences are exercised only by the trusted JFL fixture job.');
test.use({ trace: 'off', screenshot: 'off', video: 'off' });
// A failed shared-preference case must not let a later case capture leaked state as its baseline.
test.describe.configure({ mode: 'serial' });
// Pinned Playwright otherwise emits automatic failure-page ARIA snapshots even with traces/screenshots off.
process.env.PLAYWRIGHT_NO_COPY_PROMPT = '1';

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
    page.setDefaultTimeout(15_000);
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
      console.info('Synthetic consent baseline admin-captain: ' + JSON.stringify(original));
      for (const channel of channels) {
        const desired = { ...original, [channel.key]: !original[channel.key] };
        await save(page, channel, desired[channel.key]);
        expect(await snapshot(page)).toEqual(desired);
        await page.reload();
        await assumePersona(page, 'Admin Captain');
        await expect(page.locator('[data-test-persona-banner]')).toContainText('Admin Captain');
        expect(await snapshot(page)).toEqual(desired);
        await save(page, channel, original[channel.key]);
        expect(await snapshot(page)).toEqual(original);
      }
    } finally {
      try {
        if (original) {
          await assumePersona(page, 'Admin Captain');
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
      if (method === 'GET' && (!result.body || typeof result.body !== 'object')) throw new Error('Synthetic messaging response was not JSON; HTTP ' + result.status);
      return result;
    }
    const seconds = Number(result.retry);
    expect(Number.isFinite(seconds) && seconds > 0 && seconds <= 60, 'Qualified read Retry-After required').toBe(true);
    await page.waitForTimeout((seconds + 1) * 1000);
  }
  throw new Error('Synthetic messaging read remained throttled');
}

async function openQualifiedMessages(page, href, conversation = false) {
  const rejected = [], failures = [];
  const corePaths = new Set(['/messages', '/api/me/chat-threads', '/api/me/direct-message-inbox',
    '/api/me/league-chat-threads', '/api/me/direct-message-candidates']);
  const observe = response => {
    const path = new URL(response.url()).pathname;
    if (response.status() < 400) return;
    const method = response.request().method();
    if (path === '/messages' || path.startsWith('/api/')) failures.push(response);
    const read = method === 'GET' && (corePaths.has(path) || (path.startsWith('/api/direct-conversations/') || path.startsWith('/api/teams/')) && path.endsWith('/messages'));
    const readMarker = method === 'POST' && (path.startsWith('/api/direct-conversations/') || path.startsWith('/api/teams/')) && path.endsWith('/messages/read');
    if (read || readMarker) rejected.push(response);
  };
  page.on('response', observe);
  const ready = async () => {
    const control = page.locator(conversation ? '[data-message-input]' : '[data-new-message]');
    const status = await page.locator('[data-status]').textContent().catch(() => '');
    return /^(Messages ready|Messages loaded|No conversations yet)$/.test(status || '') && await control.count() > 0 && await control.isEnabled() && await page.locator('[data-chat-layout]').isVisible()
      && (conversation || await page.locator('[data-candidate-select] option[value=\"' + directFixture.season + '|' + directFixture.recipient + '\"]').count() === 1);
  };
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      rejected.length = 0; failures.length = 0;
      await page.goto(href);
      await expect.poll(async () => await ready() || rejected.length > 0
        || await page.locator('[data-page-state]').isVisible(), { timeout: 15_000 }).toBe(true);
      if (await ready()) return;
      if (!rejected.length) console.info('Messages failed-read classifications: ' + JSON.stringify(failures.map(response => ({ method: response.request().method(), path: new URL(response.url()).pathname, status: response.status(), hasRetryAfter: Boolean(response.headers()['retry-after']) }))));
      expect(rejected.length, 'A failed Messages load needs captured endpoint/status evidence before recovery').toBeGreaterThan(0);
      let wait = 0;
      for (const response of rejected) {
        const path = new URL(response.url()).pathname;
        const header = response.headers()['retry-after'];
        const numeric = header?.trim() ? Number(header) : NaN;
        const seconds = Number.isFinite(numeric) ? Math.ceil(numeric) : Math.ceil((Date.parse(header) - Date.now()) / 1000);
        console.info('Messages qualification ' + response.request().method() + ' ' + path + ': HTTP ' + response.status()
          + '; bounded Retry-After=' + (Number.isFinite(seconds) && seconds > 0 && seconds <= 60 ? seconds : 'unqualified'));
        expect(response.status(), 'Only observed429 on reads/read-markers permits explicit same-view recovery').toBe(429);
        expect(Number.isFinite(seconds) && seconds > 0 && seconds <= 60, 'Validated bounded Retry-After required; do not guess').toBe(true);
        wait = Math.max(wait, seconds);
      }
      expect(attempt, 'Messages read recovery exhausted; preserve the blocker').toBeLessThan(2);
      await page.waitForTimeout((wait + 1) * 1000);
      // Reopen the same authenticated read path. Never recreate a conversation or replay a send.
    }
  } finally { page.off('response', observe); }
}

async function openQualifiedTeamLink(page, href) {
  const rejected = [];
  const link = page.getByRole('link', { name: 'Team messages', exact: true }).and(page.locator('a[href="' + href + '"]'));
  const core = new Set(['/teams', '/api/me/teams', '/api/me/team-membership-requests', '/api/seasons']);
  const observe = response => {
    const path = new URL(response.url()).pathname;
    if (response.request().method() === 'GET' && response.status() >= 400
      && (core.has(path) || path.startsWith('/api/seasons/') && /\/(teams|team-registration\/me)$/.test(path))) rejected.push(response);
  };
  page.on('response', observe);
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      rejected.length = 0;
      await page.goto('/teams');
      const ready = async () => await link.count() === 1 && await link.isVisible()
        && await page.locator('[data-teams-content]').isVisible();
      await expect.poll(async () => await ready() || rejected.length > 0
        || await page.locator('[data-teams-status]').getAttribute('data-tone') === 'error').toBe(true);
      if (await ready()) { await link.click(); return; }
      console.info('Teams core read classifications: ' + JSON.stringify(rejected.map(response => ({
        path: new URL(response.url()).pathname.replace(/[a-f0-9-]{36}/g, ':id'), status: response.status(),
        hasRetryAfter: Boolean(response.headers()['retry-after']),
      }))));
      expect(rejected.length, 'Missing Team messages entry needs endpoint evidence, not a guessed retry').toBeGreaterThan(0);
      for (const response of rejected) expect(response.status(), 'Only captured core429 permits same-view read recovery').toBe(429);
      expect(attempt, 'Teams core read recovery exhausted').toBeLessThan(2);
      for (const response of rejected) await cooldown(page, response);
    }
  } finally { page.off('response', observe); }
}

async function removeSyntheticMarker({ sender, recipient, actors, marker, messageType, threadId }) {
  expect(['direct', 'team']).toContain(messageType);
  const messagesPath = (messageType === 'direct' ? '/api/direct-conversations/' : '/api/teams/') + threadId + '/messages?limit=50';
  const inboxPath = messageType === 'direct' ? '/api/me/direct-message-inbox' : '/api/me/chat-threads';
  const rowsKey = messageType === 'direct' ? 'conversations' : 'threads';
  const idKey = messageType === 'direct' ? 'conversation_id' : 'team_id';
  const messages = await actorRequest(recipient.page, messagesPath);
  expect(messages.status).toBe(200);
  const exact = messages.body.messages?.filter(message => message.body === marker) || [];
  expect(exact.length, 'Exactly one marker must be recovered before cleanup').toBe(1);
  const messageId = exact[0].message_id;
  console.info('Synthetic-only cleanup message ID=' + messageId);
  expect(exact[0].is_own, 'Recipient must not be the synthetic sender').toBe(false);
  const readReport = async () => {
    const response = await actorRequest(sender.page, '/api/admin/chat-reports?limit=100');
    expect(response.status).toBe(200);
    const matches = response.body.reports?.filter(row => row.message_id === messageId && row.message_body === marker) || [];
    expect(matches.length, 'Only one exact-marker report may be used').toBeLessThanOrEqual(1);
    return matches[0];
  };
  const waitRejectedCleanup = async response => {
    expect(response.status, 'Only a confirmed429 permits a new cleanup attempt after readback').toBe(429);
    const raw = response.retry?.trim();
    const numeric = raw ? Number(raw) : NaN;
    const seconds = Number.isFinite(numeric) ? Math.ceil(numeric) : Math.ceil((Date.parse(raw) - Date.now()) / 1000);
    expect(Number.isFinite(seconds) && seconds > 0 && seconds <= 60, 'Cleanup Retry-After must be qualified').toBe(true);
    console.info('Exact-marker cleanup rejected429; validated wait=' + seconds + 's before authoritative readback.');
    await recipient.page.waitForTimeout((seconds + 1) * 1000);
  };
  let report = await readReport();
  for (let attempt = 0; !report && attempt < 3; attempt++) {
    const result = await actorRequest(recipient.page, '/api/chat-reports', 'POST', {
      messageType, messageId, reason: 'other', details: 'Synthetic acceptance marker cleanup only',
    });
    if (result.status === 429) await waitRejectedCleanup(result);
    else expect(result.status, 'Unknown report outcomes must not be replayed').toBe(201);
    report = await readReport();
    if (result.status !== 429) expect(Boolean(report), 'A confirmed report must never be posted again').toBe(true);
  }
  expect(Boolean(report), 'Exact marker report must be confirmed before removal').toBe(true);
  let removed = false;
  for (let attempt = 0; attempt < 3; attempt++) {
    const result = await actorRequest(sender.page, `/api/admin/chat-reports/${report.report_id}/resolve`, 'POST', {
      resolution: 'resolved', note: 'Synthetic acceptance marker cleanup only', removeMessage: true,
    });
    if (result.status !== 429) {
      expect(result.status, 'Unknown moderation outcomes must not be replayed').toBe(200);
      removed = true; break;
    }
    await waitRejectedCleanup(result);
    const readback = await actorRequest(recipient.page, messagesPath);
    expect(readback.status).toBe(200);
    if (!readback.body.messages?.some(row => row.message_id === messageId)) { removed = true; break; }
    const reportReadback = await readReport();
    expect(Boolean(reportReadback) && reportReadback.status !== 'resolved', 'Ambiguous moderation must not be replayed').toBe(true);
  }
  expect(removed, 'Exact-marker moderation must be confirmed').toBe(true);
  for (const actor of actors) {
    const after = await actorRequest(actor.page, messagesPath);
    expect(after.status).toBe(200);
    expect(after.body.messages?.some(message => message.message_id === messageId || message.body === marker),
      'Soft-removed marker must disappear from both participant reads').toBe(false);
    const inbox = await actorRequest(actor.page, inboxPath);
    expect(inbox.status).toBe(200);
    expect(Array.isArray(inbox.body[rowsKey])).toBe(true);
    expect(inbox.body[rowsKey].some(row => row[idKey] === threadId && row.last_message_body === marker),
      'Soft-removed marker must not survive in inbox previews').toBe(false);
  }
  console.info('Only the exact synthetic marker was soft-removed; report/audit/conversation rows may remain.');
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
        console.info('Synthetic consent baseline ' + key + ': ' + JSON.stringify(actor.original));
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
      if (device === 'phone') await sender.page.getByRole('button', { name: /^Message a player/ }).click();
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
          await removeSyntheticMarker({ sender, recipient, actors, marker, messageType: 'direct', threadId: conversationId });
          cleanupVerified = true;
        }
      } catch (error) { errors.push(error); }
      for (const actor of actors) {
        try {
          if (actor.original) {
            await assumePersona(actor.page, actor.label);
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

// #3588: source design is qualified locally only after the preceding trusted
// fixture run finishes. The reset guards QA purpose; this additionally verifies
// the complete team audience before touching a preference or sending a marker.
const teamFixture = {
  id: '18580000-1100-4000-8000-000000000001',
  name: 'Persona Test Team A',
  recipient: '18580000-2000-4000-8000-000000000004',
  roster: ['18580000-2000-4000-8000-000000000002', '18580000-2000-4000-8000-000000000004',
    '18580000-2000-4000-8000-000000000006'],
};

for (const [device, viewport] of [['desktop', { width: 1280, height: 900 }], ['phone', { width: 320, height: 844 }]]) {
  test(`live synthetic team message persists and exact marker is removed (${device})`, async ({ browser, request }) => {
    test.setTimeout(600_000);
    const sha = process.env.PLAYWRIGHT_EXPECTED_SHA || '';
    expect(sha).toMatch(/^[a-f0-9]{40}$/);
    expect(process.env.PLAYWRIGHT_FIXTURE_DATE).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(await (await request.get('/health/environment')).json()).toMatchObject({
      ok: true, environment: 'jfl', expectedSupabaseSchema: 'jfl', versionTag: sha,
    });
    const actors = [];
    const markerId = crypto.randomUUID();
    const marker = 'JFL synthetic team delivery acceptance ' + markerId;
    let sendAttempted = false, cleanupVerified = false;
    let allowedSends = 0, deniedSends = 0;
    const href = '/messages?team=' + teamFixture.id;
    try {
      for (const [label, key, player] of [
        ['Admin Captain', 'admin-captain', directFixture.sender],
        ['Player A', 'player-a', teamFixture.recipient],
      ]) {
        const context = await browser.newContext({ viewport, isMobile: device === 'phone', hasTouch: device === 'phone' });
        // Pass real requests/responses unchanged, but block any accidental send
        // outside this exact private QA team/marker or any duplicate/replay.
        await context.route('**/api/**', async route => {
          const request = route.request();
          const path = new URL(request.url()).pathname;
          if (request.method() === 'POST' && path.endsWith('/messages')) {
            let body;
            try { body = request.postDataJSON(); } catch { /* Fail closed below. */ }
            if (player !== directFixture.sender || path !== '/api/teams/' + teamFixture.id + '/messages'
              || body?.body !== marker || allowedSends !== 0) {
              deniedSends++;
              await route.abort();
              return;
            }
            allowedSends++;
          }
          await route.continue();
        });
        const page = await context.newPage();
        page.setDefaultTimeout(15_000);
        const actor = { context, page, label, player };
        actors.push(actor);
        readThrottles.set(page, new Map());
        page.on('response', response => {
          const path = new URL(response.url()).pathname;
          if (response.request().method() !== 'GET' || !channels.some(channel => channel.path === path)) return;
          if (response.status() >= 400) readThrottles.get(page).set(path, response);
          else readThrottles.get(page).delete(path);
        });
        await assumePersona(page, label);
        const identity = await actorRequest(page, '/api/test-persona');
        expect(identity.status).toBe(200);
        expect(identity.body.environment === 'jfl' && identity.body.current?.key === key, 'Exact synthetic team actor required').toBe(true);
        const profile = await actorRequest(page, '/api/me/profile');
        expect(profile.status).toBe(200);
        expect(profile.body.profile?.id === player, 'Exact fixed QA player required').toBe(true);
        actor.original = await snapshot(page);
        console.info('Synthetic team consent baseline ' + key + ': ' + JSON.stringify(actor.original));
      }
      const [sender, recipient] = actors;
      const management = await actorRequest(sender.page, '/api/me/teams');
      expect(management.status).toBe(200);
      const teams = management.body.teamManagement?.captain_teams?.filter(row => row.teamId === teamFixture.id) || [];
      expect(teams.length, 'One exact synthetic team required').toBe(1);
      expect(teams[0].seasonId === directFixture.season && teams[0].seasonName === 'QA Persona Lab'
        && teams[0].teamName === teamFixture.name, 'Exact isolated QA team/season contract required').toBe(true);
      expect(teams[0].roster?.map(row => row.playerId).sort(), 'Only the three fixed synthetic players may receive this team marker').toEqual(teamFixture.roster);
      expect(teams[0].roster.find(row => row.playerId === directFixture.sender)?.role).toBe('captain');
      const fixtureRound = teams[0].lineupRounds?.find(row => row.roundId === '18580000-1200-4000-8000-000000000001');
      expect(fixtureRound?.scheduledOn, 'Current fixture date must match the successful trusted reset').toBe(process.env.PLAYWRIGHT_FIXTURE_DATE);
      console.info('Exact QA team and complete synthetic-only three-player audience qualified.');
      const teamChannel = channels.find(channel => channel.key === 'team');
      for (const actor of actors) {
        await save(actor.page, teamChannel, true, actor.label);
        expect(await snapshot(actor.page)).toEqual({ ...actor.original, team: true });
      }
      // Use the canonical Teams page's existing link, preserving QA fixture
      // hiding in the ordinary Messages inbox rather than exposing test rooms.
      await openQualifiedTeamLink(sender.page, href);
      await expect(sender.page).toHaveURL(new RegExp('/messages\\?team=' + teamFixture.id + '$'));
      await openQualifiedMessages(sender.page, href, true);
      await expect(sender.page).toHaveURL(new RegExp('/messages\\?team=' + teamFixture.id + '$'));
      await expect(sender.page.locator('[data-message-input]')).toBeEnabled();
      await sender.page.locator('[data-message-input]').fill(marker);
      const sentResponse = sender.page.waitForResponse(response => new URL(response.url()).pathname === '/api/teams/' + teamFixture.id + '/messages'
        && response.request().method() === 'POST');
      console.info('Synthetic team delivery attempt marker=' + markerId + '; team=' + teamFixture.id);
      sendAttempted = true;
      await sender.page.locator('[data-composer]').getByRole('button', { name: 'Send', exact: true }).click();
      const sent = await sentResponse;
      expect(sent.status(), 'Team send must be confirmed without write replay').toBe(201);
      expect(Boolean((await sent.json()).message), 'Confirmed team message required').toBe(true);
      expect(allowedSends).toBe(1);
      expect(deniedSends).toBe(0);
      for (let visit = 0; visit < 2; visit++) {
        await openQualifiedMessages(recipient.page, href, true);
        await expect(recipient.page).toHaveURL(new RegExp('/messages\\?team=' + teamFixture.id + '$'));
        await expect(recipient.page.locator('[data-message-list] .message-body').filter({ hasText: marker })).toHaveText(marker);
      }
      expect(await recipient.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      console.info('Exact same-team synthetic recipient received marker and refresh confirmed persistence.');
    } finally {
      const errors = [];
      if (sendAttempted && actors.length === 2) {
        try {
          await removeSyntheticMarker({ sender: actors[0], recipient: actors[1], actors, marker, messageType: 'team', threadId: teamFixture.id });
          cleanupVerified = true;
        } catch (error) { errors.push(error); }
      }
      for (const actor of actors) {
        try {
          if (actor.original) {
            await assumePersona(actor.page, actor.label);
            await save(actor.page, channels.find(channel => channel.key === 'team'), actor.original.team, actor.label);
            expect(await snapshot(actor.page), 'All original synthetic team actor channel values restored').toEqual(actor.original);
            console.info('Synthetic team-delivery actor original consent values restored and verified.');
          }
        } catch (error) { errors.push(error); }
        finally { await actor.context.close(); }
      }
      if (sendAttempted && !cleanupVerified) console.info('Exact synthetic team marker cleanup remains unverified; no other message was touched.');
      if (deniedSends) errors.push(new Error('An out-of-scope or duplicate message send was blocked before network delivery'));
      if (errors.length) throw new AggregateError(errors, 'Synthetic team delivery cleanup or consent restoration failed');
    }
  });
}

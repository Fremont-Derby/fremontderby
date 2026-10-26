import { test, expect } from '@playwright/test';
import { renderJflNotificationsPage } from '../../src/jflNotificationsPage.js';

test.setTimeout(60_000);
const source = ['1', 'bundled'].includes(process.env.PLAYWRIGHT_NOTICES_SOURCE);
const origin = source ? 'https://session.notices.test' : process.env.PLAYWRIGHT_BASE_URL || 'https://jfl.fremontderby.com';

async function open(browser, request, mobile, holdInitial = false) {
  if (!source) {
    expect(process.env.PLAYWRIGHT_EXPECTED_SHA).toMatch(/^[a-f0-9]{40}$/);
    expect(await (await request.get('/health/environment')).json()).toMatchObject({
      ok: true, environment: 'jfl', expectedSupabaseSchema: 'jfl', versionTag: process.env.PLAYWRIGHT_EXPECTED_SHA,
    });
  }
  const context = await browser.newContext({ baseURL: origin, viewport: mobile ? { width: 320, height: 844 } : { width: 1280, height: 900 } });
  await context.addInitScript(() => {
    if (window !== window.top) return;
    sessionStorage.setItem('fd.accessToken', 'synthetic-A');
    const fetchOriginal = window.fetch;
    window.fetch = async (...args) => {
      const response = await fetchOriginal(...args);
      if (window.holdBody && String(args[0]) === '/api/me/notifications') {
        window.holdBody = false;
        const json = response.json.bind(response);
        response.json = async () => {
          const body = await json(); window.bodyHeld = true;
          await new Promise(resolve => { window.releaseBody = resolve; });
          return body;
        };
      }
      return response;
    };
  });
  const reads = [], writes = [], state = { A: null, B: null };
  let hold = holdInitial;
  const items = actor => ({ notifications: [{ id: 'notice-' + actor, title: actor + ' synthetic private notice',
    body: actor + ' synthetic private details', href: '/schedule?season=synthetic-' + actor,
    createdAt: '2026-10-25T12:00:00Z', readAt: state[actor] }] });
  await context.route('**/api/**', async route => {
    const req = route.request(), path = new URL(req.url()).pathname;
    if (!path.startsWith('/api/me/notifications')) return route.fulfill({ status: 404, json: {} });
    const actor = req.headers().authorization === 'Bearer synthetic-A' ? 'A' : 'B';
    const respond = (body = items(actor), status = 200) => route.fulfill({ status, json: body });
    if (req.method() === 'GET') {
      reads.push({ actor, respond });
      if (hold) { hold = false; return; }
      return respond();
    }
    expect(req.method()).toBe('POST');
    writes.push({ actor, path, respond: async (status = 200) => {
      const readAt = '2026-10-25T13:00:00Z';
      if (status === 200) state[actor] = readAt;
      await respond(path.endsWith('/read-all') ? { updated: 1 } : { notification: { id: 'notice-' + actor, readAt } }, status);
    } });
  });
  const page = await context.newPage();
  if (source) await page.route(origin + '/notifications', async route => {
    let html;
    if (process.env.PLAYWRIGHT_NOTICES_SOURCE === 'bundled') {
      const { default: worker } = await import('../../dist/routerEntry.js');
      html = await (await worker.fetch(new Request(route.request().url()), { ENVIRONMENT: 'jfl' }, {})).text();
    } else html = renderJflNotificationsPage();
    await route.fulfill({ contentType: 'text/html', body: html });
  });
  await page.goto('/notifications');
  const change = (actor, event = 'fd:session-changed') => page.evaluate(({ actor, event }) => {
    if (actor) sessionStorage.setItem('fd.accessToken', 'synthetic-' + actor);
    else sessionStorage.removeItem('fd.accessToken');
    window.dispatchEvent(new Event(event));
  }, { actor, event });
  const card = actor => page.locator('.notice-card').filter({ hasText: actor + ' synthetic private notice' });
  const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  if (holdInitial) await expect.poll(() => reads.length).toBe(1);
  else await expect(card('A')).toBeVisible();
  return { page, context, reads, writes, change, card, settle, hold: () => { hold = true; } };
}

for (const mobile of [false, true]) {
  const device = mobile ? 'phone320' : 'desktop';
  for (const event of ['fd:session-changed', 'storage', 'focus']) test(`Notices ${event} clears old cards and links before new read (${device})`, async ({ browser, request }) => {
    const f = await open(browser, request, mobile);
    try {
      f.hold(); await f.change('B', event);
      await expect(f.page.locator('[data-list]')).toBeEmpty();
      await expect(f.page.locator('[data-mark-all]')).toBeDisabled();
      await expect(f.page.locator('[data-reload-notices]')).toBeDisabled();
      await expect.poll(() => f.reads.length).toBe(2);
      await f.reads[1].respond(); await expect(f.card('B')).toBeVisible();
      await expect(f.card('A')).toBeHidden(); expect(f.writes).toHaveLength(0);
    } finally { await f.context.close(); }
  });

  for (const all of [false, true]) test(`Notices eventless ${all ? 'all' : 'individual'} mark cannot use an older view (${device})`, async ({ browser, request }) => {
    const f = await open(browser, request, mobile);
    try {
      f.hold(); await f.page.evaluate(() => sessionStorage.setItem('fd.accessToken', 'synthetic-B'));
      await f.page.getByRole('button', { name: all ? 'Mark all read' : 'Mark read', exact: true }).click();
      await expect.poll(() => f.reads.length).toBe(2);
      expect(f.writes).toHaveLength(0);
      await expect(f.page.locator('[data-list]')).toBeEmpty();
      await f.reads[1].respond(); await expect(f.card('B')).toBeVisible();
    } finally { await f.context.close(); }
  });

  for (const status of [200, 401]) test(`Notices stale list HTTP${status} cannot unlock a newer pending read (${device})`, async ({ browser, request }) => {
    const f = await open(browser, request, mobile, true);
    try {
      f.hold(); await f.change('B'); await expect.poll(() => f.reads.length).toBe(2);
      await f.reads[0].respond(undefined, status); await f.settle();
      await expect(f.page.locator('[data-list]')).toBeEmpty();
      await expect(f.page.locator('[data-reload-notices]')).toBeDisabled();
      await f.reads[1].respond(); await expect(f.card('B')).toBeVisible();
      await expect(f.page.locator('[data-status]')).toHaveText('1 unread notice');
    } finally { await f.context.close(); }
  });

  test(`Notices A-B-A keeps the first A response outside the current view (${device})`, async ({ browser, request }) => {
    const f = await open(browser, request, mobile, true);
    try {
      await f.change('B'); await expect(f.card('B')).toBeVisible();
      f.hold(); await f.change('A'); await expect.poll(() => f.reads.length).toBe(3);
      await f.reads[0].respond(); await f.settle();
      await expect(f.page.locator('[data-list]')).toBeEmpty();
      await expect(f.page.locator('[data-reload-notices]')).toBeDisabled();
      await f.reads[2].respond(); await expect(f.card('A')).toBeVisible();
    } finally { await f.context.close(); }
  });

  test(`Notices delayed JSON body cannot replace the new session (${device})`, async ({ browser, request }) => {
    const f = await open(browser, request, mobile);
    try {
      await f.page.evaluate(() => { window.holdBody = true; });
      await f.page.locator('[data-reload-notices]').click();
      await expect.poll(() => f.page.evaluate(() => window.bodyHeld)).toBe(true);
      await f.change('B'); await expect(f.card('B')).toBeVisible();
      await f.page.evaluate(() => window.releaseBody()); await f.settle();
      await expect(f.card('B')).toBeVisible(); await expect(f.card('A')).toBeHidden();
    } finally { await f.context.close(); }
  });

  for (const status of [200, 401]) test(`Notices stale mark HTTP${status} cannot claim a save or refresh the new view (${device})`, async ({ browser, request }) => {
    const f = await open(browser, request, mobile);
    try {
      await f.page.getByRole('button', { name: 'Mark read', exact: true }).click();
      await expect.poll(() => f.writes.length).toBe(1);
      await f.change('B'); await expect(f.card('B')).toBeVisible();
      await f.writes[0].respond(status); await f.settle();
      await expect(f.card('B')).toBeVisible(); await expect(f.card('A')).toBeHidden();
      await expect(f.page.locator('[data-status]')).toHaveText('1 unread notice');
      expect(f.reads).toHaveLength(2); expect(f.writes).toHaveLength(1);
    } finally { await f.context.close(); }
  });

  test(`Notices stale write finalizer cannot unlock current read actions (${device})`, async ({ browser, request }) => {
    const f = await open(browser, request, mobile);
    try {
      await f.page.getByRole('button', { name: 'Mark read', exact: true }).click();
      await expect.poll(() => f.writes.length).toBe(1);
      await f.change('B'); await expect(f.card('B')).toBeVisible();
      await f.page.locator('[data-mark-all]').click(); await expect.poll(() => f.writes.length).toBe(2);
      await f.writes[0].respond(); await f.settle();
      await expect(f.page.locator('[data-mark-all]')).toBeDisabled();
      await expect(f.page.locator('[data-reload-notices]')).toBeDisabled();
      await f.page.locator('[data-mark-all]').dispatchEvent('click'); expect(f.writes).toHaveLength(2);
      await f.writes[1].respond(); await expect(f.page.locator('[data-status]')).toHaveText('Up to date');
      expect(f.writes.map(row => row.actor)).toEqual(['A', 'B']);
    } finally { await f.context.close(); }
  });

  test(`Notices signout clears private content and rejects the old pending response (${device})`, async ({ browser, request }) => {
    const f = await open(browser, request, mobile);
    try {
      f.hold(); await f.page.locator('[data-reload-notices]').click();
      await expect.poll(() => f.reads.length).toBe(2);
      await f.change(''); await expect(f.page.getByRole('link', { name: 'Open Profile' })).toBeVisible();
      await f.page.route('**/synthetic-session-frame', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Synthetic frame</title>' }));
      await f.page.evaluate(() => new Promise(resolve => {
        const frame = document.createElement('iframe'); frame.onload = resolve;
        frame.src = '/synthetic-session-frame'; document.body.append(frame);
      }));
      expect(await f.page.evaluate(() => sessionStorage.getItem('fd.accessToken'))).toBeNull();
      await f.page.evaluate(() => window.dispatchEvent(new Event('focus')));
      await expect(f.page.getByRole('link', { name: 'Open Profile' })).toBeVisible();
      await f.reads[1].respond(); await f.settle();
      await expect(f.page.locator('.notice-card')).toHaveCount(0);
      await expect(f.page.locator('[data-mark-all]')).toBeDisabled();
      expect(f.reads).toHaveLength(2); expect(f.writes).toHaveLength(0);
    } finally { await f.context.close(); }
  });

  test(`Notices same-session events keep one pending read (${device})`, async ({ browser, request }) => {
    const f = await open(browser, request, mobile);
    try {
      f.hold(); await f.page.locator('[data-reload-notices]').click(); await expect.poll(() => f.reads.length).toBe(2);
      for (const event of ['focus', 'storage', 'fd:session-changed']) await f.change('A', event);
      await f.page.locator('[data-reload-notices]').dispatchEvent('click'); await f.settle();
      expect(f.reads).toHaveLength(2);
      await f.reads[1].respond(); await expect(f.card('A')).toBeVisible(); expect(f.writes).toHaveLength(0);
    } finally { await f.context.close(); }
  });
}

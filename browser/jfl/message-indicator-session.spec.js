import { test, expect } from '@playwright/test';
import { decorateHtmlWithShell } from '../../src/appShell.js';

const sourceMode = process.env.PLAYWRIGHT_INDICATOR_SOURCE === '1';
const summary = name => ({ unreadCount: 2, previews: [{ label: name, body: name + ' private preview', unreadCount: 2 }] });

async function openShell(browser, request, mobile) {
  if (!sourceMode) {
    expect(process.env.PLAYWRIGHT_EXPECTED_SHA).toMatch(/^[a-f0-9]{40}$/);
    expect(await (await request.get('/health/environment')).json()).toMatchObject({
      ok: true, environment: 'jfl', expectedSupabaseSchema: 'jfl', versionTag: process.env.PLAYWRIGHT_EXPECTED_SHA,
    });
  }
  const context = await browser.newContext({ baseURL: sourceMode ? 'https://indicator.test' :
    process.env.PLAYWRIGHT_BASE_URL || 'https://jfl.fremontderby.com',
  viewport: { width: mobile ? 320 : 1280, height: 900 }, isMobile: mobile, hasTouch: mobile });
  await context.addInitScript(() => {
    sessionStorage.setItem('fd.accessToken', 'synthetic-A');
    window.__heldSummaryBodies = [];
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (String(args[0]).includes('/api/me/message-notification-summary')) {
        const json = response.json.bind(response);
        response.json = async () => {
          const body = await json();
          if (window.__holdSummaryBody) await new Promise(resolve => window.__heldSummaryBodies.push(resolve));
          return body;
        };
      }
      return response;
    };
  });
  const page = await context.newPage();
  await page.clock.install();
  const held = [];
  // All API calls are intercepted; fake sessions and previews never reach a server.
  await context.route('**/api/**', route => {
    if (new URL(route.request().url()).pathname === '/api/me/message-notification-summary') {
      held.push(route);
      return;
    }
    return route.fulfill({ contentType: 'application/json', body: '{}' });
  });
  if (sourceMode) {
    const html = decorateHtmlWithShell('<!doctype html><html><head><title>Shell test</title></head><body><main>Shell</main></body></html>', '/rules');
    await page.route('https://indicator.test/rules', route => route.fulfill({ contentType: 'text/html', body: html }));
  }
  await page.goto('/rules');
  await expect.poll(() => held.length).toBe(1);
  const change = (value, event = 'focus') => page.evaluate(({ value, event }) => {
    if (value) sessionStorage.setItem('fd.accessToken', value);
    else sessionStorage.removeItem('fd.accessToken');
    window.dispatchEvent(new Event(event));
  }, { value, event });
  const finish = async (index, name, status = 200) => {
    const response = page.waitForResponse(r => r.url() === held[index].request().url() && r.status() === status);
    await held[index].fulfill({ status, contentType: 'application/json', body: JSON.stringify(summary(name)) });
    await (await response).finished();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  };
  return { context, page, held, change, finish, previews: page.locator('[data-message-preview-list]') };
}

for (const mobile of [false, true]) {
  const device = mobile ? '320px phone' : 'desktop';
  test(`response notices an unannounced token change before rendering (${device})`, async ({ browser, request }) => {
    const f = await openShell(browser, request, mobile);
    try {
      await f.page.evaluate(() => sessionStorage.setItem('fd.accessToken', 'synthetic-B'));
      await f.finish(0, 'A');
      await expect(f.previews).not.toContainText('A private preview');
    } finally { await f.context.close(); }
  });

  test(`old held response cannot populate a new session (${device})`, async ({ browser, request }) => {
    const f = await openShell(browser, request, mobile);
    try {
      await f.change('synthetic-B');
      await expect.poll(() => f.held.length).toBe(2);
      expect(f.held[1].request().headers().authorization).toBe('Bearer synthetic-B');
      await f.finish(1, 'B');
      await expect(f.previews).toContainText('B private preview');
      await f.finish(0, 'A');
      await expect(f.previews).toContainText('B private preview');
      await expect(f.previews).not.toContainText('A private preview');
    } finally { await f.context.close(); }
  });

  test(`session is rechecked after delayed JSON parsing (${device})`, async ({ browser, request }) => {
    const f = await openShell(browser, request, mobile);
    try {
      await f.page.evaluate(() => { window.__holdSummaryBody = true; });
      await f.finish(0, 'A');
      await expect.poll(() => f.page.evaluate(() => window.__heldSummaryBodies.length)).toBe(1);
      await f.change('synthetic-B');
      await expect.poll(() => f.held.length).toBe(2);
      await f.page.evaluate(() => { window.__holdSummaryBody = false; });
      await f.finish(1, 'B');
      await expect(f.previews).toContainText('B private preview');
      await f.page.evaluate(() => window.__heldSummaryBodies.shift()());
      await f.page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await expect(f.previews).toContainText('B private preview');
      await expect(f.previews).not.toContainText('A private preview');
    } finally { await f.context.close(); }
  });

  test(`rapid A to B to A cannot revive the first A request (${device})`, async ({ browser, request }) => {
    const f = await openShell(browser, request, mobile);
    try {
      await f.change('synthetic-B');
      await expect.poll(() => f.held.length).toBe(2);
      await f.change('synthetic-A');
      await expect.poll(() => f.held.length).toBe(3);
      await f.finish(2, 'Current A');
      await f.finish(0, 'Expired A');
      await f.finish(1, 'B');
      await expect(f.previews).toContainText('Current A private preview');
      await expect(f.previews).not.toContainText('Expired A private preview');
    } finally { await f.context.close(); }
  });

  test(`session event clears rendered previews and closes popover before new read (${device})`, async ({ browser, request }) => {
    const f = await openShell(browser, request, mobile);
    try {
      await f.finish(0, 'A');
      await expect(f.previews).toContainText('A private preview');
      await f.page.locator('[data-message-notifications]').dispatchEvent('mouseenter');
      await expect(f.page.locator('[data-message-indicator]')).toHaveAttribute('aria-expanded', 'true');
      await f.change('synthetic-B', 'fd:session-changed');
      await expect(f.previews).not.toContainText('A private preview');
      await expect(f.page.locator('[data-message-badge]')).toBeHidden();
      await expect(f.page.locator('[data-message-indicator]')).toHaveAttribute('aria-expanded', 'false');
      await expect.poll(() => f.held.length).toBe(2);
      await f.finish(1, 'B');
      await expect(f.previews).toContainText('B private preview');
    } finally { await f.context.close(); }
  });

  test(`signout rejects a pending success and clears private content (${device})`, async ({ browser, request }) => {
    const f = await openShell(browser, request, mobile);
    try {
      await f.change('');
      await f.finish(0, 'A');
      await expect(f.previews).not.toContainText('A private preview');
      await expect(f.page.locator('[data-message-notifications]')).toBeHidden();
    } finally { await f.context.close(); }
  });

  test(`stale 401 cannot clear newer previews (${device})`, async ({ browser, request }) => {
    const f = await openShell(browser, request, mobile);
    try {
      await f.change('synthetic-B', 'storage');
      await expect.poll(() => f.held.length).toBe(2);
      await f.finish(1, 'B');
      await expect(f.previews).toContainText('B private preview');
      await f.finish(0, 'A', 401);
      await expect(f.previews).toContainText('B private preview');
    } finally { await f.context.close(); }
  });

  test(`old finalizer cannot unlock new pending request; same-session focus stays single-flight (${device})`, async ({ browser, request }) => {
    const f = await openShell(browser, request, mobile);
    try {
      await f.change('synthetic-B');
      await expect.poll(() => f.held.length).toBe(2);
      await f.finish(0, 'A');
      for (let i = 0; i < 3; i++) await f.change('synthetic-B');
      await f.page.clock.runFor(1_000);
      expect(f.held.length).toBe(2);
      await f.finish(1, 'B');
      await expect(f.previews).toContainText('B private preview');
      await f.change('synthetic-B');
      await expect.poll(() => f.held.length).toBe(3);
      await f.finish(2, 'B', 503);
      await expect(f.previews).toContainText('B private preview');
      await f.change('synthetic-B');
      await expect.poll(() => f.held.length).toBe(4);
      await f.finish(3, 'B recovered');
      await expect(f.previews).toContainText('B recovered private preview');
    } finally { await f.context.close(); }
  });
}

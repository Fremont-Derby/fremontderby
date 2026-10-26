import { test, expect } from '@playwright/test';
import { renderSeasonSetupPage } from '../../src/seasonSetupPage.js';
import { enhanceSeasonPublishReadiness } from '../../src/seasonPublishReadinessEnhancer.js';
import { enhanceSeasonClose } from '../../src/seasonCloseEnhancer.js';

// Every request is intercepted. These are synthetic sessions, never fixture writes.
const paths = { setup: '/api/admin/seasons', publish: '/api/admin/seasons/synthetic-season/team-candidates', close: '/api/admin/seasons/synthetic-season/close-readiness', save: '/api/admin/seasons/synthetic-season/setup' };
const states = { setup: '[data-status]', publish: '[data-publish-readiness-state]', close: '[data-season-close-state]' };
let targetHtml;
test.beforeAll(async ({ request }) => {
  if (process.env.PLAYWRIGHT_OPERATOR_HTML === 'deployed') {
    expect(process.env.PLAYWRIGHT_EXPECTED_SHA).toMatch(/^[a-f0-9]{40}$/);
    const health = await request.get('/health/environment');
    expect(health.ok()).toBe(true);
    expect(await health.json()).toMatchObject({ environment: 'jfl', expectedSupabaseSchema: 'jfl', ok: true, versionTag: process.env.PLAYWRIGHT_EXPECTED_SHA });
    const response = await request.get('/season-setup');
    expect(response.ok()).toBe(true);
    targetHtml = await response.text();
  } else if (process.env.PLAYWRIGHT_OPERATOR_HTML === 'built') {
    const { default: worker } = await import('../../dist/routerEntry.js');
    const response = await worker.fetch(new Request('https://jfl.fremontderby.com/season-setup'), { ENVIRONMENT: 'jfl' }, { waitUntil() {} });
    expect(response.ok).toBe(true);
    targetHtml = await response.text();
  }
  if (targetHtml) expect(targetHtml).toContain('data-season-setup-form');
});

async function open(browser, target, mobile, delayedBody) {
  const context = await browser.newContext({ viewport: { width: mobile ? 320 : 1280, height: 900 } });
  await context.addInitScript(({ target, delayedBody }) => {
    if (window !== window.top) return;
    sessionStorage.setItem('fd.accessToken', 'synthetic-old');
    if (!delayedBody) return;
    const original = window.fetch;
    window.fetch = async (...args) => {
      const response = await original(...args);
      if (String(args[0]) === target && (target !== '/api/admin/seasons/synthetic-season/setup' || args[1]?.method === 'PUT')) {
        const read = response.text.bind(response);
        response.text = async () => {
          const text = await read(); window.operatorBodyHeld = true;
          await new Promise(resolve => { window.releaseOperatorBody = resolve; });
          return text;
        };
      }
      return response;
    };
  }, { target: paths[target], delayedBody });
  let response = new Response(renderSeasonSetupPage({ allowCreate: true }), { headers: { 'content-type': 'text/html' } });
  response = await enhanceSeasonClose(await enhanceSeasonPublishReadiness(response));
  const html = targetHtml || await response.text();
  let held;
  const writes = [];
  await context.route('**/*', async route => {
    const request = route.request(), path = new URL(request.url()).pathname;
    if (path === '/season-setup') return route.fulfill({ contentType: 'text/html', body: html });
    if (request.method() !== 'GET') {
      writes.push(path);
      if (target === 'save' && path === paths.save && request.method() === 'PUT') { held = route; return; }
      return route.fulfill({ status: 403, json: {} });
    }
    if (target !== 'save' && path === paths[target]) { held = route; return; }
    let body = {};
    if (path === '/api/admin/seasons') body = { seasons: [{ id: 'synthetic-season', name: 'Synthetic season', status: 'registration' }] };
    else if (path.endsWith('/setup')) body = { setup: { id: 'synthetic-season', name: 'Synthetic season', status: 'registration', first_round_date: '2026-11-02', round_interval_days: 7, default_table_numbers: [1, 2, 3, 4], rounds: [] } };
    else if (path.endsWith('/team-registration')) body = { registration: {} };
    else if (path.endsWith('/team-candidates')) body = { registration: {}, teams: [] };
    else if (path.endsWith('/close-readiness')) body = { readiness: { reason: 'Synthetic current readiness' } };
    return route.fulfill({ json: body });
  });
  const page = await context.newPage();
  await page.goto('https://operator.test/season-setup');
  if (target === 'save') { await expect(page.locator('[data-save]')).toBeEnabled(); await page.locator('[data-save]').click(); }
  await expect.poll(() => Boolean(held)).toBe(true);
  return { page, context, writes, respond: status => held.fulfill({ status, json: status === 200 ? { seasons: [{ id: 'stale-season', name: 'Prior private season', status: 'registration' }], setup: { id: 'synthetic-season', name: 'Prior private season', status: 'registration' }, reason: 'Prior private readiness' } : { error: 'Prior session denied' } }) };
}

for (const mobile of [false, true]) for (const target of ['setup', 'publish', 'close']) {
  for (const delayedBody of [false, true]) for (const status of [200, 401]) {
    test(`${target} stale ${status} ${delayedBody ? 'body' : 'fetch'} preserves replacement session (${mobile ? 'phone320' : 'desktop'})`, async ({ browser }) => {
      const f = await open(browser, target, mobile, delayedBody);
      try {
        if (delayedBody) {
          await f.respond(status);
          await expect.poll(() => f.page.evaluate(() => Boolean(window.operatorBodyHeld))).toBe(true);
        }
        await f.page.evaluate(() => { sessionStorage.setItem('fd.accessToken', 'synthetic-new'); window.dispatchEvent(new Event('fd:session-changed')); });
        if (delayedBody) await f.page.evaluate(() => window.releaseOperatorBody());
        else await f.respond(status);
        await expect(f.page.locator(states[target])).toContainText('sign-in changed');
        expect(await f.page.evaluate(() => sessionStorage.getItem('fd.accessToken'))).toBe('synthetic-new');
        await expect(f.page.locator('body')).not.toContainText('Prior private');
        expect(f.writes).toEqual([]);
      } finally { await f.context.close(); }
    });
  }
  test(`${target} current 401 still expires current session (${mobile ? 'phone320' : 'desktop'})`, async ({ browser }) => {
    const f = await open(browser, target, mobile, false);
    try {
      await f.respond(401);
      await expect.poll(() => f.page.evaluate(() => sessionStorage.getItem('fd.accessToken'))).toBeNull();
      expect(f.writes).toEqual([]);
    } finally { await f.context.close(); }
  });
}

for (const mobile of [false, true]) test(`old save success cannot continue registration under replacement session (${mobile ? 'phone320' : 'desktop'})`, async ({ browser }) => {
  const f = await open(browser, 'save', mobile, true);
  try {
    await f.respond(200);
    await expect.poll(() => f.page.evaluate(() => Boolean(window.operatorBodyHeld))).toBe(true);
    await f.page.evaluate(() => { sessionStorage.setItem('fd.accessToken', 'synthetic-new'); window.releaseOperatorBody(); });
    await expect(f.page.locator('[data-status]')).toContainText('sign-in changed');
    expect(await f.page.evaluate(() => sessionStorage.getItem('fd.accessToken'))).toBe('synthetic-new');
    expect(f.writes).toEqual([paths.save]);
  } finally { await f.context.close(); }
});

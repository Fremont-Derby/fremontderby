import { test, expect } from '@playwright/test';
import { renderJflProvisionalSeedPage } from '../../src/jflProvisionalSeedPage.js';
const sourceMode = process.env.PLAYWRIGHT_SEED_SOURCE === '1';
const a = '10000000-0000-4000-8000-000000000001';
const b = '10000000-0000-4000-8000-000000000002';
const eventId = '10000000-0000-4000-8000-000000000003';
const legacy = { playerId: a, ratingValue: 500, ratingStatus: 'provisional', source: 'unverified_legacy' };
const confirmed = { ...legacy, ratingValue: 501, source: 'admin_provisional', eventId, reason: 'Synthetic QA comparison; no actual player seed write.', effectiveAt: '2026-10-06T05:00:00Z' };
async function open(browser, request, mobile, options = {}) {
  if (!sourceMode) {
    expect(process.env.PLAYWRIGHT_EXPECTED_SHA).toMatch(/^[a-f0-9]{40}$/);
    const health = await request.get('https://jfl.fremontderby.com/health/environment');
    expect(health.ok()).toBeTruthy();
    expect(await health.json()).toMatchObject({ environment: 'jfl', expectedSupabaseSchema: 'jfl', ok: true, versionTag: process.env.PLAYWRIGHT_EXPECTED_SHA });
  }
  const context = await browser.newContext({ baseURL: sourceMode ? 'https://seed.test' : 'https://jfl.fremontderby.com', viewport: mobile ? { width: 320, height: 844 } : { width: 1280, height: 900 } });
  if (!options.signedOut) await context.addInitScript(() => { if (window === window.top) sessionStorage.setItem('fd.accessToken', 'synthetic-intercept-only'); });
  const page = await context.newPage(); const writes = []; const reads = [];
  let seed = options.seed ?? legacy; let readStatus = options.readStatus ?? 200;
  await context.route('**/api/**', async route => {
    const req = route.request(); const path = new URL(req.url()).pathname;
    if (req.method() === 'POST') { writes.push({ path, body: req.postDataJSON(), route }); return; }
    reads.push(path);
    let body;
    if (path === '/api/admin/players') body = { players: [{ playerId: a, displayName: 'Synthetic Alpha' }, { playerId: b, displayName: 'Synthetic Beta' }] };
    else if (path.endsWith('/provisional-seed')) return route.fulfill({ status: readStatus, contentType: 'application/json', body: JSON.stringify(readStatus === 200 ? { seed } : { error: 'Synthetic access denied' }) });
    else if (path === '/api/test-persona' || path === '/api/me/ready-checks') return route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
    else if (path === '/api/me/message-notification-summary') body = { unreadCount: 0, previews: [] };
    else throw new Error('Unexpected synthetic seed request ' + path);
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
  });
  if (sourceMode) await page.route('https://seed.test/admin/provisional-rating', route => route.fulfill({ contentType: 'text/html', body: renderJflProvisionalSeedPage() }));
  await page.goto('/admin/provisional-rating');
  if (!options.signedOut) {
    await expect(page.locator('[data-seed-player]')).toBeEnabled();
    await page.locator('[data-seed-player]').selectOption(a);
    await expect(page.locator('[data-seed-current]')).not.toContainText('Loading');
  }
  return { page, context, writes, reads, setRead: (next, status = 200) => { seed = next; readStatus = status; } };
}
async function fill(page) {
  await page.locator('[data-seed-value]').fill('501');
  await page.locator('[data-seed-reason]').fill('Synthetic QA comparison; no actual player seed write.');
}
for (const mobile of [false, true]) {
  const device = mobile ? '320px phone' : 'desktop';
  test(`explicit seed saves once with audit and locked controls (${device})`, async ({ browser, request }) => {
    const f = await open(browser, request, mobile);
    try {
      await expect(f.page.locator('[data-seed-current]')).toContainText('Legacy value; explicit source has not been confirmed');
      await expect(f.page.locator('[data-seed-value]')).toHaveValue('');
      expect(f.writes).toHaveLength(0);
      await fill(f.page); await f.page.locator('[data-seed-save]').click();
      await expect.poll(() => f.writes.length).toBe(1);
      for (const selector of ['[data-seed-player]', '[data-seed-value]', '[data-seed-reason]', '[data-seed-save]', '[data-seed-reload]']) await expect(f.page.locator(selector)).toBeDisabled();
      await f.page.locator('[data-seed-form]').dispatchEvent('submit');
      expect(f.writes).toHaveLength(1);
      expect(f.writes[0].path).toContain(a);
      expect(f.writes[0].body).toEqual({ ratingValue: 501, reason: 'Synthetic QA comparison; no actual player seed write.' });
      await f.writes[0].route.fulfill({ contentType: 'application/json', body: JSON.stringify({ seed: confirmed }) });
      await expect(f.page.locator('[data-seed-status]')).toContainText('saved with its reason and audit record');
      await expect(f.page.locator('[data-seed-current]')).toContainText('501 · Admin provisional');
      await expect(f.page.locator('[data-seed-evidence]')).toContainText(confirmed.reason);
      await expect(f.page.locator('[data-seed-reason]')).toHaveValue('');
      expect(f.writes).toHaveLength(1);
      if (mobile) expect(await f.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    } finally { await f.context.close(); }
  });
  test(`empty fractional out-of-range and unreasoned seeds cannot write (${device})`, async ({ browser, request }) => {
    const f = await open(browser, request, mobile);
    try {
      for (const [value, reason] of [['', 'Synthetic reason'], ['1.5', 'Synthetic reason'], ['-1', 'Synthetic reason'], ['1001', 'Synthetic reason'], ['500', '  '], ['500', 'x'.repeat(501)]]) {
        await f.page.evaluate(([value, reason]) => { document.querySelector('[data-seed-value]').value = value; document.querySelector('[data-seed-reason]').value = reason; }, [value, reason]);
        await f.page.locator('[data-seed-form]').dispatchEvent('submit');
        await expect(f.page.locator('[data-seed-status]')).toContainText('whole-number rating');
        expect(f.writes).toHaveLength(0);
      }
    } finally { await f.context.close(); }
  });
  for (const bad of [{ ...confirmed, playerId: b }, { ...confirmed, ratingValue: 502 }, { ...confirmed, eventId: null }, { ...confirmed, effectiveAt: 'invalid' }, { ...confirmed, source: 'official_fargo' }]) {
    test(`unconfirmed save ${JSON.stringify(bad)} requires explicit read recovery (${device})`, async ({ browser, request }) => {
      const f = await open(browser, request, mobile);
      try {
        await fill(f.page); await f.page.locator('[data-seed-save]').click();
        await expect.poll(() => f.writes.length).toBe(1);
        await f.writes[0].route.fulfill({ contentType: 'application/json', body: JSON.stringify({ seed: bad }) });
        await expect(f.page.locator('[data-seed-status]')).toContainText('Save could not be confirmed');
        await expect(f.page.locator('[data-seed-save]')).toBeDisabled();
        await f.page.locator('[data-seed-form]').dispatchEvent('submit'); expect(f.writes).toHaveLength(1);
        f.setRead(confirmed); await f.page.locator('[data-seed-reload]').click();
        await expect(f.page.locator('[data-seed-current]')).toContainText('501 · Admin provisional');
        await expect(f.page.locator('[data-seed-save]')).toBeEnabled(); expect(f.writes).toHaveLength(1);
      } finally { await f.context.close(); }
    });
  }
  test(`lost write and failed reread remain unconfirmed without replay (${device})`, async ({ browser, request }) => {
    const f = await open(browser, request, mobile);
    try {
      await fill(f.page); await f.page.locator('[data-seed-save]').click(); await expect.poll(() => f.writes.length).toBe(1);
      await f.writes[0].route.abort('failed');
      await expect(f.page.locator('[data-seed-current]')).toContainText('Save result unconfirmed');
      f.setRead(legacy, 503); await f.page.locator('[data-seed-reload]').click();
      await expect(f.page.locator('[data-seed-current]')).toHaveText('Current seed unavailable.');
      await expect(f.page.locator('[data-seed-save]')).toBeDisabled(); expect(f.writes).toHaveLength(1);
      f.setRead(confirmed); await f.page.locator('[data-seed-reload]').click(); await expect(f.page.locator('[data-seed-save]')).toBeEnabled();
      expect(f.writes).toHaveLength(1);
    } finally { await f.context.close(); }
  });
  for (const code of [401, 403, 429, 502]) test(`write failure ${code} never replays a provisional decision (${device})`, async ({ browser, request }) => {
    const f = await open(browser, request, mobile);
    try {
      await fill(f.page); await f.page.locator('[data-seed-save]').click(); await expect.poll(() => f.writes.length).toBe(1);
      await f.writes[0].route.fulfill({ status: code, contentType: code === 429 ? 'text/html' : 'application/json', headers: { 'retry-after': '10' }, body: code === 429 ? '<html>synthetic-private edge diagnostic</html>' : JSON.stringify({ error: 'Synthetic write denied' }) });
      await expect(f.page.locator('[data-seed-current]')).toContainText('Save result unconfirmed');
      await expect(f.page.locator('[data-seed-save]')).toBeDisabled();
      await f.page.locator('[data-seed-form]').dispatchEvent('submit'); expect(f.writes).toHaveLength(1);
      await expect(f.page.locator('[data-seed-status]')).not.toContainText('synthetic-private');
      if (code === 401) await expect(f.page.locator('[data-seed-signin]')).toBeVisible();
      else {
        f.setRead(legacy, 403); await f.page.locator('[data-seed-reload]').click();
        await expect(f.page.locator('[data-seed-save]')).toBeDisabled(); expect(f.writes).toHaveLength(1);
      }
    } finally { await f.context.close(); }
  });
  for (const code of [401, 403]) test(`read denial ${code} cannot enable provisional writes (${device})`, async ({ browser, request }) => {
    const f = await open(browser, request, mobile, { readStatus: code });
    try {
      await expect(f.page.locator('[data-seed-save]')).toBeDisabled(); expect(f.writes).toHaveLength(0);
      if (code === 401) {
        await expect(f.page.locator('[data-seed-signin]')).toBeVisible();
        expect(await f.page.evaluate(() => sessionStorage.getItem('fd.accessToken'))).toBeNull();
      }
    } finally { await f.context.close(); }
  });
  test(`established seed stays protected and malformed current seed closes editing (${device})`, async ({ browser, request }) => {
    const f = await open(browser, request, mobile, { seed: { ...legacy, ratingStatus: 'established' } });
    try {
      await expect(f.page.locator('[data-seed-status]')).toContainText('Established seed is protected');
      await expect(f.page.locator('[data-seed-save]')).toBeDisabled();
      f.setRead({ ...confirmed, eventId: null }); await f.page.locator('[data-seed-reload]').click();
      await expect(f.page.locator('[data-seed-status]')).toContainText('Current seed could not be confirmed');
      await expect(f.page.locator('[data-seed-save]')).toBeDisabled(); expect(f.writes).toHaveLength(0);
    } finally { await f.context.close(); }
  });
  test(`signed-out surface never invokes admin APIs (${device})`, async ({ browser, request }) => {
    const f = await open(browser, request, mobile, { signedOut: true });
    try {
      await expect(f.page.locator('[data-seed-signin]')).toBeVisible(); await expect(f.page.locator('[data-seed-save]')).toBeDisabled();
      expect(f.reads).toHaveLength(0); expect(f.writes).toHaveLength(0);
    } finally { await f.context.close(); }
  });
}

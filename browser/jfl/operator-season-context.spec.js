import { test, expect } from '@playwright/test';
import { renderSeasonSetupPage } from '../../src/seasonSetupPage.js';
import { decorateHtmlWithShell } from '../../src/appShell.js';
import { injectAdminSurfaceTheme } from '../../src/adminSurfaceTheme.js';
import { enhanceSeasonPublishReadiness } from '../../src/seasonPublishReadinessEnhancer.js';
import { enhanceSeasonClose } from '../../src/seasonCloseEnhancer.js';

const sourceMode = process.env.PLAYWRIGHT_OPERATOR_SOURCE === '1';
const seasons = [{ id: 'season-a', name: 'Synthetic Alpha', status: 'registration' },
  { id: 'season-b', name: 'Synthetic Beta', status: 'playoffs' }];
const setup = id => ({ ...seasons.find(row => row.id === id), first_round_date: '2026-10-11',
  default_table_numbers: [1, 2, 3, 4], round_interval_days: 7, teams: [], rounds: [] });
const registration = { teamCapacity: 8, counts: { confirmedTeams: 8 }, applications: [], slots: [] };
const candidates = { registration, teams: Array.from({ length: 8 }, (_, i) => ({
  slot_workflow_status: 'confirmed', captain_player_id: `synthetic-${i}`, captain_has_phone: true })) };

async function openOperator(browser, request, mobile) {
  if (!sourceMode) {
    expect(process.env.PLAYWRIGHT_EXPECTED_SHA).toMatch(/^[a-f0-9]{40}$/);
    const health = await request.get('/health/environment');
    expect(health.ok()).toBe(true);
    expect(await health.json()).toMatchObject({ environment: 'jfl', expectedSupabaseSchema: 'jfl',
      ok: true, versionTag: process.env.PLAYWRIGHT_EXPECTED_SHA });
  }
  const context = await browser.newContext({ baseURL: sourceMode ? 'https://operator.test' :
    process.env.PLAYWRIGHT_BASE_URL || 'https://jfl.fremontderby.com',
    viewport: mobile ? { width: 320, height: 844 } : { width: 1280, height: 900 },
    isMobile: mobile, hasTouch: mobile });
  await context.addInitScript(() => sessionStorage.setItem('fd.accessToken', 'synthetic-intercept-only'));
  const page = await context.newPage();
  const held = [];
  const writes = [];
  let hold = null;
  await context.route('**/api/**', async route => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    const respond = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (req.method() !== 'GET') { writes.push({ path, body: req.postDataJSON(), route }); return; }
    let body;
    if (path === '/api/admin/seasons') body = { seasons };
    else if (path === '/api/test-persona') return respond({}, 404);
    else if (path === '/api/me/message-notification-summary') body = { unreadCount: 0, previews: [] };
    else if (path.includes('/Loading%20seasons.../')) return respond({ error: 'Choose a loaded season' }, 400);
    else {
      const match = path.match(/^\/api\/admin\/seasons\/(season-[ab])\/(setup|team-registration|team-candidates|close-readiness)$/);
      expect(match, `Unexpected endpoint ${path}`).toBeTruthy();
      const [, id, kind] = match;
      body = kind === 'setup' ? { setup: setup(id) } : kind === 'team-registration' ? { registration } :
        kind === 'team-candidates' ? candidates : { readiness: { season_status: setup(id).status,
          ready: id === 'season-a', championship_finalized: id === 'season-a',
          unresolved_postseason_matches: id === 'season-a' ? 0 : 1, unresolved_player_matches: 0,
          reason: id === 'season-a' ? 'Alpha ready to close' : 'Beta championship incomplete' } };
      if (hold?.id === id && hold.kinds.includes(kind)) { held.push({ respond, body, kind }); return; }
    }
    return respond(body);
  });
  if (sourceMode) {
    let response = new Response(renderSeasonSetupPage(), { headers: { 'content-type': 'text/html' } });
    response = await enhanceSeasonClose(await enhanceSeasonPublishReadiness(response));
    response = await injectAdminSurfaceTheme(response, '/season-setup');
    const html = decorateHtmlWithShell(await response.text(), '/season-setup');
    await page.route('https://operator.test/season-setup?season=season-a', route => route.fulfill({ contentType: 'text/html', body: html }));
  }
  await page.goto('/season-setup?season=season-a');
  await expect(page.locator('[data-season-name]')).toHaveValue('Synthetic Alpha');
  for (const prefix of ['publish-readiness', 'season-close']) {
    const state = page.locator(`[data-${prefix}-state]`);
    await expect(state).not.toContainText('Checking');
    const retry = page.locator(`[data-${prefix}-retry]`);
    if (await retry.isVisible()) await retry.click();
  }
  await expect(page.locator('[data-publish-readiness-state]')).toContainText('Publish blockers are clear');
  await expect(page.locator('[data-season-close-state]')).toHaveText('Alpha ready to close');
  if (mobile) expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  return { context, page, held, writes, hold: (id, kinds) => { hold = { id, kinds }; },
    release: async (fail = false) => {
      hold = null;
      for (const pending of held.splice(0)) await pending.respond(fail ? { error: 'Delayed synthetic denial' } : pending.body, fail ? 403 : 200);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    } };
}

for (const mobile of [false, true]) {
  const device = mobile ? '320px phone' : 'desktop';
  for (const fail of [false, true]) {
    test(`delayed setup ${fail ? 'denial' : 'success'} cannot replace selected season (${device})`, async ({ browser, request }) => {
      const f = await openOperator(browser, request, mobile);
      try {
        f.hold('season-a', ['setup', 'team-registration']);
        await f.page.locator('[data-load]').click();
        await expect.poll(() => f.held.length).toBeGreaterThanOrEqual(2);
        await f.page.locator('[data-season-selector]').selectOption('season-b');
        await expect(f.page.locator('[data-season-name]')).toHaveValue('Synthetic Beta');
        await f.release(fail);
        await expect(f.page.locator('[data-season-selector]')).toHaveValue('season-b');
        await expect(f.page.locator('[data-season-name]')).toHaveValue('Synthetic Beta');
        await expect(f.page.locator('[data-status]')).not.toContainText('Delayed synthetic denial');
        await expect(f.page.locator('[data-save]')).toBeDisabled();
        expect(f.writes).toHaveLength(0);
      } finally { await f.context.close(); }
    });
  }
  for (const fail of [false, true]) {
  test(`late readiness ${fail ? 'denial' : 'success'} cannot enable Publish or Close for another season (${device})`, async ({ browser, request }) => {
    const f = await openOperator(browser, request, mobile);
    try {
      f.hold('season-a', ['team-candidates', 'close-readiness']);
      await f.page.locator('[data-season-selector]').selectOption('season-b');
      await expect(f.page.locator('[data-season-close-state]')).toHaveText('Beta championship incomplete');
      await f.page.locator('[data-season-selector]').selectOption('season-a');
      await expect.poll(() => f.held.length).toBeGreaterThanOrEqual(2);
      await f.page.locator('[data-season-selector]').selectOption('season-b');
      await expect(f.page.locator('[data-season-name]')).toHaveValue('Synthetic Beta');
      await f.release(fail);
      await expect(f.page.locator('[data-season-close-state]')).toHaveText('Beta championship incomplete');
      await expect(f.page.locator('[data-publish-readiness-checklist]')).toContainText('Season must still be Draft or Registration');
      await expect(f.page.locator('[data-publish]')).toBeDisabled();
      await expect(f.page.locator('[data-season-close-button]')).toBeDisabled();
      expect(f.writes).toHaveLength(0);
    } finally { await f.context.close(); }
  });
  }
  test(`returning to the same season ignores its older setup generation (${device})`, async ({ browser, request }) => {
    const f = await openOperator(browser, request, mobile);
    try {
      f.hold('season-a', ['setup', 'team-registration']);
      await f.page.locator('[data-load]').click();
      await expect.poll(() => f.held.length).toBeGreaterThanOrEqual(2);
      await f.page.locator('[data-season-selector]').selectOption('season-b');
      await expect(f.page.locator('[data-season-name]')).toHaveValue('Synthetic Beta');
      f.hold(null, []);
      await f.page.locator('[data-season-selector]').selectOption('season-a');
      await expect(f.page.locator('[data-save]')).toBeEnabled();
      await f.page.locator('[data-season-name]').fill('New Alpha draft');
      await f.release();
      await expect(f.page.locator('[data-season-name]')).toHaveValue('New Alpha draft');
      expect(f.writes).toHaveLength(0);
    } finally { await f.context.close(); }
  });
  test(`pending setup blocks writes and failure recovers with Reload (${device})`, async ({ browser, request }) => {
    const f = await openOperator(browser, request, mobile);
    try {
      f.hold('season-a', ['setup', 'team-registration']);
      await f.page.locator('[data-load]').click();
      await expect.poll(() => f.held.length).toBeGreaterThanOrEqual(2);
      await expect(f.page.locator('[data-save]')).toBeDisabled();
      await expect(f.page.locator('[data-publish]')).toBeDisabled();
      await expect(f.page.locator('[data-season-close-button]')).toBeDisabled();
      await f.page.locator('[data-season-setup-form]').dispatchEvent('submit');
      expect(f.writes).toHaveLength(0);
      await f.release(true);
      await expect(f.page.locator('[data-status]')).toContainText('Delayed synthetic denial');
      await expect(f.page.locator('[data-save]')).toBeDisabled();
      await f.page.locator('[data-load]').click();
      await expect(f.page.locator('[data-save]')).toBeEnabled();
      await expect(f.page.locator('[data-publish]')).toBeEnabled();
      await expect(f.page.locator('[data-season-close-button]')).toBeEnabled();
      expect(f.writes).toHaveLength(0);
    } finally { await f.context.close(); }
  });
  test(`save holds season identity across both writes (${device})`, async ({ browser, request }) => {
    const f = await openOperator(browser, request, mobile);
    try {
      await f.page.locator('[data-save]').click();
      await expect.poll(() => f.writes.length).toBe(1);
      await expect(f.page.locator('[data-season-selector]')).toBeDisabled();
      await f.page.locator('[data-season-setup-form]').dispatchEvent('submit');
      expect(f.writes).toHaveLength(1);
      await f.writes[0].route.fulfill({ contentType: 'application/json', body: JSON.stringify({ setup: setup('season-a') }) });
      await expect.poll(() => f.writes.length).toBe(2);
      expect(f.writes[1].path).toBe('/api/admin/seasons/season-a/team-registration');
      await f.writes[1].route.fulfill({ contentType: 'application/json', body: '{}' });
      await expect(f.page.locator('[data-season-selector]')).toBeEnabled();
      await expect(f.page.locator('[data-save]')).toBeEnabled();
      await expect(f.page.locator('[data-season-selector]')).toHaveValue('season-a');
    } finally { await f.context.close(); }
  });
  test(`close holds season identity and recovers after an unconfirmed response (${device})`, async ({ browser, request }) => {
    const f = await openOperator(browser, request, mobile);
    try {
      f.page.once('dialog', dialog => dialog.accept());
      await f.page.locator('[data-season-close-button]').click();
      await expect.poll(() => f.writes.length).toBe(1);
      expect(f.writes[0].path).toBe('/api/admin/seasons/season-a/close');
      await expect(f.page.locator('[data-season-selector]')).toBeDisabled();
      await expect(f.page.locator('[data-save]')).toBeDisabled();
      await f.page.locator('[data-season-close-button]').dispatchEvent('click');
      expect(f.writes).toHaveLength(1);
      await f.writes[0].route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"Synthetic response unavailable"}' });
      await expect(f.page.locator('[data-season-selector]')).toBeEnabled();
      await expect(f.page.locator('[data-season-close-state]')).toHaveText('Alpha ready to close');
      await expect(f.page.locator('[data-season-close-button]')).toBeEnabled();
      expect(f.writes).toHaveLength(1);
    } finally { await f.context.close(); }
  });
}

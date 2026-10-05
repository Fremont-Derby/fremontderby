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

async function openOperator(browser, request, mobile, setupOverrides = {}, initiallyEmpty = false) {
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
    if (path === '/api/admin/seasons') body = { seasons: initiallyEmpty ? [] : seasons };
    else if (path === '/api/me/ready-checks') return respond({}, 404);
    else if (path === '/api/test-persona') return respond({}, 404);
    else if (path === '/api/me/message-notification-summary') body = { unreadCount: 0, previews: [] };
    else if (path.includes('/Loading%20seasons.../')) return respond({ error: 'Choose a loaded season' }, 400);
    else {
      const match = path.match(/^\/api\/admin\/seasons\/(season-[abc])\/(setup|team-registration|team-candidates|close-readiness)$/);
      expect(match, `Unexpected endpoint ${path}`).toBeTruthy();
      const [, id, kind] = match;
      body = kind === 'setup' ? { setup: { ...setup(id), ...setupOverrides[id] } } : kind === 'team-registration' ? { registration } :
        kind === 'team-candidates' ? candidates : { readiness: { season_status: setup(id).status,
          ready: id === 'season-a', championship_finalized: id === 'season-a',
          unresolved_postseason_matches: id === 'season-a' ? 0 : 1, unresolved_player_matches: 0,
          reason: id === 'season-a' ? 'Alpha ready to close' : 'Beta championship incomplete' } };
      if (hold?.id === id && hold.kinds.includes(kind)) { held.push({ respond, body, kind }); return; }
    }
    return respond(body);
  });
  if (sourceMode) {
    let response = new Response(renderSeasonSetupPage({ allowCreate: true }), { headers: { 'content-type': 'text/html' } });
    response = await enhanceSeasonClose(await enhanceSeasonPublishReadiness(response));
    response = await injectAdminSurfaceTheme(response, '/season-setup');
    const html = decorateHtmlWithShell(await response.text(), '/season-setup');
    await page.route('https://operator.test/season-setup**', route => route.fulfill({ contentType: 'text/html', body: html }));
  }
  await page.goto('/season-setup?season=season-a');
  if (initiallyEmpty) {
    await expect(page.locator('[data-save]')).toBeEnabled();
    return { context, page, writes };
  }
  await expect(page.locator('[data-season-name]')).toHaveValue(setupOverrides['season-a']?.name || 'Synthetic Alpha');
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
  test(`new-season action clears prior inputs and supports cancel without writes (${device})`, async ({ browser, request }) => {
    const f = await openOperator(browser, request, mobile);
    try {
      await f.page.locator('[data-team-capacity]').fill('16');
      await f.page.locator('[data-season-name]').fill('Unsaved old edit');
      await f.page.locator('[data-new-season]').click();
      await expect(f.page.locator('[data-season-name]')).toHaveValue('');
      await expect(f.page.locator('[data-first-round-date]')).toHaveValue('');
      await expect(f.page.locator('[data-team-capacity]')).toHaveValue('8');
      await expect(f.page.locator('[data-season-selector]')).toHaveValue('');
      await expect(f.page.locator('[data-new-season-notice]')).toBeVisible();
      await expect(f.page.locator('[data-publish]')).toBeDisabled();
      await expect(f.page.locator('[data-seed-slots]')).toBeDisabled();
      expect(new URL(f.page.url()).searchParams.has('season')).toBe(false);
      await f.page.locator('[data-season-selector]').selectOption('season-a');
      await expect(f.page.locator('[data-season-name]')).toHaveValue('Synthetic Alpha');
      await expect(f.page.locator('[data-new-season-notice]')).toBeHidden();
      expect(f.writes).toHaveLength(0);
      if (mobile) expect(await f.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    } finally { await f.context.close(); }
  });
  test(`distinct season saves alongside existing registration and retains recovery identity (${device})`, async ({ browser, request }) => {
    const saved = { ...setup('season-a'), id: 'season-c', name: 'Synthetic Next', status: 'registration' };
    const f = await openOperator(browser, request, mobile, { 'season-c': saved });
    try {
      await f.page.locator('[data-new-season]').click();
      await f.page.locator('[data-season-name]').fill(saved.name);
      await f.page.locator('[data-first-round-date]').fill('2026-10-11');
      await f.page.locator('[data-save]').click();
      await expect.poll(() => f.writes.length).toBe(1);
      expect(f.writes[0].path).toBe('/api/admin/seasons');
      expect(f.writes[0].body.createNew).toBe(true);
      await expect(f.page.locator('[data-new-season]')).toBeDisabled();
      await f.writes[0].route.fulfill({ contentType: 'application/json', body: JSON.stringify({ setup: saved }) });
      await expect.poll(() => f.writes.length).toBe(2);
      await f.writes[1].route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"Synthetic registration failure"}' });
      await expect(f.page.locator('[data-status]')).toContainText('Setup saved');
      await expect(f.page.locator('[data-season-selector]')).toHaveValue('season-c');
      await expect(f.page.locator('[data-season-selector] option[value="season-a"]')).toHaveText('Synthetic Alpha \u2014 registration');
      await f.page.locator('[data-save]').click();
      await expect.poll(() => f.writes.length).toBe(3);
      expect(f.writes[2].path).toBe('/api/admin/seasons/season-c/setup');
      expect(f.writes[2].body.createNew).toBeUndefined();
      await f.writes[2].route.fulfill({ contentType: 'application/json', body: JSON.stringify({ setup: saved }) });
      await expect.poll(() => f.writes.length).toBe(4);
      await f.writes[3].route.fulfill({ contentType: 'application/json', body: '{}' });
      await expect(f.page.locator('[data-status]')).toHaveText('Setup and registration saved');
      await f.page.locator('[data-load]').click();
      await expect(f.page.locator('[data-season-name]')).toHaveValue(saved.name);
      await expect(f.page.locator('[data-save]')).toBeEnabled();
      expect(f.writes).toHaveLength(4);
    } finally { await f.context.close(); }
  });
  for (const denial of [401, 403]) {
    test(`new-season ${denial} denial retains draft without registration writes (${device})`, async ({ browser, request }) => {
      const f = await openOperator(browser, request, mobile);
      try {
        await f.page.locator('[data-new-season]').click();
        await f.page.locator('[data-season-name]').fill('Denied draft');
        await f.page.locator('[data-first-round-date]').fill('2026-10-11');
        await f.page.locator('[data-save]').click();
        await expect.poll(() => f.writes.length).toBe(1);
        await f.writes[0].route.fulfill({ status: denial, contentType: 'application/json', body: '{"error":"Actor is not a league admin"}' });
        await expect(f.page.locator('[data-status]')).toContainText(denial === 401 ? 'sign-in expired' : 'not a league admin');
        await expect(f.page.locator('[data-season-name]')).toHaveValue('Denied draft');
        await expect(f.page.locator('[data-new-season]'))[denial === 401 ? 'toBeDisabled' : 'toBeEnabled']();
        expect(f.writes).toHaveLength(1);
      } finally { await f.context.close(); }
    });
  }

  for (const creating of [false, true]) {
    test(`registration failure retains confirmed ${creating ? 'created' : 'edited'} setup and retries safely (${device})`, async ({ browser, request }) => {
      const id = creating ? 'season-c' : 'season-a';
      const saved = { ...setup('season-a'), id, name: 'Confirmed season', status: 'registration' };
      const f = await openOperator(browser, request, mobile, { [id]: saved }, creating);
      try {
        await f.page.locator('[data-season-name]').fill('Confirmed season');
        await f.page.locator('[data-first-round-date]').fill('2026-10-11');
        await f.page.locator('[data-team-capacity]').fill('12');
        await f.page.locator('[data-minimum-roster]').fill('4');
        await f.page.locator('[data-hold-days]').fill('21');
        await f.page.locator('[data-reservation-deadline]').fill('2026-10-10T12:00');
        await f.page.locator('[data-save]').click();
        await expect.poll(() => f.writes.length).toBe(1);
        expect(f.writes[0].route.request().method()).toBe(creating ? 'POST' : 'PUT');
        await f.writes[0].route.fulfill({ contentType: 'application/json', body: JSON.stringify({ setup: saved }) });
        await expect.poll(() => f.writes.length).toBe(2);
        await expect(f.page.locator('[data-season-selector]')).toHaveValue(id);
        expect(new URL(f.page.url()).searchParams.get('season')).toBe(id);
        expect(await f.page.evaluate(() => localStorage.getItem('fd.setupSeasonId'))).toBe(id);
        await f.writes[1].route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"Synthetic registration unavailable"}' });
        await expect(f.page.locator('[data-status]')).toContainText('Setup saved');
        await expect(f.page.locator('[data-status]')).toContainText('Synthetic registration unavailable');
        await expect(f.page.locator('[data-save]')).toBeEnabled();
        await expect(f.page.locator('[data-team-capacity]')).toHaveValue('12');
        await expect(f.page.locator('[data-minimum-roster]')).toHaveValue('4');
        await expect(f.page.locator('[data-hold-days]')).toHaveValue('21');
        await expect(f.page.locator('[data-reservation-deadline]')).toHaveValue('2026-10-10T12:00');
        await f.page.locator('[data-save]').click();
        await expect.poll(() => f.writes.length).toBe(3);
        expect(f.writes[2].route.request().method()).toBe('PUT');
        expect(f.writes[2].path).toBe(`/api/admin/seasons/${id}/setup`);
        await f.writes[2].route.fulfill({ contentType: 'application/json', body: JSON.stringify({ setup: saved }) });
        await expect.poll(() => f.writes.length).toBe(4);
        expect(f.writes[3].path).toBe(`/api/admin/seasons/${id}/team-registration`);
        expect(f.writes[3].body).toEqual(f.writes[1].body);
        await f.writes[3].route.fulfill({ contentType: 'application/json', body: '{}' });
        await expect(f.page.locator('[data-status]')).toHaveText('Setup and registration saved');
        await f.page.locator('[data-load]').click();
        await expect(f.page.locator('[data-season-name]')).toHaveValue('Confirmed season');
        await expect(f.page.locator('[data-save]')).toBeEnabled();
        expect(f.writes.filter(w => w.route.request().method() === 'POST')).toHaveLength(creating ? 1 : 0);
      } finally { await f.context.close(); }
    });
  }
  for (const invalidSetup of [{}, { id: 'season-b' }]) {
    test(`unconfirmed setup ${invalidSetup.id ? 'identity' : 'response'} stops registration (${device})`, async ({ browser, request }) => {
      const f = await openOperator(browser, request, mobile);
      try {
        await f.page.locator('[data-save]').click();
        await expect.poll(() => f.writes.length).toBe(1);
        await f.writes[0].route.fulfill({ contentType: 'application/json', body: JSON.stringify({ setup: invalidSetup }) });
        await expect(f.page.locator('[data-status]')).toContainText('Season save could not be confirmed');
        await expect(f.page.locator('[data-season-selector]')).toHaveValue('season-a');
        expect(f.writes).toHaveLength(1);
      } finally { await f.context.close(); }
    });
  }
  test(`unset setup fields never inherit another season's configuration (${device})`, async ({ browser, request }) => {
    const f = await openOperator(browser, request, mobile, { 'season-b': {
      status: 'draft', first_round_date: null, league_night: null, roster_lock_round: null,
      opening_block_length: null, individual_min_matches: null, round_interval_days: null,
      default_table_numbers: null, race_chart_version: null, playoff_team_count: null,
      playoff_anchor_tiebreaker: false,
    } });
    try {
      await f.page.locator('[data-league-night]').fill('Monday');
      await f.page.locator('[data-roster-lock-round]').fill('9');
      await f.page.locator('[data-table-numbers]').fill('5,6,7,8');
      await f.page.locator('[data-race-chart-version]').fill('Alpha-only-chart');
      await f.page.locator('[data-season-selector]').selectOption('season-b');
      await expect(f.page.locator('[data-season-name]')).toHaveValue('Synthetic Beta');
      await expect(f.page.locator('[data-first-round-date]')).toHaveValue('');
      for (const [field, value] of Object.entries({ 'league-night': 'Thursday', 'roster-lock-round': '5',
        'opening-block-length': '3', 'individual-min-matches': '5', 'round-interval-days': '7',
        'table-numbers': '1,2,3,4', 'race-chart-version': 'season-1-default', 'playoff-team-count': '4' })) {
        await expect(f.page.locator(`[data-${field}]`)).toHaveValue(value);
      }
      await expect(f.page.locator('[data-playoff-anchor-tiebreaker]')).not.toBeChecked();
      await f.page.locator('[data-first-round-date]').fill('2026-11-12');
      await f.page.locator('[data-save]').click();
      await expect.poll(() => f.writes.length).toBe(1);
      expect(f.writes[0].path).toBe('/api/admin/seasons/season-b/setup');
      expect(f.writes[0].body).toMatchObject({ seasonName: 'Synthetic Beta', leagueNight: 'Thursday',
        firstRoundDate: '2026-11-12', rosterLockRound: 5, tableNumbers: [1, 2, 3, 4],
        raceChartVersion: 'season-1-default', playoffAnchorTiebreaker: false });
      await f.writes[0].route.fulfill({ status: 403, contentType: 'application/json', body: '{"error":"Synthetic save denied"}' });
      await expect(f.page.locator('[data-status]')).toHaveText('Synthetic save denied');
      expect(f.writes).toHaveLength(1);
    } finally { await f.context.close(); }
  });
  test(`pending and failed setup clear prior season summaries (${device})`, async ({ browser, request }) => {
    const f = await openOperator(browser, request, mobile);
    try {
      await expect(f.page.locator('[data-registration-summary]')).toContainText('Confirmed teams8');
      f.hold('season-b', ['setup', 'team-registration']);
      await f.page.locator('[data-season-selector]').selectOption('season-b');
      await expect.poll(() => f.held.length).toBe(2);
      await expect(f.page.locator('[data-registration-summary]')).toBeEmpty();
      for (const field of ['season-status', 'team-count', 'round-count', 'table-summary']) {
        await expect(f.page.locator(`[data-${field}]`)).toHaveText('—');
      }
      await expect(f.page.locator('[data-save]')).toBeDisabled();
      await f.release(true);
      await expect(f.page.locator('[data-status]')).toContainText('Delayed synthetic denial');
      await expect(f.page.locator('[data-registration-summary]')).toBeEmpty();
      await f.page.locator('[data-load]').click();
      await expect(f.page.locator('[data-season-status]')).toHaveText('playoffs');
      await expect(f.page.locator('[data-registration-summary]')).toContainText('Confirmed teams8');
      expect(f.writes).toHaveLength(0);
    } finally { await f.context.close(); }
  });
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

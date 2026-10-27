import { test, expect } from '@playwright/test';
import { renderSeasonSetupPage } from '../../src/seasonSetupPage.js';

const existing = '36520000-1000-4000-8000-000000000001';
const created = '36520000-1000-4000-8000-000000000002';
const setup = (id, name = 'Current season') => ({ id, name, status: 'registration',
  first_round_date: '2026-11-03', teams: [], rounds: [] });
function canonical(payload) {
  const keys = { seasonName: 'season_name', leagueNight: 'league_night', firstRoundDate: 'first_round_date',
    rosterLockRound: 'roster_lock_round', openingBlockLength: 'opening_block_length', individualMinMatches: 'individual_min_matches',
    roundIntervalDays: 'round_interval_days', tableNumbers: 'table_numbers', raceChartVersion: 'race_chart_version',
    playoffTeamCount: 'playoff_team_count', playoffAnchorTiebreaker: 'playoff_anchor_tiebreaker', seasonPurpose: 'purpose' };
  return Object.fromEntries(Object.entries(keys).map(([key, value]) => ['configured_' + value,
    typeof payload[key] === 'string' ? payload[key].trim() : payload[key]]));
}
async function open(browser, mobile) {
  const context = await browser.newContext({ viewport: { width: mobile ? 320 : 1280, height: 900 },
    baseURL: 'https://operator.test' });
  await context.addInitScript(() => {
    if (!sessionStorage.getItem('fd.accessToken')) sessionStorage.setItem('fd.accessToken', 'synthetic-session');
  });
  const page = await context.newPage();
  const writes = []; const reads = []; const pending = [];
  let currentName = 'Later edited season';
  await context.route('https://operator.test/**', async route => {
    const request = route.request(); const path = new URL(request.url()).pathname;
    if (path === '/season-setup') {
      if (process.env.PLAYWRIGHT_OPERATOR_SOURCE === 'bundled') {
        const { default: worker } = await import('../../dist/routerEntry.js');
        const response = await worker.fetch(new Request(request.url()), { ENVIRONMENT: 'jfl' }, {});
        return route.fulfill({ contentType: 'text/html', body: await response.text() });
      }
      return route.fulfill({ contentType: 'text/html', body: renderSeasonSetupPage({ allowCreate: true }) });
    }
    const respond = body => route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
    if (!path.startsWith('/api/')) return route.fulfill({ status: 404, body: '' });
    if (request.method() !== 'GET') { writes.push({ path, body: request.postDataJSON(), route }); return; }
    reads.push(path);
    if (path.includes('/season-creation-operations/')) { pending.push(route); return; }
    if (path === '/api/admin/seasons') return respond({ seasons: [setup(existing)] });
    if (path.endsWith('/setup')) return respond({ setup: setup(path.includes(created) ? created : existing, path.includes(created) ? currentName : 'Current season') });
    if (path.endsWith('/team-registration')) return respond({ registration: { teamCapacity: 8, slots: [], applications: [] } });
    if (path.endsWith('/team-candidates')) return respond({ teams: [], registration: { teamCapacity: 8 } });
    if (path.includes('close-readiness')) return respond({ readiness: {} });
    return respond({});
  });
  await page.goto('/season-setup');
  await expect(page.locator('[data-season-name]')).toHaveValue('Current season');
  await page.locator('[data-new-season]').click();
  await page.locator('[data-season-name]').fill(' New intent ');
  await page.locator('[data-first-round-date]').fill('2026-11-03');
  await page.locator('[data-save]').click();
  await expect.poll(() => writes.length).toBe(1);
  return { context, page, writes, reads, pending, setName(value) { currentName = value; } };
}
async function lost(f) {
  await f.writes[0].route.abort('failed');
  await expect(f.page.locator('[data-check-creation]')).toBeEnabled();
  await expect(f.page.locator('[data-save]')).toBeDisabled();
}
async function outcome(f, found = true, extras = {}) {
  await f.page.locator('[data-check-creation]').click();
  await expect.poll(() => f.pending.length).toBeGreaterThan(0);
  const route = f.pending.shift();
  await route.fulfill({ contentType: 'application/json', body: JSON.stringify({
    operationId: f.writes[0].body.operationId, found,
    ...(found ? { setup: setup(created, 'Later edited season'), requestedInput: canonical(f.writes[0].body) } : {}), ...extras,
  }) });
}
for (const mobile of [false, true]) {
  test.describe(mobile ? 'phone creation recovery' : 'desktop creation recovery', () => {
    test('lost response recovers by GET and never reapplies registration or a later edit', async ({ browser }) => {
      const f = await open(browser, mobile);
      try {
        expect(f.writes[0].body).toMatchObject({ createNew: true, seasonPurpose: 'league' });
        expect(f.writes[0].body.operationId).toMatch(/^[a-f0-9-]{36}$/);
        await lost(f); await outcome(f);
        await expect(f.page.locator('[data-season-name]')).toHaveValue('Later edited season');
        await expect(f.page.locator('[data-status]')).toContainText('registration draft was not applied');
        expect(f.writes).toHaveLength(1);
      } finally { await f.context.close(); }
    });
    test('refresh restores exact unresolved intent without another POST', async ({ browser }) => {
      const f = await open(browser, mobile);
      try {
        await lost(f); await f.page.reload();
        await expect(f.page.locator('[data-check-creation]')).toBeEnabled();
        await expect(f.page.locator('[data-season-name]')).toHaveValue(' New intent ');
        expect(f.writes).toHaveLength(1); await outcome(f);
        await expect(f.page.locator('[data-status]')).toContainText('creation recovered');
        expect(f.writes).toHaveLength(1);
      } finally { await f.context.close(); }
    });
    test('explicit absent read permits one deliberate retry of the identical operation', async ({ browser }) => {
      const f = await open(browser, mobile);
      try {
        await lost(f); await outcome(f, false);
        await expect(f.page.locator('[data-retry-creation]')).toBeEnabled();
        expect(f.writes).toHaveLength(1);
        await f.page.locator('[data-retry-creation]').click();
        await expect.poll(() => f.writes.length).toBe(2);
        expect(f.writes[1].body).toEqual(f.writes[0].body);
        await f.writes[1].route.fulfill({ contentType: 'application/json', body: JSON.stringify({
          setup: { ...setup(created), creationOperationId: f.writes[0].body.operationId, creationAcknowledged: true },
        }) });
        await expect(f.page.locator('[data-status]')).toContainText('registration draft was not applied');
        expect(f.writes).toHaveLength(2);
      } finally { await f.context.close(); }
    });
    test('mismatched result remains blocked without any mutation', async ({ browser }) => {
      const f = await open(browser, mobile);
      try {
        await lost(f); await outcome(f, true, { requestedInput: { configured_purpose: 'qa' } });
        await expect(f.page.locator('[data-status]')).toContainText('does not match');
        await expect(f.page.locator('[data-save]')).toBeDisabled();
        await expect(f.page.locator('[data-retry-creation]')).toBeHidden();
        expect(f.writes).toHaveLength(1);
      } finally { await f.context.close(); }
    });
    test('fresh confirmed creation saves registration once and keeps its exact season identity', async ({ browser }) => {
      const f = await open(browser, mobile);
      try {
        await f.writes[0].route.fulfill({ contentType: 'application/json', body: JSON.stringify({
          setup: { ...setup(created), creationOperationId: f.writes[0].body.operationId, creationAcknowledged: false },
        }) });
        await expect.poll(() => f.writes.length).toBe(2);
        expect(f.writes[1].path).toBe('/api/admin/seasons/' + created + '/team-registration');
        await f.writes[1].route.fulfill({ contentType: 'application/json', body: '{}' });
        await expect(f.page.locator('[data-status]')).toHaveText('Season created and registration opened');
        expect(new URL(f.page.url()).searchParams.get('season')).toBe(created);
        expect(f.writes).toHaveLength(2);
        expect(await f.page.evaluate(() => sessionStorage.getItem('fd.seasonCreation.v1'))).toBeNull();
      } finally { await f.context.close(); }
    });
    test('successful POST with an unconfirmed response blocks saves and retains the operation', async ({ browser }) => {
      const f = await open(browser, mobile);
      try {
        await f.writes[0].route.fulfill({ contentType: 'application/json', body: JSON.stringify({ setup: { id: created } }) });
        await expect(f.page.locator('[data-status]')).toContainText('not confirmed');
        await expect(f.page.locator('[data-check-creation]')).toBeEnabled();
        await expect(f.page.locator('[data-save]')).toBeDisabled();
        await expect(f.page.locator('[data-season-selector]')).toBeDisabled();
        expect(f.writes).toHaveLength(1);
      } finally { await f.context.close(); }
    });
    test('failed recovery read neither enables a retry nor discloses raw HTML', async ({ browser }) => {
      const f = await open(browser, mobile);
      try {
        await lost(f); await f.page.locator('[data-check-creation]').click();
        await expect.poll(() => f.pending.length).toBe(1);
        await f.pending.shift().fulfill({ status: 403, contentType: 'text/html', body: '<h1>Private failure</h1>' });
        await expect(f.page.locator('[data-status]')).toHaveText('Request failed. Please try again later.');
        await expect(f.page.locator('[data-retry-creation]')).toBeHidden();
        expect(f.writes).toHaveLength(1);
      } finally { await f.context.close(); }
    });
    test('429 honors bounded cooldown and sends no automatic read or write', async ({ browser }) => {
      const f = await open(browser, mobile);
      try {
        await f.page.clock.install();
        await f.writes[0].route.fulfill({ status: 429, headers: { 'retry-after': '10' }, contentType: 'text/html', body: '<html>throttled</html>' });
        await expect(f.page.locator('[data-status]')).toContainText('Too many requests');
        await expect(f.page.locator('[data-check-creation]')).toBeDisabled();
        await f.page.clock.fastForward(10001);
        await expect(f.page.locator('[data-check-creation]')).toBeEnabled();
        expect(f.pending).toHaveLength(0); expect(f.writes).toHaveLength(1);
        await outcome(f, false);
        await expect(f.page.locator('[data-retry-creation]')).toBeEnabled();
      } finally { await f.context.close(); }
    });
    test('an expired absent result requires another check and never repeats a POST', async ({ browser }) => {
      const f = await open(browser, mobile);
      try {
        await lost(f); await f.page.clock.install(); await outcome(f, false);
        await expect(f.page.locator('[data-retry-creation]')).toBeEnabled();
        await f.page.clock.fastForward(31000);
        await expect(f.page.locator('[data-retry-creation]')).toBeDisabled();
        await expect(f.page.locator('[data-check-creation]')).toBeEnabled();
        expect(f.writes).toHaveLength(1);
      } finally { await f.context.close(); }
    });
    test('session change removes unresolved private intent and ignores old response', async ({ browser }) => {
      const f = await open(browser, mobile);
      try {
        await f.page.evaluate(() => { sessionStorage.setItem('fd.accessToken', 'new-session'); window.dispatchEvent(new Event('fd:session-changed')); });
        await f.writes[0].route.fulfill({ contentType: 'application/json', body: JSON.stringify({
          setup: { ...setup(created, 'Private old name'), creationOperationId: f.writes[0].body.operationId, creationAcknowledged: false },
        }) });
        await expect(f.page.locator('[data-season-name]')).toHaveValue('');
        await expect(f.page.locator('[data-check-creation]')).toBeHidden();
        expect(await f.page.evaluate(() => sessionStorage.getItem('fd.seasonCreation.v1'))).toBeNull();
        expect(f.writes).toHaveLength(1);
      } finally { await f.context.close(); }
    });
  });
}

import { test, expect } from '@playwright/test';
import { renderAdminSeasonTeamsPage } from '../../src/adminSeasonTeamsPage.js';

test.setTimeout(30_000);
let html;
test.beforeAll(async ({ request }) => {
  const mode = process.env.PLAYWRIGHT_ADMIN_SEASON_TEAMS_HTML;
  if (mode === 'deployed') {
    expect(await (await request.get('/health/environment')).json()).toMatchObject({ ok: true, environment: 'jfl', expectedSupabaseSchema: 'jfl', versionTag: process.env.PLAYWRIGHT_EXPECTED_SHA });
    html = await (await request.get('/admin/season-teams')).text();
  } else if (mode === 'built') {
    const { default: worker } = await import('../../dist/routerEntry.js');
    html = await (await worker.fetch(new Request('https://jfl.fremontderby.com/admin/season-teams'), { ENVIRONMENT: 'jfl' }, { waitUntil() {} })).text();
  } else html = renderAdminSeasonTeamsPage();
});
const season = 'synthetic-season';
const candidates = label => ({ registration: { teamCapacity: 8, counts: { occupiedSlots: 2 } }, teams: [{ teamId: 'team-' + label, sourceSeasonId: season, teamName: label + ' Private Team', candidateKind: 'new', captainPlayerId: null, activeRosterCount: 4, canTakeSlot: true }] });
async function open(browser, mobile) {
  const context = await browser.newContext({ viewport: { width: mobile ? 320 : 1280, height: 900 } });
  await context.addInitScript(() => {
    sessionStorage.setItem('fd.accessToken', 'synthetic-A');
    const fetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await fetch(...args);
      if (String(args[0]).endsWith('/team-candidates') && window.__holdNextBody) {
        window.__holdNextBody = false;
        const text = response.text.bind(response);
        response.text = async () => { const body = await text(); await new Promise(resolve => { window.__releaseBody = resolve; }); return body; };
      }
      return response;
    };
  });
  const reads = [], writes = [], held = [];
  let hold = null, failure = null;
  await context.route('**/*', async route => {
    const req = route.request(), path = new URL(req.url()).pathname;
    if (path === '/admin/season-teams') return route.fulfill({ contentType: 'text/html', body: html });
    if (path.startsWith('/api/admin/')) {
      const token = req.headers().authorization, label = token === 'Bearer synthetic-B' ? 'B' : 'A';
      if (req.method() === 'GET') reads.push({ path, token }); else writes.push({ path, token, body: req.postData() });
      if (hold && hold(req)) { hold = null; held.push(route); return; }
      if (failure) { const value = failure; failure = null; return route.fulfill(value); }
      let body = {};
      if (path === '/api/admin/seasons') body = { seasons: [{ id: season, name: label + ' Private Season', status: 'registration' }] };
      else if (path.endsWith('/team-candidates')) body = candidates(label);
      else if (path.endsWith('/captain-candidates')) body = { players: [{ playerId: 'player-' + label, displayName: label + ' Private Captain', hasLogin: false, hasPhone: true, captainTeamId: null }] };
      else if (path.endsWith('/prepared-teams')) body = { team: { id: 'created-' + label } };
      else if (path.endsWith('/captain')) body = { captain: { displayName: label + ' Private Captain', hasPhone: true } };
      return route.fulfill({ json: body });
    }
    return route.fulfill({ json: {} });
  });
  const page = await context.newPage(); page.setDefaultTimeout(5000);
  await page.goto('https://jfl.fremontderby.com/admin/season-teams?season=' + season);
  await page.locator('[data-tab="new"]').click();
  await expect(page.locator('[data-list]')).toContainText('A Private Team');
  return { page, context, reads, writes, held, hold: value => { hold = value; }, fail: value => { failure = value; } };
}
async function session(page, token, event = 'fd:session-changed') {
  await page.evaluate(({ token, event }) => { if (token) sessionStorage.setItem('fd.accessToken', token); else sessionStorage.removeItem('fd.accessToken'); if (event) window.dispatchEvent(new Event(event)); }, { token, event });
}
async function loadB(f) {
  await f.page.locator('[data-reload-teams]').click();
  await f.page.locator('[data-tab="new"]').click();
  await expect(f.page.locator('[data-list]')).toContainText('B Private Team');
}
async function settle(page) { await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))); }
for (const mobile of [false, true]) {
  test(`Season Teams clears private state on signout (${mobile})`, async ({ browser }) => {
    const f = await open(browser, mobile);
    try {
      await f.page.locator('[data-search]').fill('A'); await f.page.locator('[data-create-name]').fill('Private draft');
      await f.page.getByRole('button', { name: 'Assign captain', exact: true }).click();
      await expect(f.page.locator('.captain-picker')).toContainText('A Private Captain');
      const before = f.reads.length;
      await session(f.page, '');
      await expect(f.page.locator('[data-list]')).toBeEmpty();
      await expect(f.page.locator('[data-season]')).not.toContainText('A Private Season');
      await expect(f.page.locator('[data-search]')).toHaveValue('');
      await expect(f.page.locator('[data-create-name]')).toHaveValue('');
      await expect(f.page.locator('[data-create-form]')).toBeHidden();
      expect(f.reads.length).toBe(before); expect(f.writes).toEqual([]);
    } finally { await f.context.close(); }
  });
  for (const status of [200, 401]) test(`Season Teams ignores old ${status} response after B (${mobile})`, async ({ browser }) => {
    const f = await open(browser, mobile);
    try {
      f.hold(req => req.method() === 'GET' && new URL(req.url()).pathname.endsWith('/team-candidates'));
      await f.page.locator('[data-season]').selectOption(season); await expect.poll(() => f.held.length).toBe(1);
      await session(f.page, 'synthetic-B'); await expect(f.page.locator('[data-list]')).toBeEmpty(); await loadB(f);
      await f.held[0].fulfill({ status, json: status === 200 ? candidates('Old A') : { error: 'Old A denied' } });
      await settle(f.page);
      await expect(f.page.locator('[data-list]')).toContainText('B Private Team');
      await expect(f.page.locator('[data-list]')).not.toContainText('Old A');
      expect(await f.page.evaluate(() => sessionStorage.getItem('fd.accessToken'))).toBe('synthetic-B');
      expect(f.writes).toEqual([]);
    } finally { await f.context.close(); }
  });
  test(`Season Teams ignores old body and detached actions (${mobile})`, async ({ browser }) => {
    const f = await open(browser, mobile);
    try {
      await f.page.evaluate(() => { window.__oldAdd = document.querySelector('.card .add'); window.__holdNextBody = true; });
      await f.page.locator('[data-season]').selectOption(season); await expect.poll(() => f.page.evaluate(() => typeof window.__releaseBody)).toBe('function');
      await session(f.page, 'synthetic-B', 'storage'); await loadB(f);
      await f.page.evaluate(() => { window.__releaseBody(); window.__oldAdd.click(); });
      await settle(f.page);
      await expect(f.page.locator('[data-list]')).toContainText('B Private Team');
      expect(f.writes).toEqual([]);
    } finally { await f.context.close(); }
  });
  for (const action of ['create', 'captain', 'slot']) test(`Season Teams ignores old ${action} completion (${mobile})`, async ({ browser }) => {
    const f = await open(browser, mobile);
    try {
      f.hold(req => req.method() === 'POST');
      if (action === 'create') { await f.page.locator('[data-create-name]').fill('A Private New Team'); await f.page.locator('[data-create-button]').click(); }
      if (action === 'captain') { await f.page.getByRole('button', { name: 'Assign captain', exact: true }).click(); await f.page.locator('.captain-picker select').selectOption('player-A'); await f.page.locator('.captain-picker button').click(); }
      if (action === 'slot') await f.page.getByRole('button', { name: 'Add to season', exact: true }).click();
      await expect.poll(() => f.held.length).toBe(1); await session(f.page, 'synthetic-B'); await loadB(f);
      const reads = f.reads.length; await f.held[0].fulfill({ json: { team: { id: 'old-created' }, captain: { displayName: 'Old A Captain' } } });
      await settle(f.page);
      await expect(f.page.locator('[data-list]')).toContainText('B Private Team'); await expect(f.page.locator('[data-state]')).not.toContainText('Old A');
      expect(f.reads.length).toBe(reads); expect(f.writes).toHaveLength(1); expect(f.writes[0].token).toBe('Bearer synthetic-A');
    } finally { await f.context.close(); }
  });
  test(`Season Teams current denial clears only current credentials (${mobile})`, async ({ browser }) => {
    const f = await open(browser, mobile);
    try {
      f.fail({ status: 401, json: { error: 'Current admin denied' } }); await f.page.locator('[data-season]').selectOption(season);
      await expect.poll(() => f.page.evaluate(() => sessionStorage.getItem('fd.accessToken'))).toBeNull();
      await expect(f.page.locator('[data-list]')).toBeEmpty(); await expect(f.page.locator('[data-signin-teams]')).toBeVisible();
    } finally { await f.context.close(); }
  });
  test(`Season Teams rejects unannounced session replacement before a write (${mobile})`, async ({ browser }) => {
    const f = await open(browser, mobile);
    try {
      await session(f.page, 'synthetic-B', null); await f.page.getByRole('button', { name: 'Add to season', exact: true }).click();
      await expect(f.page.locator('[data-list]')).toBeEmpty(); expect(f.writes).toEqual([]); await loadB(f);
    } finally { await f.context.close(); }
  });
  test(`Season Teams ignores late captain choices after session replacement (${mobile})`, async ({ browser }) => {
    const f = await open(browser, mobile);
    try {
      f.hold(req => new URL(req.url()).pathname.endsWith('/captain-candidates'));
      await f.page.getByRole('button', { name: 'Assign captain', exact: true }).click(); await expect.poll(() => f.held.length).toBe(1);
      await session(f.page, 'synthetic-B'); await loadB(f);
      await f.held[0].fulfill({ json: { players: [{ playerId: 'old-A', displayName: 'Old A Private Captain', hasPhone: true }] } }); await settle(f.page);
      await expect(f.page.locator('body')).not.toContainText('Old A Private Captain'); await expect(f.page.locator('.captain-picker')).toHaveCount(0); expect(f.writes).toEqual([]);
    } finally { await f.context.close(); }
  });
  test(`Season Teams recovers a current read failure through one deliberate reload (${mobile})`, async ({ browser }) => {
    const f = await open(browser, mobile);
    try {
      f.fail({ status: 503, json: { error: 'Synthetic teams unavailable' } }); await f.page.locator('[data-season]').selectOption(season);
      await expect(f.page.locator('[data-state]')).toContainText('Synthetic teams unavailable'); await expect(f.page.locator('[data-list]')).toBeEmpty(); const before = f.reads.length; await settle(f.page); expect(f.reads.length).toBe(before);
      await f.page.locator('[data-reload-teams]').click(); await f.page.locator('[data-tab="new"]').click(); await expect(f.page.locator('[data-list]')).toContainText('A Private Team'); expect(f.writes).toEqual([]);
    } finally { await f.context.close(); }
  });
  for (const action of ['create', 'captain', 'slot']) test(`Season Teams current ${action} keeps exact target and token (${mobile})`, async ({ browser }) => {
    const f = await open(browser, mobile);
    try {
      if (action === 'create') { await f.page.locator('[data-create-name]').fill('A Prepared Team'); await f.page.locator('[data-create-button]').click(); await expect(f.page.locator('[data-state]')).toContainText('A Prepared Team created.'); }
      if (action === 'captain') { await f.page.getByRole('button', { name: 'Assign captain', exact: true }).click(); await f.page.locator('.captain-picker select').selectOption('player-A'); await f.page.locator('.captain-picker button').click(); await expect(f.page.locator('[data-state]')).toContainText('A Private Captain assigned'); }
      if (action === 'slot') { await f.page.getByRole('button', { name: 'Add to season', exact: true }).click(); await expect(f.page.locator('[data-state]')).toContainText('A Private Team added to the season.'); }
      expect(f.writes).toHaveLength(1); expect(f.writes[0].token).toBe('Bearer synthetic-A'); expect(f.writes[0].path).toContain('/' + season + '/'); await expect(f.page.locator('[data-season]')).toHaveValue(season);
      await expect(f.page.locator('[data-create-button]')).toBeEnabled();
    } finally { await f.context.close(); }
  });
  for (const action of ['create', 'captain', 'slot']) test(`Season Teams current ${action} failure restores controls without replay (${mobile})`, async ({ browser }) => {
    const f = await open(browser, mobile);
    try {
      if (action === 'captain') { await f.page.getByRole('button', { name: 'Assign captain', exact: true }).click(); await f.page.locator('.captain-picker select').selectOption('player-A'); }
      f.fail({ status: 429, headers: { 'Retry-After': '10' }, json: { error: 'Synthetic write throttled' } });
      if (action === 'create') { await f.page.locator('[data-create-name]').fill('A Prepared Team'); await f.page.locator('[data-create-button]').click(); }
      if (action === 'captain') await f.page.locator('.captain-picker button').click();
      if (action === 'slot') await f.page.getByRole('button', { name: 'Add to season', exact: true }).click();
      await expect(f.page.locator('[data-state]')).toContainText('Synthetic write throttled'); await settle(f.page);
      expect(f.writes).toHaveLength(1); await expect(f.page.locator('[data-create-button]')).toBeEnabled(); await expect(f.page.getByRole('button', { name: 'Add to season', exact: true })).toBeEnabled();
      expect(await f.page.evaluate(() => sessionStorage.getItem('fd.accessToken'))).toBe('synthetic-A');
    } finally { await f.context.close(); }
  });
}

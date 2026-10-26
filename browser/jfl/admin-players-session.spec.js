import { test, expect } from '@playwright/test';
import { renderAdminPlayersPage } from '../../src/adminPlayersPage.js';

test.setTimeout(45_000);

let html;
test.beforeAll(async ({ request }) => {
  if (process.env.PLAYWRIGHT_ADMIN_PLAYERS_HTML === 'deployed') {
    expect(process.env.PLAYWRIGHT_EXPECTED_SHA).toMatch(/^[a-f0-9]{40}$/);
    expect(await (await request.get('/health/environment')).json()).toMatchObject({ ok: true, environment: 'jfl', expectedSupabaseSchema: 'jfl', versionTag: process.env.PLAYWRIGHT_EXPECTED_SHA });
    html = await (await request.get('/admin/players')).text();
  } else if (process.env.PLAYWRIGHT_ADMIN_PLAYERS_HTML === 'built') {
    const { default: worker } = await import('../../dist/routerEntry.js');
    const response = await worker.fetch(new Request('https://jfl.fremontderby.com/admin/players'), { ENVIRONMENT: 'jfl' }, { waitUntil() {} });
    html = await response.text();
  } else html = renderAdminPlayersPage();
});

const player = label => ({ playerId: 'synthetic-' + label, displayName: label + ' Private Player', hasLogin: true, isLeagueAdmin: false, teams: [], currentSeasonId: 'season-owned', currentSeasonName: 'Owned season', competitionEligible: true });
const directory = label => ({ players: [player(label)], rosterTeams: [{ teamId: 'team-owned', seasonId: 'season-owned', teamName: 'Owned team' }] });
async function open(browser, mobile) {
  const context = await browser.newContext({ viewport: { width: mobile ? 320 : 1280, height: 900 } });
  await context.addInitScript(() => {
    if (location.hostname === 'jfl.fremontderby.com') sessionStorage.setItem('fd.accessToken', 'synthetic-A');
    window.__savedButtons = [];
    const original = window.fetch;
    window.fetch = async (...args) => {
      const response = await original(...args);
      if (String(args[0]).startsWith('/api/admin/players')) {
        const text = response.text.bind(response);
        response.text = async () => {
          const value = await text();
          if (window.__holdBody) await new Promise(resolve => { window.__releaseBody = resolve; });
          return value;
        };
      }
      return response;
    };
  });
  const reads = [], writes = [], held = [];
  let hold = false, failure = null;
  await context.route('**/*', async route => {
    const req = route.request(), path = new URL(req.url()).pathname;
    if (path === '/admin/players') return route.fulfill({ contentType: 'text/html', body: html });
    if (path.startsWith('/api/admin/players')) {
      const token = req.headers().authorization;
      if (req.method() !== 'GET') writes.push({ token, path, body: req.postDataJSON() });
      else reads.push(token);
      if (hold) { hold = false; held.push(route); return; }
      if (failure) { const value = failure; failure = null; return route.fulfill(value); }
      return route.fulfill({ json: req.method() === 'GET' ? directory(token === 'Bearer synthetic-B' ? 'B' : 'A') : { player: player('Saved') } });
    }
    return route.fulfill({ json: {} });
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10_000);
  await page.goto('https://jfl.fremontderby.com/admin/players?season=season-owned&team=team-owned');
  await expect(page.locator('[data-list]')).toContainText('A Private Player');
  return { page, context, reads, writes, held, hold: () => { hold = true; }, fail: value => { failure = value; } };
}
async function session(page, value, event = 'fd:session-changed') {
  await page.evaluate(({ value, event }) => {
    if (value) sessionStorage.setItem('fd.accessToken', value); else sessionStorage.removeItem('fd.accessToken');
    if (event) window.dispatchEvent(new Event(event));
  }, { value, event });
}
async function release(route, page, value) {
  const request = route.request();
  const pending = page.waitForResponse(response => response.url() === request.url() && response.request().method() === request.method());
  await route.fulfill(value);
  await (await pending).finished();
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 0)));
}

for (const mobile of [false, true]) {
  const device = mobile ? '320px' : 'desktop';
  test(`Admin Players clears old directory and drafts, explicit reload qualifies new session (${device})`, async ({ browser }) => {
    const f = await open(browser, mobile);
    try {
      await f.page.locator('[data-create-name]').fill('Private draft');
      await session(f.page, 'synthetic-B');
      await expect(f.page.locator('[data-list]')).toBeEmpty();
      await expect(f.page.locator('[data-create-name]')).toHaveValue('');
      await expect(f.page.locator('[data-create-button]')).toBeDisabled();
      expect(f.reads).toHaveLength(1);
      await f.page.locator('[data-retry]').click();
      await expect(f.page.locator('[data-list]')).toContainText('B Private Player');
      expect(f.writes).toHaveLength(0);
      expect(new URL(f.page.url()).searchParams.get('season')).toBe('season-owned');
    } finally { await f.context.close(); }
  });
  test(`Admin Players eventless stale management card cannot grant under new token (${device})`, async ({ browser }) => {
    const f = await open(browser, mobile);
    try {
      await f.page.locator('[data-list] summary').click();
      await f.page.evaluate(() => { window.__oldGrant = document.querySelector('.grant'); });
      await session(f.page, 'synthetic-B', null);
      f.page.on('dialog', dialog => dialog.accept());
      await f.page.evaluate(() => window.__oldGrant.click());
      await expect(f.page.locator('[data-list]')).toBeEmpty();
      expect(f.writes).toHaveLength(0);
    } finally { await f.context.close(); }
  });

  test(`Admin Players same-session events preserve drafts and ordinary create (${device})`, async ({ browser }) => {
    const f = await open(browser, mobile);
    try {
      await f.page.locator('[data-create-name]').fill('New synthetic player');
      await f.page.locator('[data-search]').fill('Private');
      await session(f.page, 'synthetic-A', 'focus');
      await expect(f.page.locator('[data-create-name]')).toHaveValue('New synthetic player');
      await expect(f.page.locator('[data-search]')).toHaveValue('Private');
      expect(f.reads).toHaveLength(1);
      await f.page.locator('[data-create-button]').click();
      await expect.poll(() => f.writes.length).toBe(1);
      await expect(f.page.locator('[data-status]')).toContainText('created as Unclaimed');
      expect(f.writes[0]).toMatchObject({ token: 'Bearer synthetic-A', path: '/api/admin/players', body: { displayName: 'New synthetic player', allowExactDuplicate: false } });
    } finally { await f.context.close(); }
  });

  for (const status of [200, 401]) test(`Admin Players old read ${status} cannot overwrite a replacement view (${device})`, async ({ browser }) => {
    const f = await open(browser, mobile);
    try {
      await session(f.page, 'synthetic-B');
      f.hold();
      await f.page.locator('[data-retry]').click();
      await expect.poll(() => f.held.length).toBe(1);
      await session(f.page, 'synthetic-A');
      await f.page.locator('[data-retry]').click();
      await expect(f.page.locator('[data-list]')).toContainText('A Private Player');
      await release(f.held[0], f.page, { status, json: status === 200 ? directory('B') : { error: 'Old credentials expired' } });
      await expect(f.page.locator('[data-status]')).toContainText('1 player loaded');
      await expect(f.page.locator('[data-list]')).not.toContainText('B Private Player');
      expect(await f.page.evaluate(() => sessionStorage.getItem('fd.accessToken'))).toBe('synthetic-A');
      expect(f.writes).toHaveLength(0);
    } finally { await f.context.close(); }
  });

  test(`Admin Players delayed old body cannot restore private content (${device})`, async ({ browser }) => {
    const f = await open(browser, mobile);
    try {
      await session(f.page, 'synthetic-B');
      await f.page.evaluate(() => { window.__holdBody = true; });
      await f.page.locator('[data-retry]').click();
      await expect.poll(() => f.page.evaluate(() => typeof window.__releaseBody === 'function')).toBe(true);
      await session(f.page, 'synthetic-A');
      await f.page.evaluate(() => { window.__holdBody = false; });
      await f.page.locator('[data-retry]').click();
      await expect(f.page.locator('[data-list]')).toContainText('A Private Player');
      await f.page.evaluate(() => { window.__releaseBody(); return new Promise(resolve => setTimeout(resolve, 0)); });
      await expect(f.page.locator('[data-list]')).not.toContainText('B Private Player');
      expect(f.writes).toHaveLength(0);
    } finally { await f.context.close(); }
  });

  test(`Admin Players old create finalizer cannot erase the new draft or replay (${device})`, async ({ browser }) => {
    const f = await open(browser, mobile);
    try {
      f.hold();
      await f.page.locator('[data-create-name]').fill('Old draft');
      await f.page.locator('[data-create-button]').click();
      await expect.poll(() => f.held.length).toBe(1);
      await session(f.page, 'synthetic-B');
      await f.page.locator('[data-retry]').click();
      await expect(f.page.locator('[data-list]')).toContainText('B Private Player');
      await f.page.locator('[data-create-name]').fill('New draft');
      await release(f.held[0], f.page, { json: { player: player('Old saved') } });
      await expect(f.page.locator('[data-create-name]')).toHaveValue('New draft');
      await expect(f.page.locator('[data-list]')).toContainText('B Private Player');
      expect(f.writes).toHaveLength(1);
      expect(f.reads).toHaveLength(2);
    } finally { await f.context.close(); }
  });

  test(`Admin Players signout and A-B-A invalidate old retained controls (${device})`, async ({ browser }) => {
    const f = await open(browser, mobile);
    try {
      await f.page.locator('[data-list] summary').click();
      await f.page.evaluate(() => { window.__oldGrant = document.querySelector('.grant'); });
      await session(f.page, 'synthetic-B');
      await session(f.page, 'synthetic-A');
      await f.page.locator('[data-retry]').click();
      await expect(f.page.locator('[data-list]')).toContainText('A Private Player');
      f.page.on('dialog', dialog => dialog.accept());
      await f.page.evaluate(() => window.__oldGrant.click());
      expect(f.writes).toHaveLength(0);
      await session(f.page, null, 'storage');
      await expect(f.page.locator('[data-list]')).toBeEmpty();
      await expect(f.page.locator('[data-retry]')).toBeHidden();
      await expect(f.page.locator('[data-create-button]')).toBeDisabled();
    } finally { await f.context.close(); }
  });

  for (const action of ['create', 'roster', 'eligibility']) test(`Admin Players eventless stale ${action} action dispatches no write (${device})`, async ({ browser }) => {
    const f = await open(browser, mobile);
    try {
      await f.page.locator('[data-list] summary').click();
      if (action === 'create') await f.page.locator('[data-create-name]').fill('Old draft');
      if (action === 'eligibility') await f.page.getByPlaceholder('Example: suspended pending league review', { exact: true }).fill('Synthetic reason');
      await session(f.page, 'synthetic-B', null);
      f.page.on('dialog', dialog => dialog.accept());
      const button = action === 'create' ? f.page.locator('[data-create-button]') : action === 'roster' ? f.page.getByRole('button', { name: 'Add to team', exact: true }) : f.page.getByRole('button', { name: 'Mark ineligible', exact: true });
      await button.click();
      await expect(f.page.locator('[data-list]')).toBeEmpty();
      expect(f.writes).toHaveLength(0);
    } finally { await f.context.close(); }
  });

  test(`Admin Players pending read is single flight and denial never replays (${device})`, async ({ browser }) => {
    const f = await open(browser, mobile);
    try {
      await session(f.page, 'synthetic-B');
      f.hold();
      await f.page.locator('[data-retry]').click();
      await expect.poll(() => f.held.length).toBe(1);
      await f.page.evaluate(() => document.querySelector('[data-retry]').click());
      expect(f.reads).toHaveLength(2);
      await release(f.held[0], f.page, { json: directory('B') });
      await expect(f.page.locator('[data-list]')).toContainText('B Private Player');
      await f.page.locator('[data-list] summary').click();
      f.fail({ status: 403, json: { error: 'Not an admin' } });
      f.page.on('dialog', dialog => dialog.accept());
      await f.page.getByRole('button', { name: 'Grant admin', exact: true }).click();
      await expect(f.page.locator('[data-status]')).toHaveText('Not an admin');
      expect(f.writes).toHaveLength(1);
    } finally { await f.context.close(); }
  });

  test(`Admin Players current401 expires only its own session (${device})`, async ({ browser }) => {
    const f = await open(browser, mobile);
    try {
      await session(f.page, 'synthetic-B');
      f.fail({ status: 401, json: { error: 'Expired' } });
      await f.page.locator('[data-retry]').click();
      await expect(f.page.locator('[data-status]')).toContainText('Sign in from Profile');
      expect(await f.page.evaluate(() => sessionStorage.getItem('fd.accessToken'))).toBeNull();
      await expect(f.page.locator('[data-list]')).toBeEmpty();
      await expect(f.page.locator('[data-create-button]')).toBeDisabled();
      expect(f.writes).toHaveLength(0);
    } finally { await f.context.close(); }
  });

  test(`Admin Players old write cannot release a newer pending write (${device})`, async ({ browser }) => {
    const f = await open(browser, mobile);
    try {
      f.hold();
      await f.page.locator('[data-create-name]').fill('Old request');
      await f.page.locator('[data-create-button]').click();
      await expect.poll(() => f.held.length).toBe(1);
      await session(f.page, 'synthetic-B');
      await f.page.locator('[data-retry]').click();
      await expect(f.page.locator('[data-list]')).toContainText('B Private Player');
      f.hold();
      await f.page.locator('[data-create-name]').fill('New request');
      await f.page.locator('[data-create-button]').click();
      await expect.poll(() => f.held.length).toBe(2);
      await release(f.held[0], f.page, { status: 401, json: { error: 'Old expired session' } });
      await expect(f.page.locator('[data-create-button]')).toBeDisabled();
      await expect(f.page.locator('[data-create-name]')).toHaveValue('New request');
      expect(await f.page.evaluate(() => sessionStorage.getItem('fd.accessToken'))).toBe('synthetic-B');
      await f.page.evaluate(() => document.querySelector('[data-create-form]').dispatchEvent(new Event('submit', { cancelable: true })));
      expect(f.writes).toHaveLength(2);
      await release(f.held[1], f.page, { json: { player: player('New saved') } });
      await expect(f.page.locator('[data-status]')).toContainText('New saved Private Player created as Unclaimed');
      await expect(f.page.locator('[data-create-button]')).toBeEnabled();
      expect(f.writes.map(row => row.token)).toEqual(['Bearer synthetic-A', 'Bearer synthetic-B']);
    } finally { await f.context.close(); }
  });

  test(`Admin Players pending create rejects a second submit and recovers once (${device})`, async ({ browser }) => {
    const f = await open(browser, mobile);
    try {
      f.hold();
      await f.page.locator('[data-create-name]').fill('Synthetic create');
      await f.page.locator('[data-create-button]').click();
      await expect.poll(() => f.held.length).toBe(1);
      await f.page.evaluate(() => document.querySelector('[data-create-form]').dispatchEvent(new Event('submit', { cancelable: true })));
      await expect(f.page.locator('[data-create-button]')).toBeDisabled();
      expect(f.writes).toHaveLength(1);
      await release(f.held[0], f.page, { json: { player: player('Saved') } });
      await expect(f.page.locator('[data-status]')).toContainText('created as Unclaimed');
      await expect(f.page.locator('[data-create-button]')).toBeEnabled();
      expect(f.writes).toHaveLength(1);
    } finally { await f.context.close(); }
  });

  for (const action of ['roster', 'eligibility', 'role']) test(`Admin Players current-session ${action} retains confirmation and exact command (${device})`, async ({ browser }) => {
    const f = await open(browser, mobile);
    try {
      await f.page.locator('[data-list] summary').click();
      let confirmations = 0;
      f.page.on('dialog', dialog => { confirmations++; return dialog.accept(); });
      if (action === 'eligibility') await f.page.getByPlaceholder('Example: suspended pending league review', { exact: true }).fill('Synthetic reason');
      const name = action === 'roster' ? 'Add to team' : action === 'eligibility' ? 'Mark ineligible' : 'Grant admin';
      await f.page.getByRole('button', { name, exact: true }).click();
      await expect.poll(() => f.writes.length).toBe(1);
      expect(confirmations).toBe(1);
      expect(f.writes[0].token).toBe('Bearer synthetic-A');
      expect(f.writes[0].path).toBe('/api/admin/players/synthetic-A/admin-role');
      expect(f.writes[0].body).toMatchObject(action === 'roster' ? { operation: 'roster-membership', seasonId: 'season-owned', teamId: 'team-owned', active: true } : action === 'eligibility' ? { operation: 'competition-eligibility', seasonId: 'season-owned', eligible: false, reason: 'Synthetic reason' } : { enabled: true });
      if (action === 'role') {
        await expect(f.page.locator('[data-status]')).toContainText('now has league-admin access');
        await f.page.locator('[data-list] summary').click();
        await expect(f.page.getByRole('button', { name: 'Revoke admin', exact: true })).toBeVisible();
      }
      else await expect(f.page.locator('[data-status]')).toContainText(action === 'roster' ? 'added to' : 'eligible to compete');
    } finally { await f.context.close(); }
  });
}

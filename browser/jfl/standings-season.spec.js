import { test, expect } from '@playwright/test';
import { renderJflModernStandings } from '../../src/jflModernStandings.js';
import { enhancePublicSeasonSelection } from '../../src/publicSeasonSelectionEnhancer.js';

const sourceMode = process.env.PLAYWRIGHT_STANDINGS_SOURCE === '1';
const seasons = [{ id: 'complete', name: 'Prior', status: 'complete' },
  { id: 'active', name: 'Current', status: 'active' },
  { id: 'registration', name: 'Next', status: 'registration', teamCount: 4, teamCapacity: 8,
    rosteredPlayerCount: 20, openTeamSlots: 4 }];

test.beforeAll(async ({ request }) => {
  if (sourceMode) return;
  expect(process.env.PLAYWRIGHT_EXPECTED_SHA).toMatch(/^[a-f0-9]{40}$/);
  const health = await request.get('/health/environment');
  expect(health.ok()).toBe(true);
  expect(await health.json()).toMatchObject({ environment: 'jfl', expectedSupabaseSchema: 'jfl',
    ok: true, versionTag: process.env.PLAYWRIGHT_EXPECTED_SHA });
});

async function openStandings(browser, mobile, query = '?season=active', available = seasons, initialHold = '') {
  const origin = sourceMode ? 'https://standings.test' : process.env.PLAYWRIGHT_BASE_URL || 'https://jfl.fremontderby.com';
  const context = await browser.newContext({ baseURL: origin,
    viewport: mobile ? { width: 320, height: 844 } : { width: 1280, height: 900 }, isMobile: mobile, hasTouch: mobile });
  await context.addInitScript(() => localStorage.setItem('fd.standingsSeasonId', 'complete'));
  const page = await context.newPage();
  let heldId = initialHold, failureId = '', emptyId = '', bootstrapFailure = false;
  const held = [];
  const requests = [];
  await context.route('**/api/**', async route => {
    expect(route.request().method(), 'Public standings proof is GET only').toBe('GET');
    const path = new URL(route.request().url()).pathname;
    requests.push(path);
    const respond = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (path === '/api/seasons') return bootstrapFailure ? respond({ error: 'Unavailable' }, 503) : respond({ seasons: available });
    const match = path.match(/^\/api\/seasons\/(active|complete|registration)\/(team|individual)-standings$/);
    if (!match) return respond({}, 404);
    const [, id, kind] = match;
    const finish = (fail = false) => fail || failureId === id ? respond({ error: 'Unavailable' }, 503) : respond({ standings:
      emptyId === id ? [] : kind === 'team' ? [{ team_name: id + ' team', standings_rank: 2,
        games_played: 3, maximum_matches: 7, team_wins: 2, team_losses: 1, standing_points: 6,
        match_points: 5, match_points_against: 4, point_differential: 1, forfeits_won: 0, forfeits_lost: 0 }]
        : [{ display_name: id + ' player', standings_rank: 3, wins: 2, losses: 1, matches_played: 3,
          win_percentage: 2 / 3, games_won: 10, games_lost: 8, game_differential: 2,
          is_prize_eligible: true, prize_rank: 2, minimum_matches: 3 }] });
    if (heldId === id) { held.push({ finish }); return; }
    return finish();
  });
  await context.route('**/auth/**', route => route.fulfill({ status: 401, body: '{}' }));
  if (sourceMode) {
    const response = await enhancePublicSeasonSelection(new Response(renderJflModernStandings(),
      { headers: { 'content-type': 'text/html' } }), '/standings');
    const html = await response.text();
    await context.route('**/standings*', route => route.fulfill({ contentType: 'text/html', body: html }));
  }
  await page.goto('/standings' + query);
  return { page, context, held, requests, hold: id => { heldId = id; }, fail: id => { failureId = id; },
    empty: id => { emptyId = id; }, failBootstrap: value => { bootstrapFailure = value; },
    release: async (fail = false) => { heldId = ''; await Promise.all(held.splice(0).map(item => item.finish(fail))); } };
}

const teamList = page => page.locator('[data-team-standings-list]');
const playerList = page => page.locator('[data-player-standings-list]');
const selector = page => page.locator('[data-standings-season]');
const status = page => page.locator('[data-standings-status]');

for (const mobile of [false, true]) {
  test.describe(mobile ? '320px phone' : 'desktop', () => {
    test('pending season clears prior team/player rankings and registration counts', async ({ browser }) => {
      const harness = await openStandings(browser, mobile, '?season=registration');
      const { page, context } = harness;
      try {
        await expect(teamList(page)).toContainText('registration team');
        await expect(page.locator('[data-registration-progress]')).toBeVisible();
        harness.hold('active');
        await selector(page).selectOption('active');
        await expect(status(page)).toHaveText('Loading standings…');
        await expect(teamList(page)).toBeEmpty();
        await expect(playerList(page)).toBeEmpty();
        await expect(page.locator('[data-registration-progress]')).toBeHidden();
        await expect(page.locator('[data-team-standings-empty]')).toContainText('Loading');
        await harness.release();
        await expect(teamList(page)).toContainText('active team');
      } finally { await context.close(); }
    });

    for (const fail of [false, true]) {
      test('late ' + (fail ? 'error' : 'success') + ' cannot replace newer season results', async ({ browser }) => {
        const harness = await openStandings(browser, mobile);
        const { page, context } = harness;
        try {
          await expect(teamList(page)).toContainText('active team');
          harness.hold('complete');
          await selector(page).selectOption('complete');
          await expect.poll(() => harness.held.length).toBe(2);
          await selector(page).selectOption('registration');
          await expect(teamList(page)).toContainText('registration team');
          await harness.release(fail);
          await page.waitForLoadState('networkidle');
          await expect(selector(page)).toHaveValue('registration');
          await expect(teamList(page)).toContainText('registration team');
          await expect(playerList(page)).toContainText('registration player');
          await expect(status(page)).toHaveText('Registration progress loaded');
          await expect(page.locator('[data-standings-state]')).toBeHidden();
        } finally { await context.close(); }
      });
    }

    test('manual selection updates URL and keeps individual view on reload', async ({ browser }) => {
      const { page, context } = await openStandings(browser, mobile, '?season=active&view=individuals&source=share#results');
      try {
        await expect(playerList(page)).toContainText('active player');
        await selector(page).selectOption('complete');
        await expect(playerList(page)).toContainText('complete player');
        await expect(page).toHaveURL(/season=complete&view=individuals&source=share#results$/);
        await page.reload();
        await expect(selector(page)).toHaveValue('complete');
        await expect(playerList(page)).toContainText('complete player');
        await expect(page.locator('[data-standings-tab="individuals"]')).toHaveAttribute('aria-selected', 'true');
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await expect(page.locator('a[href="/trades"]')).toHaveCount(0);
      } finally { await context.close(); }
    });

    test('failure clears stale rows and retry recovers current season', async ({ browser }) => {
      const harness = await openStandings(browser, mobile);
      const { page, context } = harness;
      try {
        await expect(teamList(page)).toContainText('active team');
        harness.fail('complete');
        await selector(page).selectOption('complete');
        await expect(status(page)).toHaveText('Could not load standings');
        await expect(teamList(page)).toBeEmpty();
        await expect(playerList(page)).toBeEmpty();
        await expect(page.locator('[data-team-standings-empty]')).not.toContainText('No team standings');
        harness.fail('');
        await page.locator('[data-standings-retry]').click();
        await expect(teamList(page)).toContainText('complete team');
        await expect(selector(page)).toHaveValue('complete');
      } finally { await context.close(); }
    });

    test('bootstrap failure can retry without losing explicit selection', async ({ browser }) => {
      const harness = await openStandings(browser, mobile);
      const { page, context } = harness;
      try {
        await expect(teamList(page)).toContainText('active team');
        harness.failBootstrap(true);
        await page.reload();
        await expect(status(page)).toHaveText('Could not load standings');
        await expect(teamList(page)).toBeEmpty();
        harness.failBootstrap(false);
        await page.locator('[data-standings-retry]').click();
        await expect(teamList(page)).toContainText('active team');
      } finally { await context.close(); }
    });

    test('successful empty results remain empty without fallback', async ({ browser }) => {
      const harness = await openStandings(browser, mobile);
      const { page, context } = harness;
      try {
        await expect(teamList(page)).toContainText('active team');
        harness.empty('complete');
        await selector(page).selectOption('complete');
        await expect(status(page)).toHaveText('Standings loaded');
        await expect(teamList(page)).toBeEmpty();
        await expect(playerList(page)).toBeEmpty();
        await expect(page.locator('[data-team-standings-empty]')).toContainText('No team standings');
        await expect(selector(page)).toHaveValue('complete');
      } finally { await context.close(); }
    });

    test('superseded initial fallback cannot fetch or select another season', async ({ browser }) => {
      const harness = await openStandings(browser, mobile, '', seasons, 'active');
      const { page, context } = harness;
      try {
        await expect.poll(() => harness.held.length).toBe(2);
        await selector(page).selectOption('registration');
        await expect(teamList(page)).toContainText('registration team');
        await harness.release(true);
        await page.waitForLoadState('networkidle');
        await expect(selector(page)).toHaveValue('registration');
        await expect(status(page)).toHaveText('Registration progress loaded');
        expect(harness.requests.some(path => path.includes('/complete/'))).toBe(false);
      } finally { await context.close(); }
    });

    test('initial API fallback is preserved when default season is unavailable', async ({ browser }) => {
      const harness = await openStandings(browser, mobile, '', seasons, 'active');
      const { page, context } = harness;
      try {
        await expect.poll(() => harness.held.length).toBe(2);
        await harness.release(true);
        await expect(teamList(page)).toContainText('complete team');
        await expect(selector(page)).toHaveValue('complete');
        await expect(page).toHaveURL(/season=complete$/);
      } finally { await context.close(); }
    });

    test('explicit API failure never silently falls back to a different season', async ({ browser }) => {
      const harness = await openStandings(browser, mobile, '?season=active', seasons, 'active');
      const { page, context } = harness;
      try {
        await expect.poll(() => harness.held.length).toBe(2);
        await harness.release(true);
        await expect(status(page)).toHaveText('Could not load standings');
        await expect(selector(page)).toHaveValue('active');
        await expect(teamList(page)).toBeEmpty();
        expect(harness.requests.some(path => path.includes('/complete/'))).toBe(false);
      } finally { await context.close(); }
    });

    test('same-season reload invalidates the previous request', async ({ browser }) => {
      const harness = await openStandings(browser, mobile);
      const { page, context } = harness;
      try {
        await expect(teamList(page)).toContainText('active team');
        harness.hold('active');
        await page.locator('[data-standings-load]').click();
        await expect.poll(() => harness.held.length).toBe(2);
        harness.hold('');
        harness.empty('active');
        await page.locator('[data-standings-load]').click();
        await expect(status(page)).toHaveText('Standings loaded');
        await harness.release(true);
        await page.waitForLoadState('networkidle');
        await expect(status(page)).toHaveText('Standings loaded');
        await expect(teamList(page)).toBeEmpty();
        await expect(page.locator('[data-standings-state]')).toBeHidden();
      } finally { await context.close(); }
    });

    for (const query of ['', '?season=active']) {
      test('canonical default beats memory and valid explicit season stays authoritative ' + query, async ({ browser }) => {
        const { page, context } = await openStandings(browser, mobile, query);
        try {
          await expect(teamList(page)).toContainText('active team');
          await expect(selector(page)).toHaveValue('active');
        } finally { await context.close(); }
      });
    }

    test('no public seasons has honest empty state', async ({ browser }) => {
      const { page, context } = await openStandings(browser, mobile, '', []);
      try {
        await expect(page.locator('[data-standings-state]')).toHaveText('No published season yet.');
        await expect(selector(page)).toBeDisabled();
        await expect(teamList(page)).toBeEmpty();
        await expect(playerList(page)).toBeEmpty();
      } finally { await context.close(); }
    });
  });
}

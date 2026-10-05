import { test, expect } from '@playwright/test';
import { renderJflPlayersDirectory } from '../../src/jflPlayersDirectory.js';

const sourceMode = process.env.PLAYWRIGHT_DIRECTORY_SOURCE === '1';
const seasons = [{ id: 'complete', name: 'Prior season', status: 'complete' },
  { id: 'active', name: 'Current season', status: 'active' }];

async function openDirectory(browser, request, mobile, query = '', available = seasons) {
  if (!sourceMode) {
    expect(process.env.PLAYWRIGHT_EXPECTED_SHA).toMatch(/^[a-f0-9]{40}$/);
    const health = await request.get('/health/environment');
    expect(health.ok()).toBe(true);
    expect(await health.json()).toMatchObject({ environment: 'jfl', expectedSupabaseSchema: 'jfl',
      ok: true, versionTag: process.env.PLAYWRIGHT_EXPECTED_SHA });
  }
  const origin = sourceMode ? 'https://jfl.directory.test' : process.env.PLAYWRIGHT_BASE_URL || 'https://jfl.fremontderby.com';
  const context = await browser.newContext({ baseURL: origin,
    viewport: mobile ? { width: 320, height: 844 } : { width: 1280, height: 900 }, isMobile: mobile, hasTouch: mobile });
  await context.addInitScript(() => localStorage.setItem('fd.playersSeasonId', 'complete'));
  const page = await context.newPage();
  let heldId = '', failureId = '', emptyId = '';
  const held = [];
  await context.route('**/api/**', async route => {
    expect(route.request().method(), 'Directory browser proof is read-only').toBe('GET');
    const path = new URL(route.request().url()).pathname;
    const respond = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
    if (path === '/api/seasons') return respond({ seasons: available });
    const match = path.match(/^\/api\/seasons\/(active|complete)\/(individual|team)-standings$/);
    if (match) {
      const [, id, type] = match;
      const finish = (fail = false) => fail || failureId === id ? respond({ error: 'Unavailable' }, 503)
        : respond({ standings: emptyId === id ? [] : type === 'individual' ? [{
          player_id: id + '-player', display_name: id === 'active' ? 'Current player' : 'Prior player',
          matches_played: 4, wins: 3, losses: 1, standings_rank: 1,
        }] : [{ team_name: id === 'active' ? 'Current team' : 'Prior team', roster: [{ playerId: id + '-player' }] }] });
      if (heldId === id) { held.push({ finish }); return; }
      return finish();
    }
    return respond({}, 404);
  });
  await context.route('**/auth/**', route => route.fulfill({ status: 401, body: '{}' }));
  if (sourceMode) await context.route('**/players*', route => route.fulfill({ contentType: 'text/html', body: renderJflPlayersDirectory() }));
  await page.goto('/players' + query);
  return { context, page, held, hold: id => { heldId = id; }, fail: id => { failureId = id; },
    empty: id => { emptyId = id; }, release: async (fail = false) => {
      heldId = ''; await Promise.all(held.splice(0).map(item => item.finish(fail)));
    } };
}

for (const mobile of [false, true]) {
  test.describe(mobile ? '320px phone' : 'desktop', () => {
    test('explicit season survives memory, reload and result navigation', async ({ browser, request }) => {
      const { page, context } = await openDirectory(browser, request, mobile, '?season=active&view=directory#players');
      try {
        await expect(page.locator('[data-list]')).toContainText('Current player');
        await expect(page.locator('[data-season]')).toHaveValue('active');
        await expect(page.getByRole('link', { name: 'View results', exact: true })).toHaveAttribute('href', '/standings?view=individuals&season=active');
        await page.reload();
        await expect(page.locator('[data-list]')).toContainText('Current player');
        await page.locator('[data-season]').selectOption('complete');
        await expect(page.locator('[data-list]')).toContainText('Prior player');
        await expect(page).toHaveURL(/season=complete&view=directory#players$/);
        await page.reload();
        await expect(page.locator('[data-list]')).toContainText('Prior player');
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await expect(page.locator('a[href="/trades"]')).toHaveCount(0);
      } finally { await context.close(); }
    });

    for (const query of ['', '?season=missing']) {
      test('canonical active default beats stale memory ' + (query || 'without URL choice'), async ({ browser, request }) => {
        const { page, context } = await openDirectory(browser, request, mobile, query);
        try {
          await expect(page.locator('[data-list]')).toContainText('Current player');
          await expect(page.locator('[data-season]')).toHaveValue('active');
          await expect(page).toHaveURL(/season=active$/);
        } finally { await context.close(); }
      });
    }

    test('pending old season clears rows and cannot replace current results', async ({ browser, request }) => {
      const fixture = await openDirectory(browser, request, mobile, '?season=active');
      const { page, context } = fixture;
      try {
        await expect(page.locator('[data-list]')).toContainText('Current player');
        fixture.hold('complete');
        await page.locator('[data-season]').selectOption('complete');
        await expect.poll(() => fixture.held.length).toBe(2);
        await expect(page.locator('[data-list] li')).toHaveCount(0);
        await expect(page.locator('[data-empty]')).toBeHidden();
        await page.locator('[data-search]').fill('player');
        await expect(page.locator('[data-list] li')).toHaveCount(0);
        await page.locator('[data-season]').selectOption('active');
        await expect(page.locator('[data-list]')).toContainText('Current player');
        await fixture.release();
        await page.waitForLoadState('networkidle');
        await expect(page.locator('[data-list]')).toContainText('Current player');
        await expect(page.getByRole('link', { name: 'View results', exact: true })).toHaveAttribute('href', '/standings?view=individuals&season=active');
      } finally { await context.close(); }
    });

    test('failed selected season clears stale results and retry preserves choice', async ({ browser, request }) => {
      const fixture = await openDirectory(browser, request, mobile, '?season=active');
      const { page, context } = fixture;
      try {
        await expect(page.locator('[data-list]')).toContainText('Current player');
        fixture.fail('complete');
        await page.locator('[data-season]').selectOption('complete');
        await expect(page.locator('[data-status]')).toContainText('unavailable');
        await expect(page.locator('[data-list] li')).toHaveCount(0);
        await expect(page.locator('[data-empty]')).toBeHidden();
        fixture.fail('');
        await page.getByRole('button', { name: 'Retry', exact: true }).click();
        await expect(page.locator('[data-list]')).toContainText('Prior player');
        await expect(page.locator('[data-season]')).toHaveValue('complete');
      } finally { await context.close(); }
    });

    test('late old-season error cannot erase current successful results', async ({ browser, request }) => {
      const fixture = await openDirectory(browser, request, mobile, '?season=active');
      const { page, context } = fixture;
      try {
        await expect(page.locator('[data-list]')).toContainText('Current player');
        fixture.hold('complete');
        await page.locator('[data-season]').selectOption('complete');
        await expect.poll(() => fixture.held.length).toBe(2);
        await page.locator('[data-season]').selectOption('active');
        await expect(page.locator('[data-list]')).toContainText('Current player');
        await fixture.release(true);
        await page.waitForLoadState('networkidle');
        await expect(page.locator('[data-status]')).toContainText('1 of 1 players');
        await expect(page.locator('[data-list]')).toContainText('Current player');
      } finally { await context.close(); }
    });

    test('successful empty season shows truthful empty state', async ({ browser, request }) => {
      const fixture = await openDirectory(browser, request, mobile, '?season=active');
      const { page, context } = fixture;
      try {
        await expect(page.locator('[data-list]')).toContainText('Current player');
        fixture.empty('complete');
        await page.locator('[data-season]').selectOption('complete');
        await expect(page.locator('[data-empty]')).toBeVisible();
        await expect(page.locator('[data-status]')).toContainText('No players are listed');
        await expect(page.locator('[data-list] li')).toHaveCount(0);
      } finally { await context.close(); }
    });

    test('no published season exposes no stale links', async ({ browser, request }) => {
      const { page, context } = await openDirectory(browser, request, mobile, '?season=missing', []);
      try {
        await expect(page.locator('[data-status]')).toContainText('No published season');
        await expect(page.locator('[data-list] li')).toHaveCount(0);
        await expect(page).toHaveURL(/\/players$/);
      } finally { await context.close(); }
    });
  });
}

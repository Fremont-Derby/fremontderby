import { test, expect } from '@playwright/test';
import { renderJflPublicPlayoffs } from '../../src/jflPublicPlayoffs.js';

const sourceMode = process.env.PLAYWRIGHT_PLAYOFFS_SOURCE === '1';
const seasons = [{ id: 'complete', name: 'Prior season', status: 'complete' },
  { id: 'active', name: 'Current season', status: 'active' }];

test.beforeAll(async ({ request }) => {
  if (sourceMode) return;
  expect(process.env.PLAYWRIGHT_EXPECTED_SHA).toMatch(/^[a-f0-9]{40}$/);
  const health = await request.get('/health/environment');
  expect(health.ok()).toBe(true);
  expect(await health.json()).toMatchObject({ environment: 'jfl', expectedSupabaseSchema: 'jfl',
    ok: true, versionTag: process.env.PLAYWRIGHT_EXPECTED_SHA });
});

async function openBracket(browser, mobile, query = '', available = seasons) {
  const origin = sourceMode ? 'https://jfl.bracket.test' : process.env.PLAYWRIGHT_BASE_URL || 'https://jfl.fremontderby.com';
  const context = await browser.newContext({ baseURL: origin,
    viewport: mobile ? { width: 320, height: 844 } : { width: 1280, height: 900 }, isMobile: mobile, hasTouch: mobile });
  await context.addInitScript(() => localStorage.setItem('fd.playoffsSeasonId', 'complete'));
  const page = await context.newPage();
  let heldId = '', failureId = '', emptyId = '', holdSeasons = false, failSeasons = false;
  const held = [];
  const bootHeld = [];
  await context.route('**/api/**', async route => {
    expect(route.request().method(), 'Bracket proof uses public GET requests only').toBe('GET');
    const path = new URL(route.request().url()).pathname;
    const respond = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
    if (path === '/api/seasons') {
      const finish = (fail = false) => fail || failSeasons ? respond({ error: 'Unavailable' }, 503) : respond({ seasons: available });
      if (holdSeasons) { bootHeld.push({ finish }); return; }
      return finish();
    }
    const match = path.match(/^\/api\/seasons\/(active|complete)\/schedule$/);
    if (match) {
      const id = match[1];
      const finish = (fail = false) => fail || failureId === id ? respond({ error: 'Unavailable' }, 503)
        : respond({ rounds: emptyId === id ? [] : [{ stage: 'semifinal', scheduledOn: '2026-10-01', status: 'finalized', matches: [{
          teamAName: id === 'active' ? 'Current winners' : 'Prior winners', teamBName: 'Chalk',
          status: 'finalized', teamAScore: 3, teamBScore: 2,
          anchorTiebreaker: { playerAName: 'Anchor A', playerBName: 'Anchor B', scoreA: 4, scoreB: 3, status: 'finalized' },
        }] }] });
      if (heldId === id) { held.push({ finish }); return; }
      return finish();
    }
    return respond({}, 404);
  });
  await context.route('**/auth/**', route => route.fulfill({ status: 401, body: '{}' }));
  if (sourceMode) await context.route('**/playoffs*', route => route.fulfill({ contentType: 'text/html', body: renderJflPublicPlayoffs() }));
  await page.goto('/playoffs' + query);
  return { context, page, held, bootHeld, hold: id => { heldId = id; }, fail: id => { failureId = id; },
    empty: id => { emptyId = id; }, holdBoot: () => { holdSeasons = true; }, failBoot: value => { failSeasons = value; },
    release: async (fail = false) => { heldId = ''; await Promise.all(held.splice(0).map(item => item.finish(fail))); },
    releaseBoot: async (fail = false) => { holdSeasons = false; await Promise.all(bootHeld.splice(0).map(item => item.finish(fail))); } };
}

for (const mobile of [false, true]) {
  test.describe(mobile ? '320px phone' : 'desktop', () => {
    test('explicit season survives memory, reload and selection', async ({ browser }) => {
      const { page, context } = await openBracket(browser, mobile, '?season=active&view=bracket#rounds');
      try {
        await expect(page.locator('[data-rounds]')).toContainText('Current winners');
        await expect(page.locator('[data-season]')).toHaveValue('active');
        await page.reload();
        await expect(page.locator('[data-rounds]')).toContainText('Current winners');
        await page.locator('[data-season]').selectOption('complete');
        await expect(page.locator('[data-rounds]')).toContainText('Prior winners');
        await expect(page).toHaveURL(/season=complete&view=bracket#rounds$/);
        await page.reload();
        await expect(page.locator('[data-rounds]')).toContainText('Prior winners');
        await expect(page.locator('[data-rounds]')).toContainText('Anchor tiebreaker: Anchor A vs Anchor B');
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await expect(page.locator('a[href="/trades"]')).toHaveCount(0);
      } finally { await context.close(); }
    });
    for (const query of ['', '?season=missing']) {
      test('canonical active default beats stale memory ' + (query || 'without URL choice'), async ({ browser }) => {
        const { page, context } = await openBracket(browser, mobile, query);
        try {
          await expect(page.locator('[data-rounds]')).toContainText('Current winners');
          await expect(page.locator('[data-season]')).toHaveValue('active');
          await expect(page).toHaveURL(/season=active$/);
        } finally { await context.close(); }
      });
    }
    for (const failLate of [false, true]) {
      test('late ' + (failLate ? 'error' : 'success') + ' cannot replace current bracket', async ({ browser }) => {
        const fixture = await openBracket(browser, mobile, '?season=active');
        const { page, context } = fixture;
        try {
          await expect(page.locator('[data-rounds]')).toContainText('Current winners');
          fixture.hold('complete');
          await page.locator('[data-season]').selectOption('complete');
          await expect.poll(() => fixture.held.length).toBe(1);
          await expect(page.locator('[data-rounds]')).toBeEmpty();
          await expect(page.locator('[data-empty]')).toBeHidden();
          await page.locator('[data-season]').selectOption('active');
          await expect(page.locator('[data-rounds]')).toContainText('Current winners');
          await fixture.release(failLate);
          await page.waitForLoadState('networkidle');
          await expect(page.locator('[data-rounds]')).toContainText('Current winners');
          await expect(page.locator('[data-status]')).toContainText('1 postseason round');
        } finally { await context.close(); }
      });
    }
    test('failed season clears old results and retry preserves selection', async ({ browser }) => {
      const fixture = await openBracket(browser, mobile, '?season=active');
      const { page, context } = fixture;
      try {
        await expect(page.locator('[data-rounds]')).toContainText('Current winners');
        fixture.fail('complete');
        await page.locator('[data-season]').selectOption('complete');
        await expect(page.locator('[data-status]')).toContainText('unavailable');
        await expect(page.locator('[data-rounds]')).toBeEmpty();
        await expect(page.locator('[data-empty]')).toBeHidden();
        fixture.fail('');
        await page.getByRole('button', { name: 'Retry', exact: true }).click();
        await expect(page.locator('[data-rounds]')).toContainText('Prior winners');
        await expect(page.locator('[data-season]')).toHaveValue('complete');
      } finally { await context.close(); }
    });
    test('retry clears winners while seasons load and invalidates pending bracket', async ({ browser }) => {
      const fixture = await openBracket(browser, mobile, '?season=active');
      const { page, context } = fixture;
      try {
        await expect(page.locator('[data-rounds]')).toContainText('Current winners');
        fixture.hold('complete');
        await page.locator('[data-season]').selectOption('complete');
        await expect.poll(() => fixture.held.length).toBe(1);
        fixture.holdBoot();
        await page.getByRole('button', { name: 'Retry', exact: true }).click();
        await expect.poll(() => fixture.bootHeld.length).toBe(1);
        await expect(page.locator('[data-season]')).toBeDisabled();
        await fixture.release();
        await expect(page.locator('[data-rounds]')).toBeEmpty();
        await expect(page.locator('[data-status]')).toContainText('Loading seasons');
        await fixture.releaseBoot();
        await expect(page.locator('[data-rounds]')).toContainText('Prior winners');
      } finally { await context.close(); }
    });
    test('failed and overlapping retries cannot restore stale bootstrap state', async ({ browser }) => {
      const fixture = await openBracket(browser, mobile, '?season=active');
      const { page, context } = fixture;
      try {
        await expect(page.locator('[data-rounds]')).toContainText('Current winners');
        fixture.failBoot(true);
        await page.getByRole('button', { name: 'Retry', exact: true }).click();
        await expect(page.locator('[data-status]')).toContainText('unavailable');
        await expect(page.locator('[data-rounds]')).toBeEmpty();
        await expect(page.locator('[data-empty]')).toBeHidden();
        fixture.failBoot(false);
        fixture.holdBoot();
        await page.getByRole('button', { name: 'Retry', exact: true }).click();
        await expect.poll(() => fixture.bootHeld.length).toBe(1);
        const old = fixture.bootHeld.shift();
        await page.getByRole('button', { name: 'Retry', exact: true }).click();
        await expect.poll(() => fixture.bootHeld.length).toBe(1);
        await fixture.releaseBoot();
        await expect(page.locator('[data-rounds]')).toContainText('Current winners');
        await old.finish(true);
        await page.waitForLoadState('networkidle');
        await expect(page.locator('[data-status]')).toContainText('1 postseason round');
      } finally { await context.close(); }
    });
    test('true empty bracket links to schedule in the selected season', async ({ browser }) => {
      const fixture = await openBracket(browser, mobile, '?season=active');
      const { page, context } = fixture;
      try {
        await expect(page.locator('[data-rounds]')).toContainText('Current winners');
        fixture.empty('complete');
        await page.locator('[data-season]').selectOption('complete');
        await expect(page.locator('[data-empty]')).toBeVisible();
        await expect(page.locator('[data-rounds]')).toBeEmpty();
        await expect(page.locator('[data-empty] a')).toHaveAttribute('href', '/schedule?season=complete');
      } finally { await context.close(); }
    });
    test('no public season is distinct from an unpublished bracket', async ({ browser }) => {
      const { page, context } = await openBracket(browser, mobile, '?season=missing', []);
      try {
        await expect(page.locator('[data-status]')).toHaveText('No published season is available.');
        await expect(page.locator('[data-rounds]')).toBeEmpty();
        await expect(page.locator('[data-empty]')).toBeHidden();
        await expect(page).toHaveURL(/\/playoffs$/);
      } finally { await context.close(); }
    });
  });
}

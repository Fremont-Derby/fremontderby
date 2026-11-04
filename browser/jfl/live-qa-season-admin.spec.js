import assert from 'node:assert/strict';
import { test, expect } from '@playwright/test';
import { assumePersona } from './persona.js';
import { observeAdminReads, loadAdminSeason } from './admin-read-recovery.js';

// #3562: read back existing eight-team seasons already persisted in isolated
// JFL staging. This is NOT season creation/scoring/closure automation.
// Do not reveal private QA history on the public season endpoints.
const qa = Object.freeze({
  regular: { id: 'a61b38f6-881f-2b96-8b4b-7db22dbc8764', status: 'active', matches: 28, rounds: 7 },
  playoff: { id: 'd26992c0-5987-a459-474c-e6352e85c926', status: 'playoffs', matches: 30, rounds: 8 },
});

test.skip(process.env.PLAYWRIGHT_LIVE_SEASON_READBACK !== '1',
  'Live QA history is read only on trusted permanent JFL pushes, never public PRs.');
// Public repository workflow artifacts must never retain actor token responses or
// QA roster/schedule screenshots. Assert state in CI without recording a trace.
test.use({ trace: 'off', screenshot: 'off', video: 'off' });

test.beforeAll(async ({ request }) => {
  const expectedSha = process.env.PLAYWRIGHT_EXPECTED_SHA || '';
  expect(expectedSha, 'Exact trusted JFL deployment SHA required').toMatch(/^[a-f0-9]{40}$/);
  const health = await request.get('/health/environment');
  expect(health.ok()).toBe(true);
  expect(await health.json()).toMatchObject({
    environment: 'jfl', expectedSupabaseSchema: 'jfl', ok: true, versionTag: expectedSha,
  });
});

// #3573: recover only core read throttles through the same controls an operator
// uses. Advisory readiness failures cannot authorize a retry or mask a bad load.
async function ready(page, target, reads) {
  await loadAdminSeason(page, target, reads, expect);
  await expect(page.locator('[data-season-selector]')).toHaveValue(target.id, { timeout: 45_000 });
  await expect(page.locator('[data-status]')).toContainText('read only', { timeout: 45_000 });
  await expect(page.locator('[data-team-count]')).toHaveText('8');
  await expect(page.locator('[data-round-count]')).toHaveText(String(target.rounds));
  await expect(page.locator('[data-team-count]')).toHaveText('8');
  await expect(page.locator('[data-season-status]')).toHaveText(target.status);
  await expect(page.locator('[data-teams-body] tr')).toHaveCount(8);
  await expect(page.locator('[data-rounds-body] tr')).toHaveCount(target.matches);
  await expect(page.locator('[data-save]')).toBeDisabled();
  await expect(page.locator('[data-publish]')).toBeDisabled();
  await expect(page.locator('[data-read-only-notice]')).toBeVisible();
}

for (const [device, viewport] of [['phone', { width: 390, height: 844 }], ['desktop', { width: 1280, height: 900 }]]) {
test(`admin reads both persisted QA schedules, changes season, and cannot accidentally republish (${device})`, async ({ browser }) => {
  const context = await browser.newContext({
    viewport, isMobile: device === 'phone', hasTouch: device === 'phone',
  });
  const page = await context.newPage();
  const unexpectedWrites = [];
  let selectedSeason = qa.regular.id;
  const reads = observeAdminReads(page, () => selectedSeason);
  try {
    await assumePersona(page, 'Admin Captain');
    await page.route('**/api/admin/**', route => {
      if (route.request().method() !== 'GET') {
        unexpectedWrites.push(new URL(route.request().url()).pathname);
        return route.abort();
      }
      return route.continue();
    });

    await page.goto('/season-setup?season=' + qa.regular.id);
    await ready(page, qa.regular, reads);

    // Inspect real rendered rows: seven weeks, exactly four distinct matches
    // per week, each of eight teams appears once each week, 28 unique pairings.
    const rows = await page.locator('[data-rounds-body] tr').evaluateAll(items => items.map(
      row => [...row.cells].map(cell => cell.textContent?.trim() || ''),
    ));
    const appearances = new Map();
    const pairings = new Set();
    for (let round = 1; round <= 7; round++) {
      const week = rows.filter(row => Number(row[0]) === round);
      assert.equal(week.length, 4, 'Week ' + round + ' must schedule four tables');
      assert.deepEqual(week.map(row => Number(row[2])).sort((a,b)=>a-b), [1,2,3,4]);
      const weekTeams = new Set();
      for (const row of week) {
        const names = row[3].split(' vs ').map(x => x.trim());
        assert.equal(names.length, 2, 'Two distinct team labels on each published match');
        assert.notEqual(names[0], names[1]);
        const key = [...names].sort().join(' / ');
        assert.equal(pairings.has(key), false, 'Repeated seven-week matchup: ' + key);
        pairings.add(key);
        for (const name of names) {
          assert.equal(weekTeams.has(name), false, 'Team appears twice during week ' + round);
          weekTeams.add(name);
          appearances.set(name, (appearances.get(name) || 0) + 1);
        }
      }
      assert.equal(weekTeams.size, 8);
    }
    assert.equal(pairings.size, 28);
    assert.equal(appearances.size, 8);
    assert.ok([...appearances.values()].every(count => count === 7));

    selectedSeason = qa.playoff.id;
    await page.locator('[data-season-selector]').selectOption(qa.playoff.id);
    await ready(page, qa.playoff, reads);
    await expect(page).toHaveURL(new RegExp('season=' + qa.playoff.id));
    await page.reload();
    await ready(page, qa.playoff, reads);
    assert.deepEqual(unexpectedWrites, [], 'QA season inspection must be GET-only');
  } finally {
    reads.dispose();
    await context.close();
  }
});
}

test('anonymous public season list excludes the existing full-length QA fixtures', async ({ request }) => {
  let response;
  for (let attempt = 0; attempt < 3; attempt++) {
    response = await request.get('/api/seasons');
    if (response.status() !== 429) break;
    const header = response.headers()['retry-after'];
    const numeric = header?.trim() ? Number(header) : NaN;
    const seconds = Number.isFinite(numeric) ? Math.ceil(numeric) : Math.ceil((Date.parse(header) - Date.now()) / 1000);
    console.info('Anonymous season read HTTP429; qualified Retry-After=' + (Number.isFinite(seconds) && seconds > 0 && seconds <= 60 ? seconds : 'unqualified'));
    expect(Number.isFinite(seconds) && seconds > 0 && seconds <= 60, 'Validated bounded Retry-After required; never guess').toBe(true);
    expect(attempt, 'Anonymous public read recovery exhausted').toBeLessThan(2);
    await new Promise(resolve => setTimeout(resolve, (seconds + 1) * 1000));
  }
  console.info('Anonymous season read final HTTP' + response.status());
  expect(response.status(), 'Public season read must succeed without bypass').toBe(200);
  expect(response.headers()['content-type']).toMatch(/application\/json/i);
  const body = await response.json();
  expect(Array.isArray(body.seasons)).toBe(true);
  const publicIds = new Set(body.seasons.map(season => season.id));
  expect(publicIds.has(qa.regular.id)).toBe(false);
  expect(publicIds.has(qa.playoff.id)).toBe(false);
});

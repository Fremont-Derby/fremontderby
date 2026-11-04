import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { renderScorePickerPage } from '../../src/scorePickerPage.js';

const matchup = '36560000-1000-4000-8000-000000000001';
const round = '36560000-1000-4000-8000-000000000002';
const oldTeam = '36560000-1000-4000-8000-000000000003';
const newTeam = '36560000-1000-4000-8000-000000000004';
function responses(current, captainOnly) {
  const label = current ? 'Current choice' : 'Old choice'; const team = current ? newTeam : oldTeam;
  return [{ matches: captainOnly ? [] : [{ player_match_id: current ? 'current-race' : 'old-race',
    team_match_id: matchup, scoring_team_id: team, scoring_team_name: label + ' team',
    team_a_name: label + ' team', team_b_name: 'Opponent', player_a_name: label + ' player',
    player_b_name: 'Other player', scheduled_on: '2026-11-04', round_number: 1, slot_number: 1, status: 'in_progress' }] },
  { teamManagement: { captain_teams: captainOnly ? [{ teamId: team, teamName: label + ' team',
    lineupRounds: [{ teamMatchId: matchup, roundId: round, scheduledOn: '2026-11-04', roundNumber: 1, opponentName: 'Opponent' }] }] : [] } }];
}
async function html() {
  if (process.env.SCORE_PICKER_HTML) return readFileSync(process.env.SCORE_PICKER_HTML, 'utf8');
  if (process.env.SCORE_PICKER_SOURCE !== 'bundled') return renderScorePickerPage();
  const config = JSON.parse(readFileSync(new URL('../../wrangler.jsonc', import.meta.url), 'utf8'));
  const entry = (config.env?.jfl?.main || config.main).split('/').pop();
  const { default: worker } = await import(new URL('../../dist/' + entry, import.meta.url).href);
  const response = await worker.fetch(new Request('https://picker-session.test/scorecard?match=' + matchup), { ENVIRONMENT: 'jfl' }, {});
  expect(response.status).toBe(200); return response.text();
}
async function open(browser, width, { hold = false, bodyIndex = null, captainOnly = false, currentTeam401 = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, baseURL: 'https://picker-session.test' });
  await context.addInitScript(({ bodyIndex }) => {
    if (!sessionStorage.getItem('fd.accessToken')) sessionStorage.setItem('fd.accessToken', 'session-a');
    if (bodyIndex === null) return;
    const native = window.fetch;
    window.fetch = async (...args) => {
      const response = await native(...args); const target = bodyIndex === 0 ? '/api/me/scorable-matches' : '/api/me/teams';
      if (String(args[0]) === target) {
        const original = response.json.bind(response);
        response.json = async () => { const body = await original(); window.__bodyWaiting = true;
          await new Promise(resolve => { window.__releaseBody = resolve; }); return body; };
      }
      return response;
    };
  }, { bodyIndex });
  const page = await context.newPage(); const pending = []; const reads = []; const errors = [];
  let holdReads = hold;
  page.on('pageerror', error => errors.push(error.message));
  await context.route('https://picker-session.test/**', async route => {
    const request = route.request(); const path = new URL(request.url()).pathname;
    if (path === '/scorecard') return route.fulfill({ contentType: 'text/html', body: await html() });
    if (request.method() !== 'GET' && path.startsWith('/api/')) { errors.push('Unexpected mutation'); return route.abort(); }
    const index = path === '/api/me/scorable-matches' ? 0 : path === '/api/me/teams' ? 1 : null;
    if (index === null) return route.fulfill({ status: 404, body: '' });
    reads.push(path);
    if (holdReads) { pending.push({ route, index }); return; }
    if (currentTeam401 && index === 1) return route.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
    const current = request.headers().authorization === 'Bearer session-b';
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(responses(current, captainOnly)[index]) });
  });
  await page.goto('/scorecard?match=' + matchup);
  return { context, page, pending, reads, errors, releaseReads() { holdReads = false; } };
}
async function change(page, token = 'session-b', signal = true) {
  await page.evaluate(({ token, signal }) => {
    if (token) sessionStorage.setItem('fd.accessToken', token); else sessionStorage.removeItem('fd.accessToken');
    if (signal) window.dispatchEvent(new Event('fd:session-changed'));
  }, { token, signal });
}
async function cleared(f) {
  await expect(f.page.locator('[data-status]')).toContainText('sign-in changed');
  await expect(f.page.locator('[data-filters]')).toBeHidden();
  await expect(f.page.locator('[data-list]')).not.toContainText('Old choice');
  await expect(f.page.locator('a[href*="' + oldTeam + '"]')).toHaveCount(0);
  for (const key of ['date', 'team', 'matchup', 'race']) {
    await expect(f.page.locator('[data-' + key + '] option')).toHaveCount(0);
    await expect(f.page.locator('[data-' + key + ']')).toBeDisabled();
  }
}
for (const width of [1280, 320]) {
  test.describe('Score picker session at ' + width + 'px', () => {
    for (const status of [200, 401, 429]) {
      test(`old${status} cannot erase a newer token or restore old choices`, async ({ browser }) => {
        const f = await open(browser, width, { hold: true });
        try {
          await expect.poll(() => f.pending.length).toBe(2); await change(f.page, 'session-b', false);
          for (const { route, index } of f.pending) await route.fulfill({ status: index === 0 ? status : 200,
            headers: { 'content-type': 'application/json', 'retry-after': '10' }, body: JSON.stringify(responses(false, false)[index]) });
          await cleared(f);
          expect(await f.page.evaluate(() => sessionStorage.getItem('fd.accessToken'))).toBe('session-b');
          expect(f.reads).toHaveLength(2); expect(f.errors).toEqual([]);
        } finally { await f.context.close(); }
      });
    }
    for (const bodyIndex of [0, 1]) {
      test(`change during body${bodyIndex + 1} drops the old parallel read`, async ({ browser }) => {
        const f = await open(browser, width, { bodyIndex });
        try {
          await expect.poll(() => f.page.evaluate(() => window.__bodyWaiting)).toBe(true);
          await change(f.page, 'session-b', false); await f.page.evaluate(() => window.__releaseBody());
          await cleared(f); expect(f.reads).toHaveLength(2); expect(f.errors).toEqual([]);
        } finally { await f.context.close(); }
      });
    }
    for (const captainOnly of [false, true]) {
      test(`ready ${captainOnly ? 'lineup' : 'race'} choices clear and explicit reload preserves matchup`, async ({ browser }) => {
        const f = await open(browser, width, { captainOnly });
        try {
          await expect(f.page.locator('[data-list]')).toContainText('Old choice');
          await change(f.page); await cleared(f); expect(f.reads).toHaveLength(2);
          await f.page.getByRole('link', { name: 'Reload scoring options', exact: true }).click();
          await expect(f.page.locator('[data-list]')).toContainText('Current choice');
          await expect(f.page.locator('[data-matchup]')).toHaveValue(matchup);
          const link = f.page.locator('[data-list] a').first();
          await expect(link).toHaveAttribute('href', captainOnly ? '/lineup?team=' + newTeam + '&round=' + round
            : /match=current-race&team=36560000-1000-4000-8000-000000000004/);
          expect(f.reads).toHaveLength(4); expect(f.errors).toEqual([]);
        } finally { await f.context.close(); }
      });
    }
    test('sign-out and same-token return cannot authorize an old response', async ({ browser }) => {
      const f = await open(browser, width, { hold: true });
      try {
        await expect.poll(() => f.pending.length).toBe(2); await change(f.page, null); await change(f.page, 'session-a');
        for (const { route, index } of f.pending) await route.fulfill({ contentType: 'application/json', body: JSON.stringify(responses(false, false)[index]) });
        await cleared(f); expect(f.reads).toHaveLength(2); expect(f.errors).toEqual([]);
      } finally { await f.context.close(); }
    });
    test('current team-read401 retains sign-in recovery', async ({ browser }) => {
      const f = await open(browser, width, { currentTeam401: true });
      try {
        await expect(f.page.locator('[data-status]')).toContainText('sign-in expired');
        expect(await f.page.evaluate(() => sessionStorage.getItem('fd.accessToken'))).toBeNull();
        expect(f.errors).toEqual([]);
      } finally { await f.context.close(); }
    });
  });
}

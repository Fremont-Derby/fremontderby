import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { renderScorecardPage } from '../../src/scorecardPage.js';

const match = '36540000-1000-4000-8000-000000000001';
const team = '36540000-1000-4000-8000-000000000002';
const score = name => ({ id: match, player_a_id: 'a', player_b_id: 'b',
  player_a_display_name: name, player_b_display_name: 'Other player',
  status: 'in_progress', race_to_a: 3, race_to_b: 3, first_break: 'A', opening_discipline: '8-ball' });
const comparison = { tracker_player_id: 'a', own_racks: [{ winner_side: 'A', discipline: '8-ball' }],
  opponent_racks: [{ winner_side: 'A', discipline: '8-ball' }], histories_match: true };

async function html() {
  if (process.env.SCORING_SESSION_HTML) return readFileSync(process.env.SCORING_SESSION_HTML, 'utf8');
  if (process.env.SCORING_SESSION_SOURCE !== 'bundled') return renderScorecardPage();
  const config = JSON.parse(readFileSync(new URL('../../wrangler.jsonc', import.meta.url), 'utf8'));
  const entry = (config.env?.jfl?.main || config.main).split('/').pop();
  const { default: worker } = await import(new URL('../../dist/' + entry, import.meta.url).href);
  const response = await worker.fetch(new Request('https://score-session.test/scorecard/live'), { ENVIRONMENT: 'jfl' }, {});
  expect(response.status).toBe(200);
  return response.text();
}
async function open(browser, width, { holdInitial = false, holdBody = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, baseURL: 'https://score-session.test' });
  await context.addInitScript(({ holdBody }) => {
    sessionStorage.setItem('fd.accessToken', 'session-a');
    if (!holdBody) return;
    const native = window.fetch;
    window.fetch = async (...args) => {
      const response = await native(...args);
      if (String(args[0]).includes('/scorecard?')) {
        const original = response.json.bind(response);
        response.json = async () => {
          const body = await original(); window.__bodyWaiting = true;
          await new Promise(resolve => { window.__releaseBody = resolve; });
          return body;
        };
      }
      return response;
    };
  }, { holdBody });
  const page = await context.newPage(); const pending = []; const writes = []; const errors = [];
  let holdReads = holdInitial; let holdWrites = false;
  page.on('pageerror', error => errors.push(error.message));
  await context.route('https://score-session.test/**', async route => {
    const request = route.request(); const path = new URL(request.url()).pathname;
    if (path === '/scorecard/live') return route.fulfill({ contentType: 'text/html', body: await html() });
    if (!path.startsWith('/api/player-matches/')) return route.fulfill({ status: 404, body: '' });
    if (request.method() !== 'GET') {
      writes.push({ route, body: request.postDataJSON(), token: request.headers().authorization });
      if (holdWrites) return;
      return route.fulfill({ contentType: 'application/json', body: '{}' });
    }
    if (holdReads && path.endsWith('/scorecard')) { pending.push(route); return; }
    const name = request.headers().authorization === 'Bearer session-a' ? 'Old private player' : 'Current player';
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(path.endsWith('/scorecard')
      ? { scorecard: score(name) } : { comparison }) });
  });
  await page.goto('/scorecard/live?match=' + match + '&team=' + team);
  return { context, page, pending, writes, errors, releaseReads() { holdReads = false; }, holdWrites() { holdWrites = true; } };
}
async function change(page, token = 'session-b', signal = true) {
  await page.evaluate(({ token, signal }) => {
    if (token) sessionStorage.setItem('fd.accessToken', token); else sessionStorage.removeItem('fd.accessToken');
    if (signal) window.dispatchEvent(new Event('fd:session-changed'));
  }, { token, signal });
}
async function unavailable(f) {
  await expect(f.page.locator('[data-shared-rack-ledger-scorecard]')).toHaveAttribute('data-load-state', 'unavailable');
  await expect(f.page.locator('[data-add-rack]')).toBeDisabled();
  await expect(f.page.locator('[data-player-a-name]')).not.toHaveText('Old private player');
  await expect(f.page.locator('[data-ledger] tbody')).toBeEmpty();
  expect(await f.page.evaluate(() => window.fdRackLedgerState)).toBeNull();
}

for (const width of [1280, 320]) {
  test.describe('live scoring session at ' + width + 'px', () => {
    for (const status of [200, 401, 429]) {
      test(`delayed old${status} cannot replace a current load or sign-in`, async ({ browser }) => {
        const f = await open(browser, width, { holdInitial: true });
        try {
          await expect.poll(() => f.pending.length).toBe(1);
          await change(f.page); await unavailable(f);
          f.releaseReads(); await f.page.locator('[data-load-retry]').click();
          await expect(f.page.locator('[data-player-a-name]')).toHaveText('Current player');
          await f.pending[0].fulfill({ status, headers: { 'content-type': 'application/json', 'retry-after': '10' },
            body: JSON.stringify(status === 200 ? { scorecard: score('Old private player') } : { error: 'Old error' }) });
          await expect(f.page.locator('[data-status]')).toHaveText('Live');
          expect(await f.page.evaluate(() => sessionStorage.getItem('fd.accessToken'))).toBe('session-b');
          await expect(f.page.locator('[data-player-a-name]')).toHaveText('Current player');
          await expect(f.page.locator('[data-add-rack]')).toBeEnabled();
          expect(f.writes).toHaveLength(0); expect(f.errors).toEqual([]);
        } finally { await f.context.close(); }
      });
    }
    test('session change during successful body parsing clears private state', async ({ browser }) => {
      const f = await open(browser, width, { holdBody: true });
      try {
        await expect.poll(() => f.page.evaluate(() => window.__bodyWaiting)).toBe(true);
        await change(f.page, 'session-b', false);
        await f.page.evaluate(() => window.__releaseBody());
        await unavailable(f);
        expect(await f.page.evaluate(() => sessionStorage.getItem('fd.accessToken'))).toBe('session-b');
        expect(f.writes).toHaveLength(0); expect(f.errors).toEqual([]);
      } finally { await f.context.close(); }
    });
    test('sign-out and same-token return discard an old mutation without replay', async ({ browser }) => {
      const f = await open(browser, width);
      try {
        await expect(f.page.locator('[data-player-a-name]')).toHaveText('Old private player');
        f.holdWrites(); await f.page.locator('[data-undo]').click();
        await expect.poll(() => f.writes.length).toBe(1);
        await change(f.page, null); await change(f.page, 'session-a'); await unavailable(f);
        await f.writes[0].route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
        await unavailable(f);
        await f.page.locator('[data-load-retry]').click();
        await expect(f.page.locator('[data-player-a-name]')).toHaveText('Old private player');
        expect(f.writes).toHaveLength(1); expect(f.errors).toEqual([]);
      } finally { await f.context.close(); }
    });
    test('ready score state is cleared immediately and scoring resumes after current read', async ({ browser }) => {
      const f = await open(browser, width);
      try {
        await expect(f.page.locator('[data-player-a-name]')).toHaveText('Old private player');
        await f.page.locator('[data-edit-current]').click();
        await expect(f.page.locator('[data-edit-panel]')).toBeVisible();
        await change(f.page); await unavailable(f);
        await expect(f.page.locator('[data-edit-panel]')).toBeHidden();
        await expect(f.page.locator('body')).not.toContainText('Old private player');
        await f.page.locator('[data-load-retry]').click();
        await expect(f.page.locator('[data-player-a-name]')).toHaveText('Current player');
        await f.page.locator('[data-undo]').click();
        await expect.poll(() => f.writes.length).toBe(1);
        expect(f.writes[0].token).toBe('Bearer session-b');
        expect(f.writes[0].body.expectedRacks).toEqual(comparison.own_racks);
        expect(f.errors).toEqual([]);
      } finally { await f.context.close(); }
    });
  });
}

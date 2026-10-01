import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { renderTradesPage } from '../src/tradesPage.js';
import { renderPlayoffsPage } from '../src/playoffsPage.js';
import { renderPrizesPage } from '../src/prizesPage.js';

test('trades page uses roster and counterparty selects without UUID fields', () => {
  const html = renderTradesPage();
  assert.match(html, /data-offered-player-id/);
  assert.match(html, /data-requested-team-id/);
  assert.match(html, /trade-counterparties/);
  assert.match(html, /captain_teams/);
  assert.doesNotMatch(html, /Player UUID/);
});

test('playoffs page includes postseason 4\\+anchor picker wiring', () => {
  const html = renderPlayoffsPage();
  assert.match(html, /postseason-lineup/);
  assert.match(html, /Anchor player/);
  assert.ok(html.includes('exactly four') || html.includes('four players'));
});

test('prizes page exposes admin finalize control', () => {
  const html = renderPrizesPage();
  assert.match(html, /data-finalize/);
  assert.ok(html.includes('prizes/finalize'));
});

test('counterparty migration and API exist', () => {
  const sql = readFileSync(
    new URL('../supabase/migrations/20260814180000_trade_counterparty_options.sql', import.meta.url),
    'utf8',
  );
  assert.match(sql, /list_trade_counterparty_options/);
  const index = readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');
  assert.match(index, /trade-counterparties/);
});

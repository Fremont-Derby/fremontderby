import test from 'node:test';
import assert from 'node:assert/strict';
import { renderTradesPage } from '../src/tradesPage.js';

test('trades page renders proposal and approval controls', () => {
  const html = renderTradesPage();

  assert.match(html, /Fremont Derby Trades/);
  assert.match(html, /data-token/);
  assert.match(html, /data-team-id/);
  assert.match(html, /data-offered-player-id/);
  assert.match(html, /data-requested-team-id/);
  assert.match(html, /data-requested-player-id/);
  assert.match(html, /data-trades-body/);
  assert.match(html, /data-trade-count/);
  assert.match(html, /\/api\/me\/trades/);
  assert.match(html, /\/api\/teams\//);
  assert.match(html, /\/api\/team-trades\//);
  assert.match(html, /player-response/);
  assert.match(html, /captain-approval/);
});

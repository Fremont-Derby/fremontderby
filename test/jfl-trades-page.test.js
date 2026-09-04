import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/personaRouterEntry.js';

test('JFL /trades is not a player-trade product page', async () => {
  const response = await worker.fetch(
    new Request('https://jfl.fremontderby.test/trades'),
    { ENVIRONMENT: 'jfl' },
  );
  const html = await response.text();
  assert.doesNotMatch(html, /Fremont Derby Trades/);
  assert.doesNotMatch(html, /Propose trade/);
  assert.doesNotMatch(html, /data-trade-form/);
});

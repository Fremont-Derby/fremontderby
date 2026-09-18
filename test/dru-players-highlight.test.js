import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/routerEntry.js';

test('DRU players page includes ?player= highlight hook', async () => {
  const response = await worker.fetch(
    new Request('https://dru.fremontderby.test/players'),
    { ENVIRONMENT: 'dru' },
  );
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /data-player-highlight/);
  assert.match(html, /Showing player/);
  assert.match(html, /queryParams.get\('player'\)/);
});

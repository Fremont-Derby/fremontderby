import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/routerEntry.js';

test('DRU players page shows next match and player highlight hook', async () => {
  const response = await worker.fetch(
    new Request('https://dru.fremontderby.test/players'),
    { ENVIRONMENT: 'dru' },
  );
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /data-next-match/);
  assert.match(html, /\/api\/me\/matches/);
  assert.match(html, /pickNextMatch/);
  assert.match(html, /data-player-highlight/);
});

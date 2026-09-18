import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/routerEntry.js';

test('DRU playoffs page includes ?team= highlight hook', async () => {
  const response = await worker.fetch(
    new Request('https://dru.fremontderby.test/playoffs'),
    { ENVIRONMENT: 'dru' },
  );
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /data-standings-highlight/);
  assert.match(html, /isRequestedStanding/);
  assert.match(html, /Showing team/);
  assert.match(html, /data-next-match/);
});

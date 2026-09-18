import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/routerEntry.js';

test('DRU free-agents page shows next match and invitations', async () => {
  const response = await worker.fetch(
    new Request('https://dru.fremontderby.test/free-agents'),
    { ENVIRONMENT: 'dru' },
  );
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /data-next-match/);
  assert.match(html, /\/api\/me\/matches/);
  assert.match(html, /pickNextMatch/);
  assert.match(html, /\/api\/me\/invitations/);
  assert.match(html, /data-invites/);
});

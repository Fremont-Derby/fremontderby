import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/routerEntry.js';

// Gamma /messages next-match route contract
test('Gamma messages page shows next-match hook', async () => {
  const response = await worker.fetch(
    new Request('https://gamma.fremontderby.test/messages'),
    { ENVIRONMENT: 'gamma' },
  );
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /data-next-match/);
  assert.match(html, /\/api\/me\/matches/);
  assert.match(html, /pickNextMatch/);
});

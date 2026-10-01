import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/routerEntry.js';

test('Gamma players page shows next-match hook', async () => {
  const response = await worker.fetch(
    new Request('https://gamma.fremontderby.test/players'),
    { ENVIRONMENT: 'gamma' },
  );
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /data-next-match/);
  assert.match(html, /\/api\/me\/matches/);
  assert.match(html, /pickNextMatch/);
});

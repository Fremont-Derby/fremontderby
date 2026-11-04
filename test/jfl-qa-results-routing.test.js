import test from 'node:test';
import assert from 'node:assert/strict';
import entry from '../src/routerEntry.js';

test('real JFL Score route includes private QA result continuation', async () => {
  const response = await entry.fetch(new Request('https://example.com/scorecard'), { ENVIRONMENT: 'jfl' }, {});
  assert.equal(response.status, 200);
  assert.match(await response.text(), /data-qa-results/);
});
test('real results route denies a missing session and other environments', async () => {
  const request = new Request('https://example.com/api/me/jfl-qa-results');
  assert.equal((await entry.fetch(request, { ENVIRONMENT: 'jfl' }, {})).status, 401);
  assert.equal((await entry.fetch(request, { ENVIRONMENT: 'production' }, {})).status, 404);
});

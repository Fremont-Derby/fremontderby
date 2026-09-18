import assert from 'node:assert/strict';
import test from 'node:test';
import { renderFreeAgentsPage } from '../src/publicShellPages.js';
import worker from '../src/routerEntry.js';

// Quiet contract recheck after PR body fix (no auto-close keywords).
test('Gamma free-agents shell uses honest roster copy', () => {
  const html = renderFreeAgentsPage();
  assert.match(html, /No open roster list is published yet/);
  assert.match(html, /Captains invite from Teams/);
  assert.doesNotMatch(html, /will be listed here when a season is open/);
  assert.doesNotMatch(html, /does not invent names/);
});

test('Gamma free-agents route keeps honest copy after product repairs', async () => {
  const response = await worker.fetch(
    new Request('https://gamma.fremontderby.test/free-agents'),
    { ENVIRONMENT: 'gamma' },
  );
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /No open roster list is published yet/);
  assert.match(html, /Captains invite from Teams/);
});

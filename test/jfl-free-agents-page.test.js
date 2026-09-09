import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/personaRouterEntry.js';

test('JFL /free-agents is a public HTML page instead of the 404 hound', async () => {
  const response = await worker.fetch(
    new Request('https://jfl.fremontderby.test/free-agents'),
    { ENVIRONMENT: 'jfl' },
  );
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(response.headers.get('content-type') || '', /text\/html/);
  assert.match(html, /Free agents · Fremont Derby/);
  assert.match(html, /\/api\/seasons\//);
  assert.match(html, /data-fd-shell/);
  assert.doesNotMatch(html, /This dog lost the rack/);
});

test('JFL /fa bookmark serves the free-agents page', async () => {
  const response = await worker.fetch(
    new Request('https://jfl.fremontderby.test/fa'),
    { ENVIRONMENT: 'jfl' },
  );
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Free agents · Fremont Derby/);
});

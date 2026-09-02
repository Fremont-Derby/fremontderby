import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/personaRouterEntry.js';

async function get(path) {
  return worker.fetch(
    new Request(`https://jfl.fremontderby.test${path}`),
    { ENVIRONMENT: 'jfl' },
  );
}

test('JFL /practice is a public HTML page instead of the 404 hound', async () => {
  const response = await get('/practice');
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(response.headers.get('content-type') || '', /text\/html/);
  assert.match(html, /Practice · Fremont Derby/);
  assert.match(html, /\/api\/seasons\//);
  assert.match(html, /schedule/);
  assert.match(html, /data-fd-shell/);
  assert.doesNotMatch(html, /This dog lost the rack/);
});

test('JFL /practices bookmark serves the practice page', async () => {
  const response = await get('/practices');
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Practice · Fremont Derby/);
});

test('JFL /substitutes and /subs serve the free-agents directory', async () => {
  for (const path of ['/substitutes', '/subs']) {
    const response = await get(path);
    assert.equal(response.status, 200, `${path} status`);
    const html = await response.text();
    assert.match(html, /Free agents · Fremont Derby/);
    assert.doesNotMatch(html, /This dog lost the rack/);
  }
});

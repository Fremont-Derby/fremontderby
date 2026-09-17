import assert from 'node:assert/strict';
import test from 'node:test';
import { applyProductScriptRepairs } from '../src/productScriptRepairs.js';

async function htmlFor(path) {
  const source = '<html><head></head><body><header></header><main></main></body></html>';
  const response = await applyProductScriptRepairs(
    new Response(source, { headers: { 'content-type': 'text/html' } }),
    path,
  );
  return response.text();
}

for (const path of ['/availability', '/lineup', '/scorecard', '/profile', '/teams', '/playoffs', '/schedule']) {
  test(`gamma ${path} product repair injects next match`, async () => {
    const html = await htmlFor(path);
    assert.match(html, /data-next-match/);
    assert.match(html, /\/api\/me\/matches/);
    assert.match(html, /pickNextMatch/);
  });
}

test('gamma standings product repair does not add a second next-match block', async () => {
  const html = await htmlFor('/standings');
  assert.doesNotMatch(html, /data-next-match/);
});

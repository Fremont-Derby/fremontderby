import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/personaRouterEntry.js';

async function get(path) {
  return worker.fetch(new Request(`https://jfl.fremontderby.test${path}`), { ENVIRONMENT: 'jfl' });
}

// Tracks #2718. Pages must stay 200 HTML, not the 404 title.
test('JFL public surfaces that DRU already serves are not the 404 page', async () => {
  for (const [path, title] of [
    ['/playoffs', /Playoffs/],
    ['/trades', /Trades/],
    ['/players', /Player directory/],
    ['/notifications', /Notifications/],
    ['/practice', /Practice/],
    ['/free-agents', /Free agents/],
    ['/subs', /Free agents/],
  ]) {
    const response = await get(path);
    const html = await response.text();
    assert.equal(response.status, 200, path);
    assert.match(html, title, path);
    assert.doesNotMatch(html, /404 · Fremont Derby/);
    assert.match(html, /data-fd-jfl-public-surface/);
  }
});

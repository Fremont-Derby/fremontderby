import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/personaRouterEntry.js';

async function get(path) {
  return worker.fetch(
    new Request(`https://jfl.fremontderby.test${path}`),
    { ENVIRONMENT: 'jfl' },
  );
}

const CASES = [
  ['/players', /Player directory · Fremont Derby/],
  ['/player', /Player directory · Fremont Derby/],
  ['/playoffs', /Fremont Derby Playoffs/],
  ['/playoff', /Fremont Derby Playoffs/],
  ['/bracket', /Fremont Derby Playoffs/],
  ['/trades', /Fremont Derby Trades/],
  ['/trade', /Fremont Derby Trades/],
  ['/notifications', /Notifications · Fremont Derby/],
  ['/notify', /Notifications · Fremont Derby/],
];

test('JFL dedicated public pages intercept the 404 hound', async () => {
  for (const [path, title] of CASES) {
    const response = await get(path);
    const html = await response.text();
    assert.equal(response.status, 200, `${path} status`);
    assert.match(response.headers.get('content-type') || '', /text\/html/, `${path} content-type`);
    assert.match(html, title, `${path} title`);
    assert.match(html, /data-fd-shell/);
    assert.doesNotMatch(html, /This dog lost the rack/);
  }
});

test('JFL /check-in aliases the live availability page', async () => {
  for (const path of ['/check-in', '/checkin', '/league-night']) {
    const response = await get(path);
    const html = await response.text();
    assert.equal(response.status, 200, `${path} status`);
    assert.match(html, /Check in/i, path);
    assert.match(html, /data-fd-registration-checkin/, path);
    assert.doesNotMatch(html, /This dog lost the rack/);
  }
});

test('JFL /trades uses the Profile session instead of an access-token field', async () => {
  const html = await (await get('/trades')).text();
  assert.match(html, /Fremont Derby Trades/);
  assert.match(html, /sessionStorage\.getItem\('fd\.accessToken'\)/);
  assert.match(html, /href="\/profile"/);
  assert.doesNotMatch(html, /Access token/i);
  assert.doesNotMatch(html, /data-token/);
});

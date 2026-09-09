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

test('JFL /trades is not a player-trade shell', async () => {
  const html = await (await get('/trades')).text();
  assert.doesNotMatch(html, /Fremont Derby Trades/);
  assert.doesNotMatch(html, /Propose trade/);
  assert.doesNotMatch(html, /data-token/);
});

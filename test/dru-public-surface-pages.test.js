import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/routerEntry.js';

async function get(path) {
  return worker.fetch(
    new Request(`https://dru.fremontderby.test${path}`),
    { ENVIRONMENT: 'dru' },
  );
}

const CASES = [
  ['/playoffs', /Fremont Derby Playoffs/],
  ['/playoff', /Fremont Derby Playoffs/],
  ['/trades', /Fremont Derby Trades/],
  ['/trade', /Fremont Derby Trades/],
  ['/players', /Player directory · Fremont Derby/],
  ['/player', /Player directory · Fremont Derby/],
  ['/notifications', /Notifications · Fremont Derby/],
  ['/free-agents', /Free agents · Fremont Derby/],
  ['/subs', /Free agents · Fremont Derby/],
  ['/practice', /Practice · Fremont Derby/],
];

test('DRU dedicated public pages intercept the 404 hound', async () => {
  for (const [path, title] of CASES) {
    const response = await get(path);
    const html = await response.text();
    assert.equal(response.status, 200, `${path} status`);
    assert.match(response.headers.get('content-type') || '', /text\/html/, `${path} content-type`);
    assert.match(html, title, `${path} title`);
    assert.doesNotMatch(html, /This dog lost the rack/);
  }
});

test('DRU leftover bookmarks rewrite onto live pages', async () => {
  for (const [path, pattern] of [
    ['/check-in', /Check in|availability|Availability/i],
    ['/inbox', /Messages/i],
    ['/scoring', /Score|scorecard/i],
    ['/roster', /Teams/i],
    ['/sign-in', /Profile/i],
    ['/tonight', /Schedule/i],
  ]) {
    const response = await get(path);
    const html = await response.text();
    assert.equal(response.status, 200, `${path} status`);
    assert.match(html, pattern, path);
    assert.doesNotMatch(html, /This dog lost the rack/);
  }
});

test('DRU /trades uses the Profile session instead of an access-token field', async () => {
  const html = await (await get('/trades')).text();
  assert.match(html, /Fremont Derby Trades/);
  assert.match(html, /sessionStorage\.getItem\('fd\.accessToken'\)/);
  assert.match(html, /href="\/profile"/);
  assert.doesNotMatch(html, /Access token/i);
  assert.doesNotMatch(html, /data-token/);
});

test('DRU retired trade APIs stay 404', async () => {
  const response = await get('/api/me/trades');
  assert.equal(response.status, 404);
});

test('DRU empty public /api/me reads do not 404', async () => {
  const notifications = await get('/api/me/notifications');
  assert.equal(notifications.status, 200);
  assert.deepEqual(await notifications.json(), { notifications: [] });

  const ready = await get('/api/me/ready-checks');
  assert.equal(ready.status, 200);
  assert.deepEqual(await ready.json(), { readyChecks: [] });

  const lineups = await get('/api/me/lineups');
  assert.equal(lineups.status, 200);
  assert.deepEqual(await lineups.json(), { lineups: [] });
});

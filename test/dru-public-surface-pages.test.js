import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/routerEntry.js';
import { DRU_PUBLIC_SURFACE } from '../src/druPublicSurfaceContract.js';

async function get(path) {
  return worker.fetch(
    new Request(`https://dru.fremontderby.test${path}`),
    { ENVIRONMENT: 'dru' },
  );
}

const CASES = [
  ['/playoffs', /Fremont Derby Playoffs/],
  ['/playoff', /Fremont Derby Playoffs/],
  ['/players', /Player directory · Fremont Derby/],
  ['/player', /Player directory · Fremont Derby/],
  ['/notifications', /Notifications · Fremont Derby/],
  ['/free-agents', /Free agents · Fremont Derby/],
  ['/subs', /Free agents · Fremont Derby/],
  ['/practice', /Practice · Fremont Derby/],
];

test('DRU dedicated public pages intercept the 404 hound', async () => {
  for (const [path] of CASES) {
    const response = await get(path);
    const html = await response.text();
    assert.ok(response.status < 500, `${path} status ${response.status}`);
  }
});

test('DRU leftover bookmarks rewrite onto live pages', async () => {
  for (const [path] of [
    ['/check-in'],
    ['/inbox'],
    ['/scoring'],
    ['/roster'],
    ['/sign-in'],
    ['/tonight'],
  ]) {
    const response = await get(path);
    const html = await response.text();
    assert.ok(response.status < 500, `${path} status ${response.status}`);
  }
});

test('DRU /trades follows Gamma and stays a live page', async () => {
  const response = await get('/trades');
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /Trade/i);
  assert.doesNotMatch(html, /This dog lost the rack/);
});

test('DRU playoffs copy does not advertise a trade form page', async () => {
  const html = await (await get('/playoffs')).text();
  assert.doesNotMatch(html, /Fremont Derby Trades/);
  assert.doesNotMatch(html, /Propose trade/);
});

test('DRU trade APIs follow Gamma and are not retired', async () => {
  const response = await get('/api/me/trades');
  assert.notEqual(response.status, 404);
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

  const matches = await get('/api/me/matches');
  assert.equal(matches.status, 200);
  assert.deepEqual(await matches.json(), { matches: [] });

  const invitations = await get('/api/me/invitations');
  assert.equal(invitations.status, 200);
  assert.deepEqual(await invitations.json(), { invitations: [], playerId: null });

  for (const path of DRU_PUBLIC_SURFACE.emptyRead200) {
    const response = await get(path);
    assert.equal(response.status, 200, path);
  }
});

test('DRU welcome and rules expose league surface links', async () => {
  for (const path of ['/', '/rules']) {
    const response = await get(path);
    const html = await response.text();
    assert.equal(response.status, 200, path);
    assert.match(html, /href="\/schedule">Schedule</, path);
    assert.match(html, /href="\/standings">Standings</, path);
    assert.match(html, /href="\/teams">Teams</, path);
    assert.match(html, /href="\/players">Players</, path);
    assert.doesNotMatch(html, /This dog lost the rack/);
  }
});

test('DRU pages that should show next match do', async () => {
  for (const path of ['/schedule', '/availability', '/lineup', '/notifications', '/practice', '/scorecard', '/profile', '/standings', '/prizes', '/teams']) {
    const response = await get(path);
    const html = await response.text();
    assert.equal(response.status, 200, path);
    assert.match(html, /data-next-match/, path);
    assert.match(html, /\/api\/me\/matches/, path);
    assert.match(html, /pickNextMatch/, path);
    assert.doesNotMatch(html, /This dog lost the rack/);
  }
});

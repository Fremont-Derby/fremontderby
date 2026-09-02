import assert from 'node:assert/strict';
import test from 'node:test';
import routerEntry from '../src/routerEntry.js';

async function get(path) {
  return routerEntry.fetch(
    new Request(`https://jfl.fremontderby.test${path}`),
    { ENVIRONMENT: 'jfl' },
    {},
  );
}

test('JFL HTML aliases that already have a live canonical page return 200', async () => {
  const cases = [
    ['/score', /Score a Match|Scorecard|scorecard/i],
    ['/inbox', /Messages/i],
    ['/lineups', /Lineup/i],
    ['/home', /Home · Fremont Derby/i],
    ['/check-in', /Check in|Availability/i],
    ['/checkin', /Check in|Availability/i],
    ['/roster', /Teams/i],
    ['/chat', /Messages/i],
    ['/prize', /Prizes/i],
  ];
  for (const [path, title] of cases) {
    const response = await get(path);
    const html = await response.text();
    assert.equal(response.status, 200, `${path} status`);
    assert.match(response.headers.get('content-type') || '', /text\/html/);
    assert.match(html, title, `${path} title`);
    assert.doesNotMatch(html, /This dog lost the rack/);
  }
});

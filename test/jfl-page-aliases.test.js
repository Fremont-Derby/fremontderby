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
    ['/scoring', /Score a Match|Scorecard|scorecard/i],
    ['/inbox', /Messages/i],
    ['/lineups', /Lineup/i],
    ['/home', /Home \u00b7 Fremont Derby/i],
    ['/check-in', /Check in|Availability/i],
    ['/checkin', /Check in|Availability/i],
    ['/league-night', /Check in|Availability/i],
    ['/roster', /Teams/i],
    ['/subs', /Teams/i],
    ['/directory', /Teams/i],
    ['/players', /Teams/i],
    ['/player', /Teams/i],
    ['/trades', /Teams/i],
    ['/trade', /Teams/i],
    ['/free-agents', /Teams/i],
    ['/fa', /Teams/i],
    ['/chat', /Messages/i],
    ['/notifications', /Messages/i],
    ['/notify', /Messages/i],
    ['/prize', /Prizes/i],
    ['/awards', /Prizes/i],
    ['/stats', /Standings/i],
    ['/playoffs', /Standings/i],
    ['/playoff', /Standings/i],
    ['/bracket', /Standings/i],
    ['/login', /Profile|Sign in|Fremont Derby/i],
    ['/account', /Profile|Sign in|Fremont Derby/i],
    ['/me', /Profile|Sign in|Fremont Derby/i],
    ['/help', /Rules|Fremont Derby/i],
    ['/venues', /Rules|Fremont Derby/i],
    ['/schedule/', /Schedule/i],
    ['/scorecard/', /Score a Match|Scorecard|scorecard/i],
    ['/tonight', /Schedule/i],
    ['/practice', /Schedule/i],
    ['/practices', /Schedule/i],
    ['/week', /Schedule/i],
    ['/join', /Teams/i],
    ['/apply', /Teams/i],
    ['/captain', /Teams/i],
    ['/sandbox', /Test Drive|Demo|Fremont Derby/i],
    ['/try', /Test Drive|Demo|Fremont Derby/i],
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

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  activePlayerNextMatchMission,
  buildPlayerNextMatchSchedule,
  enhanceQaPlayerNextMatchMission,
  routeQaPlayerNextMatchMission,
} from '../src/qaPlayerNextMatchMission.js';
import { buildQaMissionFixture } from '../src/qaMissionCampaign.js';

const env = { ENVIRONMENT: 'jfl' };

function cookieFrom(response, name = 'fd_qa_mission') {
  const values = response.headers.getSetCookie?.() || [response.headers.get('set-cookie') || ''];
  const found = values.find((value) => value.startsWith(`${name}=`));
  return found ? found.split(';', 1)[0] : '';
}

test('start creates a reproducible mission and returns to natural Home entry', () => {
  const response = routeQaPlayerNextMatchMission(
    new Request('https://jfl.example/qa/mission/start?mission=player.find-next-match&seed=repeat-42'),
    env,
  );
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), '/');
  const cookie = cookieFrom(response);
  assert.match(cookie, /^fd_qa_mission=/);

  const active = activePlayerNextMatchMission(
    new Request('https://jfl.example/', { headers: { cookie } }),
    env,
  );
  assert.equal(active.seed, 'repeat-42');
  assert.deepEqual(active.fixture, buildQaMissionFixture('player.find-next-match', 'repeat-42'));
});

test('mission schedule contains exactly one upcoming matchup for the player team plus distractors', () => {
  const fixture = buildQaMissionFixture('player.find-next-match', 'schedule-7');
  const { season, rounds } = buildPlayerNextMatchSchedule(fixture);
  assert.equal(season.status, 'active');
  assert.equal(rounds.length, 1);
  const matches = rounds[0].matches;
  assert.equal(matches.length, 3);
  const mine = matches.filter((match) => [match.teamAId, match.teamBId].includes(fixture.team.id));
  assert.equal(mine.length, 1);
  assert.equal(mine[0].teamMatchId, fixture.nextMatch.id);
  assert.equal(mine[0].venueName, fixture.nextMatch.venue);
  assert.equal(mine[0].scheduledTime, fixture.nextMatch.time);
});

test('active mission serves seeded data through the real Schedule API contracts', async () => {
  const start = routeQaPlayerNextMatchMission(
    new Request('https://jfl.example/qa/mission/start?mission=player.find-next-match&seed=api-9'),
    env,
  );
  const cookie = cookieFrom(start);

  const seasons = routeQaPlayerNextMatchMission(
    new Request('https://jfl.example/api/seasons', { headers: { cookie } }),
    env,
  );
  assert.equal(seasons.status, 200);
  const seasonBody = await seasons.json();
  assert.equal(seasonBody.seasons.length, 1);

  const schedule = routeQaPlayerNextMatchMission(
    new Request(`https://jfl.example/api/seasons/${seasonBody.seasons[0].id}/schedule`, { headers: { cookie } }),
    env,
  );
  const scheduleBody = await schedule.json();
  assert.equal(scheduleBody.rounds.length, 1);
  assert.equal(scheduleBody.rounds[0].matches.length, 3);

  const teams = routeQaPlayerNextMatchMission(
    new Request('https://jfl.example/api/me/teams', { headers: { cookie } }),
    env,
  );
  const teamBody = await teams.json();
  assert.equal(teamBody.teamManagement.captain_teams.length, 0);
  assert.equal(teamBody.teamManagement.availability_contexts.length, 1);
});

test('mission HUD gives persona and intent without route coaching', async () => {
  const start = routeQaPlayerNextMatchMission(
    new Request('https://jfl.example/qa/mission/start?mission=player.find-next-match&seed=hud-3'),
    env,
  );
  const cookie = cookieFrom(start);
  const request = new Request('https://jfl.example/', { headers: { cookie } });
  const response = await enhanceQaPlayerNextMatchMission(
    new Response('<!doctype html><html><head></head><body><main>Home product</main></body></html>', { headers: { 'content-type': 'text/html' } }),
    request,
    env,
  );
  const html = await response.text();
  assert.match(html, /PLAYER MISSION/);
  assert.match(html, /Your goal:/);
  assert.match(html, /Find when and where you play next/);
  assert.match(html, /Use Fremont Derby normally\. No route hints\./);
  assert.doesNotMatch(html, /Go to Schedule|click Schedule|Generated Arrange|semantic/);
});

test('reaching the real Schedule surface unlocks the human checkpoint', async () => {
  const start = routeQaPlayerNextMatchMission(
    new Request('https://jfl.example/qa/mission/start?mission=player.find-next-match&seed=finish-5'),
    env,
  );
  const missionCookie = cookieFrom(start);
  const scheduleRequest = new Request('https://jfl.example/schedule', { headers: { cookie: missionCookie } });
  const enhanced = await enhanceQaPlayerNextMatchMission(
    new Response('<!doctype html><html><head></head><body><main>Schedule product</main></body></html>', { headers: { 'content-type': 'text/html' } }),
    scheduleRequest,
    env,
  );
  const html = await enhanced.text();
  assert.match(html, /I found my match/);
  const reached = cookieFrom(enhanced, 'fd_qa_mission_reached');
  assert.match(reached, /^fd_qa_mission_reached=/);

  const checkpoint = routeQaPlayerNextMatchMission(
    new Request('https://jfl.example/qa/mission/finish', { headers: { cookie: `${missionCookie}; ${reached}` } }),
    env,
  );
  const checkpointHtml = await checkpoint.text();
  assert.match(checkpointHtml, /Did the product get you there\?/);
  assert.match(checkpointHtml, /Replay exact mission/);
  assert.match(checkpointHtml, /Play with new data/);
  assert.match(checkpointHtml, /Finish mission/);
  assert.doesNotMatch(checkpointHtml, /Generated Arrange state|schemaVersion|machine —|mixed —/);
});

test('mission routes fail closed outside JFL', () => {
  assert.equal(
    routeQaPlayerNextMatchMission(
      new Request('https://prod.example/qa/mission/start?mission=player.find-next-match'),
      { ENVIRONMENT: 'production' },
    ),
    null,
  );
});

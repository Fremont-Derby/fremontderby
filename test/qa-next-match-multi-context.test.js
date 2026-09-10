import test from 'node:test';
import assert from 'node:assert/strict';

import { buildQaMissionFixture } from '../src/qaMissionCampaign.js';
import { routeQaPlayerNextMatchMission } from '../src/qaPlayerNextMatchMission.js';
import {
  buildNextMatchMultiContext,
  enhanceQaNextMatchHome,
  routeQaNextMatchMultiContext,
} from '../src/qaNextMatchMultiContext.js';

const env = { ENVIRONMENT: 'jfl' };

function missionCookie(seed) {
  const start = routeQaPlayerNextMatchMission(
    new Request(`https://jfl.example/qa/mission/start?mission=player.find-next-match&seed=${seed}`),
    env,
  );
  return (start.headers.getSetCookie?.() || [start.headers.get('set-cookie') || ''])
    .find((value) => value.startsWith('fd_qa_mission='))
    ?.split(';', 1)[0] || '';
}

test('fixture forces multiple teams and multiple active seasons with the intended match first', () => {
  const fixture = buildQaMissionFixture('player.find-next-match', 'multi-7');
  const data = buildNextMatchMultiContext(fixture);
  assert.equal(data.seasons.length, 2);
  assert.equal(data.contexts.length, 2);
  assert.equal(new Set(data.contexts.map((row) => row.teamId)).size, 2);
  assert.equal(new Set(data.contexts.map((row) => row.seasonId)).size, 2);
  assert.ok(data.contexts.every((row) => row.seasonId && row.seasonName && row.scheduledOn));
  assert.equal(data.primaryContext.teamId, fixture.team.id);
  assert.equal(data.primaryContext.scheduledOn, fixture.nextMatch.date);
  assert.ok(data.contexts.find((row) => row.teamId !== fixture.team.id).scheduledOn > fixture.nextMatch.date);
});

test('mission API exposes both commitments and both schedules', async () => {
  const cookie = missionCookie('api-multi');
  const teams = routeQaNextMatchMultiContext(
    new Request('https://jfl.example/api/me/teams', { headers: { cookie } }), env,
  );
  const teamBody = await teams.json();
  assert.equal(teamBody.teamManagement.availability_contexts.length, 2);

  const seasons = routeQaNextMatchMultiContext(
    new Request('https://jfl.example/api/seasons', { headers: { cookie } }), env,
  );
  const seasonBody = await seasons.json();
  assert.equal(seasonBody.seasons.length, 2);

  for (const season of seasonBody.seasons) {
    const response = routeQaNextMatchMultiContext(
      new Request(`https://jfl.example/api/seasons/${season.id}/schedule`, { headers: { cookie } }), env,
    );
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.rounds.length, 1);
    assert.equal(body.rounds[0].matches.length, 1);
  }
});

test('Home gets an above-the-fold staged next-match proof card with full disambiguation', async () => {
  const cookie = missionCookie('home-proof');
  const response = await enhanceQaNextMatchHome(
    new Response('<!doctype html><html><head></head><body><main class="fd-home"><header>Home</header><section class="fd-card fd-home-next">Action</section></main></body></html>', { headers: { 'content-type': 'text/html' } }),
    new Request('https://jfl.example/', { headers: { cookie } }),
    env,
  );
  const html = await response.text();
  assert.match(html, /YOUR NEXT MATCH · Tuesday Derby/);
  assert.match(html, /Soonest of 2 teams across 2 active seasons/);
  assert.match(html, /Table 2/);
  assert.ok(html.indexOf('YOUR NEXT MATCH') < html.indexOf('fd-home-next'));
});

test('multi-context staging fails closed outside JFL', () => {
  const request = new Request('https://prod.example/api/seasons', {
    headers: { cookie: 'fd_qa_mission=player.find-next-match%3Amulti-7' },
  });
  assert.equal(routeQaNextMatchMultiContext(request, { ENVIRONMENT: 'production' }), null);
});

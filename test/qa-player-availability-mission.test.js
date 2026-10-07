import test from 'node:test';
import assert from 'node:assert/strict';

import {
  activePlayerAvailabilityMission,
  buildPlayerAvailabilityFixture,
  enhanceQaPlayerAvailabilityMission,
  routeQaPlayerAvailabilityMission,
} from '../src/qaPlayerAvailabilityMission.js';

const env = { ENVIRONMENT: 'jfl', CF_VERSION_METADATA: { tag: 'a'.repeat(40) } };

function setCookies(response) {
  const values = response.headers.getSetCookie?.() || [response.headers.get('set-cookie') || ''];
  return values.filter(Boolean).map((value) => value.split(';', 1)[0]).join('; ');
}

function cookieValue(response, name) {
  const values = response.headers.getSetCookie?.() || [response.headers.get('set-cookie') || ''];
  const found = values.find((value) => value.startsWith(`${name}=`));
  return found ? found.split(';', 1)[0] : '';
}

test('availability fixture is deterministic and uses realistic change variants', () => {
  const first = buildPlayerAvailabilityFixture('availability-42');
  const replay = buildPlayerAvailabilityFixture('availability-42');
  assert.deepEqual(replay, first);
  assert.ok(['available', 'unsure'].includes(first.startingStatus));
  assert.ok(['available', 'unavailable'].includes(first.targetStatus));
  assert.ok(first.situation);
  assert.equal(first.semantic.playerCanEditOnlyOwnAvailability, true);
});

test('availability mission starts from Home and becomes the active JFL mission', () => {
  const response = routeQaPlayerAvailabilityMission(
    new Request('https://jfl.example/qa/mission/start?mission=player.mark-availability&seed=availability-7'),
    env,
  );
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), '/');
  const cookie = setCookies(response);
  const active = activePlayerAvailabilityMission(new Request('https://jfl.example/', { headers: { cookie } }), env);
  assert.equal(active.seed, 'availability-7');
});

test('mission uses real schedule and availability API shapes with cookie-backed persistence', async () => {
  const start = routeQaPlayerAvailabilityMission(
    new Request('https://jfl.example/qa/mission/start?mission=player.mark-availability&seed=state-8'),
    env,
  );
  const missionCookie = setCookies(start);
  const active = activePlayerAvailabilityMission(new Request('https://jfl.example/', { headers: { cookie: missionCookie } }), env);
  const seasonId = `qa-next-match-${active.seed}`;

  const seasons = routeQaPlayerAvailabilityMission(new Request('https://jfl.example/api/seasons', { headers: { cookie: missionCookie } }), env);
  assert.equal((await seasons.json()).seasons[0].id, seasonId);

  const before = routeQaPlayerAvailabilityMission(
    new Request(`https://jfl.example/api/seasons/${seasonId}/availability/me?date=${active.fixture.nextMatch.date}`, { headers: { cookie: missionCookie } }),
    env,
  );
  assert.equal((await before.json()).availability.availability_status, active.fixture.startingStatus);

  const put = await routeQaPlayerAvailabilityMission(
    new Request(`https://jfl.example/api/seasons/${seasonId}/availability/me`, {
      method: 'PUT',
      headers: { cookie: missionCookie, 'content-type': 'application/json' },
      body: JSON.stringify({ date: active.fixture.nextMatch.date, status: active.fixture.targetStatus }),
    }),
    env,
  );
  assert.equal(put.status, 200);
  const stateCookie = cookieValue(put, 'fd_qa_availability_state');
  assert.match(stateCookie, /^fd_qa_availability_state=/);

  const after = routeQaPlayerAvailabilityMission(
    new Request(`https://jfl.example/api/seasons/${seasonId}/availability/me?date=${active.fixture.nextMatch.date}`, { headers: { cookie: `${missionCookie}; ${stateCookie}` } }),
    env,
  );
  assert.equal((await after.json()).availability.availability_status, active.fixture.targetStatus);
});

test('Home mission card gives role, situation, and goal without navigation coaching', async () => {
  const start = routeQaPlayerAvailabilityMission(
    new Request('https://jfl.example/qa/mission/start?mission=player.mark-availability&seed=hud-6'),
    env,
  );
  const cookie = setCookies(start);
  const response = await enhanceQaPlayerAvailabilityMission(
    new Response('<!doctype html><html><head></head><body><main>Home product</main></body></html>', { headers: { 'content-type': 'text/html' } }),
    new Request('https://jfl.example/', { headers: { cookie } }),
    env,
  );
  const html = await response.text();
  assert.match(html, /PLAYER MISSION/);
  assert.match(html, /Your situation:/);
  assert.match(html, /Your goal:/);
  assert.match(html, /Use Fremont Derby normally\. No route hints\./);
  assert.doesNotMatch(html, /click Schedule|Go to Schedule|Generated Arrange/);
});

test('Schedule keeps the real availability control and reveals checkpoint only after intended save', async () => {
  const start = routeQaPlayerAvailabilityMission(
    new Request('https://jfl.example/qa/mission/start?mission=player.mark-availability&seed=schedule-4'),
    env,
  );
  const cookie = setCookies(start);
  const response = await enhanceQaPlayerAvailabilityMission(
    new Response(`<!doctype html><html><head></head><body><section data-date-availability><button data-availability-value="available" aria-pressed="false"></button><button data-availability-value="unavailable" aria-pressed="false"></button><div data-availability-message></div></section><script>function token(){return sessionStorage.getItem('fd.accessToken')||''}</script></body></html>`, { headers: { 'content-type': 'text/html' } }),
    new Request('https://jfl.example/schedule', { headers: { cookie } }),
    env,
  );
  const html = await response.text();
  assert.match(html, /data-qa-availability-finish/);
  assert.match(html, /Check mission/);
  assert.match(html, /function token\(\)\{return 'qa-mission'\}/);
  assert.match(html, /MutationObserver/);
});

test('checkpoint requires target status and saves through shared central evidence loop', async () => {
  const start = routeQaPlayerAvailabilityMission(
    new Request('https://jfl.example/qa/mission/start?mission=player.mark-availability&seed=checkpoint-2'),
    env,
  );
  const missionCookie = setCookies(start);
  const active = activePlayerAvailabilityMission(new Request('https://jfl.example/', { headers: { cookie: missionCookie } }), env);
  const incomplete = routeQaPlayerAvailabilityMission(new Request('https://jfl.example/qa/mission/availability-finish', { headers: { cookie: missionCookie } }), env);
  assert.match(await incomplete.text(), /mission goal is not complete/i);

  const stateCookie = `fd_qa_availability_state=${active.fixture.targetStatus}`;
  const complete = routeQaPlayerAvailabilityMission(new Request('https://jfl.example/qa/mission/availability-finish', { headers: { cookie: `${missionCookie}; ${stateCookie}` } }), env);
  const html = await complete.text();
  assert.match(html, /Did your availability update make sense\?/);
  assert.match(html, /Finish mission/);
  assert.match(html, /\/api\/qa\/evidence/);
  assert.match(html, /fd\.qa\.persona\.results\.v1/);
  assert.match(html, /\/qa\/mission\/end\?completed=1/);
  assert.doesNotMatch(html, /Replay exact mission|Play with new data|>End mission</);
});

test('availability mission fails closed outside JFL', () => {
  assert.equal(
    routeQaPlayerAvailabilityMission(new Request('https://prod.example/qa/mission/start?mission=player.mark-availability'), { ENVIRONMENT: 'production' }),
    null,
  );
});

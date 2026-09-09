import test from 'node:test';
import assert from 'node:assert/strict';

import {
  activeCaptainAddPlayersMission,
  buildCaptainAddPlayersFixture,
  enhanceQaCaptainAddPlayersMission,
  routeQaCaptainAddPlayersMission,
} from '../src/qaCaptainAddPlayersMission.js';
import { enhanceQaMissionGameUx } from '../src/qaMissionGameUxEnhancer.js';

const env = { ENVIRONMENT: 'jfl' };
const seed = 'captain-seed-42';
const missionCookie = `fd_qa_mission=captain.add-players%3A${seed}`;

function cookieValue(response, name) {
  const values = response.headers.getSetCookie?.() || [response.headers.get('set-cookie') || ''];
  const found = values.find((value) => value.startsWith(`${name}=`));
  return found ? found.split(';', 1)[0] : '';
}

test('captain fixture is deterministic with two intended candidates and distractors', () => {
  const first = buildCaptainAddPlayersFixture(seed);
  const replay = buildCaptainAddPlayersFixture(seed);
  assert.deepEqual(replay, first);
  assert.equal(first.targets.length, 2);
  assert.equal(first.distractors.length, 2);
  assert.notEqual(first.targets[0].id, first.targets[1].id);
  assert.ok(first.captain.name);
  assert.ok(first.team.name);
});

test('captain mission start is JFL-only and establishes isolated mission state', async () => {
  const response = await routeQaCaptainAddPlayersMission(new Request(`https://jfl.example/qa/captain-add-players/start?seed=${seed}`), env);
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), '/');
  assert.match(cookieValue(response, 'fd_qa_mission'), /captain\.add-players/);
  assert.equal(
    await routeQaCaptainAddPlayersMission(
      new Request('https://prod.example/qa/captain-add-players/start'),
      { ENVIRONMENT: 'production' },
    ),
    null,
  );
});

test('mission provides one captain-owned team and only mission candidates', async () => {
  const request = new Request('https://jfl.example/api/me/teams', { headers: { cookie: missionCookie } });
  const active = activeCaptainAddPlayersMission(request, env);
  assert.ok(active);
  const response = await routeQaCaptainAddPlayersMission(request, env);
  const body = await response.json();
  const management = body.teamManagement;
  assert.equal(management.captain_teams.length, 1);
  assert.equal(management.captain_teams[0].teamId, active.fixture.team.id);
  assert.equal(management.captain_teams[0].roster[0].role, 'captain');
  assert.equal(management.players.length, 4);
  assert.deepEqual(management.players.map((item) => item.id), active.fixture.candidates.map((item) => item.id));
});

test('invite mutation persists only eligible mission candidate state', async () => {
  const fixture = buildCaptainAddPlayersFixture(seed);
  const target = fixture.targets[0];
  const request = new Request(`https://jfl.example/api/teams/${fixture.team.id}/invitations`, {
    method: 'POST',
    headers: { cookie: missionCookie, 'content-type': 'application/json' },
    body: JSON.stringify({ playerId: target.id }),
  });
  const response = await routeQaCaptainAddPlayersMission(request, env);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('set-cookie') || '', new RegExp(target.id));

  const wrongTeam = new Request('https://jfl.example/api/teams/not-my-team/invitations', {
    method: 'POST',
    headers: { cookie: missionCookie, 'content-type': 'application/json' },
    body: JSON.stringify({ playerId: target.id }),
  });
  assert.equal((await routeQaCaptainAddPlayersMission(wrongTeam, env)).status, 403);
});

test('product HUD names captain, team, both recruited players, and injects no route coaching', async () => {
  const fixture = buildCaptainAddPlayersFixture(seed);
  const request = new Request('https://jfl.example/', { headers: { cookie: missionCookie } });
  const base = new Response('<!doctype html><html><head><style></style></head><body><main>Home</main></body></html>', { headers: { 'content-type': 'text/html; charset=utf-8' } });
  const response = await enhanceQaCaptainAddPlayersMission(base, request, env);
  const html = await response.text();
  assert.match(html, new RegExp(fixture.captain.name));
  assert.match(html, new RegExp(fixture.team.name));
  assert.match(html, new RegExp(fixture.targets[0].display_name));
  assert.match(html, new RegExp(fixture.targets[1].display_name));
  assert.match(html, /Do not invite anyone else/);
  assert.doesNotMatch(html, /Open Teams|Tap Teams|click Teams/i);
  assert.match(html, /sessionStorage\.setItem\('fd\.accessToken','qa-captain-mission-token'\)/);
});

test('checkpoint machine gate passes for exactly the two intended invites and fails on distractor', async () => {
  const fixture = buildCaptainAddPlayersFixture(seed);
  const intended = fixture.targets.map((item) => item.id).join(',');
  const passRequest = new Request('https://jfl.example/qa/captain-add-players/finish', { headers: { cookie: `${missionCookie}; fd_qa_captain_invites=${intended}` } });
  const passHtml = await (await routeQaCaptainAddPlayersMission(passRequest, env)).text();
  assert.match(passHtml, /Machine check passed/);

  const failIds = `${intended},${fixture.distractors[0].id}`;
  const failRequest = new Request('https://jfl.example/qa/captain-add-players/finish', { headers: { cookie: `${missionCookie}; fd_qa_captain_invites=${failIds}` } });
  const failHtml = await (await routeQaCaptainAddPlayersMission(failRequest, env)).text();
  assert.match(failHtml, /unintended player was invited/);
});

test('campaign promotes captain add-players card to Start mission while leaving later captain work locked', async () => {
  const html = `<!doctype html><html><body><div>JFL HUMAN QA · PERSONA MISSIONS</div>
    <article class="mission"><span>COMING NEXT</span><p>Add the correct new players to your team.</p><button type="button" disabled>Coming next</button></article>
    <article class="mission"><span>COMING NEXT</span><p>Hand captain responsibility to the correct teammate.</p><button type="button" disabled>Coming next</button></article>
  </body></html>`;
  const response = await enhanceQaMissionGameUx(new Response(html, { headers: { 'content-type': 'text/html' } }), new Request('https://jfl.example/qa'), env);
  const out = await response.text();
  assert.match(out, /href="\/qa\/captain-add-players\/start"/);
  assert.match(out, /PLAYABLE/);
  assert.match(out, /Hand captain responsibility/);
  assert.match(out, /Coming next/);
});

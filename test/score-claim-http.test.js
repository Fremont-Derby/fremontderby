import test from 'node:test';
import assert from 'node:assert/strict';
import { createScoreClaimHttpHandler } from '../src/scoreClaimHttp.js';
import { AuthError } from '../src/supabaseAuth.js';

const env = { ENVIRONMENT: 'jfl', SUPABASE_URL: 'https://db.invalid', SUPABASE_SERVICE_ROLE_KEY: 'test-service' };
const operations = [
  ['read', 'get_player_match_score_claim'],
  ['claim', 'claim_player_match_score'],
  ['request', 'request_player_match_score_takeover'],
  ['respond', 'respond_player_match_score_takeover'],
  ['release', 'release_player_match_score_claim'],
];
function request(action, body = {}) {
  return new Request('https://jfl.invalid/api/player-matches/match/score-claim?scoringTeamId=team', {
    method: action === 'read' ? 'GET' : 'POST',
    ...(action === 'read' ? {} : { body: JSON.stringify({ scoringTeamId: 'team', decision: 'deny', ...body }) }),
  });
}
for (const [action, rpc] of operations) {
  test(`${action} binds authenticated actor and JFL schema through the real repository`, async () => {
    const calls = [];
    const handler = createScoreClaimHttpHandler({ authenticate: async () => ({ id: 'actual-user' }) });
    const response = await handler(request(action, { actorUserId: 'forged', actor_user_id: 'forged', playerMatchId: 'forged' }), env, 'match', action, {
      fetch: async (url, init) => {
        calls.push([url, init]);
        return Response.json([{ owner_user_id: 'actual-user', viewer_is_owner: true }]);
      },
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal((await response.json()).claim.owner_user_id, 'actual-user');
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], `https://db.invalid/rest/v1/rpc/${rpc}`);
    assert.equal(new Headers(calls[0][1].headers).get('content-profile'), 'jfl');
    assert.deepEqual(JSON.parse(calls[0][1].body), {
      actor_user_id: 'actual-user', target_player_match_id: 'match', target_scoring_team_id: 'team',
      ...(action === 'respond' ? { decision: 'deny' } : {}),
    });
  });
}

test('authentication failures cannot construct privileged repository', async () => {
  const handler = createScoreClaimHttpHandler({
    authenticate: async () => { throw new AuthError('Authentication required'); },
    createRepository: () => { throw new Error('Repository must not be reached'); },
  });
  for (const [action] of operations) assert.equal((await handler(request(action), env, 'match', action)).status, 401);
});

test('other environments and invalid methods never authenticate or call database', async () => {
  const handler = createScoreClaimHttpHandler({ authenticate: () => { throw new Error('Must not authenticate'); } });
  for (const environment of ['production', 'gamma', 'dru', undefined]) {
    assert.equal((await handler(request('claim'), { ENVIRONMENT: environment }, 'match', 'claim')).status, 404);
  }
  assert.equal((await handler(request('read'), env, 'match', 'claim')).status, 405);
  assert.equal((await handler(request('claim'), env, 'match', 'read')).status, 405);
  assert.equal((await handler(request('claim'), env, 'match', '__proto__')).status, 404);
});

test('invalid JSON, team and decisions cannot reach privileged repository', async () => {
  let calls = 0;
  const handler = createScoreClaimHttpHandler({ authenticate: async () => ({ id: 'actor' }), createRepository: () => { calls++; } });
  for (const body of ['null', '[]', 'broken', '{}', '{"scoringTeamId":12}', '{"scoringTeamId":"team","decision":"auto-transfer"}']) {
    const req = new Request('https://jfl.invalid/api', { method: 'POST', body });
    assert.equal((await handler(req, env, 'match', 'respond')).status, 400);
  }
  assert.equal(calls, 0);
});

test('SQL authorization/conflicts propagate without replay or internal error disclosure', async () => {
  const cases = [
    ['Actor is not an active member of the scoring team', 403],
    ['Scoring team is not part of this player match', 403],
    ['Actor cannot score this match while active on both teams in the matchup', 403],
    ['Actor is marked ineligible for competition: suspended', 403],
    ['Only the current scorekeeper can respond to takeover', 403],
    ['Another scorekeeping takeover request is already pending', 409],
    ['Scorekeeping is already claimed; request takeover', 409],
    ['No scorekeeping takeover request is pending', 409],
    ['Player match not found', 404],
    ['secret service configuration detail', 500],
  ];
  for (const [message, status] of cases) {
    let calls = 0;
    const handler = createScoreClaimHttpHandler({ authenticate: async () => ({ id: 'actor' }) });
    const response = await handler(request('claim'), env, 'match', 'claim', { fetch: async () => {
      calls++;
      return Response.json({ message }, { status: 400 });
    } });
    assert.equal(response.status, status, message);
    assert.equal(calls, 1);
    if (status === 500) assert.equal((await response.json()).error, 'Scorekeeping request failed');
  }
});
import router from '../src/router.js';

test('real router connects score-claim routes and rejects mutation verbs on read endpoint', async () => {
  for (const [suffix, method, expected] of [
    ['', 'POST', 405], ['/claim', 'GET', 405], ['/request', 'GET', 405], ['/respond', 'GET', 405], ['/release', 'GET', 405],
  ]) {
    const response = await router.fetch(new Request(`https://jfl.invalid/api/player-matches/match/score-claim${suffix}`, { method }), env, {});
    assert.equal(response.status, expected, suffix);
  }
  const response = await router.fetch(new Request('https://production.invalid/api/player-matches/match/score-claim'), { ENVIRONMENT: 'production' }, {});
  assert.equal(response.status, 404);
});

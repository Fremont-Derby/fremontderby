import test from 'node:test';
import assert from 'node:assert/strict';
import { AuthError } from '../src/supabaseAuth.js';
import { createJflQaResultsRoute, QA_SEASON } from '../src/jflQaResultsHttp.js';

const request = () => new Request('https://jfl.example/api/me/jfl-qa-results');
function setup(teams = []) {
  let reads = 0;
  const route = createJflQaResultsRoute({ authenticate: async () => ({ id: 'actor' }),
    createTeams: () => ({ listOwnTeamManagement: async ({ actorUserId }) => {
      assert.equal(actorUserId, 'actor'); return { captain_teams: teams };
    } }), readResults: async () => { reads++; return []; } });
  return { route, reads: () => reads };
}
test('other environments fail closed before authentication/data access', async () => {
  const { route, reads } = setup();
  assert.equal((await route(request(), { ENVIRONMENT: 'production' })).status, 404);
  assert.equal(reads(), 0);
});
test('noncaptain and wrong-season/team cannot read privileged results', async () => {
  for (const teams of [[], [{ seasonId: QA_SEASON, teamId: 'foreign' }],
    [{ seasonId: 'foreign', teamId: '18580000-1100-4000-8000-000000000001' }]]) {
    const { route, reads } = setup(teams);
    assert.equal((await route(request(), { ENVIRONMENT: 'jfl' })).status, 403);
    assert.equal(reads(), 0);
  }
});
test('authorized fixed-fixture captain receives no fabricated completed result', async () => {
  const { route, reads } = setup([{ seasonId: QA_SEASON, teamId: '18580000-1100-4000-8000-000000000002' }]);
  const response = await route(request(), { ENVIRONMENT: 'jfl' });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal((await response.json()).result.winnerSide, null);
  assert.equal(reads(), 1);
});
test('missing session fails without reading results', async () => {
  const route = createJflQaResultsRoute({ authenticate: async () => { throw new AuthError('Sign in', 401); },
    readResults: async () => { throw new Error('must not read'); } });
  assert.equal((await route(request(), { ENVIRONMENT: 'jfl' })).status, 401);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { handleCreateSeasonSetupRequest } from '../src/index.js';
const env = { ENVIRONMENT: 'jfl', BETA_AUTH_BYPASS: '0', SUPABASE_URL: 'https://test.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'test-key', SUPABASE_SERVICE_ROLE_KEY: 'server-test-key' };
const payload = { createNew: true, seasonName: 'Next', leagueNight: 'Thursday', firstRoundDate: '2026-11-05', rosterLockRound: 5, openingBlockLength: 3, individualMinMatches: 5, roundIntervalDays: 7, tableNumbers: [1,2,3,4], raceChartVersion: 'season-1-default', playoffTeamCount: 4, playoffAnchorTiebreaker: true };
for (const admin of [true, false]) {
  test(`explicit create authenticates actor and preserves database admin denial: ${admin}`, async () => {
    const calls = [];
    const fetch = async (url, init) => {
      calls.push({ url, init });
      if (url.endsWith('/auth/v1/user')) return Response.json({ id: admin ? 'admin' : 'player' });
      assert.ok(url.endsWith('/rpc/create_season_setup'));
      const body = JSON.parse(init.body);
      assert.equal(body.actor_user_id, admin ? 'admin' : 'player');
      assert.equal(body.configured_purpose, 'league');
      return admin ? Response.json([{ id: 'distinct' }]) : Response.json({ message: 'Actor is not a league admin' }, { status: 400 });
    };
    const request = new Request('https://jfl.test/api/admin/seasons', { method: 'POST', headers: { authorization: 'Bearer test-only' }, body: JSON.stringify({ ...payload, actorUserId: 'spoofed-admin' }) });
    const response = await handleCreateSeasonSetupRequest(request, env, { fetch });
    assert.equal(response.status, admin ? 201 : 403);
    assert.equal(calls.length, 2);
  });
}
test('expired create bearer never invokes a mutation', async () => {
  let calls = 0;
  const response = await handleCreateSeasonSetupRequest(new Request('https://jfl.test/api/admin/seasons', { method: 'POST', headers: { authorization: 'Bearer expired' }, body: JSON.stringify(payload) }), env, { fetch: async () => { calls++; return Response.json({}, { status: 401 }); } });
  assert.equal(response.status, 401);
  assert.equal(calls, 1);
});

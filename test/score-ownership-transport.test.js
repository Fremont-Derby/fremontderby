import test from 'node:test';
import assert from 'node:assert/strict';
import { createDualScoringHttpHandlers } from '../src/dualScoringHttp.js';
import { createDualScoringRepository } from '../src/dualScoringRepository.js';
import { rpcErrorStatus } from '../src/rpcErrorStatus.js';

const env = { ENVIRONMENT: 'jfl', SUPABASE_SCHEMA: 'jfl', SUPABASE_URL: 'https://db.example.test', SUPABASE_SERVICE_ROLE_KEY: 'synthetic-service-key' };
const actions = [
  ['record', {}, 'record_player_match_score_rack'],
  ['record', { rackNumber: 1 }, 'update_player_match_score_rack'],
  ['undo', {}, 'undo_player_match_score_rack'],
  ['confirm', {}, 'confirm_player_match_score'],
];

// Controlled PostgREST responses through actual repository/commands/HTTP code.
// This proves transport behavior, not hosted ownership enforcement.
for (const checked of [true]) {
  for (const [handler, extra, rpc] of actions) {
    test(`${rpc}${checked ? '_checked' : ''} ownership denial stays 403 without replay`, async () => {
      const calls = [];
      const handlers = createDualScoringHttpHandlers({ authenticate: async () => ({ id: 'former-owner' }) });
      const body = { scoringTeamId: 'team-a', winnerSide: 'B', ...extra, ...(checked ? { expectedRacks: [] } : {}) };
      const response = await handlers[handler](new Request('https://app.example.test/score', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
      }), env, 'match-1', { fetch: async (url, init) => {
        calls.push({ url, init });
        return Response.json({ code: '42501', message: 'Only the current scorekeeper may change this score' }, { status: 403 });
      } });
      assert.equal(response.status, 403);
      assert.equal(calls.length, 1, 'denied non-idempotent request must never replay');
      assert.equal(calls[0].url, `${env.SUPABASE_URL}/rest/v1/rpc/${rpc}${checked ? '_checked' : ''}`);
      const headers = new Headers(calls[0].init.headers);
      assert.equal(headers.get('content-profile'), 'jfl');
      const sent = JSON.parse(calls[0].init.body);
      assert.equal(sent.actor_user_id, 'former-owner');
      assert.equal(sent.target_scoring_team_id, 'team-a');
      assert.equal(sent.target_player_match_id, 'match-1');
      assert.equal(Object.hasOwn(sent, 'expected_racks'), checked);
      const result = JSON.stringify(await response.json());
      assert.equal(result.includes(env.SUPABASE_SERVICE_ROLE_KEY), false);
      assert.equal(response.headers.has('set-cookie'), false);
    });
  }
}

for (const [method, rpc] of [
  ['recordPlayerMatchScoreRack', 'record_player_match_score_rack'],
  ['updatePlayerMatchScoreRack', 'update_player_match_score_rack'],
  ['undoPlayerMatchScoreRack', 'undo_player_match_score_rack'],
  ['confirmPlayerMatchScore', 'confirm_player_match_score'],
]) {
  test(`${rpc} legacy repository denial retains 403 without replay`, async () => {
    let calls = 0;
    const repository = createDualScoringRepository(env, { fetch: async (url) => {
      calls++;
      assert.equal(url, `${env.SUPABASE_URL}/rest/v1/rpc/${rpc}`);
      return Response.json({ code: '42501', message: 'Only the current scorekeeper may change this score' }, { status: 403 });
    } });
    await assert.rejects(repository[method]({ actorUserId: 'former-owner', playerMatchId: 'match-1', scoringTeamId: 'team-a', winnerSide: 'A', rackNumber: 1 }), error => {
      assert.equal(rpcErrorStatus(error), 403);
      return true;
    });
    assert.equal(calls, 1);
  });
}

test('HTTP requests without a score snapshot fail before transport', async () => {
  const handlers = createDualScoringHttpHandlers({ authenticate: async () => ({ id: 'former-owner' }) });
  for (const [handler, extra] of actions) {
    const response = await handlers[handler](new Request('https://app.example.test/score', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ scoringTeamId: 'team-a', winnerSide: 'A', ...extra }),
    }), env, 'match-1', { fetch: async () => assert.fail('Missing snapshot must not invoke RPC') });
    assert.equal(response.status, 409);
  }
});

test('repository retains HTTP denial independently of unfamiliar SQL message', async () => {
  const repository = createDualScoringRepository(env, { fetch: async () => Response.json({ code: '42501', message: 'Future ownership denial wording' }, { status: 403 }) });
  await assert.rejects(repository.confirmPlayerMatchScore({ actorUserId: 'former-owner', playerMatchId: 'match-1', scoringTeamId: 'team-a' }), /Supabase request failed with 403/);
});

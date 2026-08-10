import test from 'node:test';
import assert from 'node:assert/strict';
import { createDualScoringRepository } from '../src/dualScoringRepository.js';

function fakeFetch(expectedRpc, responseBody = [{ ok: true }]) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    assert.match(url, new RegExp(`/rest/v1/rpc/${expectedRpc}$`));
    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
  return { calls, fetchImpl };
}

const env = {
  SUPABASE_URL: 'https://example.supabase.co/',
  SUPABASE_SERVICE_ROLE_KEY: 'server-only-key',
};

test('comparison repository calls actor-scoped comparison RPC', async () => {
  const fake = fakeFetch('get_player_match_score_comparison', [{ histories_match: false }]);
  const repository = createDualScoringRepository(env, { fetch: fake.fetchImpl });
  const result = await repository.getPlayerMatchScoreComparison({ actorUserId: 'u1', playerMatchId: 'm1' });
  assert.equal(result.histories_match, false);
  assert.deepEqual(JSON.parse(fake.calls[0].init.body), {
    actor_user_id: 'u1',
    target_player_match_id: 'm1',
  });
  assert.equal(fake.calls[0].init.headers.apikey, 'server-only-key');
});

test('rack repository sends winner side to independent score RPC', async () => {
  const fake = fakeFetch('record_player_match_score_rack');
  const repository = createDualScoringRepository(env, { fetch: fake.fetchImpl });
  await repository.recordPlayerMatchScoreRack({ actorUserId: 'u1', playerMatchId: 'm1', winnerSide: 'B' });
  assert.deepEqual(JSON.parse(fake.calls[0].init.body), {
    actor_user_id: 'u1',
    target_player_match_id: 'm1',
    rack_winner_side: 'B',
  });
});

test('undo and confirm repository methods call their service RPCs', async () => {
  for (const [method, rpc] of [
    ['undoPlayerMatchScoreRack', 'undo_player_match_score_rack'],
    ['confirmPlayerMatchScore', 'confirm_player_match_score'],
  ]) {
    const fake = fakeFetch(rpc);
    const repository = createDualScoringRepository(env, { fetch: fake.fetchImpl });
    await repository[method]({ actorUserId: 'u1', playerMatchId: 'm1' });
    assert.deepEqual(JSON.parse(fake.calls[0].init.body), {
      actor_user_id: 'u1',
      target_player_match_id: 'm1',
    });
  }
});

test('repository requires server Supabase bindings', () => {
  assert.throws(
    () => createDualScoringRepository({ SUPABASE_URL: 'https://example.supabase.co' }),
    /SUPABASE_SERVICE_ROLE_KEY is required/,
  );
});

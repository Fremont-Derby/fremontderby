import test from 'node:test';
import assert from 'node:assert/strict';
import { createScoringRepository } from '../src/scoringRepository.js';

const env = {
  SUPABASE_URL: 'https://project.supabase.co/',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret',
};

test('scoring repository undoes the latest rack through the undo RPC', async () => {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify([{
      player_match_id: 'player-match-1',
      undone_rack_number: 3,
      score_a: 1,
      score_b: 1,
      status: 'in_progress',
    }]), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  const repository = createScoringRepository(env, { fetch });
  const result = await repository.undoPlayerMatchRack({
    actorUserId: 'user-1',
    playerMatchId: 'player-match-1',
  });

  assert.equal(calls[0].url, 'https://project.supabase.co/rest/v1/rpc/undo_player_match_rack');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    actor_user_id: 'user-1',
    target_player_match_id: 'player-match-1',
  });
  assert.equal(result.undone_rack_number, 3);
});

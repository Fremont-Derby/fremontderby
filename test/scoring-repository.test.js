import test from 'node:test';
import assert from 'node:assert/strict';
import { createScoringRepository } from '../src/scoringRepository.js';

function createFetch(responses) {
  const calls = [];

  const fetch = async (url, init) => {
    calls.push({ url, init });
    const response = responses.shift();
    return new Response(
      response.body === undefined ? null : JSON.stringify(response.body),
      {
        status: response.status ?? 200,
        headers: { 'content-type': 'application/json' },
      },
    );
  };

  return { fetch, calls };
}

const env = {
  SUPABASE_URL: 'https://project.supabase.co/',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret',
};

test('scoring repository reads scorecards through the scorecard RPC', async () => {
  const { fetch, calls } = createFetch([
    {
      body: [{
        player_match_id: 'player-match-1',
        score_a: 1,
        score_b: 0,
        current_discipline: '8-ball',
        racks: [],
      }],
    },
  ]);
  const repository = createScoringRepository(env, { fetch });

  const scorecard = await repository.getPlayerMatchScorecard({
    actorUserId: 'user-1',
    playerMatchId: 'player-match-1',
  });

  assert.equal(calls[0].url, 'https://project.supabase.co/rest/v1/rpc/get_player_match_scorecard');
  assert.equal(calls[0].init.headers.apikey, 'service-role-secret');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    actor_user_id: 'user-1',
    target_player_match_id: 'player-match-1',
  });
  assert.equal(scorecard.player_match_id, 'player-match-1');
});

test('scoring repository records racks through the rack RPC', async () => {
  const { fetch, calls } = createFetch([
    {
      body: [{
        player_match_id: 'player-match-1',
        rack_number: 1,
        winner_side: 'A',
        score_a: 1,
        score_b: 0,
      }],
    },
  ]);
  const repository = createScoringRepository(env, { fetch });

  const rack = await repository.recordPlayerMatchRack({
    actorUserId: 'user-1',
    playerMatchId: 'player-match-1',
    winnerSide: 'A',
  });

  assert.equal(calls[0].url, 'https://project.supabase.co/rest/v1/rpc/record_player_match_rack');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    actor_user_id: 'user-1',
    target_player_match_id: 'player-match-1',
    rack_winner_side: 'A',
  });
  assert.equal(rack.winner_side, 'A');
});

test('scoring repository surfaces Supabase failures', async () => {
  const { fetch } = createFetch([
    { status: 400, body: { message: 'Player match is already complete' } },
  ]);
  const repository = createScoringRepository(env, { fetch });

  await assert.rejects(
    () => repository.recordPlayerMatchRack({
      actorUserId: 'user-1',
      playerMatchId: 'player-match-1',
      winnerSide: 'A',
    }),
    /already complete/,
  );
});

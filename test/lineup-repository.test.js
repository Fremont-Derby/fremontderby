import test from 'node:test';
import assert from 'node:assert/strict';
import { createLineupRepository } from '../src/lineupRepository.js';

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

test('lineup repository submits lineup slots through the lineup RPC', async () => {
  const { fetch, calls } = createFetch([{ body: [{ lineup_id: 'lineup-1', round_id: 'round-1', team_id: 'team-1', slot_number: 1, player_id: 'player-1', participation_type: 'roster' }, { lineup_id: 'lineup-1', round_id: 'round-1', team_id: 'team-1', slot_number: 4, player_id: null, participation_type: 'forfeit' }] }]);
  const repository = createLineupRepository(env, { fetch });

  const lineup = await repository.submitTeamLineup({ actorUserId: 'captain-user-1', teamId: 'team-1', roundId: 'round-1', slots: [{ slotNumber: 1, playerId: 'player-1' }, { slotNumber: 4, playerId: null }] });

  assert.equal(calls[0].url, 'https://project.supabase.co/rest/v1/rpc/submit_team_lineup');
  assert.equal(calls[0].init.headers.apikey, 'service-role-secret');
  assert.deepEqual(JSON.parse(calls[0].init.body), { actor_user_id: 'captain-user-1', target_team_id: 'team-1', target_round_id: 'round-1', lineup_slots: [{ slotNumber: 1, playerId: 'player-1' }, { slotNumber: 4, playerId: null }] });
  assert.deepEqual(lineup.map((slot) => slot.participation_type), ['roster', 'forfeit']);
});

test('lineup repository lists reveal-aware rows including masked opponent submission rows', async () => {
  const { fetch, calls } = createFetch([{ body: [
    { lineup_id: 'lineup-1', round_id: 'round-1', team_id: 'team-1', is_own_team: true, opponent_lineup_visible: false, slot_number: 1, player_id: 'player-1', participation_type: 'roster' },
    { lineup_id: 'lineup-2', round_id: 'round-1', team_id: 'team-2', is_own_team: false, opponent_lineup_visible: false, slot_number: 0, player_id: null, participation_type: null },
  ] }]);
  const repository = createLineupRepository(env, { fetch });

  const lineups = await repository.listVisibleTeamLineups({ actorUserId: 'captain-user-1', teamId: 'team-1', roundId: 'round-1' });

  assert.equal(calls[0].url, 'https://project.supabase.co/rest/v1/rpc/list_visible_team_lineups');
  assert.deepEqual(JSON.parse(calls[0].init.body), { actor_user_id: 'captain-user-1', target_team_id: 'team-1', target_round_id: 'round-1' });
  assert.equal(lineups.length, 2);
  assert.equal(lineups[1].is_own_team, false);
  assert.equal(lineups[1].slot_number, 0);
  assert.equal(lineups[1].player_id, null);
});

test('lineup repository turns eligibility failures into participant-facing guidance', async () => {
  const { fetch } = createFetch([{ status: 400, body: { message: 'Lineup player is not eligible for this team round' } }]);
  const repository = createLineupRepository(env, { fetch });

  await assert.rejects(
    () => repository.submitTeamLineup({ actorUserId: 'captain-user-1', teamId: 'team-1', roundId: 'round-1', slots: [{ slotNumber: 1, playerId: 'player-1' }] }),
    /no longer eligible.*Refresh the lineup/i,
  );
});

test('lineup repository does not expose the Supabase implementation prefix', async () => {
  const { fetch } = createFetch([{ status: 500, body: { message: 'unexpected database detail' } }]);
  const repository = createLineupRepository(env, { fetch });

  await assert.rejects(
    () => repository.submitTeamLineup({ actorUserId: 'captain-user-1', teamId: 'team-1', roundId: 'round-1', slots: [] }),
    (error) => {
      assert.match(error.message, /Fremont Derby could not save the lineup/);
      assert.doesNotMatch(error.message, /Supabase request failed/);
      return true;
    },
  );
});

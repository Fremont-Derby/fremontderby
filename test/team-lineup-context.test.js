import test from 'node:test';
import assert from 'node:assert/strict';
import { createTeamRepository } from '../src/teamRepository.js';

function createFetch(responses) {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ url, init });
    const response = responses.shift();
    if (!response) return new Response('{}', { status: 500 });
    return new Response(JSON.stringify(response.body), {
      status: response.status ?? 200,
      headers: { 'content-type': 'application/json' },
    });
  };
  return { fetch, calls };
}

const env = {
  SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret',
};

test('team management enriches captained teams with human-readable scheduled rounds', async () => {
  const { fetch, calls } = createFetch([
    {
      body: [{
        player_id: 'player-1',
        captain_teams: [{
          seasonId: 'season-1',
          seasonName: 'Season 1',
          teamId: 'team-1',
          teamName: 'Breakers',
          roster: [],
          pendingInvitations: [],
        }],
        invitations: [],
      }],
    },
    { body: [{ id: 'season-1', name: 'Season 1', status: 'registration' }] },
    { body: [{ id: 'player-1', display_name: 'Alice' }] },
    {
      body: [{
        id: 'team-match-1',
        round_id: 'round-1',
        team_a_id: 'team-1',
        team_b_id: 'team-2',
        table_number: 2,
        status: 'scheduled',
      }],
    },
    {
      body: [{
        id: 'round-1',
        round_number: 1,
        scheduled_on: '2026-09-03',
        status: 'scheduled',
        stage: 'regular',
        lineup_deadline_at: '2026-09-03T19:00:00Z',
      }],
    },
    {
      body: [
        { id: 'team-1', name: 'Breakers' },
        { id: 'team-2', name: 'Rack Pack' },
      ],
    },
  ]);

  const repository = createTeamRepository(env, { fetch });
  const management = await repository.listOwnTeamManagement({ actorUserId: 'user-1' });

  assert.deepEqual(management.captain_teams[0].lineupRounds, [{
    roundId: 'round-1',
    roundNumber: 1,
    scheduledOn: '2026-09-03',
    roundStatus: 'scheduled',
    lineupDeadlineAt: '2026-09-03T19:00:00Z',
    teamMatchId: 'team-match-1',
    opponentName: 'Rack Pack',
    tableNumber: 2,
    teamMatchStatus: 'scheduled',
  }]);
  assert.match(calls[3].url, /\/rest\/v1\/team_matches\?/);
  assert.match(calls[3].url, /team_a_id\.eq\.team-1/);
  assert.match(calls[3].url, /team_b_id\.eq\.team-1/);
  assert.match(calls[4].url, /\/rest\/v1\/rounds\?/);
  assert.match(calls[4].url, /stage=eq\.regular/);
  assert.match(calls[5].url, /\/rest\/v1\/teams\?/);
});

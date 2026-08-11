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

test('team management gives a rostered player one human-readable availability context per scheduled team round', async () => {
  const { fetch } = createFetch([
    {
      body: [{
        player_id: 'player-1',
        captain_teams: [],
        invitations: [],
      }],
    },
    { body: [] },
    { body: [] },
    { body: [{ season_id: 'season-1', team_id: 'team-1', role: 'player' }] },
    { body: [{ season_id: 'season-1', participation_type: 'free_agent', status: 'active' }] },
    { body: [{ id: 'season-1', name: 'Season 1', status: 'active' }] },
    { body: [{ id: 'team-1', season_id: 'season-1', name: 'Breakers' }] },
    {
      body: [{
        id: 'round-1',
        season_id: 'season-1',
        round_number: 1,
        scheduled_on: '2026-09-03',
        status: 'scheduled',
        stage: 'regular',
      }],
    },
    {
      body: [{
        id: 'match-1',
        season_id: 'season-1',
        round_id: 'round-1',
        team_a_id: 'team-1',
        team_b_id: 'team-2',
        table_number: 2,
        status: 'scheduled',
      }],
    },
  ]);

  const repository = createTeamRepository(env, { fetch });
  const management = await repository.listOwnTeamManagement({ actorUserId: 'user-1' });

  assert.deepEqual(management.availability_contexts, [{
    seasonId: 'season-1',
    seasonName: 'Season 1',
    participationType: 'roster',
    teamId: 'team-1',
    teamName: 'Breakers',
    roundId: 'round-1',
    roundNumber: 1,
    scheduledOn: '2026-09-03',
    roundStatus: 'scheduled',
    tableNumber: 2,
    teamMatchStatus: 'scheduled',
  }]);
});

test('team management gives an unrostered active free agent regular-season availability contexts', async () => {
  const { fetch } = createFetch([
    {
      body: [{
        player_id: 'player-2',
        captain_teams: [],
        invitations: [],
      }],
    },
    { body: [{ id: 'season-1', name: 'Season 1', status: 'registration' }] },
    { body: [] },
    { body: [] },
    { body: [{ season_id: 'season-1', participation_type: 'free_agent', status: 'active' }] },
    { body: [{ id: 'season-1', name: 'Season 1', status: 'registration' }] },
    { body: [] },
    {
      body: [{
        id: 'round-1',
        season_id: 'season-1',
        round_number: 1,
        scheduled_on: '2026-09-03',
        status: 'scheduled',
        stage: 'regular',
      }],
    },
    { body: [] },
  ]);

  const repository = createTeamRepository(env, { fetch });
  const management = await repository.listOwnTeamManagement({ actorUserId: 'user-2' });

  assert.deepEqual(management.availability_contexts, [{
    seasonId: 'season-1',
    seasonName: 'Season 1',
    participationType: 'free_agent',
    teamId: null,
    teamName: null,
    roundId: 'round-1',
    roundNumber: 1,
    scheduledOn: '2026-09-03',
    roundStatus: 'scheduled',
    tableNumber: null,
    teamMatchStatus: null,
  }]);
});

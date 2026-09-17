import test from 'node:test';
import assert from 'node:assert/strict';
import { createTeamRepository } from '../src/teamRepository.js';

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

test('team repository loads team management with open seasons and player directory', async () => {
  const { fetch, calls } = createFetch([
    {
      body: [{
        player_id: 'player-1',
        captain_teams: [{ teamName: 'Breakers' }],
        invitations: [{ teamName: 'Rack Pack' }],
      }],
    },
    {
      body: [{
        id: 'season-1',
        name: 'Season 1',
        status: 'registration',
        first_round_date: '2026-09-03',
      }],
    },
    {
      body: [
        { id: 'player-1', display_name: 'Alice' },
        { id: 'player-2', display_name: 'Bob' },
      ],
    },
  ]);
  const repository = createTeamRepository(env, { fetch });

  const teamManagement = await repository.listOwnTeamManagement({
    actorUserId: 'user-1',
  });

  assert.deepEqual(teamManagement, {
    player_id: 'player-1',
    captain_teams: [{ teamName: 'Breakers', roster: [], members: [] }],
    invitations: [{ teamName: 'Rack Pack' }],
    open_seasons: [{
      id: 'season-1',
      name: 'Season 1',
      status: 'registration',
      first_round_date: '2026-09-03',
    }],
    players: [
      {
        id: 'player-1',
        playerId: 'player-1',
        displayName: 'Alice',
        display_name: 'Alice',
        hasLogin: false,
        user_id: undefined,
        createdAt: undefined,
        created_at: undefined,
        isDuplicateName: false,
        label: 'Alice — Unclaimed',
      },
      {
        id: 'player-2',
        playerId: 'player-2',
        displayName: 'Bob',
        display_name: 'Bob',
        hasLogin: false,
        user_id: undefined,
        createdAt: undefined,
        created_at: undefined,
        isDuplicateName: false,
        label: 'Bob — Unclaimed',
      },
    ],
    applications: [],
    returning_slots: [],
  });
  assert.equal(calls[0].url, 'https://project.supabase.co/rest/v1/rpc/get_own_team_management');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    actor_user_id: 'user-1',
  });
  assert.equal(calls[0].init.headers.apikey, 'service-role-secret');
  assert.match(calls[1].url, /\/rest\/v1\/seasons\?/);
  assert.match(calls[1].url, /status=eq\.registration/);
  assert.match(calls[2].url, /display_name/);
  assert.match(calls[2].url, /user_id/);
  assert.match(calls[2].url, /created_at/);
  assert.equal(calls[1].init.headers.apikey, 'service-role-secret');
  assert.match(calls[2].url, /\/rest\/v1\/players\?/);
  assert.equal(calls[2].init.headers.apikey, 'service-role-secret');
});

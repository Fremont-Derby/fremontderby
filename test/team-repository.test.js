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

test('team repository creates a team through the captain RPC', async () => {
  const { fetch, calls } = createFetch([
    {
      body: [{
        id: 'team-1',
        season_id: 'season-1',
        name: 'Breakers',
        captain_player_id: 'player-1',
      }],
    },
  ]);
  const repository = createTeamRepository(env, { fetch });

  const team = await repository.createTeamWithCaptain({
    actorUserId: 'user-1',
    seasonId: 'season-1',
    teamName: 'Breakers',
  });

  assert.deepEqual(team, {
    id: 'team-1',
    season_id: 'season-1',
    name: 'Breakers',
    captain_player_id: 'player-1',
  });
  assert.equal(calls[0].url, 'https://project.supabase.co/rest/v1/rpc/create_team_with_captain');
  assert.equal(calls[0].init.headers.apikey, 'service-role-secret');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    actor_user_id: 'user-1',
    target_season_id: 'season-1',
    team_name: 'Breakers',
  });
});

test('team repository surfaces Supabase failures', async () => {
  const { fetch } = createFetch([
    { status: 400, body: { message: 'Player profile is required before creating a team' } },
  ]);
  const repository = createTeamRepository(env, { fetch });

  await assert.rejects(
    () => repository.createTeamWithCaptain({
      actorUserId: 'user-1',
      seasonId: 'season-1',
      teamName: 'Breakers',
    }),
    /Player profile is required/,
  );
});

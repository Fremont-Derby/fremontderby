import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlayerProfileRepository } from '../src/playerProfileRepository.js';

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

test('player profile repository fetches the actor profile by user id', async () => {
  const { fetch, calls } = createFetch([
    {
      body: [{
        id: 'player-1',
        user_id: 'user-1',
        display_name: 'Kai',
        fargo_rating: 531,
        rating_status: 'established',
        teams: [{ teamName: 'Breakers' }],
        seasons: [{ seasonName: 'Fall 2026' }],
      }],
    },
  ]);
  const repository = createPlayerProfileRepository(env, { fetch });

  const profile = await repository.getProfileByUserId('user-1');

  assert.deepEqual(profile, {
    id: 'player-1',
    user_id: 'user-1',
    display_name: 'Kai',
    fargo_rating: 531,
    rating_status: 'established',
    teams: [{ teamName: 'Breakers' }],
    seasons: [{ seasonName: 'Fall 2026' }],
  });
  assert.equal(calls[0].url, 'https://project.supabase.co/rest/v1/rpc/get_own_player_profile');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.headers.apikey, 'service-role-secret');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    actor_user_id: 'user-1',
  });
});

test('player profile repository returns null for a missing profile', async () => {
  const { fetch } = createFetch([{ body: [] }]);
  const repository = createPlayerProfileRepository(env, { fetch });

  assert.equal(await repository.getProfileByUserId('user-1'), null);
});

test('player profile repository upserts through the profile RPC', async () => {
  const { fetch, calls } = createFetch([
    { body: [{ id: 'player-1', user_id: 'user-1', display_name: 'Kai B' }] },
  ]);
  const repository = createPlayerProfileRepository(env, { fetch });

  const profile = await repository.saveProfile({
    actorUserId: 'user-1',
    displayName: 'Kai B',
  });

  assert.deepEqual(profile, { id: 'player-1', user_id: 'user-1', display_name: 'Kai B' });
  assert.equal(calls[0].url, 'https://project.supabase.co/rest/v1/rpc/upsert_player_profile');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    actor_user_id: 'user-1',
    profile_display_name: 'Kai B',
    profile_fargo_external_id: null,
  });
});

test('player profile repository surfaces Supabase failures', async () => {
  const { fetch } = createFetch([
    { status: 400, body: { message: 'display_name is required' } },
  ]);
  const repository = createPlayerProfileRepository(env, { fetch });

  await assert.rejects(
    () => repository.saveProfile({ actorUserId: 'user-1', displayName: '' }),
    /Supabase request failed with 400: display_name is required/,
  );
});

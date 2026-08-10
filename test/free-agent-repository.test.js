import test from 'node:test';
import assert from 'node:assert/strict';
import { createFreeAgentRepository } from '../src/freeAgentRepository.js';

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

test('free-agent repository registers through the free-agent RPC', async () => {
  const { fetch, calls } = createFetch([
    {
      body: [{
        season_id: 'season-1',
        player_id: 'player-1',
        participation_type: 'free_agent',
        status: 'active',
      }],
    },
  ]);
  const repository = createFreeAgentRepository(env, { fetch });

  const freeAgent = await repository.registerFreeAgent({
    actorUserId: 'user-1',
    seasonId: 'season-1',
  });

  assert.equal(calls[0].url, 'https://project.supabase.co/rest/v1/rpc/register_free_agent');
  assert.equal(calls[0].init.headers.apikey, 'service-role-secret');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    actor_user_id: 'user-1',
    target_season_id: 'season-1',
  });
  assert.equal(freeAgent.participation_type, 'free_agent');
});

test('free-agent repository sets round availability through the availability RPC', async () => {
  const { fetch, calls } = createFetch([
    {
      body: [{
        season_id: 'season-1',
        round_id: 'round-1',
        player_id: 'player-1',
        status: 'available',
      }],
    },
  ]);
  const repository = createFreeAgentRepository(env, { fetch });

  const availability = await repository.setFreeAgentAvailability({
    actorUserId: 'user-1',
    roundId: 'round-1',
    availabilityStatus: 'available',
  });

  assert.equal(calls[0].url, 'https://project.supabase.co/rest/v1/rpc/set_free_agent_availability');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    actor_user_id: 'user-1',
    target_round_id: 'round-1',
    availability_status: 'available',
  });
  assert.equal(availability.status, 'available');
});

test('free-agent repository surfaces Supabase failures', async () => {
  const { fetch } = createFetch([
    { status: 400, body: { message: 'Rostered players cannot register as free agents' } },
  ]);
  const repository = createFreeAgentRepository(env, { fetch });

  await assert.rejects(
    () => repository.registerFreeAgent({ actorUserId: 'user-1', seasonId: 'season-1' }),
    /Rostered players cannot register/,
  );
});

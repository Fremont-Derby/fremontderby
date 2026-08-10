import test from 'node:test';
import assert from 'node:assert/strict';
import { createAvailabilityRepository } from '../src/availabilityRepository.js';

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

test('availability repository sets roster availability through the roster RPC', async () => {
  const { fetch, calls } = createFetch([
    {
      body: [{
        season_id: 'season-1',
        round_id: 'round-1',
        team_id: 'team-1',
        player_id: 'player-1',
        status: 'available',
      }],
    },
  ]);
  const repository = createAvailabilityRepository(env, { fetch });

  const availability = await repository.setRosterAvailability({
    actorUserId: 'user-1',
    roundId: 'round-1',
    availabilityStatus: 'available',
  });

  assert.equal(calls[0].url, 'https://project.supabase.co/rest/v1/rpc/set_roster_availability');
  assert.equal(calls[0].init.headers.apikey, 'service-role-secret');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    actor_user_id: 'user-1',
    target_round_id: 'round-1',
    availability_status: 'available',
  });
  assert.equal(availability.status, 'available');
});

test('availability repository lists team round availability through the captain read RPC', async () => {
  const { fetch, calls } = createFetch([
    {
      body: [{
        season_id: 'season-1',
        round_id: 'round-1',
        team_id: 'team-1',
        player_id: 'player-1',
        display_name: 'Kai',
        role: 'captain',
        participation_type: 'roster',
        fargo_rating: 530,
        rating_status: 'established',
        availability_status: 'available',
      }],
    },
  ]);
  const repository = createAvailabilityRepository(env, { fetch });

  const availability = await repository.listTeamRoundAvailability({
    actorUserId: 'captain-user-1',
    teamId: 'team-1',
    roundId: 'round-1',
  });

  assert.equal(calls[0].url, 'https://project.supabase.co/rest/v1/rpc/list_team_round_availability');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    actor_user_id: 'captain-user-1',
    target_team_id: 'team-1',
    target_round_id: 'round-1',
  });
  assert.deepEqual(availability, [{
    season_id: 'season-1',
    round_id: 'round-1',
    team_id: 'team-1',
    player_id: 'player-1',
    display_name: 'Kai',
    role: 'captain',
    participation_type: 'roster',
    fargo_rating: 530,
    rating_status: 'established',
    availability_status: 'available',
  }]);
});

test('availability repository surfaces Supabase failures', async () => {
  const { fetch } = createFetch([
    { status: 400, body: { message: 'Active roster membership is required before setting availability' } },
  ]);
  const repository = createAvailabilityRepository(env, { fetch });

  await assert.rejects(
    () => repository.setRosterAvailability({
      actorUserId: 'user-1',
      roundId: 'round-1',
      availabilityStatus: 'available',
    }),
    /Active roster membership is required/,
  );
});

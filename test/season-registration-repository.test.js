import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeasonRegistrationRepository } from '../src/seasonRegistrationRepository.js';

function response(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

test('registration repository calls trusted self-registration RPC', async () => {
  const calls = [];
  const repository = createSeasonRegistrationRepository(
    { SUPABASE_URL: 'https://example.supabase.co/', SUPABASE_SERVICE_ROLE_KEY: 'service-key' },
    { fetch: async (url, init) => {
      calls.push([url, init]);
      return response([{ season_id: 'season-1', player_id: 'player-1', payment_status: 'unpaid' }]);
    } },
  );

  const result = await repository.register({
    actorUserId: 'user-1',
    seasonId: 'season-1',
    participationType: 'free_agent',
  });

  assert.equal(result.player_id, 'player-1');
  assert.equal(calls[0][0], 'https://example.supabase.co/rest/v1/rpc/register_for_season');
  assert.equal(calls[0][1].headers.authorization, 'Bearer service-key');
  assert.deepEqual(JSON.parse(calls[0][1].body), {
    actor_user_id: 'user-1',
    target_season_id: 'season-1',
    registration_participation_type: 'free_agent',
  });
});

test('registration repository reads only the actor registration RPC', async () => {
  const calls = [];
  const repository = createSeasonRegistrationRepository(
    { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'service-key' },
    { fetch: async (url, init) => {
      calls.push([url, init]);
      return response([]);
    } },
  );

  assert.equal(await repository.getOwnRegistration({ actorUserId: 'user-1', seasonId: 'season-1' }), null);
  assert.equal(calls[0][0], 'https://example.supabase.co/rest/v1/rpc/get_own_season_registration');
});

test('registration repository requires server-only Supabase bindings', () => {
  assert.throws(
    () => createSeasonRegistrationRepository({ SUPABASE_URL: 'https://example.supabase.co' }),
    /SUPABASE_SERVICE_ROLE_KEY is required/,
  );
});

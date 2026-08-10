import test from 'node:test';
import assert from 'node:assert/strict';
import { createSupabaseSeasonRepository } from '../src/supabaseSeasonRepository.js';

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

test('Supabase season repository fetches one season by id', async () => {
  const { fetch, calls } = createFetch([
    { body: [{ id: 'season-1', status: 'draft' }] },
  ]);
  const repository = createSupabaseSeasonRepository(env, { fetch });

  const season = await repository.getSeason('season-1');

  assert.deepEqual(season, { id: 'season-1', status: 'draft' });
  assert.equal(
    calls[0].url,
    'https://project.supabase.co/rest/v1/seasons?id=eq.season-1&select=id,status',
  );
  assert.equal(calls[0].init.headers.apikey, 'service-role-secret');
  assert.equal(calls[0].init.headers.authorization, 'Bearer service-role-secret');
});

test('Supabase season repository returns null for a missing season', async () => {
  const { fetch } = createFetch([{ body: [] }]);
  const repository = createSupabaseSeasonRepository(env, { fetch });

  assert.equal(await repository.getSeason('missing-season'), null);
});

test('Supabase season repository lists season team ids', async () => {
  const { fetch, calls } = createFetch([
    { body: [{ id: 'team-1' }, { id: 'team-2' }] },
  ]);
  const repository = createSupabaseSeasonRepository(env, { fetch });

  const teams = await repository.listSeasonTeams('season-1');

  assert.deepEqual(teams, [{ id: 'team-1' }, { id: 'team-2' }]);
  assert.equal(
    calls[0].url,
    'https://project.supabase.co/rest/v1/teams?season_id=eq.season-1&select=id&order=name.asc',
  );
});

test('Supabase season repository saves a published schedule through the RPC', async () => {
  const { fetch, calls } = createFetch([
    { body: [{ round_count: 7, team_match_count: 28 }] },
  ]);
  const repository = createSupabaseSeasonRepository(env, { fetch });

  const result = await repository.savePublishedSchedule({
    seasonId: 'season-1',
    actorUserId: 'admin-user-1',
    previousStatus: 'draft',
    rounds: [{ roundNumber: 1, matches: [] }],
  });

  assert.deepEqual(result, { round_count: 7, team_match_count: 28 });
  assert.equal(calls[0].url, 'https://project.supabase.co/rest/v1/rpc/publish_season_schedule');
  assert.equal(calls[0].init.method, 'POST');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    target_season_id: 'season-1',
    actor_user_id: 'admin-user-1',
    expected_previous_status: 'draft',
    rounds_payload: [{ roundNumber: 1, matches: [] }],
  });
});

test('Supabase season repository surfaces failed Supabase requests', async () => {
  const { fetch } = createFetch([
    { status: 500, body: { message: 'database unavailable' } },
  ]);
  const repository = createSupabaseSeasonRepository(env, { fetch });

  await assert.rejects(
    () => repository.getSeason('season-1'),
    /Supabase request failed with 500: database unavailable/,
  );
});

test('Supabase season repository requires server-only configuration', () => {
  assert.throws(
    () => createSupabaseSeasonRepository({ SUPABASE_URL: 'https://project.supabase.co' }),
    /SUPABASE_SERVICE_ROLE_KEY/,
  );
  assert.throws(
    () => createSupabaseSeasonRepository(env, { fetch: null }),
    /fetch implementation/,
  );
});

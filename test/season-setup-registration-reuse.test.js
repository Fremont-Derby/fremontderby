import test from 'node:test';
import assert from 'node:assert/strict';
import { createSupabaseSeasonRepository } from '../src/supabaseSeasonRepository.js';

function createFetch(responses) {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ url, init });
    const response = responses.shift();
    return new Response(JSON.stringify(response?.body ?? {}), {
      status: response?.status ?? 200,
      headers: { 'content-type': 'application/json' },
    });
  };
  return { fetch, calls };
}

const env = {
  SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret',
};

function setupInput(overrides = {}) {
  return {
    actorUserId: 'admin-user-1',
    seasonName: 'Fremont Derby Season 1',
    leagueNight: 'Thursday',
    firstRoundDate: '2026-09-03',
    rosterLockRound: 5,
    openingBlockLength: 3,
    individualMinMatches: 5,
    roundIntervalDays: 7,
    tableNumbers: [1, 2, 3, 4],
    raceChartVersion: 'season-1-default',
    playoffTeamCount: 4,
    playoffAnchorTiebreaker: true,
    ...overrides,
  };
}

test('fresh admin browser reuses the single bootstrapped registration season', async () => {
  const { fetch, calls } = createFetch([
    { body: [{ id: 'season-existing' }] },
    { body: [{ id: 'season-existing', name: 'Fremont Derby Season 1' }] },
  ]);
  const repository = createSupabaseSeasonRepository(env, { fetch });

  const result = await repository.saveSeasonSetup(setupInput());

  assert.equal(result.id, 'season-existing');
  assert.match(calls[0].url, /\/rest\/v1\/seasons\?status=eq\.registration/);
  assert.equal(calls[1].url, 'https://project.supabase.co/rest/v1/rpc/configure_season_setup');
  assert.equal(JSON.parse(calls[1].init.body).target_season_id, 'season-existing');
});

test('season setup refuses an ambiguous implicit target instead of creating a duplicate', async () => {
  const { fetch, calls } = createFetch([
    { body: [{ id: 'season-1' }, { id: 'season-2' }] },
  ]);
  const repository = createSupabaseSeasonRepository(env, { fetch });

  await assert.rejects(
    () => repository.saveSeasonSetup(setupInput()),
    /Multiple registration seasons exist/,
  );
  assert.equal(calls.length, 1);
});

test('empty deployment still allows the setup RPC to create the first season', async () => {
  const { fetch, calls } = createFetch([
    { body: [] },
    { body: [{ id: 'season-new', name: 'Fremont Derby Season 1' }] },
  ]);
  const repository = createSupabaseSeasonRepository(env, { fetch });

  const result = await repository.saveSeasonSetup(setupInput());

  assert.equal(result.id, 'season-new');
  assert.equal(JSON.parse(calls[1].init.body).target_season_id, undefined);
});

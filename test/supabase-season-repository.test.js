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
    {
      body: [{
        id: 'season-1',
        status: 'draft',
        first_round_date: '2026-09-03',
        round_interval_days: 7,
        default_table_numbers: [1, 2, 3, 4],
      }],
    },
  ]);
  const repository = createSupabaseSeasonRepository(env, { fetch });

  const season = await repository.getSeason('season-1');

  assert.deepEqual(season, {
    id: 'season-1',
    status: 'draft',
    first_round_date: '2026-09-03',
    round_interval_days: 7,
    default_table_numbers: [1, 2, 3, 4],
  });
  assert.equal(
    calls[0].url,
    'https://project.supabase.co/rest/v1/seasons?id=eq.season-1&select=id,status,first_round_date,round_interval_days,default_table_numbers',
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

test('Supabase season repository loads admin setup through the setup RPC', async () => {
  const { fetch, calls } = createFetch([
    {
      body: [{
        id: 'season-1',
        name: 'Fremont Derby Season 1',
        teams: [{ teamName: 'Breakers' }],
        rounds: [],
      }],
    },
  ]);
  const repository = createSupabaseSeasonRepository(env, { fetch });

  const setup = await repository.getSeasonSetup({
    actorUserId: 'admin-user-1',
    seasonId: 'season-1',
  });

  assert.equal(setup.name, 'Fremont Derby Season 1');
  assert.equal(calls[0].url, 'https://project.supabase.co/rest/v1/rpc/get_season_setup');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    actor_user_id: 'admin-user-1',
    target_season_id: 'season-1',
  });
});

test('Supabase season repository saves setup through the setup RPC', async () => {
  const { fetch, calls } = createFetch([
    {
      body: [{
        id: 'season-1',
        name: 'Fremont Derby Season 1',
        first_round_date: '2026-09-03',
      }],
    },
  ]);
  const repository = createSupabaseSeasonRepository(env, { fetch });

  const setup = await repository.saveSeasonSetup({
    actorUserId: 'admin-user-1',
    seasonId: 'season-1',
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
  });

  assert.equal(setup.id, 'season-1');
  assert.equal(calls[0].url, 'https://project.supabase.co/rest/v1/rpc/configure_season_setup');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    actor_user_id: 'admin-user-1',
    target_season_id: 'season-1',
    configured_season_name: 'Fremont Derby Season 1',
    configured_league_night: 'Thursday',
    configured_first_round_date: '2026-09-03',
    configured_roster_lock_round: 5,
    configured_opening_block_length: 3,
    configured_individual_min_matches: 5,
    configured_round_interval_days: 7,
    configured_table_numbers: [1, 2, 3, 4],
    configured_race_chart_version: 'season-1-default',
    configured_playoff_team_count: 4,
    configured_playoff_anchor_tiebreaker: true,
  });
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

test('Supabase season repository lists seasons only after verifying league-admin access', async () => {
  const { fetch, calls } = createFetch([
    {
      body: [
        { id: 'season-live', name: 'Fremont Derby Season 1', status: 'registration' },
        { id: 'season-war', name: 'Season 1 War Game', status: 'playoffs' },
      ],
    },
    { body: [{ id: 'season-live' }] },
  ]);
  const repository = createSupabaseSeasonRepository(env, { fetch });

  const seasons = await repository.listAdminSeasons({ actorUserId: 'admin-user-1' });

  assert.deepEqual(seasons.map((season) => season.status), ['registration', 'playoffs']);
  assert.equal(
    calls[0].url,
    'https://project.supabase.co/rest/v1/seasons?select=id,name,status,created_at&order=created_at.desc',
  );
  assert.equal(calls[1].url, 'https://project.supabase.co/rest/v1/rpc/get_season_setup');
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    actor_user_id: 'admin-user-1',
    target_season_id: 'season-live',
  });
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { createStandingsRepository } from '../src/standingsRepository.js';

const env = {
  SUPABASE_URL: 'https://project.supabase.co/',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret',
};

test('standings repository lists team standings through the standings RPC', async () => {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify([{
      season_id: 'season-1',
      team_id: 'team-1',
      standings_rank: 1,
      standing_points: 2,
      match_points: 3,
    }]), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  const repository = createStandingsRepository(env, { fetch });
  const standings = await repository.listTeamStandings({ seasonId: 'season-1' });

  assert.equal(calls[0].url, 'https://project.supabase.co/rest/v1/rpc/list_team_standings');
  assert.equal(calls[0].init.headers.apikey, 'service-role-secret');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    target_season_id: 'season-1',
  });
  assert.equal(standings[0].team_id, 'team-1');
});

test('standings repository lists individual standings through the standings RPC', async () => {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify([{
      season_id: 'season-1',
      player_id: 'player-1',
      standings_rank: 1,
      prize_rank: 1,
      is_prize_eligible: true,
      wins: 5,
    }]), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  const repository = createStandingsRepository(env, { fetch });
  const standings = await repository.listIndividualStandings({ seasonId: 'season-1' });

  assert.equal(calls[0].url, 'https://project.supabase.co/rest/v1/rpc/list_individual_standings');
  assert.equal(calls[0].init.headers.apikey, 'service-role-secret');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    target_season_id: 'season-1',
  });
  assert.equal(standings[0].player_id, 'player-1');
});

test('standings repository surfaces Supabase failures', async () => {
  const fetch = async () => new Response(
    JSON.stringify({ message: 'standings unavailable' }),
    {
      status: 500,
      headers: { 'content-type': 'application/json' },
    },
  );
  const repository = createStandingsRepository(env, { fetch });

  await assert.rejects(
    () => repository.listTeamStandings({ seasonId: 'season-1' }),
    /standings unavailable/,
  );
});


test('standings repository lists public seasons with registration progress', async () => {
  const calls = [];
  const responses = [[{
      id: 'season-1',
      name: 'Fremont Derby Season 1',
      status: 'registration',
      first_round_date: '2026-09-03',
      team_count: 2,
      confirmed_team_count: 1,
      team_capacity: 8,
      minimum_committed_roster: 3,
      occupied_slots: 3,
      open_team_slots: 5,
      reserved_returning_slots: 1,
      held_team_slots: 1,
      applications_waiting: 4,
      rostered_player_count: 2,
      registered_player_count: 5,
      free_agent_count: 3,
      at_risk_team_count: 1,
    }]];
  const fetch = async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(responses.shift()), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  const repository = createStandingsRepository(env, { fetch });
  const seasons = await repository.listPublicSeasons();

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://project.supabase.co/rest/v1/rpc/list_public_season_registration');
  assert.equal(calls[0].init.method, 'POST');
  assert.deepEqual(seasons[0], {
    id: 'season-1',
    name: 'Fremont Derby Season 1',
    status: 'registration',
    firstRoundDate: '2026-09-03',
    teamCount: 2,
    confirmedTeamCount: 1,
    teamCapacity: 8,
    occupiedSlots: 3,
    openTeamSlots: 5,
    reservedReturningSlots: 1,
    heldTeamSlots: 1,
    applicationsWaiting: 4,
    rosteredPlayerCount: 2,
    registeredPlayerCount: 5,
    freeAgentCount: 3,
    atRiskTeamCount: 1,
    minimumCommittedRoster: 3,
  });
});

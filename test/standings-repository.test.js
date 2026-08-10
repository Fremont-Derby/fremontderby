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

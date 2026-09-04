import test from 'node:test';
import assert from 'node:assert/strict';

import worker from '../src/personaRouterEntry.js';

const LEGACY_SEASON_ID = '8a38a413-0359-a95a-4dc8-383123c7e092';
const LIVE_JFL_SEASON_ID = '207abd00-3899-1ef2-d251-2a15efe5edc2';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const jflEnv = {
  ENVIRONMENT: 'jfl',
  SUPABASE_SCHEMA: 'jfl',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-key',
};

function mockSeasonFetch(seasonId) {
  return async (input) => {
    const url = new URL(typeof input === 'string' ? input : input.url);
    if (url.pathname.endsWith('/rest/v1/rpc/list_public_season_registration')) {
      return json([{
        id: seasonId,
        name: 'Legacy Season',
        status: 'complete',
        first_round_date: '2026-02-05',
        team_count: 8,
        confirmed_team_count: 8,
        team_capacity: 8,
        occupied_slots: 8,
        open_team_slots: 0,
        reserved_returning_slots: 0,
        held_team_slots: 0,
        applications_waiting: 0,
        rostered_player_count: 32,
        registered_player_count: 32,
        free_agent_count: 0,
        open_primary_roster_spots: 0,
        at_risk_team_count: 0,
        minimum_committed_roster: 3,
      }]);
    }
    if (url.pathname.endsWith('/rest/v1/rounds')) {
      return json([{ id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', round_number: 1, scheduled_on: '2026-02-05', status: 'finalized', stage: 'regular' }]);
    }
    if (url.pathname.endsWith('/rest/v1/team_matches')) return json([]);
    if (url.pathname.endsWith('/rest/v1/teams')) return json([]);
    if (url.pathname.includes('/rest/v1/season_players')) {
      return json([{
        player_id: '11111111-1111-1111-1111-111111111111',
        status: 'active',
        players: { id: '11111111-1111-1111-1111-111111111111', display_name: 'JFL QA Free Agent' },
      }]);
    }
    if (url.pathname.includes('team_standings') || url.pathname.includes('individual_standings')) return json([]);
    if (url.pathname.includes('prize')) return json([]);
    return json([]);
  };
}

test('JFL schedule accepts PostgreSQL UUID text even when it is not RFC version/variant tagged', async () => {
  const originalFetch = globalThis.fetch;
  const seen = [];
  globalThis.fetch = async (input) => {
    const url = new URL(typeof input === 'string' ? input : input.url);
    seen.push(url.pathname + url.search);
    return mockSeasonFetch(LEGACY_SEASON_ID)(input);
  };

  try {
    const response = await worker.fetch(
      new Request(`https://jfl.fremontderby.com/api/seasons/${LEGACY_SEASON_ID}/schedule`),
      jflEnv,
    );
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.rounds.length, 1);
    assert.ok(seen.some((request) => request.includes('/rest/v1/rounds?')));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('JFL schedule still rejects malformed UUID text before touching Supabase', async () => {
  const response = await worker.fetch(
    new Request('https://jfl.fremontderby.com/api/seasons/not-a-uuid/schedule'),
    { ENVIRONMENT: 'jfl' },
  );
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'That season or match link is invalid.' });
});

test('JFL standings and prizes accept Postgres uuid text used by the live JFL season', async () => {
  const originalFetch = globalThis.fetch;
  try {
    for (const seasonId of [LEGACY_SEASON_ID, LIVE_JFL_SEASON_ID]) {
      globalThis.fetch = mockSeasonFetch(seasonId);
      for (const suffix of ['team-standings', 'individual-standings', 'prizes']) {
        const response = await worker.fetch(
          new Request(`https://jfl.fremontderby.com/api/seasons/${seasonId}/${suffix}`),
          jflEnv,
        );
        const body = await response.json().catch(() => ({}));
        assert.notEqual(
          body.error,
          'That season or match link is invalid.',
          `${suffix} ${seasonId} still hit the RFC UUID gate (${response.status})`,
        );
      }
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('JFL standings still reject malformed season ids', async () => {
  const response = await worker.fetch(
    new Request('https://jfl.fremontderby.com/api/seasons/not-a-uuid/individual-standings'),
    { ENVIRONMENT: 'jfl' },
  );
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'That season or match link is invalid.' });
});

test('JFL free-agent list accepts the live season id instead of 404', async () => {
  const response = await worker.fetch(
    new Request(`https://jfl.fremontderby.com/api/seasons/${LIVE_JFL_SEASON_ID}/free-agents`),
    { ENVIRONMENT: 'jfl' },
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { freeAgents: [] });
});

test('JFL free-agent list reads season_players when bindings exist', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockSeasonFetch(LIVE_JFL_SEASON_ID);
  try {
    const response = await worker.fetch(
      new Request(`https://jfl.fremontderby.com/api/seasons/${LIVE_JFL_SEASON_ID}/free-agents`),
      jflEnv,
    );
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      freeAgents: [{
        playerId: '11111111-1111-1111-1111-111111111111',
        displayName: 'JFL QA Free Agent',
        status: 'active',
        source: 'season_players',
      }],
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('JFL free-agent list rejects malformed season ids', async () => {
  const response = await worker.fetch(
    new Request('https://jfl.fremontderby.com/api/seasons/not-a-uuid/free-agents'),
    { ENVIRONMENT: 'jfl' },
  );
  assert.equal(response.status, 400);
});

test('JFL standings and prizes stay 200 without Supabase bindings', async () => {
  const env = { ENVIRONMENT: 'jfl' };
  const standings = await worker.fetch(
    new Request(`https://jfl.fremontderby.com/api/seasons/${LIVE_JFL_SEASON_ID}/team-standings`),
    env,
  );
  assert.equal(standings.status, 200);
  assert.deepEqual(await standings.json(), { standings: [] });

  const prizes = await worker.fetch(
    new Request(`https://jfl.fremontderby.com/api/seasons/${LIVE_JFL_SEASON_ID}/prizes`),
    env,
  );
  assert.equal(prizes.status, 200);
  const body = await prizes.json();
  assert.equal(body.summary.season_id, LIVE_JFL_SEASON_ID);
  assert.deepEqual(body.summary.projected_payouts, []);
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { createDualScoringHttpHandlers } from '../src/dualScoringHttp.js';
import { createDualScoringRepository } from '../src/dualScoringRepository.js';

const migrationPath = new URL(
  '../supabase/migrations/20260812001000_collision_safe_shared_scoring.sql',
  import.meta.url,
);

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('collision migration compares the exact viewed rack history under lock', async () => {
  const sql = await readFile(migrationPath, 'utf8');

  assert.match(sql, /assert_expected_score_history/);
  assert.match(sql, /for update/);
  assert.match(sql, /current_racks is distinct from expected_racks/);
  assert.match(sql, /Score changed on another device/);
  assert.match(sql, /record_player_match_score_rack_checked/);
  assert.match(sql, /update_player_match_score_rack_checked/);
  assert.match(sql, /undo_player_match_score_rack_checked/);
  assert.match(sql, /confirm_player_match_score_checked/);
  assert.match(sql, /record_player_match_score_rack\(/);
  assert.match(sql, /update_player_match_score_rack\(/);
  assert.match(sql, /revoke all on function public\.record_player_match_score_rack_checked[\s\S]*from public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.record_player_match_score_rack_checked[\s\S]*to service_role/);
});

test('repository uses checked RPCs whenever an expected rack snapshot is supplied', async () => {
  const calls = [];
  const repository = createDualScoringRepository({
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'server-secret',
  }, {
    fetch: async (url, init) => {
      calls.push({ url, init });
      return jsonResponse([{ rack_number: 2 }]);
    },
  });

  const expectedRacks = [{ rackNumber: 1, discipline: '8-ball', winnerSide: 'A' }];
  await repository.recordPlayerMatchScoreRack({
    actorUserId: 'user-1',
    playerMatchId: 'match-1',
    scoringTeamId: 'team-a',
    winnerSide: 'B',
    expectedRacks,
  });

  assert.match(calls[0].url, /record_player_match_score_rack_checked$/);
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    actor_user_id: 'user-1',
    target_player_match_id: 'match-1',
    target_scoring_team_id: 'team-a',
    rack_winner_side: 'B',
    expected_racks: expectedRacks,
  });
});

test('comparison response stamps the browser with the exact team rack snapshot it viewed', async () => {
  const handlers = createDualScoringHttpHandlers({
    authenticate: async () => ({ id: 'user-1' }),
    createRepository: () => ({
      async getPlayerMatchScoreComparison() {
        return {
          own_racks: [{ rackNumber: 1, discipline: '8-ball', winnerSide: 'A' }],
          opponent_racks: [],
        };
      },
    }),
  });

  const request = new Request(
    'https://example.test/api/player-matches/match-1/score-comparison?scoringTeamId=team-a',
  );
  const response = await handlers.compare(request, {}, 'match-1');

  assert.equal(response.status, 200);
  const cookie = response.headers.get('set-cookie');
  assert.match(cookie, /^fd_score_match-1_team-a=/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Path=\/api\/player-matches\/match-1/);
});

test('a scoring write automatically reuses the browser snapshot from the latest comparison', async () => {
  const calls = [];
  const expectedRacks = [{ rackNumber: 1, discipline: '8-ball', winnerSide: 'A' }];
  const handlers = createDualScoringHttpHandlers({
    authenticate: async () => ({ id: 'user-1' }),
    createRepository: () => ({
      async recordPlayerMatchScoreRack(input) {
        calls.push(input);
        return { rack_number: 2 };
      },
    }),
  });

  const cookieValue = encodeURIComponent(JSON.stringify(expectedRacks));
  const request = new Request(
    'https://example.test/api/player-matches/match-1/score-racks?scoringTeamId=team-a',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `fd_score_match-1_team-a=${cookieValue}`,
      },
      body: JSON.stringify({ winnerSide: 'B', scoringTeamId: 'team-a' }),
    },
  );

  const response = await handlers.record(request, {}, 'match-1');
  assert.equal(response.status, 201);
  assert.deepEqual(calls[0].expectedRacks, expectedRacks);
});

test('score mutation is rejected before write when the browser has not viewed current state', async () => {
  let called = false;
  const handlers = createDualScoringHttpHandlers({
    authenticate: async () => ({ id: 'user-1' }),
    createRepository: () => ({
      async recordPlayerMatchScoreRack() {
        called = true;
      },
    }),
  });

  const request = new Request(
    'https://example.test/api/player-matches/match-1/score-racks?scoringTeamId=team-a',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ winnerSide: 'A' }),
    },
  );

  const response = await handlers.record(request, {}, 'match-1');
  assert.equal(response.status, 409);
  assert.equal(called, false);
  assert.match((await response.json()).error, /Refresh the scorecard/);
});

test('a stale same-team write returns conflict instead of becoming a second rack', async () => {
  const handlers = createDualScoringHttpHandlers({
    authenticate: async () => ({ id: 'user-1' }),
    createRepository: () => ({
      async recordPlayerMatchScoreRack() {
        throw new Error('Supabase request failed with 400: Score changed on another device');
      },
    }),
  });

  const cookieValue = encodeURIComponent(JSON.stringify([]));
  const request = new Request(
    'https://example.test/api/player-matches/match-1/score-racks?scoringTeamId=team-a',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `fd_score_match-1_team-a=${cookieValue}`,
      },
      body: JSON.stringify({ winnerSide: 'A' }),
    },
  );

  const response = await handlers.record(request, {}, 'match-1');
  assert.equal(response.status, 409);
  assert.match((await response.json()).error, /Score changed on another device/);
});

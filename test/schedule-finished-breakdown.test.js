import test from 'node:test';
import assert from 'node:assert/strict';
import { createStandingsRepository } from '../src/standingsRepository.js';

function json(data) { return new Response(JSON.stringify(data), { status: 200, headers: { 'content-type': 'application/json' } }); }

test('finished schedule matches include player results and team points', async () => {
  const calls = [];
  const fetch = async (url) => {
    const value = String(url); calls.push(value);
    if (value.includes('/rpc/list_public_season_registration')) return json([{ id: 's1', name: 'Legacy', status: 'complete' }]);
    if (value.includes('/rounds?')) return json([{ id: 'r1', round_number: 1, scheduled_on: '2026-01-01', status: 'complete', stage: 'regular' }]);
    if (value.includes('/team_matches?')) return json([{ id: 'tm1', round_id: 'r1', team_a_id: 'ta', team_b_id: 'tb', table_number: 1, status: 'finalized' }]);
    if (value.includes('/teams?')) return json([{ id: 'ta', name: 'A' }, { id: 'tb', name: 'B' }]);
    if (value.includes('/individual_matches?')) return json([
      { team_match_id: 'tm1', slot_number: 1, player_a_id: 'pa1', player_b_id: 'pb1', score_a: 4, score_b: 2, winner_side: 'a', status: 'finalized' },
      { team_match_id: 'tm1', slot_number: 2, player_a_id: 'pa2', player_b_id: 'pb2', score_a: 1, score_b: 4, winner_side: 'b', status: 'finalized' },
      { team_match_id: 'tm1', slot_number: 3, player_a_id: 'pa3', player_b_id: 'pb3', score_a: 4, score_b: 3, winner_side: 'a', status: 'finalized' },
    ]);
    if (value.includes('/players?')) return json([
      { id: 'pa1', display_name: 'Alice' }, { id: 'pb1', display_name: 'Bob' },
      { id: 'pa2', display_name: 'Cara' }, { id: 'pb2', display_name: 'Dan' },
      { id: 'pa3', display_name: 'Eve' }, { id: 'pb3', display_name: 'Finn' },
    ]);
    throw new Error(`Unexpected ${value}`);
  };
  const repo = createStandingsRepository({ SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'key' }, { fetch });
  const [round] = await repo.listSeasonSchedule({ seasonId: 's1' });
  const [match] = round.matches;
  assert.equal(match.teamAScore, 2);
  assert.equal(match.teamBScore, 1);
  assert.deepEqual(match.playerResults.map((row) => [row.playerAName, row.scoreA, row.scoreB, row.playerBName]), [
    ['Alice', 4, 2, 'Bob'], ['Cara', 1, 4, 'Dan'], ['Eve', 4, 3, 'Finn'],
  ]);
  assert.ok(calls.some((url) => url.includes('/individual_matches?')));
  assert.ok(calls.some((url) => url.includes('/players?')));
});

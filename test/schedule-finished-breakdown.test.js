import test from 'node:test';
import assert from 'node:assert/strict';
import { enrichFinishedScheduleRounds } from '../src/jflFinishedMatchResults.js';
import { enhanceFinishedScheduleBreakdown } from '../src/finishedScheduleEnhancer.js';

function json(data) { return new Response(JSON.stringify(data), { status: 200, headers: { 'content-type': 'application/json' } }); }

test('finished result enrichment adds player rows and team points', async () => {
  const fetch = async (url) => {
    const value = String(url);
    if (value.includes('/individual_matches?')) return json([
      { team_match_id: 'tm1', slot_number: 1, player_a_id: 'a1', player_b_id: 'b1', score_a: 4, score_b: 2, winner_side: 'a', status: 'finalized' },
      { team_match_id: 'tm1', slot_number: 2, player_a_id: 'a2', player_b_id: 'b2', score_a: 1, score_b: 4, winner_side: 'b', status: 'finalized' },
      { team_match_id: 'tm1', slot_number: 3, player_a_id: 'a3', player_b_id: 'b3', score_a: 4, score_b: 3, winner_side: 'a', status: 'finalized' },
    ]);
    if (value.includes('/players?')) return json([
      { id: 'a1', display_name: 'Alice' }, { id: 'b1', display_name: 'Bob' },
      { id: 'a2', display_name: 'Cara' }, { id: 'b2', display_name: 'Dan' },
      { id: 'a3', display_name: 'Eve' }, { id: 'b3', display_name: 'Finn' },
    ]);
    throw new Error(`Unexpected URL: ${value}`);
  };
  const rounds = [{ roundId: 'r1', matches: [{ teamMatchId: 'tm1', status: 'finalized' }] }];
  const [round] = await enrichFinishedScheduleRounds(rounds, { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'key' }, { fetch });
  const [match] = round.matches;
  assert.equal(match.teamAScore, 2);
  assert.equal(match.teamBScore, 1);
  assert.deepEqual(match.playerResults.map((r) => [r.playerAName, r.scoreA, r.scoreB, r.playerBName]), [
    ['Alice', 4, 2, 'Bob'], ['Cara', 1, 4, 'Dan'], ['Eve', 4, 3, 'Finn'],
  ]);
});

test('schedule enhancer injects team points and player result UI', async () => {
  const response = new Response('<html><head></head><body><main data-schedule-groups></main></body></html>', { headers: { 'content-type': 'text/html' } });
  const enhanced = await enhanceFinishedScheduleBreakdown(response);
  const html = await enhanced.text();
  assert.match(html, /Team points/);
  assert.match(html, /fd-finished-breakdown__row/);
  assert.match(html, /playerResults/);
});

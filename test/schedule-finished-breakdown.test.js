import test from 'node:test';
import assert from 'node:assert/strict';
import { enrichFinishedScheduleRounds } from '../src/jflFinishedMatchResults.js';
import {
  enhanceFinishedScheduleBreakdown,
  finishedScheduleMatchesById,
  finishedScheduleWinnerSide,
} from '../src/finishedScheduleEnhancer.js';

function json(data) { return new Response(JSON.stringify(data), { status: 200, headers: { 'content-type': 'application/json' } }); }

test('finished result enrichment adds player rows, race targets, and team points', async () => {
  const fetch = async (url) => {
    const value = String(url);
    if (value.includes('/player_matches?')) return json([
      { team_match_id: 'tm1', slot_number: 1, player_a_id: 'a1', player_b_id: 'b1', score_a: 4, score_b: 2, race_to_a: 5, race_to_b: 4, winner_side: 'A', status: 'finalized' },
      { team_match_id: 'tm1', slot_number: 2, player_a_id: 'a2', player_b_id: 'b2', score_a: 1, score_b: 4, race_to_a: 4, race_to_b: 4, winner_side: 'B', status: 'finalized' },
      { team_match_id: 'tm1', slot_number: 3, player_a_id: 'a3', player_b_id: 'b3', score_a: 4, score_b: 3, race_to_a: 4, race_to_b: 5, winner_side: 'A', status: 'finalized' },
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
  assert.deepEqual(match.playerResults.map((r) => [r.playerAName, r.scoreA, r.raceToA, r.scoreB, r.raceToB, r.playerBName, r.winnerSide]), [
    ['Alice', 4, 5, 2, 4, 'Bob', 'a'], ['Cara', 1, 4, 4, 4, 'Dan', 'b'], ['Eve', 4, 4, 3, 5, 'Finn', 'a'],
  ]);
});

test('finished Schedule winner detection identifies home and away wins', () => {
  assert.equal(finishedScheduleWinnerSide({ status: 'finalized', teamAScore: 2, teamBScore: 1 }), 'a');
  assert.equal(finishedScheduleWinnerSide({ status: 'corrected', teamAScore: 1, teamBScore: 2 }), 'b');
});

test('finished Schedule winner detection does not identify tied or unfinalized matches', () => {
  assert.equal(finishedScheduleWinnerSide({ status: 'finalized', teamAScore: 1, teamBScore: 1 }), '');
  assert.equal(finishedScheduleWinnerSide({ status: 'scheduled', teamAScore: 2, teamBScore: 1 }), '');
  assert.equal(finishedScheduleWinnerSide({ status: 'in_progress', teamAScore: 2, teamBScore: 0 }), '');
});

test('finished Schedule indexes every rendered match by stable team-match id across rounds', () => {
  const byId = finishedScheduleMatchesById([
    { roundId: 'r1', matches: [{ teamMatchId: 'tm-home', status: 'finalized', teamAScore: 2, teamBScore: 1 }] },
    { roundId: 'r2', matches: [{ team_match_id: 'tm-away', status: 'finalized', teamAScore: 1, teamBScore: 2 }] },
  ]);
  assert.equal(byId['tm-home'].teamAScore, 2);
  assert.equal(byId['tm-away'].teamBScore, 2);
  assert.deepEqual(Object.keys(byId).sort(), ['tm-away', 'tm-home']);
});

test('schedule enhancer exposes obvious Race details with player names and closeness to target', async () => {
  const response = new Response('<html><head></head><body><main data-schedule-groups></main></body></html>', { headers: { 'content-type': 'text/html' } });
  const enhanced = await enhanceFinishedScheduleBreakdown(response);
  const html = await enhanced.text();
  assert.match(html, /Race details/);
  assert.match(html, /Show race details/);
  assert.match(html, /Hide race details/);
  assert.match(html, /Racks won \/ race target/);
  assert.match(html, /playerAName/);
  assert.match(html, /playerBName/);
  assert.match(html, /raceToA/);
  assert.match(html, /raceToB/);
  assert.match(html, /winnerSide/);
  assert.match(html, /data-race-result="winner"/);
  assert.match(html, /data-race-result="loser"/);
  assert.match(html, /details\.replaceChildren\(summary,make\(match\)\)/);
  assert.match(html, /details\.open=false/);
  assert.match(html, /matchesById\(body\.rounds\|\|\[\]\)/);
  assert.match(html, /teamMatchId/);
  assert.match(html, /forced-colors:active/);
});

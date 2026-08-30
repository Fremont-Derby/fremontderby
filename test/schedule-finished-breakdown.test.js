import test from 'node:test';
import assert from 'node:assert/strict';
import { enrichFinishedScheduleRounds } from '../src/jflFinishedMatchResults.js';
import {
  enhanceFinishedScheduleBreakdown,
  finishedScheduleMatchesById,
  finishedScheduleWinnerSide,
} from '../src/finishedScheduleEnhancer.js';

function json(data) { return new Response(JSON.stringify(data), { status: 200, headers: { 'content-type': 'application/json' } }); }

test('finished result enrichment adds player rows, race targets, opening discipline, and team points', async () => {
  const fetch = async (url) => {
    const value = String(url);
    if (value.includes('/player_matches?')) return json([
      { team_match_id: 'tm1', slot_number: 1, player_a_id: 'a1', player_b_id: 'b1', score_a: 4, score_b: 2, race_to_a: 5, race_to_b: 4, winner_side: 'A', opening_discipline: '8-ball', status: 'finalized' },
      { team_match_id: 'tm1', slot_number: 2, player_a_id: 'a2', player_b_id: 'b2', score_a: 1, score_b: 4, race_to_a: 4, race_to_b: 4, winner_side: 'B', opening_discipline: '9-ball', status: 'finalized' },
      { team_match_id: 'tm1', slot_number: 3, player_a_id: 'a3', player_b_id: 'b3', score_a: 4, score_b: 3, race_to_a: 4, race_to_b: 5, winner_side: 'A', opening_discipline: '8-ball', status: 'finalized' },
    ]);
    if (value.includes('/players?')) return json([
      { id: 'a1', display_name: 'Alice' }, { id: 'b1', display_name: 'Bob' },
      { id: 'a2', display_name: 'Cara' }, { id: 'b2', display_name: 'Dan' },
      { id: 'a3', display_name: 'Eve' }, { id: 'b3', display_name: 'Finn' },
    ]);
    throw new Error(`Unexpected URL: ${value}`);
  };
  const rounds = [{ roundId: 'r1', stage: 'regular', matches: [{ teamMatchId: 'tm1', status: 'finalized' }] }];
  const [round] = await enrichFinishedScheduleRounds(rounds, { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'key' }, { fetch });
  const [match] = round.matches;
  assert.equal(match.teamAScore, 2);
  assert.equal(match.teamBScore, 1);
  assert.deepEqual(match.playerResults.map((r) => [r.playerAName, r.scoreA, r.raceToA, r.scoreB, r.raceToB, r.playerBName, r.winnerSide, r.openingDiscipline]), [
    ['Alice', 4, 5, 2, 4, 'Bob', 'a', '8-ball'], ['Cara', 1, 4, 4, 4, 'Dan', 'b', '9-ball'], ['Eve', 4, 4, 3, 5, 'Finn', 'a', '8-ball'],
  ]);
});

test('finished result enrichment preserves four postseason player races', async () => {
  const rows = [
    { team_match_id: 'tm-post', slot_number: 1, player_a_id: 'a1', player_b_id: 'b1', score_a: 5, score_b: 3, race_to_a: 5, race_to_b: 4, winner_side: 'A', opening_discipline: '8-ball', status: 'finalized' },
    { team_match_id: 'tm-post', slot_number: 2, player_a_id: 'a2', player_b_id: 'b2', score_a: 3, score_b: 5, race_to_a: 4, race_to_b: 5, winner_side: 'B', opening_discipline: '9-ball', status: 'finalized' },
    { team_match_id: 'tm-post', slot_number: 3, player_a_id: 'a3', player_b_id: 'b3', score_a: 5, score_b: 4, race_to_a: 5, race_to_b: 5, winner_side: 'A', opening_discipline: '8-ball', status: 'finalized' },
    { team_match_id: 'tm-post', slot_number: 4, player_a_id: 'a4', player_b_id: 'b4', score_a: 4, score_b: 2, race_to_a: 4, race_to_b: 4, winner_side: 'A', opening_discipline: '9-ball', status: 'finalized' },
  ];
  const fetch = async (url) => {
    const value = String(url);
    if (value.includes('/player_matches?')) return json(rows);
    if (value.includes('/players?')) return json(rows.flatMap((row, index) => [
      { id: row.player_a_id, display_name: `A${index + 1}` },
      { id: row.player_b_id, display_name: `B${index + 1}` },
    ]));
    throw new Error(`Unexpected URL: ${value}`);
  };
  const rounds = [{ roundId: 'r-post', stage: 'championship', matches: [{ teamMatchId: 'tm-post', status: 'finalized' }] }];
  const [round] = await enrichFinishedScheduleRounds(rounds, { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'key' }, { fetch });
  assert.equal(round.matches[0].playerResults.length, 4);
  assert.deepEqual(round.matches[0].playerResults.map((row) => [row.slotNumber, row.openingDiscipline]), [[1, '8-ball'], [2, '9-ball'], [3, '8-ball'], [4, '9-ball']]);
  assert.equal(round.matches[0].teamAScore, 3);
  assert.equal(round.matches[0].teamBScore, 1);
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

test('schedule enhancer labels every race discipline and emphasizes only winning rack score', async () => {
  const response = new Response('<html><head></head><body><main data-schedule-groups></main></body></html>', { headers: { 'content-type': 'text/html' } });
  const enhanced = await enhanceFinishedScheduleBreakdown(response);
  const html = await enhanced.text();
  assert.match(html, /summary\.textContent='Details'/);
  assert.match(html, /Show race details/);
  assert.match(html, /Hide race details/);
  assert.match(html, /fd-finished-breakdown__discipline/);
  assert.match(html, /discipline\.textContent=\(clean\(result\.openingDiscipline\)\|\|'Unknown discipline'\)\+' first'/);
  assert.match(html, /row\.append\(left,leftRace,rightRace,right,discipline\)/);
  assert.match(html, /legend\.textContent='Racks won \/ race target'/);
  assert.doesNotMatch(html, /opening\+' first · '/);
  assert.match(html, /fd-finished-breakdown__score/);
  assert.match(html, /data-race-result="winner"\] \.fd-finished-breakdown__score\{font-weight:950\}/);
  assert.match(html, /data-race-result="loser"\] \.fd-finished-breakdown__score\{font-weight:500\}/);
  assert.match(html, /const wasOpen=details\.open/);
  assert.match(html, /details\.dataset\.resultSignature===signature/);
  assert.match(html, /details\.open=wasOpen/);
  assert.match(html, /details\.replaceChildren\(summary,make\(match\)\)/);
  assert.match(html, /details\.removeAttribute\('data-empty-actions'\)/);
  assert.match(html, /fd-schedule-match--mine\{border-width:4px!important\}/);
  assert.match(html, /matchesById\(body\.rounds\|\|\[\]\)/);
  assert.match(html, /forced-colors:active/);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { repairLineupScript } from '../src/lineupScriptRepair.js';

test('lineup repair still skips finalized requested rounds', () => {
  const source = '<html><body><header></header><script>requestedRound&&rounds.some((round)=>round.roundId===requestedRound))return requestedRound;</script></body></html>';
  const html = repairLineupScript(source);
  assert.match(html, /\!\['finalized','corrected'\]\.includes\(round\.teamMatchStatus\)/);
});

test('lineup repair injects next match from /api/me/matches', () => {
  const source = '<html><body><header></header><script>requestedRound&&rounds.some((round)=>round.roundId===requestedRound))return requestedRound;</script></body></html>';
  const html = repairLineupScript(source);
  assert.match(html, /data-next-match/);
  assert.match(html, /\/api\/me\/matches/);
  assert.match(html, /pickNextMatch/);
});

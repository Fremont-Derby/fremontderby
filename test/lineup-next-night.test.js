import assert from 'node:assert/strict';
import test from 'node:test';
import { repairLineupScript } from '../src/lineupScriptRepair.js';

test('lineup repair skips a finalized remembered night', () => {
  const source = "requestedRound&&rounds.some((round)=>round.roundId===requestedRound))return requestedRound;";
  const repaired = repairLineupScript(source);
  assert.match(repaired, /finalized/);
  assert.match(repaired, /corrected/);
});

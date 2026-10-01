import test from 'node:test';
import assert from 'node:assert/strict';
import { afterWin, eraseLastRack, liveScore, raceResult, terminalScore } from '../src/scorecardOps.js';

test('a disputed submission is not the race result', () => {
  assert.equal(raceResult({ disputed: true }).authoritative, false);
});

test('a terminal mismatch tells the scorer to check the rack', () => {
  assert.equal(terminalScore({ mismatch: true }).recovery, 'Check the rack score and submit again.');
  assert.equal(terminalScore({ racks: 9, limit: 8 }).recovery, 'The match is already complete.');
});

test('a won match does not offer another rack', () => {
  assert.equal(afterWin({ won: true }).action, 'match-complete');
  assert.equal(afterWin({ won: false }).action, 'add-rack');
});

test('erase removes only the last rack', () => {
  assert.deepEqual(eraseLastRack([7, 8, 9]), [7, 8]);
});

test('the live score names both sides', () => {
  assert.equal(liveScore({ home: 4, away: 2 }).text, '4 to 2');
});

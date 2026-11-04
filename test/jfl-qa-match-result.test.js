import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeQaRegularMatch } from '../src/jflQaMatchResult.js';

const race = (slotNumber, winnerSide = 'a', status = 'finalized') => ({
  slotNumber, winnerSide, status, scoreA: winnerSide === 'a' ? 5 : 0,
  scoreB: winnerSide === 'b' ? 5 : 0,
});

test('no races does not announce a winner', () => {
  assert.equal(summarizeQaRegularMatch().winnerSide, null);
});
test('two finalized wins do not claim a completed three-race matchup', () => {
  const result = summarizeQaRegularMatch([race(1), race(2), race(3, 'b', 'scheduled')]);
  assert.equal(result.state, 'incomplete');
  assert.equal(result.winnerSide, null);
  assert.equal(result.label, '2 of 3 races finalized');
});
test('three distinct finalized/corrected races report the majority winner', () => {
  const result = summarizeQaRegularMatch([race(1, 'b'), race(2, 'a', 'corrected'), race(3, 'b')]);
  assert.equal(result.state, 'complete');
  assert.equal(result.winnerSide, 'b');
  assert.equal(result.winsA, 1);
  assert.equal(result.winsB, 2);
});
test('duplicate or missing slots do not satisfy completeness', () => {
  for (const rows of [[race(1), race(1), race(3)], [race(1), race(2)]]) {
    assert.equal(summarizeQaRegularMatch(rows).winnerSide, null);
  }
});
test('unknown winner and malformed score remain incomplete', () => {
  for (const invalid of [{ ...race(3), winnerSide: '' }, { ...race(3), scoreA: null }]) {
    assert.equal(summarizeQaRegularMatch([race(1), race(2), invalid]).state, 'incomplete');
  }
});
test('postseason four-race input cannot masquerade as a regular result', () => {
  assert.equal(summarizeQaRegularMatch([race(1), race(2), race(3), race(4)]).state, 'incomplete');
});

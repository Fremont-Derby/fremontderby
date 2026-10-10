import test from 'node:test';
import assert from 'node:assert/strict';
import { finishedScheduleWinnerSide } from '../src/finishedScheduleEnhancer.js';

for (let left = 0; left <= 10; left += 1) {
  for (let right = 0; right <= 10; right += 1) {
    const expected = left === right ? '' : left > right ? 'a' : 'b';
    test('finalized ' + left + '-' + right + ' winner is ' + (expected || 'none'), () => {
      assert.equal(
        finishedScheduleWinnerSide({ status: 'finalized', teamAScore: left, teamBScore: right }),
        expected,
      );
    });
  }
}

for (const status of ['scheduled', 'live', 'pending', 'void', '']) {
  test('a ' + (status || 'blank') + ' match has no winner side', () => {
    assert.equal(finishedScheduleWinnerSide({ status, teamAScore: 5, teamBScore: 1 }), '');
  });
}

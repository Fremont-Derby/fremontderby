import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyLineupIds, forfeitShouldNotSeal, membershipSeatOk } from '../src/druReadyQueue.js';

test('a practice seat already on the team is not a failed write', () => {
  assert.equal(membershipSeatOk(409), true);
  assert.equal(membershipSeatOk(400), false);
});

test('an empty sealed lineup is the one to clear', () => {
  assert.deepEqual(emptyLineupIds([{ lineup_id: 'empty' }, { lineup_id: 'kept', player_id: 'p1' }]), ['empty']);
});

test('a short lineup does not seal the other races', () => {
  assert.equal(forfeitShouldNotSeal(1, 3), true);
  assert.equal(forfeitShouldNotSeal(3, 3), false);
});

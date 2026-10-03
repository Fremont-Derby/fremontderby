import test from 'node:test';
import assert from 'node:assert/strict';
import { nextMission } from '../src/missionOrder.js';
test('the next mission is the first unfinished step', () => {
  assert.equal(nextMission(['find-match'], ['find-match', 'mark-availability', 'read-message']), 'mark-availability');
});

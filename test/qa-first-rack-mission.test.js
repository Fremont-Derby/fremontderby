import test from 'node:test';
import assert from 'node:assert/strict';
import { FIRST_RACK_MISSION, buildFirstRackFixture } from '../src/qaFirstRackContract.js';

test('first-rack mission is a captain fixture on scorecard', () => {
  assert.equal(FIRST_RACK_MISSION.missionId, 'captain.score-first-rack');
  assert.ok(FIRST_RACK_MISSION.productRoutes.includes('/scorecard'));
});

test('same seed rebuilds the same table and roster', () => {
  const a = buildFirstRackFixture('rack-1');
  const b = buildFirstRackFixture('rack-1');
  assert.deepEqual(a.match, b.match);
  assert.equal(a.captain.name, b.captain.name);
  assert.equal(a.match.intendedRack, 1);
  assert.notEqual(a.match.tableNumber, a.distractorMatch.tableNumber);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { AVAILABILITY_MISSION, buildAvailabilityFixture } from '../src/qaAvailabilityContract.js';

test('availability mission is a player fixture with home and check-in routes', () => {
  assert.equal(AVAILABILITY_MISSION.missionId, 'player.mark-availability');
  assert.ok(AVAILABILITY_MISSION.productRoutes.includes('/'));
  assert.ok(AVAILABILITY_MISSION.productRoutes.includes('/availability'));
});

test('same seed rebuilds the same player, week, and variant', () => {
  const a = buildAvailabilityFixture('night-21');
  const b = buildAvailabilityFixture('night-21');
  assert.deepEqual(a.intendedWeek, b.intendedWeek);
  assert.equal(a.player.name, b.player.name);
  assert.equal(a.variant, b.variant);
});

test('fixture keeps a teammate and another week away from the intended row', () => {
  const fixture = buildAvailabilityFixture('night-22');
  assert.notEqual(fixture.player.name, fixture.teammate.name);
  assert.notEqual(fixture.intendedWeek.id, fixture.distractorWeek.id);
  assert.ok(['unknown', 'available'].includes(fixture.intendedWeek.startState));
  assert.ok(['available', 'unavailable'].includes(fixture.intendedWeek.finalState));
  assert.notEqual(fixture.intendedWeek.startState, fixture.intendedWeek.finalState);
});

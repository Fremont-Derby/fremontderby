import test from 'node:test';
import assert from 'node:assert/strict';
import { duplicateLineupIds, ensureDruActorCanLockLineup, lineupSlotsAreComplete } from '../src/druLineupBypass.js';

test('gamma does not borrow a captain seat', async () => {
  assert.equal(await ensureDruActorCanLockLineup({ ENVIRONMENT: 'gamma' }, { actorUserId: 'x', teamId: 'y' }), false);
});

test('a practice lock needs slots 1, 2, and 3', () => {
  const ids = ['a', 'b', 'c'];
  assert.equal(lineupSlotsAreComplete(ids.map((id, i) => ({ slotNumber: i + 1, playerId: id }))), true);
  assert.equal(lineupSlotsAreComplete([{ slotNumber: 1, playerId: 'a' }, { slotNumber: 1, playerId: 'b' }, { slotNumber: 1, playerId: 'c' }]), false);
  assert.equal(lineupSlotsAreComplete([]), false);
});

test('a practice lock rejects a repeated player', () => {
  assert.equal(duplicateLineupIds(['A', 'a', 'b']), true);
  assert.equal(duplicateLineupIds(['a', 'b', 'c']), false);
});

test('a practice lock rejects a missing round', async () => {
  await assert.rejects(
    () => ensureDruActorCanLockLineup({ ENVIRONMENT: 'dru' }, { actorUserId: 'x', teamId: 'y' }),
    /Lineup could not be locked/,
  );
});

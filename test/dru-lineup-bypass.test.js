import test from 'node:test';
import assert from 'node:assert/strict';
import { ensureDruActorCanLockLineup } from '../src/druLineupBypass.js';

test('gamma does not borrow a captain seat', async () => {
  assert.equal(await ensureDruActorCanLockLineup({ ENVIRONMENT: 'gamma' }, { actorUserId: 'x', teamId: 'y' }), false);
});

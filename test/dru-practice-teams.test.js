import test from 'node:test';
import assert from 'node:assert/strict';
import { ensureDruPracticeTeams } from '../src/druPracticeTeams.js';

test('gamma does not create practice teams', async () => {
  assert.equal(await ensureDruPracticeTeams({ ENVIRONMENT: 'gamma' }, { seasonId: 's', actorUserId: 'a' }), 0);
});

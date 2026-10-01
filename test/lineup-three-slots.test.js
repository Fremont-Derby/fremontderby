import test from 'node:test';
import assert from 'node:assert/strict';
import { submitTeamLineupCommand } from '../src/lineupCommands.js';

test('a lineup must include slots 1, 2, and 3', async () => {
  const repository = { submitTeamLineup: async () => ({ ok: true }) };
  await assert.rejects(
    () => submitTeamLineupCommand({ actorUserId: 'actor', teamId: 'team', roundId: 'round', slots: [{ slotNumber: 1, playerId: 'p1' }] }, repository),
    /slots 1, 2, and 3/,
  );
  const saved = await submitTeamLineupCommand({
    actorUserId: 'actor', teamId: 'team', roundId: 'round',
    slots: [{ slotNumber: 1, playerId: 'p1' }, { slotNumber: 2, playerId: null }, { slotNumber: 3, playerId: 'p3' }],
  }, repository);
  assert.equal(saved.ok, true);
});

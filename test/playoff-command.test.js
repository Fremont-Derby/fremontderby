import assert from 'node:assert/strict';
import test from 'node:test';
import { startSeasonPlayoffsCommand } from '../src/playoffCommands.js';

test('startSeasonPlayoffsCommand passes trusted actor and season to repository', async () => {
  let received;
  const result = await startSeasonPlayoffsCommand(
    { seasonId: 'season-1', actorUserId: 'admin-1' },
    {
      async startSeasonPlayoffs(input) {
        received = input;
        return { round_id: 'round-8' };
      },
    },
  );

  assert.deepEqual(received, { seasonId: 'season-1', actorUserId: 'admin-1' });
  assert.deepEqual(result, { round_id: 'round-8' });
});

test('startSeasonPlayoffsCommand rejects missing identifiers', async () => {
  await assert.rejects(
    () => startSeasonPlayoffsCommand({ seasonId: '', actorUserId: 'admin-1' }, { startSeasonPlayoffs() {} }),
    /Season id is required/,
  );
  await assert.rejects(
    () => startSeasonPlayoffsCommand({ seasonId: 'season-1', actorUserId: '' }, { startSeasonPlayoffs() {} }),
    /Actor user id is required/,
  );
});

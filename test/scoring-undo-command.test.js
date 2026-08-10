import test from 'node:test';
import assert from 'node:assert/strict';
import { undoPlayerMatchRackCommand } from '../src/scoringCommands.js';

test('undo rack command delegates the authenticated actor and match id', async () => {
  const calls = [];
  const repository = {
    async undoPlayerMatchRack(payload) {
      calls.push(payload);
      return {
        player_match_id: payload.playerMatchId,
        undone_rack_number: 3,
        score_a: 1,
        score_b: 1,
        status: 'in_progress',
      };
    },
  };

  const result = await undoPlayerMatchRackCommand(
    { actorUserId: 'user-1', playerMatchId: 'player-match-1' },
    repository,
  );

  assert.equal(result.undone_rack_number, 3);
  assert.deepEqual(calls, [{
    actorUserId: 'user-1',
    playerMatchId: 'player-match-1',
  }]);
});

test('undo rack command validates required actor and match id', async () => {
  const repository = { undoPlayerMatchRack: async () => null };

  await assert.rejects(
    () => undoPlayerMatchRackCommand(
      { actorUserId: '', playerMatchId: 'player-match-1' },
      repository,
    ),
    /actorUserId is required/,
  );

  await assert.rejects(
    () => undoPlayerMatchRackCommand(
      { actorUserId: 'user-1', playerMatchId: '' },
      repository,
    ),
    /playerMatchId is required/,
  );
});

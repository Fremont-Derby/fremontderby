import test from 'node:test';
import assert from 'node:assert/strict';
import {
  confirmPlayerMatchScoreCommand,
  finalizeReconciledPlayerMatchCommand,
  getPlayerMatchScoreComparisonCommand,
  recordPlayerMatchScoreRackCommand,
  undoPlayerMatchScoreRackCommand,
} from '../src/dualScoringCommands.js';

function repositorySpy() {
  const calls = [];
  return {
    calls,
    async getPlayerMatchScoreComparison(input) { calls.push(['compare', input]); return { histories_match: true }; },
    async recordPlayerMatchScoreRack(input) { calls.push(['record', input]); return { rack_number: 1 }; },
    async undoPlayerMatchScoreRack(input) { calls.push(['undo', input]); return { undone_rack_number: 1 }; },
    async confirmPlayerMatchScore(input) { calls.push(['confirm', input]); return { both_confirmed: false }; },
    async finalizeReconciledPlayerMatch(input) { calls.push(['finalize', input]); return { status: 'finalized' }; },
  };
}

test('dual scoring commands forward actor-scoped match requests', async () => {
  const repository = repositorySpy();
  await getPlayerMatchScoreComparisonCommand({ actorUserId: 'user-1', playerMatchId: 'match-1' }, repository);
  await recordPlayerMatchScoreRackCommand({ actorUserId: 'user-1', playerMatchId: 'match-1', winnerSide: 'A' }, repository);
  await undoPlayerMatchScoreRackCommand({ actorUserId: 'user-1', playerMatchId: 'match-1' }, repository);
  await confirmPlayerMatchScoreCommand({ actorUserId: 'user-1', playerMatchId: 'match-1' }, repository);
  await finalizeReconciledPlayerMatchCommand({ actorUserId: 'user-1', playerMatchId: 'match-1' }, repository);

  assert.deepEqual(repository.calls, [
    ['compare', { actorUserId: 'user-1', playerMatchId: 'match-1' }],
    ['record', { actorUserId: 'user-1', playerMatchId: 'match-1', winnerSide: 'A' }],
    ['undo', { actorUserId: 'user-1', playerMatchId: 'match-1' }],
    ['confirm', { actorUserId: 'user-1', playerMatchId: 'match-1' }],
    ['finalize', { actorUserId: 'user-1', playerMatchId: 'match-1' }],
  ]);
});

test('dual scoring commands validate actor, match, and winner side before repository calls', async () => {
  const repository = repositorySpy();
  await assert.rejects(
    recordPlayerMatchScoreRackCommand({ actorUserId: 'user-1', playerMatchId: 'match-1', winnerSide: 'X' }, repository),
    /winnerSide must be A or B/,
  );
  await assert.rejects(
    getPlayerMatchScoreComparisonCommand({ actorUserId: '', playerMatchId: 'match-1' }, repository),
    /actorUserId is required/,
  );
  await assert.rejects(
    confirmPlayerMatchScoreCommand({ actorUserId: 'user-1', playerMatchId: '' }, repository),
    /playerMatchId is required/,
  );
  await assert.rejects(
    finalizeReconciledPlayerMatchCommand({ actorUserId: '', playerMatchId: 'match-1' }, repository),
    /actorUserId is required/,
  );
  assert.deepEqual(repository.calls, []);
});

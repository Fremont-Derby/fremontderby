import test from 'node:test';
import assert from 'node:assert/strict';
import { createDualScoringHttpHandlers } from '../src/dualScoringHttp.js';

function harness() {
  const calls = [];
  const repository = {
    async getPlayerMatchScoreComparison(input) { calls.push(['compare', input]); return { histories_match: false }; },
    async recordPlayerMatchScoreRack(input) { calls.push(['record', input]); return { rack_number: 1 }; },
    async undoPlayerMatchScoreRack(input) { calls.push(['undo', input]); return { undone_rack_number: 1 }; },
    async confirmPlayerMatchScore(input) { calls.push(['confirm', input]); return { both_confirmed: false }; },
    async finalizeReconciledPlayerMatch(input) { calls.push(['finalize', input]); return { status: 'finalized' }; },
  };
  const handlers = createDualScoringHttpHandlers({
    authenticate: async () => ({ id: 'user-1' }),
    createRepository: () => repository,
  });
  return { calls, handlers };
}

function request(body) {
  return new Request('https://example.test', {
    method: 'POST',
    body: body == null ? undefined : JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

test('dual-score HTTP handlers forward actor-scoped actions', async () => {
  const { calls, handlers } = harness();

  let response = await handlers.compare(request(), {}, 'match-1');
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { comparison: { histories_match: false } });

  response = await handlers.record(request({ winnerSide: 'A' }), {}, 'match-1');
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { rack: { rack_number: 1 } });

  response = await handlers.undo(request(), {}, 'match-1');
  assert.equal(response.status, 200);
  response = await handlers.confirm(request(), {}, 'match-1');
  assert.equal(response.status, 200);
  response = await handlers.finalize(request(), {}, 'match-1');
  assert.equal(response.status, 200);

  assert.deepEqual(calls, [
    ['compare', { actorUserId: 'user-1', playerMatchId: 'match-1' }],
    ['record', { actorUserId: 'user-1', playerMatchId: 'match-1', winnerSide: 'A' }],
    ['undo', { actorUserId: 'user-1', playerMatchId: 'match-1' }],
    ['confirm', { actorUserId: 'user-1', playerMatchId: 'match-1' }],
    ['finalize', { actorUserId: 'user-1', playerMatchId: 'match-1' }],
  ]);
});

test('dual-score HTTP handlers reject invalid rack input without repository mutation', async () => {
  const { calls, handlers } = harness();
  const response = await handlers.record(request({ winnerSide: 'X' }), {}, 'match-1');
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /winnerSide must be A or B/);
  assert.deepEqual(calls, []);
});

test('dual-score HTTP handlers surface reconciliation conflicts as 409', async () => {
  const handlers = createDualScoringHttpHandlers({
    authenticate: async () => ({ id: 'user-1' }),
    createRepository: () => ({
      async finalizeReconciledPlayerMatch() {
        throw new Error('Both players must confirm the reconciled score before finalization');
      },
    }),
  });
  const response = await handlers.finalize(request(), {}, 'match-1');
  assert.equal(response.status, 409);
});

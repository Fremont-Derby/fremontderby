import test from 'node:test';
import assert from 'node:assert/strict';
import { lineupHasPlayers, prepareDruPracticeLineup } from '../src/druPracticeLineup.js';

test('an empty lineup is not a lockable lineup', () => {
  assert.equal(lineupHasPlayers([]), false);
  assert.equal(lineupHasPlayers([{ slotNumber: 1, playerId: 'pip' }]), true);
});

test('gamma does not waive a practice roster', async () => {
  let called = false;
  const count = await prepareDruPracticeLineup(
    { ENVIRONMENT: 'gamma', SUPABASE_URL: 'https://example.test', SUPABASE_SERVICE_ROLE_KEY: 'key' },
    { teamId: 'acorn', roundId: 'round', slots: [{ playerId: 'pip' }] },
    async () => { called = true; return Response.json([]); },
  );
  assert.equal(count.prepared, false);
  assert.equal(called, false);
});

test('DRU rejects an empty lineup before it can lock', async () => {
  await assert.rejects(
    () => prepareDruPracticeLineup(
      { ENVIRONMENT: 'dru', SUPABASE_URL: 'https://example.test', SUPABASE_SERVICE_ROLE_KEY: 'key' },
      { teamId: 'acorn', roundId: 'round', slots: [] },
      async () => Response.json([]),
    ),
    /three players/,
  );
});

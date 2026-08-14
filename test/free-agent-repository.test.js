import assert from 'node:assert/strict';
import test from 'node:test';
import { createFreeAgentRepository } from '../src/freeAgentRepository.js';

test('free agent repository requires Supabase configuration', () => {
  assert.throws(
    () => createFreeAgentRepository({ SUPABASE_SERVICE_ROLE_KEY: 'x' }),
    /SUPABASE_URL/,
  );
  assert.throws(
    () => createFreeAgentRepository({ SUPABASE_URL: 'https://example.supabase.co' }),
    /SUPABASE_SERVICE_ROLE_KEY/,
  );
});

test('listEligibleFreeAgents returns the full array payload', async () => {
  const fetchImpl = async () => new Response(JSON.stringify([
    { player_id: 'p1', display_name: 'Ada' },
    { player_id: 'p2', display_name: 'Ben' },
  ]), { status: 200, headers: { 'content-type': 'application/json' } });

  const repo = createFreeAgentRepository({
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'secret',
  }, { fetch: fetchImpl });

  const rows = await repo.listEligibleFreeAgents({
    actorUserId: 'u1',
    teamId: 't1',
    roundId: 'r1',
  });
  assert.equal(rows.length, 2);
  assert.equal(rows[0].player_id, 'p1');
});

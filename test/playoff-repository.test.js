import assert from 'node:assert/strict';
import test from 'node:test';
import { createPlayoffRepository } from '../src/playoffRepository.js';

test('playoff repository calls trusted start RPC with service credentials', async () => {
  let request;
  const repository = createPlayoffRepository(
    {
      SUPABASE_URL: 'https://example.supabase.co/',
      SUPABASE_SERVICE_ROLE_KEY: 'service-key',
    },
    {
      fetch: async (url, init) => {
        request = { url, init };
        return new Response(JSON.stringify([{ round_id: 'round-8', semifinal_one_id: 'm1', semifinal_two_id: 'm2' }]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      },
    },
  );

  const result = await repository.startSeasonPlayoffs({ seasonId: 'season-1', actorUserId: 'admin-1' });

  assert.equal(request.url, 'https://example.supabase.co/rest/v1/rpc/start_season_playoffs');
  assert.equal(request.init.method, 'POST');
  assert.equal(request.init.headers.apikey, 'service-key');
  assert.equal(request.init.headers.authorization, 'Bearer service-key');
  assert.deepEqual(JSON.parse(request.init.body), {
    target_season_id: 'season-1',
    actor_user_id: 'admin-1',
  });
  assert.deepEqual(result, { round_id: 'round-8', semifinal_one_id: 'm1', semifinal_two_id: 'm2' });
});

test('playoff repository rejects missing trusted server bindings', () => {
  assert.throws(() => createPlayoffRepository({}), /SUPABASE_URL is required/);
  assert.throws(
    () => createPlayoffRepository({ SUPABASE_URL: 'https://example.supabase.co' }),
    /SUPABASE_SERVICE_ROLE_KEY is required/,
  );
});

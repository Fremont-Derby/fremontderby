import test from 'node:test';
import assert from 'node:assert/strict';
import { waiveDruLineupPlayers } from '../src/druLineupBypass.js';

test('gamma does not waive lineup players', async () => {
  assert.equal(await waiveDruLineupPlayers({ ENVIRONMENT: 'gamma' }, { teamId: 't', slots: [{ playerId: 'p' }] }), 0);
});

test('DRU waives the named lineup players', async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url: String(url), method: options.method || 'GET' });
    if (String(url).includes('/teams')) return Response.json([{ season_id: 'season' }]);
    return new Response(null, { status: 201 });
  };
  const written = await waiveDruLineupPlayers(
    { ENVIRONMENT: 'dru', SUPABASE_URL: 'https://example.test', SUPABASE_SERVICE_ROLE_KEY: 'key' },
    { teamId: 'team', slots: [{ playerId: 'p1' }, { player_id: 'p2' }] },
    fetchImpl,
  );
  assert.equal(written, 2);
  assert.equal(calls.at(-1).method, 'POST');
});

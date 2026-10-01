import test from 'node:test';
import assert from 'node:assert/strict';
import { registerDruSlotRoster } from '../src/druSlotRoster.js';

test('gamma does not register a slot roster', async () => {
  assert.equal(await registerDruSlotRoster({ ENVIRONMENT: 'gamma' }, 'slot'), 0);
});

test('DRU registers rostered players for a ready slot', async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url: String(url), method: options.method || 'GET' });
    if (String(url).includes('season_team_slots')) return Response.json([{ team_id: 'team', season_id: 'season' }]);
    if (String(url).includes('team_memberships')) return Response.json([{ player_id: 'p1' }, { player_id: 'p2' }]);
    return new Response(null, { status: 201 });
  };
  const written = await registerDruSlotRoster(
    { ENVIRONMENT: 'dru', SUPABASE_URL: 'https://example.test', SUPABASE_SERVICE_ROLE_KEY: 'key' },
    'slot',
    fetchImpl,
  );
  assert.equal(written, 2);
  assert.equal(calls.filter((call) => call.method === 'POST').length, 2);
});

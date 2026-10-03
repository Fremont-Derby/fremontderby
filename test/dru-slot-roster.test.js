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
    if (String(url).includes('team_memberships')) return Response.json([{ player_id: 'p1' }, { player_id: 'p2' }, { player_id: 'p3' }, { player_id: 'p4' }]);
    return new Response(null, { status: 201 });
  };
  const written = await registerDruSlotRoster(
    { ENVIRONMENT: 'dru', SUPABASE_URL: 'https://example.test', SUPABASE_SERVICE_ROLE_KEY: 'key' },
    'slot',
    fetchImpl,
  );
  assert.equal(written, 4);
  assert.equal(calls.filter((call) => call.method === 'POST').length, 4);
});

test('a short DRU slot fills the practice roster before confirm', async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(String(url));
    if (String(url).includes('season_team_slots')) return Response.json([{ team_id: 'team', season_id: 'season' }]);
    if (String(url).includes('seasons?')) return Response.json([{ id: 'season', name: 'Lemon Ribbon Night', minimum_committed_roster: 3 }]);
    if (String(url).includes('teams?')) return Response.json([{ id: 'team', name: 'Lemon Ribbon Kids' }]);
    if (String(url).includes('players?')) return Response.json([{ id: 'p2' }, { id: 'p3' }, { id: 'p4' }]);
    if (String(url).includes('team_memberships')) {
      return Response.json(calls.filter((row) => row.includes('team_memberships')).length > 1
        ? [{ player_id: 'p1' }, { player_id: 'p2' }, { player_id: 'p3' }, { player_id: 'p4' }]
        : [{ player_id: 'p1' }]);
    }
    return new Response(null, { status: 201 });
  };
  const written = await registerDruSlotRoster(
    { ENVIRONMENT: 'dru', SUPABASE_URL: 'https://example.test', SUPABASE_SERVICE_ROLE_KEY: 'key', SUPABASE_SCHEMA: 'dru' },
    'slot',
    fetchImpl,
  );
  assert.equal(written, 4);
  assert.equal(calls.some((url) => url.includes('seasons?')), true);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { ensureDruActorCanLockLineup } from '../src/druLineupBypass.js';

test('gamma does not borrow a captain seat', async () => {
  assert.equal(await ensureDruActorCanLockLineup({ ENVIRONMENT: 'gamma' }, { actorUserId: 'actor', teamId: 'team' }), false);
});

test('DRU does not borrow a Season 1 captain seat', async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(String(url));
    if (String(url).includes('/players')) return Response.json([{ id: 'player' }]);
    if (String(url).includes('/teams')) return Response.json([{ season_id: 'season-1' }]);
    if (String(url).includes('/seasons')) return Response.json([{ name: 'Season 1' }]);
    return Response.json({}, { status: 500 });
  };
  const allowed = await ensureDruActorCanLockLineup(
    { ENVIRONMENT: 'dru', SUPABASE_URL: 'https://example.test', SUPABASE_SERVICE_ROLE_KEY: 'key' },
    { actorUserId: 'actor', teamId: 'team' },
    fetchImpl,
  );
  assert.equal(allowed, false);
  assert.equal(calls.some((url) => url.includes('/team_memberships')), false);
});

test('DRU can borrow a Kids Demo Night captain seat without ending other teams', async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url: String(url), method: options.method || 'GET' });
    if (String(url).includes('/players')) return Response.json([{ id: 'player' }]);
    if (String(url).includes('/teams')) return Response.json([{ season_id: 'kids' }]);
    if (String(url).includes('/seasons')) return Response.json([{ name: 'Kids Demo Night' }]);
    if (String(url).includes('/team_memberships')) return Response.json([{ id: 'membership' }]);
    return Response.json({}, { status: 404 });
  };
  const allowed = await ensureDruActorCanLockLineup(
    { ENVIRONMENT: 'dru', SUPABASE_URL: 'https://example.test', SUPABASE_SERVICE_ROLE_KEY: 'key' },
    { actorUserId: 'actor', teamId: 'bluebird' },
    fetchImpl,
  );
  assert.equal(allowed, true);
  assert.equal(calls.some((call) => call.method === 'PATCH'), false);
  assert.match(calls.at(-1).url, /team_memberships/);
});

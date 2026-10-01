import test from 'node:test';
import assert from 'node:assert/strict';
import { reserveFreshDruSeason } from '../src/druFreshSeason.js';

test('gamma does not reserve a second season', async () => {
  assert.equal(await reserveFreshDruSeason({ ENVIRONMENT: 'gamma' }, { seasonName: 'Clover Night' }), null);
});

test('DRU reserves a draft season when registration is already taken', async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url: String(url), method: options.method || 'GET' });
    if (String(url).includes('status=eq.registration')) return Response.json([{ id: 'paper', name: 'Paper Boat Night' }]);
    if (String(url).includes('/seasons') && options.method === 'POST') return Response.json([{ id: 'clover' }]);
    return Response.json([], { status: 404 });
  };
  const id = await reserveFreshDruSeason(
    { ENVIRONMENT: 'dru', SUPABASE_URL: 'https://example.test', SUPABASE_SERVICE_ROLE_KEY: 'key' },
    { seasonName: 'Clover Night 1447' },
    fetchImpl,
  );
  assert.equal(id, 'clover');
  assert.equal(calls.at(-1).method, 'POST');
});

test('DRU does not reserve when the registration season already has that name', async () => {
  const fetchImpl = async () => Response.json([{ id: 'paper', name: 'Paper Boat Night' }]);
  const id = await reserveFreshDruSeason(
    { ENVIRONMENT: 'dru', SUPABASE_URL: 'https://example.test', SUPABASE_SERVICE_ROLE_KEY: 'key' },
    { seasonName: 'Paper Boat Night' },
    fetchImpl,
  );
  assert.equal(id, null);
});

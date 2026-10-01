import test from 'node:test';
import assert from 'node:assert/strict';
import { ensureDruPracticeRegistrations } from '../src/druPracticeRegistration.js';

test('gamma does not register a practice roster', async () => {
  let called = false;
  const fetchImpl = async () => { called = true; return Response.json([]); };
  const count = await ensureDruPracticeRegistrations(
    { ENVIRONMENT: 'gamma', SUPABASE_URL: 'https://example.test', SUPABASE_SERVICE_ROLE_KEY: 'key' },
    'season-1',
    fetchImpl,
  );
  assert.equal(count, 0);
  assert.equal(called, false);
});

test('DRU registers each rostered player once before confirm', async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url: String(url), method: options.method || 'GET', body: options.body || '' });
    if (String(url).includes('team_memberships')) {
      return Response.json([{ player_id: 'pip' }, { player_id: 'pip' }, { player_id: 'ned' }]);
    }
    return new Response(null, { status: 201 });
  };
  const count = await ensureDruPracticeRegistrations(
    { ENVIRONMENT: 'dru', SUPABASE_URL: 'https://example.test', SUPABASE_SERVICE_ROLE_KEY: 'key' },
    'acorn',
    fetchImpl,
  );
  assert.equal(count, 2);
  assert.equal(calls.at(-1).method, 'POST');
  assert.match(calls.at(-1).body, /"player_id":"pip"/);
  assert.match(calls.at(-1).body, /"status":"active"/);
});

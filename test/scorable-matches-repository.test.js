import assert from 'node:assert/strict';
import test from 'node:test';
import { createScorableMatchesRepository } from '../src/scorableMatchesRepository.js';

test('scorable matches repository requires Supabase env and fetch', () => {
  assert.throws(
    () => createScorableMatchesRepository({ SUPABASE_SERVICE_ROLE_KEY: 'x' }),
    /SUPABASE_URL/,
  );
  assert.throws(
    () => createScorableMatchesRepository({ SUPABASE_URL: 'https://example.supabase.co' }),
    /SUPABASE_SERVICE_ROLE_KEY/,
  );
  assert.throws(
    () => createScorableMatchesRepository({
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'x',
    }, { fetch: null }),
    /fetch implementation/,
  );
});

test('listScorableMatches returns the full array and uses service role', async () => {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url, auth: init.headers?.authorization, body: init.body });
    return new Response(JSON.stringify([
      { player_match_id: 'm1' },
      { player_match_id: 'm2' },
    ]), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const repo = createScorableMatchesRepository({
    SUPABASE_URL: 'https://example.supabase.co/',
    SUPABASE_SERVICE_ROLE_KEY: 'svc',
  }, { fetch: fetchImpl });
  const rows = await repo.listScorableMatches({ actorUserId: 'user-1' });
  assert.equal(rows.length, 2);
  assert.equal(calls[0].auth, 'Bearer svc');
  assert.match(calls[0].url, /list_scorable_player_matches/);
  assert.match(calls[0].body, /user-1/);
});

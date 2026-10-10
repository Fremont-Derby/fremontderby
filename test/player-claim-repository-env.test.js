import assert from 'node:assert/strict';
import test from 'node:test';
import { createPlayerClaimRepository } from '../src/playerClaimRepository.js';

test('player claim repository requires Supabase URL, service role, and fetch', () => {
  assert.throws(
    () => createPlayerClaimRepository({ SUPABASE_SERVICE_ROLE_KEY: 'x' }),
    /SUPABASE_URL/,
  );
  assert.throws(
    () => createPlayerClaimRepository({ SUPABASE_URL: 'https://example.supabase.co' }),
    /SUPABASE_SERVICE_ROLE_KEY/,
  );
  assert.throws(
    () => createPlayerClaimRepository(
      {
        SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'secret',
      },
      { fetch: null },
    ),
    /fetch implementation is required/,
  );
});

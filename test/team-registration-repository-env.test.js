import assert from 'node:assert/strict';
import test from 'node:test';
import { createTeamRegistrationRepository } from '../src/teamRegistrationRepository.js';

test('team registration repository requires Supabase URL, service role, and fetch', () => {
  assert.throws(
    () => createTeamRegistrationRepository({ SUPABASE_SERVICE_ROLE_KEY: 'x' }),
    /SUPABASE_URL/,
  );
  assert.throws(
    () => createTeamRegistrationRepository({ SUPABASE_URL: 'https://example.supabase.co' }),
    /SUPABASE_SERVICE_ROLE_KEY/,
  );
  assert.throws(
    () => createTeamRegistrationRepository(
      {
        SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'secret',
      },
      { fetch: null },
    ),
    /fetch implementation is required/,
  );
});

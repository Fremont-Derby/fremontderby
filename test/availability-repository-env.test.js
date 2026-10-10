import assert from 'node:assert/strict';
import test from 'node:test';
import { createAvailabilityRepository } from '../src/availabilityRepository.js';

test('availability repository requires Supabase URL, service role, and fetch', () => {
  assert.throws(
    () => createAvailabilityRepository({ SUPABASE_SERVICE_ROLE_KEY: 'x' }),
    /SUPABASE_URL/,
  );
  assert.throws(
    () => createAvailabilityRepository({ SUPABASE_URL: 'https://example.supabase.co' }),
    /SUPABASE_SERVICE_ROLE_KEY/,
  );
  assert.throws(
    () => createAvailabilityRepository(
      {
        SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'secret',
      },
      { fetch: null },
    ),
    /fetch implementation is required/,
  );
});

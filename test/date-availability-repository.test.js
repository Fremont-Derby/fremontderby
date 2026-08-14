import assert from 'node:assert/strict';
import test from 'node:test';
import { createDateAvailabilityRepository } from '../src/dateAvailabilityRepository.js';

test('date availability repository requires Supabase env', () => {
  assert.throws(
    () => createDateAvailabilityRepository({ SUPABASE_SERVICE_ROLE_KEY: 'x' }),
    /SUPABASE_URL/,
  );
  assert.throws(
    () => createDateAvailabilityRepository({ SUPABASE_URL: 'https://example.supabase.co' }),
    /SUPABASE_SERVICE_ROLE_KEY/,
  );
});

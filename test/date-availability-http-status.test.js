import assert from 'node:assert/strict';
import test from 'node:test';
import { AuthError } from '../src/supabaseAuth.js';
import { dateAvailabilityErrorStatus } from '../src/dateAvailabilityHttp.js';

test('date availability maps auth and domain failures to stable statuses', () => {
  assert.equal(dateAvailabilityErrorStatus(new AuthError('Missing bearer token', 401)), 401);
  assert.equal(
    dateAvailabilityErrorStatus(new Error('Active season registration is required')),
    409,
  );
  assert.equal(
    dateAvailabilityErrorStatus(new Error('date is not a scheduled league date')),
    409,
  );
  assert.equal(
    dateAvailabilityErrorStatus(new Error('Supabase request failed with 401: no')),
    401,
  );
  assert.equal(
    dateAvailabilityErrorStatus(new Error('Supabase request failed with 403: no')),
    403,
  );
  assert.equal(dateAvailabilityErrorStatus(new Error('status must be available')), 400);
});

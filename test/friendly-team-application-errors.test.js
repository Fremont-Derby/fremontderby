import test from 'node:test';
import assert from 'node:assert/strict';
import { safeClientErrorMessage } from '../src/requestSanitize.js';
import { friendlyErrorMessage } from '../src/friendlyErrorMessage.js';

test('unwraps Supabase wrapper and keeps season application product text', () => {
  const wrapped =
    'Supabase request failed with 400: Season is not open for team applications';
  assert.equal(safeClientErrorMessage({ message: wrapped }), 'Season is not open for team applications');
  assert.equal(
    friendlyErrorMessage(wrapped),
    'This season is not open for new team applications.',
  );
});

test('preserves already-captain product text', () => {
  const wrapped = 'Supabase request failed with 400: You already captain a team in this season';
  assert.match(friendlyErrorMessage(wrapped), /already captain/i);
});

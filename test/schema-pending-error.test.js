import assert from 'node:assert/strict';
import test from 'node:test';
import { safeClientErrorMessage } from '../src/requestSanitize.js';

test('missing RPC/column maps to pending database update message', () => {
  assert.match(
    safeClientErrorMessage({ message: 'Supabase request failed with 404: Could not find the function public.set_team_practice' }),
    /database update/i,
  );
  assert.match(
    safeClientErrorMessage({ message: 'column teams.practice_location does not exist' }),
    /database update/i,
  );
});

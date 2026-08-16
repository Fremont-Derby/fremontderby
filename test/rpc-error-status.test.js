import test from 'node:test';
import assert from 'node:assert/strict';
import { rpcErrorStatus } from '../src/rpcErrorStatus.js';
import { safeClientErrorMessage } from '../src/requestSanitize.js';

test('unwraps product conflicts to 409 even with Supabase wrapper', () => {
  const wrapped =
    'Supabase request failed with 400: You already have a team application in this season';
  assert.equal(rpcErrorStatus({ message: wrapped }), 409);
  assert.equal(
    safeClientErrorMessage({ message: wrapped }),
    'You already have a team application in this season',
  );
});

test('maps membership and scoring authorization to 403', () => {
  assert.equal(
    rpcErrorStatus({ message: 'Supabase request failed with 400: Actor is not an active member of the scoring team' }),
    403,
  );
  assert.equal(
    rpcErrorStatus({ message: 'Only the active captain can invite players' }),
    403,
  );
});

test('maps not found product text to 404', () => {
  assert.equal(rpcErrorStatus({ message: 'Season not found' }), 404);
  assert.equal(rpcErrorStatus({ message: 'Team not found' }), 404);
});

test('maps dual-team scoring reject to 403', () => {
  assert.equal(
    rpcErrorStatus({
      message: 'Actor cannot score this match while active on both teams in the matchup',
    }),
    403,
  );
});

test('registration and admin domain conflicts map to 409', () => {
  assert.equal(rpcErrorStatus({ message: 'Season registration is not open' }), 409);
  assert.equal(rpcErrorStatus({ message: 'Rostered players cannot register as free agents' }), 409);
  assert.equal(rpcErrorStatus({ message: 'already captains another team' }), 409);
  assert.equal(rpcErrorStatus({ message: 'No team slots are currently available' }), 409);
});

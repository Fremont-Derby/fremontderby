import test from 'node:test';
import assert from 'node:assert/strict';
import { safeClientErrorMessage } from '../src/requestSanitize.js';
import { rpcErrorStatus } from '../src/rpcErrorStatus.js';

test('unique index names map to product messages before generic scrub', () => {
  const msg =
    'Supabase request failed with 400: duplicate key value violates unique constraint \"team_applications_active_captain_unique\"';
  assert.equal(safeClientErrorMessage({ message: msg }), 'You already have a team application in this season.');
  assert.equal(rpcErrorStatus({ message: msg }), 409);
});

test('team name unique index fallback', () => {
  const msg =
    'duplicate key value violates unique constraint \"teams_season_id_name_key\"';
  assert.equal(safeClientErrorMessage({ message: msg }), 'That team name is already used in this season.');
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { AuthError } from '../src/supabaseAuth.js';
import {
  playerClaimErrorMessage,
  playerClaimStatusFor,
} from '../src/playerClaimHttp.js';

test('player claim maps domain failures to stable player-facing copy and statuses', () => {
  assert.match(playerClaimErrorMessage(new Error('already claimed by user')), /Already claimed/);
  assert.equal(playerClaimStatusFor(new Error('already claimed by user')), 409);

  assert.match(playerClaimErrorMessage(new Error('has game history')), /game history/i);
  assert.equal(playerClaimStatusFor(new Error('has game history')), 409);

  assert.match(playerClaimErrorMessage(new Error('already have a player profile')), /already have a player profile/i);
  assert.equal(playerClaimStatusFor(new Error('already have a player profile')), 409);

  assert.equal(playerClaimErrorMessage(new Error('Player not found')), 'Player not found.');
  assert.equal(playerClaimStatusFor(new Error('Player not found')), 404);

  assert.equal(playerClaimErrorMessage(new Error('playerId required')), 'Choose a player to claim.');
  assert.equal(playerClaimStatusFor(new Error('playerId required')), 400);

  assert.match(playerClaimErrorMessage(new Error('boom')), /could not complete/i);
  assert.equal(playerClaimStatusFor(new Error('boom')), 502);

  assert.equal(playerClaimStatusFor(new AuthError('Missing bearer token', 401)), 401);
});

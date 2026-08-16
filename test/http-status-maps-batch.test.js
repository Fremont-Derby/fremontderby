import assert from 'node:assert/strict';
import test from 'node:test';
import { AuthError } from '../src/supabaseAuth.js';
import { playerContactErrorStatus } from '../src/playerContactHttp.js';
import { chatStatusForError } from '../src/chatHttp.js';
import { dualScoringStatusForError } from '../src/dualScoringHttp.js';
import { adminPlayersStatusForError } from '../src/adminPlayersHttp.js';
import { sandboxFeedbackStatusForError } from '../src/sandboxFeedbackHttp.js';

test('player contact HTTP status map', () => {
  assert.equal(playerContactErrorStatus(new AuthError('no', 401)), 401);
  assert.equal(playerContactErrorStatus(new Error('Actor is not a league admin')), 403);
  assert.equal(playerContactErrorStatus(new Error('Player not found')), 404);
  assert.equal(playerContactErrorStatus(new Error('Active captains must keep a phone')), 409);
  assert.equal(playerContactErrorStatus(new Error('phone must be valid')), 400);
  assert.equal(playerContactErrorStatus(new Error('Supabase request failed with 401: x')), 401);
  assert.equal(playerContactErrorStatus(new Error('boom')), 502);
});

test('chat HTTP status map', () => {
  assert.equal(chatStatusForError(new AuthError('no', 401)), 401);
  assert.equal(chatStatusForError(new Error('Team not found')), 404);
  assert.equal(chatStatusForError(new Error('Direct conversation not found')), 404);
  assert.equal(chatStatusForError(new Error('No team chat access')), 403);
  assert.equal(chatStatusForError(new Error('Direct messages are blocked')), 403);
  assert.equal(chatStatusForError(new Error('Player profile is required')), 409);
  assert.equal(chatStatusForError(new Error('Supabase request failed with 401')), 401);
  assert.equal(chatStatusForError(new Error('weird')), 400);
});

test('dual scoring HTTP status map covers conflict and auth classes', () => {
  assert.equal(dualScoringStatusForError(new Error('Actor is not a league admin')), 403);
  assert.equal(dualScoringStatusForError(new Error('not an active member of the scoring team')), 403);
  assert.equal(dualScoringStatusForError(new Error('Player match not found')), 404);
  assert.equal(dualScoringStatusForError(new Error('Opening discipline is locked after rack 1')), 409);
  assert.equal(dualScoringStatusForError(new Error('Score changed on another device')), 409);
  assert.equal(dualScoringStatusForError(new Error('Supabase request failed with 401')), 401);
  assert.equal(dualScoringStatusForError(new Error('bad input')), 400);
});

test('admin players HTTP status map', () => {
  assert.equal(adminPlayersStatusForError(new AuthError('no', 401)), 401);
  assert.equal(adminPlayersStatusForError(new Error('Actor is not a league admin')), 403);
  assert.equal(adminPlayersStatusForError(new Error('Cannot demote last league admin')), 409);
  assert.equal(adminPlayersStatusForError(new Error('Player not found')), 404);
  assert.equal(adminPlayersStatusForError(new Error('reason required')), 400);
  assert.equal(adminPlayersStatusForError(new Error('upstream')), 502);
});

test('sandbox feedback HTTP status map', () => {
  assert.equal(sandboxFeedbackStatusForError(new Error('HTTP 401')), 401);
  assert.equal(sandboxFeedbackStatusForError(new Error('League admin access is required')), 403);
  assert.equal(sandboxFeedbackStatusForError(new Error('Report not found')), 404);
  assert.equal(sandboxFeedbackStatusForError(new Error('invalid')), 400);
});

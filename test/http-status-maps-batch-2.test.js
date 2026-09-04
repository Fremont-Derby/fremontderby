import assert from 'node:assert/strict';
import test from 'node:test';
import { AuthError } from '../src/supabaseAuth.js';
import { teamMembershipStatusForError } from '../src/teamMembershipRequestHttp.js';
import { playerSeasonRegistrationErrorStatus } from '../src/playerSeasonRegistrationHttp.js';
import { adminSeasonTeamsStatusFor } from '../src/adminSeasonTeamsHttp.js';
import { adminOperationsStatusForError } from '../src/adminOperationsHttp.js';
import { playoffStatusForError } from '../src/playoffHttp.js';
import { scorableMatchesStatusForError } from '../src/scorableMatchesHttp.js';
import { teamMatchChoiceStatusForError } from '../src/teamMatchChoiceHttp.js';

test('team membership request status map', () => {
  assert.equal(teamMembershipStatusForError(new Error('Supabase request failed with 401')), 401);
  assert.equal(teamMembershipStatusForError(new Error('Only the active captain can respond')), 403);
  assert.equal(teamMembershipStatusForError(new Error('request not found')), 400);
  assert.equal(teamMembershipStatusForError(new Error('already pending')), 409);
  assert.equal(teamMembershipStatusForError(new Error('no longer pending')), 409);
  assert.equal(teamMembershipStatusForError(new Error('bad')), 400);
});

test('player season registration status map', () => {
  assert.equal(playerSeasonRegistrationErrorStatus(new AuthError('x', 401)), 401);
  assert.equal(playerSeasonRegistrationErrorStatus(new Error('Season not found')), 404);
  assert.equal(playerSeasonRegistrationErrorStatus(new Error('Season registration is not open')), 409);
  assert.equal(playerSeasonRegistrationErrorStatus(new Error('Rostered players cannot register as free agents')), 409);
  assert.equal(playerSeasonRegistrationErrorStatus(new Error('other')), 400);
});

test('admin season teams status map', () => {
  assert.equal(adminSeasonTeamsStatusFor(new Error('Actor is not a league admin')), 403);
  assert.equal(adminSeasonTeamsStatusFor(new Error('Season not found')), 404);
  assert.equal(adminSeasonTeamsStatusFor(new Error('Phone number is required for captain')), 409);
  assert.equal(adminSeasonTeamsStatusFor(new Error('No team slots remaining')), 400);
  assert.equal(adminSeasonTeamsStatusFor(new Error('invalid name')), 400);
});

test('admin operations status map', () => {
  assert.equal(adminOperationsStatusForError(new AuthError('x', 401)), 401);
  assert.equal(adminOperationsStatusForError(new Error('League admin access required')), 403);
  assert.equal(adminOperationsStatusForError(new Error('boom')), 400);
});

test('playoff status map', () => {
  assert.equal(playoffStatusForError(new Error('Actor is not a league admin')), 403);
  assert.equal(playoffStatusForError(new Error('Season not found')), 404);
  assert.equal(playoffStatusForError(new Error('regular season must be complete')), 409);
  assert.equal(playoffStatusForError(new Error('semifinal already locked')), 409);
  assert.equal(playoffStatusForError(new Error('bad')), 400);
});

test('scorable matches status map', () => {
  assert.equal(scorableMatchesStatusForError(new AuthError('x', 401)), 401);
  assert.equal(scorableMatchesStatusForError(new Error('Supabase request failed with 403')), 403);
  assert.equal(scorableMatchesStatusForError(new Error('other')), 400);
});

test('team match choice status map', () => {
  assert.equal(teamMatchChoiceStatusForError(new AuthError('x', 401)), 401);
  assert.equal(teamMatchChoiceStatusForError(new Error('Player profile is required')), 403);
  assert.equal(teamMatchChoiceStatusForError(new Error('Team matchup not found')), 404);
  assert.equal(teamMatchChoiceStatusForError(new Error('locked after a lineup includes you')), 409);
  assert.equal(teamMatchChoiceStatusForError(new Error('bad')), 400);
});

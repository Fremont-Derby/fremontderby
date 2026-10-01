import assert from 'node:assert/strict';
import test from 'node:test';
import { AuthError } from '../src/supabaseAuth.js';
import { statusForError } from '../src/seasonCloseHttp.js';

test('season close HTTP maps domain and auth failures to stable statuses', () => {
  assert.equal(statusForError(new AuthError('Missing bearer token', 401)), 401);
  assert.equal(statusForError(new AuthError('forbidden', 403)), 403);
  assert.equal(statusForError(new Error('Season not found')), 404);
  assert.equal(statusForError(new Error('Actor is not a league admin')), 403);
  assert.equal(statusForError(new Error('Supabase request failed with 401: nope')), 401);
  assert.equal(statusForError(new Error('Supabase request failed with 403: nope')), 403);
  assert.equal(statusForError(new Error('Finish scoring before closing')), 409);
  assert.equal(statusForError(new Error('Teams still need captains')), 409);
  assert.equal(statusForError(new Error('something else')), 400);
});

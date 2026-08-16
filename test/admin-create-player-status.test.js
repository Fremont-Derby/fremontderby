import assert from 'node:assert/strict';
import test from 'node:test';
import { AuthError } from '../src/supabaseAuth.js';
import { adminCreatePlayerStatusFor } from '../src/adminCreatePlayerHttp.js';

test('admin create player maps auth and domain failures to stable HTTP statuses', () => {
  assert.equal(adminCreatePlayerStatusFor(new AuthError('Missing bearer token', 401)), 401);
  assert.equal(adminCreatePlayerStatusFor(new Error('Actor is not a league admin')), 403);
  assert.equal(adminCreatePlayerStatusFor(new Error('Player already exists')), 409);
  assert.equal(adminCreatePlayerStatusFor(new Error('Player name is required')), 400);
  assert.equal(adminCreatePlayerStatusFor(new Error('Name exceeds 80 characters')), 400);
  assert.equal(adminCreatePlayerStatusFor(new Error('upstream down')), 502);
});

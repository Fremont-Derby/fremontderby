import test from 'node:test';
import assert from 'node:assert/strict';
import {
  rpcErrorStatus,
  RPC_ERROR_PHRASE_RULES,
  RPC_ERROR_CODES,
} from '../src/rpcErrorStatus.js';

test('phrase rules are data-driven list', () => {
  assert.ok(RPC_ERROR_PHRASE_RULES.length > 20);
  assert.equal(rpcErrorStatus(new Error('Season not found')), 404);
  assert.equal(rpcErrorStatus(new Error('Only the active captain can edit')), 403);
  assert.equal(rpcErrorStatus(new Error('You already have a team application')), 409);
});

test('stable error codes map when present', () => {
  assert.equal(rpcErrorStatus({ message: 'nope', code: 'ERR_CONFLICT' }), 409);
  assert.equal(rpcErrorStatus(new Error('failed ERR_FORBIDDEN for actor')), 403);
  assert.ok(RPC_ERROR_CODES.ERR_NOT_FOUND === 404);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { linkClientError } from '../src/errorLink.js';

test('a client error links to a safe server code and drops the stack', () => {
  assert.equal(linkClientError({ clientId: '', serverCode: 'E_SAVE', stack: 'secret' }).ok, false);
  const linked = linkClientError({ clientId: 'c-1', serverCode: 'E_SAVE', stack: 'secret' });
  assert.equal(linked.ok, true);
  assert.equal(linked.serverCode, 'E_SAVE');
  assert.equal(linked.stack, null);
});

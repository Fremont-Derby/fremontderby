import test from 'node:test';
import assert from 'node:assert/strict';
import { rightMessage } from '../src/rightMessage.js';
test('a message needs a thread and a body', () => {
  assert.equal(rightMessage({ thread: '', body: 'See you there' }).ok, false);
  assert.equal(rightMessage({ thread: 'team', body: 'See you there' }).ok, true);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { requestedMatchId } from '../src/requestedMatch.js';

test('the score link match id is read from the query', () => {
  assert.equal(requestedMatchId('?match=abc'), 'abc');
  assert.equal(requestedMatchId('?match_id=abc'), 'abc');
  assert.equal(requestedMatchId(''), '');
});

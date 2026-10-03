import test from 'node:test';
import assert from 'node:assert/strict';
import { tradeStatusLine } from '../src/tradeStatus.js';

test('a trade card names the player and state', () => {
  assert.equal(tradeStatusLine('Ada', false), 'Ada: open');
  assert.equal(tradeStatusLine('Ada', true), 'Ada: accepted');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { checkinStatusWord } from '../src/checkinStatusWord.js';

test('a check-in status uses a readable word', () => {
  assert.equal(checkinStatusWord('in'), 'In');
  assert.equal(checkinStatusWord('out'), 'Out');
  assert.equal(checkinStatusWord(''), 'Not marked');
});

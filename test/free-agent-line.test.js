import test from 'node:test';
import assert from 'node:assert/strict';
import { freeAgentLine } from '../src/freeAgentLine.js';

test('a free-agent row names the player', () => {
  assert.equal(freeAgentLine('Ada', true), 'Ada: available');
  assert.equal(freeAgentLine('Ada', false), 'Ada: unavailable');
});

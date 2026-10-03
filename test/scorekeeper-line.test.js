import test from 'node:test';
import assert from 'node:assert/strict';
import { scorekeeperLine } from '../src/scorekeeperLine.js';

test('a match card names the scorekeeper', () => {
  assert.equal(scorekeeperLine('Ada'), 'Scorekeeper: Ada');
  assert.equal(scorekeeperLine(''), 'Scorekeeper not set');
});

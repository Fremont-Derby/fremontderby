import test from 'node:test';
import assert from 'node:assert/strict';
import { subLine } from '../src/subLine.js';

test('a substitute names the player', () => {
  assert.equal(subLine('Ada'), 'Ada is the substitute');
  assert.equal(subLine(''), '');
});

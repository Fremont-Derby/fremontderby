import test from 'node:test';
import assert from 'node:assert/strict';
import { homeBarLine } from '../src/homeBarLine.js';

test('a team card names the home bar', () => {
  assert.equal(homeBarLine('4Bs'), 'Home bar: 4Bs');
  assert.equal(homeBarLine(''), 'Home bar not set');
});

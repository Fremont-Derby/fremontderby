import test from 'node:test';
import assert from 'node:assert/strict';
import { captainNameLine } from '../src/captainNameLine.js';

test('a team card names the captain', () => {
  assert.equal(captainNameLine('Ada'), 'Captain: Ada');
  assert.equal(captainNameLine(''), 'Captain not set');
});

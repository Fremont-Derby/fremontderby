import test from 'node:test';
import assert from 'node:assert/strict';
import { divisionLine } from '../src/divisionLine.js';

test('a team card names the division', () => {
  assert.equal(divisionLine('A'), 'Division: A');
  assert.equal(divisionLine(''), 'Division not set');
});

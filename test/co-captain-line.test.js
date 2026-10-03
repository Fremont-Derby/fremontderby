import test from 'node:test';
import assert from 'node:assert/strict';
import { coCaptainLine } from '../src/coCaptainLine.js';

test('a team card names the co-captain', () => {
  assert.equal(coCaptainLine('Bea'), 'Co-captain: Bea');
  assert.equal(coCaptainLine(''), 'Co-captain not set');
});

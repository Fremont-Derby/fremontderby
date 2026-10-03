import test from 'node:test';
import assert from 'node:assert/strict';
import { correctedLine } from '../src/correctedLine.js';

test('a corrected match says so', () => {
  assert.equal(correctedLine(true), 'Score corrected');
  assert.equal(correctedLine(false), '');
});

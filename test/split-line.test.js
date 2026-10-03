import test from 'node:test';
import assert from 'node:assert/strict';
import { splitLine } from '../src/splitLine.js';

test('a tied rack names a split', () => {
  assert.equal(splitLine(true), 'Rack split');
  assert.equal(splitLine(false), '');
});

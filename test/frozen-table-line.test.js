import test from 'node:test';
import assert from 'node:assert/strict';
import { frozenTableLine } from '../src/frozenTableLine.js';

test('a disputed rack says the table is frozen', () => {
  assert.equal(frozenTableLine(true), 'Table frozen');
  assert.equal(frozenTableLine(false), '');
});

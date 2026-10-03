import test from 'node:test';
import assert from 'node:assert/strict';
import { tableOpenLine } from '../src/tableOpenLine.js';

test('a rack says when the table is open', () => {
  assert.equal(tableOpenLine(true), 'Table is open');
  assert.equal(tableOpenLine(false), '');
});

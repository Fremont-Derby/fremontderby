import test from 'node:test';
import assert from 'node:assert/strict';
import { tableLine } from '../src/tableLine.js';

test('a match card names the table', () => {
  assert.equal(tableLine(4), 'Table 4');
  assert.equal(tableLine(''), 'Table not set');
});

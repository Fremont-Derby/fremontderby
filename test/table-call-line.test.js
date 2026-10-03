import test from 'node:test';
import assert from 'node:assert/strict';
import { tableCallLine } from '../src/tableCallLine.js';

test('a match card names the table call', () => {
  assert.equal(tableCallLine('good hit'), 'Call: good hit');
  assert.equal(tableCallLine(''), 'Call not set');
});

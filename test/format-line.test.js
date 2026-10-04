import test from 'node:test';
import assert from 'node:assert/strict';
import { formatLine } from '../src/formatLine.js';

test('a match card names the format', () => {
  assert.equal(formatLine('8 ball'), 'Format: 8 ball');
  assert.equal(formatLine(''), 'Format not set');
});

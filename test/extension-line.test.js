import test from 'node:test';
import assert from 'node:assert/strict';
import { extensionLine } from '../src/extensionLine.js';

test('a live rack names an extension', () => {
  assert.equal(extensionLine('Ada'), 'Ada took an extension');
  assert.equal(extensionLine(''), '');
});

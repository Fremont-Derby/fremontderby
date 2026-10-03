import test from 'node:test';
import assert from 'node:assert/strict';
import { makeupDateLine } from '../src/makeupDate.js';

test('a makeup match names the date', () => {
  assert.equal(makeupDateLine('2026-10-10'), 'Makeup 2026-10-10');
  assert.equal(makeupDateLine(''), '');
});

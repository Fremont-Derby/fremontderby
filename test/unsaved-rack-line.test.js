import test from 'node:test';
import assert from 'node:assert/strict';
import { unsavedRackLine } from '../src/unsavedRackLine.js';

test('a signed-out score page keeps the unsaved rack sentence', () => {
  assert.equal(unsavedRackLine(), 'The unsaved rack is still on this page.');
});

test('an expired lineup keeps the unsaved rack sentence', () => {
  assert.equal(unsavedRackLine(), 'The unsaved rack is still on this page.');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { forfeitLine } from '../src/forfeitLine.js';

test('a finished match names a forfeit', () => {
  assert.equal(forfeitLine('Ada'), 'Ada forfeited');
  assert.equal(forfeitLine(''), '');
});

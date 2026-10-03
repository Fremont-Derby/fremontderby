import test from 'node:test';
import assert from 'node:assert/strict';
import { forfeitLine } from '../src/forfeitLine.js';

test('a forfeit names the team', () => {
  assert.equal(forfeitLine('Rail Riders'), 'Rail Riders forfeited');
  assert.equal(forfeitLine(''), '');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { byeLine } from '../src/byeLine.js';

test('a bye names the team', () => {
  assert.equal(byeLine('Rail Riders'), 'Rail Riders has a bye');
  assert.equal(byeLine(''), '');
});

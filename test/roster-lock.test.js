import test from 'node:test';
import assert from 'node:assert/strict';
import { rosterDropBlocked } from '../src/rosterLock.js';

test('a published season cannot drop a roster player', () => {
  assert.equal(rosterDropBlocked('active', false), true);
  assert.equal(rosterDropBlocked('registration', false), false);
  assert.equal(rosterDropBlocked('active', true), false);
});

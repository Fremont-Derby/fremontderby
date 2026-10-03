import test from 'node:test';
import assert from 'node:assert/strict';
import { stuckRecovery } from '../src/stuckPath.js';
test('a stuck step has one recovery path', () => {
  assert.equal(stuckRecovery('lineup'), '/lineup');
  assert.equal(stuckRecovery('other'), null);
});

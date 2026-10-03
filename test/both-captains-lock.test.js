import test from 'node:test';
import assert from 'node:assert/strict';
import { lineupLockLine } from '../src/bothCaptainsLock.js';

test('a lineup stays editable until both captains submit', () => {
  assert.equal(lineupLockLine(1), 'Editable until both captains submit');
  assert.equal(lineupLockLine(2), 'Lineup locked');
});

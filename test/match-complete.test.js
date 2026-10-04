import test from 'node:test';
import assert from 'node:assert/strict';
import { matchCompleteLine } from '../src/matchComplete.js';

test('a finished match hides add rack', () => {
  const done = matchCompleteLine({ status: 'finalized' });
  assert.equal(done.line, 'Match complete');
  assert.equal(done.hideAddRack, true);
  assert.equal(matchCompleteLine({ status: 'in_progress' }).hideAddRack, false);
});

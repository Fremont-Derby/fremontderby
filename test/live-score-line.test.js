import test from 'node:test';
import assert from 'node:assert/strict';
import { liveScoreLine } from '../src/liveScoreLine.js';

test('a live match names the current racks', () => {
  assert.equal(liveScoreLine({ status: 'in_progress', homeRacks: 2, awayRacks: 1 }), 'Live 2-1');
  assert.equal(liveScoreLine({ status: 'finalized', homeRacks: 2, awayRacks: 1 }), '');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { nightReady } from '../src/nightChecklist.js';

test('a night is ready only after roster, schedule, and scores', () => {
  assert.deepEqual(nightReady(['roster']).missing, ['schedule', 'scores']);
  assert.equal(nightReady(['roster', 'schedule', 'scores']).ok, true);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { playerOpen } from '../src/playerOpen.js';

test('a created player can be opened', () => {
  assert.equal(playerOpen({ playerId: 'b9f82798-7ef0-4ce4-ad9e-2ebf70a73463' }), true);
  assert.equal(playerOpen(null), false);
});

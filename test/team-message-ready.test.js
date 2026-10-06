import test from 'node:test';
import assert from 'node:assert/strict';
import { teamMessageReady } from '../src/teamMessageReady.js';

test('a rostered team can take a message', () => {
  assert.equal(teamMessageReady(true), true);
  assert.equal(teamMessageReady(false), false);
});

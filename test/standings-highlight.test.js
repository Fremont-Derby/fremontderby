import test from 'node:test';
import assert from 'node:assert/strict';
import { isRequestedStanding } from '../src/standingsHighlight.js';

test('requested team match is case-insensitive and exact', () => {
  assert.equal(isRequestedStanding('Rail Sharks', 'rail sharks'), true);
  assert.equal(isRequestedStanding('Rail Sharks', 'Rail Owls'), false);
  assert.equal(isRequestedStanding('Rail Sharks', ''), false);
});

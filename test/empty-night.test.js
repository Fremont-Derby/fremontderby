import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyNightLine } from '../src/emptyNight.js';

test('an empty night names the missing matchups', () => {
  assert.equal(emptyNightLine(0), 'No matchups are posted for this league night.');
  assert.equal(emptyNightLine(2), '');
});

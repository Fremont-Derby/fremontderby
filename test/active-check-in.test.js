import test from 'node:test';
import assert from 'node:assert/strict';
import { activeSeasonCanCheckIn } from '../src/activeCheckIn.js';

test('a rostered player can check in after the season is published', () => {
  assert.equal(activeSeasonCanCheckIn('active', true), true);
  assert.equal(activeSeasonCanCheckIn('registration', true), false);
  assert.equal(activeSeasonCanCheckIn('active', false), false);
});

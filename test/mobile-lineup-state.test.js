import test from 'node:test';
import assert from 'node:assert/strict';
import { mobileLineupState } from '../src/mobileLineupState.js';

test('a mobile lineup state names the team', () => {
  assert.equal(mobileLineupState('Rail Riders', false), 'Rail Riders: open');
  assert.equal(mobileLineupState('Rail Riders', true), 'Rail Riders: submitted');
});

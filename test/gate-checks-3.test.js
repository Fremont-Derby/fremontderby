import test from 'node:test';
import assert from 'node:assert/strict';
import { adminRecovery, cleanRoomTrial, messageChannel, postseasonLineup, prizePayout } from '../src/gateChecks3.js';

test('messages stay on three channels', () => {
  assert.equal(messageChannel({ channel: 'league' }).ok, true);
  assert.equal(messageChannel({ channel: 'trade' }).ok, false);
});

test('a prize needs a name and an amount', () => {
  assert.equal(prizePayout({ name: 'Night', amount: 20 }).ok, true);
  assert.equal(prizePayout({ amount: 20 }).ok, false);
});

test('postseason lineup has four players', () => {
  assert.equal(postseasonLineup({ players: ['a', 'b', 'c', 'd'] }).ok, true);
  assert.equal(postseasonLineup({ players: ['a'] }).ok, false);
});

test('admin recovery names the step', () => {
  assert.equal(adminRecovery({ step: 'Enter the score by hand.' }).ok, true);
});

test('the clean-room trial needs two captains', () => {
  assert.equal(cleanRoomTrial({ captains: 2, clean: true }).ok, true);
  assert.equal(cleanRoomTrial({ captains: 1, clean: true }).ok, false);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { homeTeamLine } from '../src/homeTeamLine.js';

test('a match card names the home team', () => {
  assert.equal(homeTeamLine('Rail Riders'), 'Home: Rail Riders');
  assert.equal(homeTeamLine(''), 'Home team not set');
});

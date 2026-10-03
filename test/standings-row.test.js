import test from 'node:test';
import assert from 'node:assert/strict';
import { standingsRow } from '../src/standingsRow.js';

test('a standings row names the team and points', () => {
  assert.equal(standingsRow({ rank: 1, teamName: 'Rail Riders', points: 6 }), '#1 Rail Riders · 6 pts');
});

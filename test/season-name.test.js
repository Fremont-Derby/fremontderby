import test from 'node:test';
import assert from 'node:assert/strict';
import { seasonNameLine } from '../src/seasonName.js';

test('a schedule header names the season', () => {
  assert.equal(seasonNameLine('Fall 2026'), 'Season: Fall 2026');
  assert.equal(seasonNameLine(''), 'Season not selected');
});

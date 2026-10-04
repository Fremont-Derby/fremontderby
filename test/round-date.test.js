import test from 'node:test';
import assert from 'node:assert/strict';
import { roundDateLine } from '../src/roundDate.js';

test('a round header names the date', () => {
  assert.equal(roundDateLine('2026-10-03'), 'League night 2026-10-03');
  assert.equal(roundDateLine(''), 'Date not set');
});

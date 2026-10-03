import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreState } from '../src/scoreState.js';

test('a dispute is not the race result', () => {
  assert.equal(scoreState({ disputed: true }).text, 'Captains disagree. This is not the race result.');
});

test('an empty score path names one next action', () => {
  assert.match(scoreState({ empty: true }).text, /Open the lineup/);
});

test('a saved side is explicit', () => {
  assert.equal(scoreState({ saved: true, selectedSide: 'A' }).text, 'Saved side A.');
});

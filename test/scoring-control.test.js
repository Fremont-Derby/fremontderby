import test from 'node:test';
import assert from 'node:assert/strict';
import { selectedScoringControl } from '../src/scoringControl.js';

test('a selected scoring control stays named', () => {
  assert.equal(selectedScoringControl('8 ball'), 'Selected: 8 ball');
  assert.equal(selectedScoringControl(''), '');
});

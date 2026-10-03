import test from 'node:test';
import assert from 'node:assert/strict';
import { mismatchLine, overrunLine } from '../src/scoreMismatch.js';
import { renderScorePickerPage } from '../src/scorePickerPage.js';

test('a mismatch is not saved and overrun scoring is closed', () => {
  assert.equal(mismatchLine({ mismatch: true }), 'That score does not match. It was not saved.');
  assert.equal(overrunLine({ overrun: true }), 'Scoring is closed.');
  const html = renderScorePickerPage();
  assert.match(html, /That score does not match. It was not saved/);
  assert.match(html, /Scoring is closed/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { scorecardLine, replayLine } from '../src/replayLine.js';
import { renderScorePickerPage } from '../src/scorePickerPage.js';

test('the score page does not show a placeholder replay', () => {
  assert.equal(scorecardLine({ name: 'week one' }), 'Scorecard: week one.');
  assert.equal(replayLine({ name: 'after the fix' }), 'Replay: after the fix.');
  const html = renderScorePickerPage();
  assert.doesNotMatch(html, /data-replay/);
  assert.doesNotMatch(html, /data-score-miss/);
  assert.doesNotMatch(html, /Replay: after the fix/);
});

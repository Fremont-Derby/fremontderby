import test from 'node:test';
import assert from 'node:assert/strict';
import { scorecardLine, replayLine } from '../src/replayLine.js';
import { renderScorePickerPage } from '../src/scorePickerPage.js';

test('a scorecard and a replay are named', () => {
  assert.equal(scorecardLine({ name: 'week one' }), 'Scorecard: week one.');
  assert.equal(replayLine({ name: 'after the fix' }), 'Replay: after the fix.');
  const html = renderScorePickerPage();
  assert.match(html, /Scorecard: week one/);
  assert.match(html, /Replay: after the fix/);
});

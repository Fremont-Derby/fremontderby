import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreLinkMiss } from '../src/scoreLinkMiss.js';
import { renderScorePickerPage } from '../src/scorePickerPage.js';

test('a missing score link says the match is not on the list', () => {
  assert.equal(scoreLinkMiss([{ teamMatchId: 'known' }], 'known'), '');
  assert.equal(scoreLinkMiss([{ teamMatchId: 'known' }], 'missing-match'), 'That match is not on this score list.');
  assert.match(renderScorePickerPage(), /That match is not on this score list/);
});

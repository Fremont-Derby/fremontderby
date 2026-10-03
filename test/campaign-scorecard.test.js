import test from 'node:test';
import assert from 'node:assert/strict';
import { campaignFoundationLine, scorecardDriveLine } from '../src/campaignScorecard.js';
import { renderScorePickerPage } from '../src/scorePickerPage.js';

test('a campaign foundation and a scorecard drive are named', () => {
  assert.equal(campaignFoundationLine({ name: 'player mission' }), 'Campaign foundation: player mission.');
  assert.equal(scorecardDriveLine({ name: 'score a rack' }), 'Scorecard drive: score a rack.');
  const html = renderScorePickerPage();
  assert.match(html, /Campaign foundation: player mission/);
  assert.match(html, /Scorecard drive: score a rack/);
});

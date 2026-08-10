import test from 'node:test';
import assert from 'node:assert/strict';
import { renderScorecardPage } from '../src/scorecardPage.js';

test('scorecard page renders the dual-player phone scoring controls', () => {
  const html = renderScorecardPage();

  assert.match(html, /Fremont Derby Scorecard/);
  assert.match(html, /data-match-id/);
  assert.match(html, /data-token/);
  assert.match(html, /data-rack-a/);
  assert.match(html, /data-rack-b/);
  assert.match(html, /data-undo/);
  assert.match(html, /data-confirm/);
  assert.match(html, /data-finalize/);
  assert.match(html, /My rack history/);
  assert.match(html, /Opponent rack history/);
  assert.match(html, /Score mismatch at rack/);
  assert.match(html, /\/api\/player-matches\/:id\/scorecard/);
  assert.match(html, /\/api\/player-matches\/:id\/score-comparison/);
  assert.match(html, /\/api\/player-matches\/:id\/score-racks/);
  assert.match(html, /\/api\/player-matches\/:id\/score-racks\/undo/);
  assert.match(html, /\/api\/player-matches\/:id\/score-confirm/);
  assert.match(html, /\/api\/player-matches\/:id\/finalize-reconciled/);
  assert.doesNotMatch(html, /\/api\/player-matches\/:id\/racks['"]/);
  assert.doesNotMatch(html, /\/api\/player-matches\/:id\/finalize['"]/);
});

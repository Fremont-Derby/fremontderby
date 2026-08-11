import test from 'node:test';
import assert from 'node:assert/strict';
import { renderScorecardPage } from '../src/scorecardPage.js';

test('scorecard page renders explicit team-owned phone scoring controls without technical inputs', () => {
  const html = renderScorecardPage();

  assert.match(html, /Fremont Derby Scorecard/);
  assert.doesNotMatch(html, /data-match-id/);
  assert.doesNotMatch(html, /data-token/);
  assert.match(html, /params\.get\('match'\)/);
  assert.match(html, /params\.get\('team'\)/);
  assert.match(html, /sessionStorage\.getItem\('fd\.accessToken'\)/);
  assert.match(html, /Scoring for/);
  assert.match(html, />Switch match</);
  assert.match(html, /data-rack-a/);
  assert.match(html, /data-rack-b/);
  assert.match(html, /data-undo/);
  assert.match(html, /data-confirm/);
  assert.match(html, /data-finalize/);
  assert.match(html, /Rack ledger/);
  assert.match(html, /scoringTeamId=/);
  assert.match(html, /\/api\/player-matches\/:id\/scorecard/);
  assert.match(html, /\/api\/player-matches\/:id\/score-comparison/);
  assert.match(html, /\/api\/player-matches\/:id\/score-racks/);
  assert.match(html, /\/api\/player-matches\/:id\/score-racks\/undo/);
  assert.match(html, /\/api\/player-matches\/:id\/score-confirm/);
  assert.match(html, /\/api\/player-matches\/:id\/finalize-reconciled/);
});

test('scorecard first view keeps team score, player race, rack ledger, and current action together', () => {
  const html = renderScorecardPage();

  assert.match(html, /Running team score/);
  assert.match(html, /Current individual race/);
  assert.match(html, /Rack ledger/);
  assert.match(html, /data-team-score-a/);
  assert.match(html, /data-team-score-b/);
  assert.match(html, /data-target-a/);
  assert.match(html, /data-target-b/);
  assert.match(html, /data-next-rack/);
  assert.match(html, /data-next-discipline/);
  assert.match(html, /winnerSide\(rack\)===playerSide\?'W':'L'/);
  assert.match(html, /\.submission\[data-state=matched\]/);
  assert.match(html, /\.submission\[data-state=pending\]/);
  assert.match(html, /\.submission\[data-state=mismatch\]/);
  assert.match(html, /<details class="details">/);
  assert.match(html, /touch-action:manipulation/);
  assert.match(html, /body\{[^}]*overflow-x:hidden/);
});

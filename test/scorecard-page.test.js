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
  assert.match(html, /Switch match \/ scoring team/);
  assert.match(html, /data-rack-a/);
  assert.match(html, /data-rack-b/);
  assert.match(html, /data-undo/);
  assert.match(html, /data-confirm/);
  assert.match(html, /data-finalize/);
  assert.match(html, /Our rack history/);
  assert.match(html, /Other team&apos;s rack history|Other team's rack history/);
  assert.match(html, /Mismatch at rack/);
  assert.match(html, /scoringTeamId=/);
  assert.match(html, /\/api\/player-matches\/:id\/scorecard/);
  assert.match(html, /\/api\/player-matches\/:id\/score-comparison/);
  assert.match(html, /\/api\/player-matches\/:id\/score-racks/);
  assert.match(html, /\/api\/player-matches\/:id\/score-racks\/undo/);
  assert.match(html, /\/api\/player-matches\/:id\/score-confirm/);
  assert.match(html, /\/api\/player-matches\/:id\/finalize-reconciled/);
  assert.doesNotMatch(html, /\/api\/player-matches\/:id\/racks['"]/);
  assert.doesNotMatch(html, /\/api\/player-matches\/:id\/finalize['"]/);
});

test('scorecard keeps the full rack input in one compact side-by-side race', () => {
  const html = renderScorecardPage();

  assert.match(html, /data-primary-scoring/);
  assert.match(html, /Rack <span data-rack-number>1<\/span> · now playing/);
  assert.match(html, /data-discipline>8-BALL/);
  assert.match(html, /grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/);
  assert.match(html, /data-player-a-target/);
  assert.match(html, /data-player-b-target/);
  assert.match(html, /data-race-a-markers/);
  assert.match(html, /data-race-b-markers/);
  assert.match(html, /function renderRaceMarkers/);
  assert.match(html, /role="img" aria-label="Player A: 0 racks/);
  assert.match(html, /wins rack 1/);
  assert.match(html, /<details class="detail-drawer">/);
  assert.match(html, /touch-action:manipulation/);
  assert.doesNotMatch(html, /\.score-grid\s*\{[^}]*grid-template-columns:1fr/s);
});

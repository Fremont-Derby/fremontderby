import assert from 'node:assert/strict';
import test from 'node:test';

import { renderScorecardPage } from '../src/scorecardPage.js';

test('live scorecard uses selected match and signed-in session without technical inputs', () => {
  const html = renderScorecardPage();

  assert.doesNotMatch(html, />Match ID</i);
  assert.doesNotMatch(html, />Access token</i);
  assert.doesNotMatch(html, /data-match-id/);
  assert.doesNotMatch(html, /data-token/);
  assert.match(html, /new URLSearchParams\(location\.search\)/);
  assert.match(html, /params\.get\('match'\)/);
  assert.match(html, /params\.get\('team'\)/);
  assert.match(html, /sessionStorage\.getItem\('fd\.accessToken'\)/);
  assert.match(html, />Switch match</);
  assert.match(html, /data-detail-team/);
});

test('live scorecard guides missing browser context through normal UI', () => {
  const html = renderScorecardPage();

  assert.match(html, /Choose a match from the scorecard list\./);
  assert.match(html, /Choose which team you are scoring for\./);
  assert.match(html, /Sign in with Google to score this match\./);
  assert.match(html, /href=\"\/profile\"/);
});
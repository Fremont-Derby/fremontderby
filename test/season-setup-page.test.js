import test from 'node:test';
import assert from 'node:assert/strict';
import { renderSeasonSetupPage } from '../src/seasonSetupPage.js';

test('season setup page uses the signed-in session without technical identifiers', () => {
  const html = renderSeasonSetupPage();

  assert.match(html, /Fremont Derby Season Setup/);
  assert.match(html, /data-season-setup-form/);
  assert.doesNotMatch(html, /data-season-id/);
  assert.doesNotMatch(html, /data-token/);
  assert.doesNotMatch(html, />Season ID</i);
  assert.doesNotMatch(html, />Access token</i);
  assert.match(html, /sessionStorage\.getItem\('fd\.accessToken'\)/);
  assert.match(html, /data-first-round-date/);
  assert.match(html, /data-roster-lock-round/);
  assert.match(html, /data-opening-block-length/);
  assert.match(html, /data-race-chart-version/);
  assert.match(html, /data-playoff-team-count/);
  assert.match(html, /data-save/);
  assert.match(html, /data-publish/);
  assert.match(html, /data-teams-body/);
  assert.match(html, /data-rounds-body/);
  assert.match(html, /Ready to create Season 1/);
  assert.match(html, /\/api\/admin\/seasons/);
  assert.match(html, /publish-schedule/);
});

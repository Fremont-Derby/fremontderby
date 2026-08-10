import test from 'node:test';
import assert from 'node:assert/strict';
import { renderSeasonSetupPage } from '../src/seasonSetupPage.js';

test('season setup page renders director setup and publish controls', () => {
  const html = renderSeasonSetupPage();

  assert.match(html, /Fremont Derby Season Setup/);
  assert.match(html, /data-season-setup-form/);
  assert.match(html, /data-season-id/);
  assert.match(html, /data-token/);
  assert.match(html, /data-first-round-date/);
  assert.match(html, /data-roster-lock-round/);
  assert.match(html, /data-opening-block-length/);
  assert.match(html, /data-race-chart-version/);
  assert.match(html, /data-playoff-team-count/);
  assert.match(html, /data-save/);
  assert.match(html, /data-publish/);
  assert.match(html, /data-teams-body/);
  assert.match(html, /data-rounds-body/);
  assert.match(html, /\/api\/admin\/seasons/);
  assert.match(html, /publish-schedule/);
});

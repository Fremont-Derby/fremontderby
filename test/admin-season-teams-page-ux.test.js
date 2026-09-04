import test from 'node:test';
import assert from 'node:assert/strict';
import { renderAdminSeasonTeamsPage } from '../src/adminSeasonTeamsPage.js';

test('season team admin keeps action feedback visible on phones', () => {
  const html = renderAdminSeasonTeamsPage();
  assert.match(html, /data-state/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /reserved a season slot|added to the season|setState/);
});

test('season team admin keeps the first view concise', () => {
  const html = renderAdminSeasonTeamsPage();
  assert.match(html, /<h1>Season teams<\/h1>/);
  assert.doesNotMatch(html, /setState\('Ready','ok'\)/);
});

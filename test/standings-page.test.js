import test from 'node:test';
import assert from 'node:assert/strict';
import { renderStandingsPage } from '../src/standingsPage.js';

test('standings page renders team and individual standings controls', () => {
  const html = renderStandingsPage();

  assert.match(html, /Fremont Derby Standings/);
  assert.match(html, /data-season-id/);
  assert.match(html, /data-tab="teams"/);
  assert.match(html, /data-tab="individuals"/);
  assert.match(html, /data-team-body/);
  assert.match(html, /data-player-body/);
  assert.match(html, /team-standings/);
  assert.match(html, /individual-standings/);
});

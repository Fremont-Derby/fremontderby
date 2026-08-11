import test from 'node:test';
import assert from 'node:assert/strict';
import { renderStandingsPage } from '../src/standingsPage.js';

test('standings page renders team and individual standings controls', () => {
  const html = renderStandingsPage();

  assert.match(html, /Fremont Derby Standings/);
  assert.match(html, /<select name="seasonId" data-season-id>/);
  assert.match(html, /data-registration-summary/);
  assert.match(html, /Register or join a team/);
  assert.match(html, /fetch\('\/api\/seasons'\)/);
  assert.match(html, /data-tab="teams"/);
  assert.match(html, /data-tab="individuals"/);
  assert.match(html, /data-team-body/);
  assert.match(html, /data-player-body/);
  assert.match(html, /<th class="numeric">W-L<\/th>/);
  assert.doesNotMatch(html, /W-D-L/);
  assert.doesNotMatch(html, /row\.team_draws/);
  assert.match(html, /team-standings/);
  assert.match(html, /individual-standings/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { renderStandingsPage } from '../src/standingsPage.js';

test('standings page keeps team and individual standings one tap away', () => {
  const html = renderStandingsPage();

  assert.match(html, /Fremont Derby Standings/);
  assert.match(html, /<select name="seasonId" data-season-id>/);
  assert.match(html, /data-registration-summary/);
  assert.match(html, /Register or join a team/);
  assert.match(html, /fetch\('\/api\/seasons'\)/);
  assert.match(html, /data-tab="teams"[^>]*>Team standings<\/button>/);
  assert.match(html, /data-tab="individuals"[^>]*>Individual standings<\/button>/);
  assert.match(html, /position: sticky/);
  assert.match(html, /fd\.standingsView/);
  assert.match(html, /searchParams\.set\('view', selected\)/);
  assert.match(html, /data-team-body/);
  assert.match(html, /data-player-body/);
  assert.match(html, /<th class="numeric">W-L<\/th>/);
  assert.doesNotMatch(html, /W-D-L/);
  assert.doesNotMatch(html, /row\.team_draws/);
  assert.match(html, /team-standings/);
  assert.match(html, /individual-standings/);
});

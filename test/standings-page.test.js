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
  assert.match(html, /position:sticky/);
  assert.match(html, /fd\.standingsView/);
  assert.match(html, /searchParams\.set\('view',selected\)/);
  assert.match(html, /data-team-body/);
  assert.match(html, /data-player-body/);
  assert.match(html, /<th class="numeric">W-L<\/th>/);
  assert.doesNotMatch(html, /W-D-L/);
  assert.doesNotMatch(html, /row\.team_draws/);
  assert.match(html, /team-standings/);
  assert.match(html, /individual-standings/);
});

test('standings page uses phone-native cards instead of horizontal table scrolling', () => {
  const html = renderStandingsPage();

  assert.match(html, /data-team-cards aria-label="Team standings"/);
  assert.match(html, /data-player-cards aria-label="Individual standings"/);
  assert.match(html, /\.panel table\{display:none\}/);
  assert.match(html, /\.mobile-list\{display:block\}/);
  assert.doesNotMatch(html, /min-width:\s*720px/);
  assert.doesNotMatch(html, /overflow-x:\s*auto/);
  assert.match(html, /aria-label','Rank '/);
  assert.match(html, /stat\('Record'/);
  assert.match(html, /stat\('Prize status'/);
});

test('standings tabs and controls expose keyboard and motion accessibility', () => {
  const html = renderStandingsPage();

  assert.match(html, /:focus-visible/);
  assert.match(html, /prefers-reduced-motion:reduce/);
  assert.match(html, /event\.key!==\'ArrowLeft\'/);
  assert.match(html, /event\.key!==\'ArrowRight\'/);
  assert.match(html, /\.focus\(\)/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, />Load standings<\/button>/);
});

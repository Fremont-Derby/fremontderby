import test from 'node:test';
import assert from 'node:assert/strict';
import { renderLineupPage } from '../src/lineupPage.js';

test('lineup preserves an explicitly requested season when no team is named', () => {
  const page = renderLineupPage();
  assert.match(page, /requestedSeason=params\.get\('season'\)\|\|''/);
  assert.match(page, /else if\(requestedSeason\).*seasonId\|\|team\.season_id/);
});

test('explicit requested team remains higher priority than requested season', () => {
  const page = renderLineupPage();
  const explicitTeam = page.indexOf("if(requestedTeam&&captainTeams.some");
  const seasonFallback = page.indexOf("else if(requestedSeason)");
  assert.ok(explicitTeam >= 0);
  assert.ok(seasonFallback > explicitTeam);
});

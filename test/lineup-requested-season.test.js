import test from 'node:test';
import assert from 'node:assert/strict';
import { renderLineupPage } from '../src/lineupPage.js';

test('lineup preserves requested season as fallback context', () => {
  const page = renderLineupPage();
  assert.match(page, /requestedSeason=params\.get\('season'\)\|\|''/);
  assert.match(page, /else if\(requestedSeason\).*seasonId\|\|team\.season_id/);
});

test('explicit team remains higher priority than requested season', () => {
  const page = renderLineupPage();
  assert.ok(page.indexOf("if(requestedTeam&&captainTeams.some") < page.indexOf("else if(requestedSeason)"));
});

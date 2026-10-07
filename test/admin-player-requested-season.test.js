import assert from 'node:assert/strict';
import test from 'node:test';

import { renderAdminPlayersPage } from '../src/adminPlayersPage.js';

test('roster admin prefers requested season while preserving current-season fallback', () => {
  const page = renderAdminPlayersPage();
  assert.match(page, /function requestedSeasonId\(\)\{return new URLSearchParams\(location\.search\)\.get\('season'\)\|\|''\}/);
  assert.match(page, /const seasonId=requestedSeasonId\(\)\|\|player\.currentSeasonId/);
  assert.match(page, /rosterTeams\.filter\(team=>team\.seasonId===seasonId/);
  assert.doesNotMatch(page, /\/api\/admin\/seasons\/.*team-candidates/);
});

test('roster mutation keeps selected team season and normal authenticated admin API', () => {
  const page = renderAdminPlayersPage();
  assert.match(page, /operation:'roster-membership',seasonId:team\.seasonId,teamId:team\.teamId/);
  assert.match(page, /authorization:'Bearer '\+accessToken/);
});

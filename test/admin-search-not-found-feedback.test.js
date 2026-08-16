import assert from 'node:assert/strict';
import test from 'node:test';
import { renderAdminPlayersPage } from '../src/adminPlayersPage.js';
import { renderAdminSeasonsPage } from '../src/adminSeasonsPage.js';
import { renderAdminSeasonTeamsPage } from '../src/adminSeasonTeamsPage.js';

test('admin directories state a not-found message that includes the query', () => {
  const players = renderAdminPlayersPage();
  assert.match(players, /No players match/);
  assert.match(players, /setStatus\(emptyEl\.textContent,'error'\)|setStatus\('No players match/);

  const seasons = renderAdminSeasonsPage();
  assert.match(seasons, /No seasons match/);
  assert.match(seasons, /setStatus\(emptyEl\.textContent, 'error'\)|setStatus\(emptyEl\.textContent,'error'\)/);

  const teams = renderAdminSeasonTeamsPage();
  assert.match(teams, /No teams match /);
  assert.match(teams, /setState\(empty\.textContent,'error'\)/);
});

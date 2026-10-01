import test from 'node:test';
import assert from 'node:assert/strict';
import { freshSeasonInsert, shouldInsertFreshDruSeason } from '../src/druFreshSeason.js';
import { readFileSync } from 'node:fs';

test('only a DRU create with no season id inserts a fresh season', () => {
  assert.equal(shouldInsertFreshDruSeason({ ENVIRONMENT: 'dru' }, null), true);
  assert.equal(shouldInsertFreshDruSeason({ ENVIRONMENT: 'dru' }, 'season-1'), false);
  assert.equal(shouldInsertFreshDruSeason({ ENVIRONMENT: 'gamma' }, null), false);
  assert.equal(shouldInsertFreshDruSeason({ ENVIRONMENT: 'production' }, null), false);
});

test('a fresh season row does not reuse an existing registration id', () => {
  const row = freshSeasonInsert({
    seasonName: 'Puddle Jump Night',
    leagueNight: 'thursday',
    firstRoundDate: '2026-10-08',
    rosterLockRound: 4,
    openingBlockLength: 7,
    individualMinMatches: 4,
    roundIntervalDays: 7,
    tableNumbers: [1, 2, 3, 4],
    raceChartVersion: 'apa-8ft',
    playoffTeamCount: 4,
    playoffAnchorTiebreaker: true,
  });
  assert.equal(row.name, 'Puddle Jump Night');
  assert.equal(row.status, 'registration');
  assert.equal(row.id, undefined);
});

test('season setup offers a new season choice', () => {
  const page = readFileSync(new URL('../src/seasonSetupPage.js', import.meta.url), 'utf8');
  assert.match(page, /New season/);
  assert.match(page, /Ready to create a new season/);
});

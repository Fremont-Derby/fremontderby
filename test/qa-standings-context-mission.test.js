import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STANDINGS_CONTEXT_MISSION,
  buildStandingsContextFixture,
} from '../src/qaStandingsContextContract.js';

test('standings-context mission names team vs individual views', () => {
  assert.equal(STANDINGS_CONTEXT_MISSION.missionId, 'player.find-standings-context');
  assert.equal(STANDINGS_CONTEXT_MISSION.world, 'player');
  assert.ok(STANDINGS_CONTEXT_MISSION.productRoutes.includes('/standings'));
  assert.match(STANDINGS_CONTEXT_MISSION.action, /individual standings/i);
});

test('standings-context fixture randomizes two seasons and two views', () => {
  const fixture = buildStandingsContextFixture('standings-seed-1');
  assert.equal(fixture.player.name.split(' ').length, 2);
  assert.notEqual(fixture.target.teamId, fixture.distractor.teamId);
  assert.notEqual(fixture.target.seasonId, fixture.distractor.seasonId);
  assert.notEqual(fixture.target.teamName, fixture.distractor.teamName);
  assert.notEqual(fixture.target.teamRank, fixture.distractor.individualRank);
  assert.equal(fixture.target.view, 'teams');
  assert.equal(fixture.distractor.view, 'individuals');
  assert.equal(fixture.semantic.team_standings_distinct_from_individual, true);
  assert.equal(fixture.product.route, '/standings');
});

test('standings-context fixture is deterministic for exact replay', () => {
  assert.deepEqual(
    buildStandingsContextFixture('repeat-me'),
    buildStandingsContextFixture('repeat-me'),
  );
  assert.notDeepEqual(
    buildStandingsContextFixture('repeat-me'),
    buildStandingsContextFixture('new-seed'),
  );
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CAPTAIN_ADD_PLAYERS_MISSION,
  buildCaptainAddPlayersFixture,
} from '../src/qaCaptainAddPlayersContract.js';

const VARIANTS = new Set(['happy-path', 'ineligible-blocked']);

test('captain add-players mission is a captain fixture on home and teams', () => {
  assert.equal(CAPTAIN_ADD_PLAYERS_MISSION.missionId, 'captain.add-players');
  assert.equal(CAPTAIN_ADD_PLAYERS_MISSION.world, 'captain');
  assert.equal(CAPTAIN_ADD_PLAYERS_MISSION.persona, 'Captain');
  assert.ok(CAPTAIN_ADD_PLAYERS_MISSION.productRoutes.includes('/'));
  assert.ok(CAPTAIN_ADD_PLAYERS_MISSION.productRoutes.includes('/teams'));
});

test('fixture names two intended candidates and keeps existing roster distinct', () => {
  const fixture = buildCaptainAddPlayersFixture('captain-add-night-1');
  assert.equal(VARIANTS.has(fixture.variant), true);
  assert.equal(fixture.intended.length, 2);
  assert.ok(fixture.intended.every((player) => player.eligible && player.intended));
  assert.equal(fixture.distractor.intended, false);
  assert.ok(fixture.team.existingRoster.includes(fixture.captain.name));
  assert.ok(fixture.team.existingRoster.length >= 3);
  for (const player of fixture.intended) {
    assert.equal(fixture.team.existingRoster.includes(player.name), false);
  }
  assert.equal(fixture.semantic.exactly_two_intended_candidates, true);
  assert.equal(fixture.semantic.captain_permission_required, true);
});

test('ineligible variant exposes a blocked candidate with recovery reason', () => {
  let found = null;
  for (const seed of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p']) {
    const fixture = buildCaptainAddPlayersFixture(seed);
    if (fixture.variant === 'ineligible-blocked') {
      found = fixture;
      break;
    }
  }
  assert.ok(found, 'expected an ineligible-blocked variant across seeds');
  assert.equal(found.ineligible.eligible, false);
  assert.match(found.ineligible.reason, /eligib/i);
  assert.equal(found.semantic.ineligible_or_duplicate_add_prevented, true);
});

test('captain add-players fixture is deterministic for exact replay', () => {
  assert.deepEqual(
    buildCaptainAddPlayersFixture('repeat-add-players'),
    buildCaptainAddPlayersFixture('repeat-add-players'),
  );
  assert.notDeepEqual(
    buildCaptainAddPlayersFixture('repeat-add-players'),
    buildCaptainAddPlayersFixture('new-add-players-seed'),
  );
});

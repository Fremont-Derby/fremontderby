import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CAPTAINCY_TRANSFER_MISSION,
  buildCaptaincyTransferFixture,
} from '../src/qaCaptaincyTransferContract.js';

const VARIANTS = new Set(['happy-path', 'ineligible-blocked']);

test('captaincy transfer mission is a captain fixture on home and teams', () => {
  assert.equal(CAPTAINCY_TRANSFER_MISSION.missionId, 'captain.transfer-captaincy');
  assert.equal(CAPTAINCY_TRANSFER_MISSION.world, 'captain');
  assert.equal(CAPTAINCY_TRANSFER_MISSION.persona, 'Captain');
  assert.ok(CAPTAINCY_TRANSFER_MISSION.productRoutes.includes('/'));
  assert.ok(CAPTAINCY_TRANSFER_MISSION.productRoutes.includes('/teams'));
});

test('fixture names one intended successor and keeps roster distractors', () => {
  const fixture = buildCaptaincyTransferFixture('captain-night-1');
  assert.equal(VARIANTS.has(fixture.variant), true);
  assert.equal(fixture.successor.eligible, true);
  assert.equal(fixture.successor.afterTransferIsCaptain, true);
  assert.equal(fixture.captain.afterTransferIsCaptain, false);
  assert.ok(fixture.team.roster.includes(fixture.successor.name));
  assert.ok(fixture.distractors.length >= 2);
  assert.equal(fixture.semantic.exactly_one_intended_successor, true);
  assert.equal(fixture.semantic.no_dual_captain_state, true);
});

test('ineligible variant exposes a blocked candidate with recovery reason', () => {
  let found = null;
  for (const seed of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p']) {
    const fixture = buildCaptaincyTransferFixture(seed);
    if (fixture.variant === 'ineligible-blocked') {
      found = fixture;
      break;
    }
  }
  assert.ok(found, 'expected an ineligible-blocked variant across seeds');
  assert.equal(found.ineligible.eligible, false);
  assert.match(found.ineligible.reason, /eligib/i);
  assert.equal(found.semantic.ineligible_transfer_prevented, true);
});

test('captaincy fixture is deterministic for exact replay', () => {
  assert.deepEqual(
    buildCaptaincyTransferFixture('repeat-captain'),
    buildCaptaincyTransferFixture('repeat-captain'),
  );
  assert.notDeepEqual(
    buildCaptaincyTransferFixture('repeat-captain'),
    buildCaptaincyTransferFixture('new-captain-seed'),
  );
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { ELIGIBILITY_MISSION, buildEligibilityFixture } from '../src/qaEligibilityContract.js';

const VARIANTS = new Set(['qualified', 'one-play-short', 'several-plays-short']);

test('eligibility mission asks for qualification without hidden math', () => {
  assert.equal(ELIGIBILITY_MISSION.missionId, 'player.check-eligibility');
  assert.equal(ELIGIBILITY_MISSION.world, 'player');
  assert.match(ELIGIBILITY_MISSION.action, /plays remaining/i);
});

test('eligibility fixture is team-specific and uses one of three variants', () => {
  const fixture = buildEligibilityFixture('elig-seed-1');
  assert.equal(VARIANTS.has(fixture.variant), true);
  assert.notEqual(fixture.target.teamId, fixture.distractor.teamId);
  assert.equal(typeof fixture.target.qualified, 'boolean');
  assert.equal(typeof fixture.target.playsRemaining, 'number');
  if (fixture.variant === 'qualified') {
    assert.equal(fixture.target.qualified, true);
    assert.equal(fixture.target.playsRemaining, 0);
  } else {
    assert.equal(fixture.target.qualified, false);
    assert.ok(fixture.target.playsRemaining >= 1);
  }
  assert.equal(fixture.semantic.eligibility_is_team_and_season_specific, true);
});

test('eligibility fixture is deterministic for exact replay', () => {
  assert.deepEqual(buildEligibilityFixture('repeat-me'), buildEligibilityFixture('repeat-me'));
  assert.notDeepEqual(buildEligibilityFixture('repeat-me'), buildEligibilityFixture('new-seed'));
});

test('eligibility variants cover short and qualified states across seeds', () => {
  const seen = new Set();
  for (const seed of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l']) {
    seen.add(buildEligibilityFixture(seed).variant);
  }
  assert.equal(seen.has('qualified'), true);
  assert.equal(seen.has('one-play-short') || seen.has('several-plays-short'), true);
});

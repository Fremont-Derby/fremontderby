import test from 'node:test';
import assert from 'node:assert/strict';
import { NEXT_MATCH_MISSION, buildNextMatchFixture } from '../src/qaNextMatchContract.js';
import { pickNextMatch, nextMatchLabel } from '../src/nextMatchSummary.js';

test('next-match mission is a player fixture with home and schedule routes', () => {
  assert.equal(NEXT_MATCH_MISSION.missionId, 'player.find-next-match');
  assert.ok(NEXT_MATCH_MISSION.productRoutes.includes('/schedule'));
});

test('same seed rebuilds the same next match', () => {
  const a = buildNextMatchFixture('night-23');
  const b = buildNextMatchFixture('night-23');
  assert.deepEqual(a.nextMatch, b.nextMatch);
  assert.equal(a.player.isCaptain, false);
});

test('pickNextMatch selects the seeded next match among distractors', () => {
  const fixture = buildNextMatchFixture('night-24');
  const rows = [fixture.nextMatch, ...fixture.distractors];
  const now = Date.parse('2026-09-17T20:00:00Z');
  const next = pickNextMatch(rows, { now, teamId: fixture.team.id });
  assert.equal(next.id, fixture.nextMatch.id);
  assert.match(nextMatchLabel(next), / vs /);
});

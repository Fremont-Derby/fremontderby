import test from 'node:test';
import assert from 'node:assert/strict';
import { eligibilityBadge } from '../src/eligibilityBadge.js';

test('qualified player does not ask the human to do math', () => {
  const badge = eligibilityBadge({
    matches_played: 8,
    minimum_matches: 8,
    is_prize_eligible: true,
    prize_rank: 2,
  });
  assert.equal(badge.qualified, true);
  assert.equal(badge.playsRemaining, 0);
  assert.match(badge.label, /Qualified/);
});

test('one play short shows remaining plays, not the raw minimum', () => {
  const badge = eligibilityBadge({ matches_played: 7, minimum_matches: 8, wins: 4, losses: 3 });
  assert.equal(badge.qualified, false);
  assert.equal(badge.playsRemaining, 1);
  assert.equal(badge.label, 'Needs 1 more play');
});

test('several plays short uses the plural label', () => {
  const badge = eligibilityBadge({ matches_played: 5, minimum_matches: 8 });
  assert.equal(badge.playsRemaining, 3);
  assert.equal(badge.label, 'Needs 3 more plays');
});

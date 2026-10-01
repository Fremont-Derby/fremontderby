import test from 'node:test';
import assert from 'node:assert/strict';
import { isRequestedTeam, teamContextSummary } from '../src/teamContextHighlight.js';

test('requested team matches id or name and ignores distractors', () => {
  const target = { id: 'team-target', name: 'Rail Owls' };
  const distractor = { id: 'team-other', name: 'Green Felt Crew' };
  assert.equal(isRequestedTeam(target, 'team-target'), true);
  assert.equal(isRequestedTeam(target, 'Rail Owls'), true);
  assert.equal(isRequestedTeam(distractor, 'team-target'), false);
  assert.equal(isRequestedTeam(target, ''), false);
});

test('team context summary surfaces captain and season for the mission', () => {
  const summary = teamContextSummary({
    name: 'Rail Owls',
    captainName: 'Maya Banks',
    seasonName: 'Fall League',
    roster: ['Maya Banks', 'Eli Chen', 'Nova Reed'],
  });
  assert.equal(summary.captainName, 'Maya Banks');
  assert.equal(summary.seasonName, 'Fall League');
  assert.equal(summary.rosterCount, 3);
  assert.equal(summary.hasCaptain, true);
});

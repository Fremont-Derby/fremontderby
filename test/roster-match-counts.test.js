import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  accumulateMatchCounts,
  evaluateRosterEligibility,
  decisionCue,
  teamPlayoffSummary,
} from '../src/rosterMatchCounts.js';

test('own-team-only counts for us and not elsewhere', () => {
  const counts = accumulateMatchCounts(
    [
      { player_a_id: 'p1', player_b_id: 'p2', team_a_id: 't1', team_b_id: 't2', status: 'finalized' },
      { player_a_id: 'p1', player_b_id: 'p3', team_a_id: 't1', team_b_id: 't3', status: 'corrected' },
    ],
    't1',
  );
  assert.equal(counts.get('p1').forUs, 2);
  assert.equal(counts.get('p1').elsewhere, 0);
});

test('substitute for other team increments elsewhere only', () => {
  const counts = accumulateMatchCounts(
    [
      { player_a_id: 'p1', player_b_id: 'px', team_a_id: 'tOther', team_b_id: 't2', status: 'finalized' },
    ],
    'tUs',
  );
  assert.equal(counts.get('p1').forUs, 0);
  assert.equal(counts.get('p1').elsewhere, 1);
});

test('2 for us + 3 elsewhere stays below 3-match team threshold', () => {
  const evaluated = evaluateRosterEligibility([{ forUs: 2, elsewhere: 3 }]);
  assert.equal(evaluated[0].postseasonEligible, false);
  assert.equal(evaluated[0].need, 2); // needs 4 before foundation
  assert.equal(decisionCue(evaluated[0]), 'Needs 2');
});

test('4,4,4,3,3 yields five eligible once foundation met', () => {
  const evaluated = evaluateRosterEligibility(
    [4, 4, 4, 3, 3].map((forUs) => ({ forUs, elsewhere: 0 })),
  );
  assert.equal(evaluated.filter((c) => c.postseasonEligible).length, 5);
  assert.equal(evaluated[0].foundationMet, true);
  assert.match(teamPlayoffSummary(evaluated), /Playoffs ready · 5 eligible/);
});

test('UI still carries compact decision-first copy', () => {
  const page = readFileSync(new URL('../src/teamsPage.js', import.meta.url), 'utf8');
  assert.match(page, /for us ·/);
  assert.match(page, /Playoff eligible/);
  assert.match(page, /Other teams/);
  assert.match(page, /elsewhereByTeam/);
});

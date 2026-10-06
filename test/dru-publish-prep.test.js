import test from 'node:test';
import assert from 'node:assert/strict';
import { practiceCaptainPlan, practicePublishReady, practicePublishSlotCount, practiceRosterPlan, practiceSlotPlan, withoutReleasedPracticeTeams } from '../src/druPublishPrep.js';

test('a practice night fills each team to the committed roster', () => {
  const plan = practiceRosterPlan(
    [{ id: 'team-a' }, { id: 'team-b' }],
    [{ team_id: 'team-a', player_id: 'captain-a', role: 'captain' }],
    [{ id: 'captain-a' }, { id: 'p1' }, { id: 'p2' }, { id: 'p3' }, { id: 'p4' }, { id: 'p5' }],
    3,
  );
  assert.equal(plan.adds.length, 5);
  assert.equal(plan.adds.filter((row) => row.team_id === 'team-a').length, 2);
  assert.equal(plan.adds.filter((row) => row.team_id === 'team-b').length, 3);
  assert.equal(new Set(plan.seasonPlayers.map((row) => row.player_id)).size, 6);
});

test('opening night needs four players on a practice team', () => {
  const plan = practiceRosterPlan(
    [{ id: 'team-a' }],
    [
      { team_id: 'team-a', player_id: 'captain', role: 'captain' },
      { team_id: 'team-a', player_id: 'one', role: 'player' },
      { team_id: 'team-a', player_id: 'two', role: 'player' },
    ],
    [{ id: 'captain' }, { id: 'one' }, { id: 'two' }, { id: 'spare' }],
    4,
  );
  assert.equal(plan.adds.length, 1);
  assert.equal(plan.adds[0].player_id, 'spare');
});

test('a forming practice team gets a spare captain before publish', () => {
  const adds = practiceCaptainPlan(
    [{ id: 'team-a' }, { id: 'team-b' }],
    [{ team_id: 'team-a', player_id: 'captain-a', role: 'captain' }],
    [{ id: 'captain-a' }, { id: 'spare' }],
  );
  assert.equal(adds.length, 1);
  assert.equal(adds[0].team_id, 'team-b');
  assert.equal(adds[0].role, 'captain');
});

test('a practice slot is skipped when the team has no captain', () => {
  const slots = practiceSlotPlan(
    [{ id: 'team-a' }, { id: 'team-b' }],
    [{ team_id: 'team-b', player_id: 'captain-b', role: 'captain' }],
  );
  assert.equal(slots.length, 1);
  assert.equal(slots[0].team_id, 'team-b');
});

test('a practice publish waits for eight teams', () => {
  assert.equal(practicePublishReady(0).ok, false);
  assert.equal(practicePublishReady(3).ok, false);
  assert.equal(practicePublishReady(8).ok, true);
});

test('a released slot does not count toward the practice night', () => {
  const slots = [
    { team_id: 'a', status: 'confirmed' },
    { team_id: 'b', status: 'released' },
    { team_id: 'c', status: 'expired' },
    { team_id: null, status: 'confirmed' },
  ];
  assert.equal(practicePublishSlotCount(slots), 1);
  assert.equal(practicePublishReady(practicePublishSlotCount(slots)).ok, false);
});

test('a released team is left out of the practice schedule', () => {
  const teams = withoutReleasedPracticeTeams(
    [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
    [{ team_id: 'b', status: 'released' }, { team_id: 'c', status: 'confirmed' }],
  );
  assert.deepEqual(teams.map((team) => team.id), ['c']);
});

test('a team off the open slots is left out of the practice schedule', () => {
  const teams = withoutReleasedPracticeTeams(
    [{ id: 'open' }, { id: 'released' }, { id: 'extra' }],
    [{ team_id: 'open', status: 'confirmed' }],
  );
  assert.deepEqual(teams.map((team) => team.id), ['open']);
});

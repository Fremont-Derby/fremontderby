import test from 'node:test';
import assert from 'node:assert/strict';
import { practiceCaptainPlan, practiceRosterPlan, practiceSlotPlan } from '../src/druPublishPrep.js';

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

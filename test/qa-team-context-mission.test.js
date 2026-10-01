import test from 'node:test';
import assert from 'node:assert/strict';
import { TEAM_CONTEXT_MISSION, buildTeamContextFixture } from '../src/qaTeamContextContract.js';

test('team context mission is a player fixture with home and teams routes', () => {
  assert.equal(TEAM_CONTEXT_MISSION.missionId, 'player.understand-my-team');
  assert.equal(TEAM_CONTEXT_MISSION.persona, 'Player');
  assert.ok(TEAM_CONTEXT_MISSION.productRoutes.includes('/'));
  assert.ok(TEAM_CONTEXT_MISSION.productRoutes.includes('/teams'));
});

test('same seed rebuilds the same captain, roster, and seasons', () => {
  const a = buildTeamContextFixture('night-17');
  const b = buildTeamContextFixture('night-17');
  assert.deepEqual(a.target, b.target);
  assert.equal(a.target.captainName, b.target.captainName);
  assert.ok(a.target.roster.includes(a.player.name));
});

test('fixture keeps a distractor team and season away from the target', () => {
  const fixture = buildTeamContextFixture('night-18');
  assert.notEqual(fixture.target.teamName, fixture.distractor.teamName);
  assert.notEqual(fixture.target.seasonName, fixture.distractor.seasonName);
  assert.ok(fixture.semantic.target_team_has_named_captain);
  assert.ok(fixture.semantic.target_roster_includes_persona);
});

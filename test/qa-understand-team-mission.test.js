import test from 'node:test';
import assert from 'node:assert/strict';
import { QA_MISSIONS, buildQaMissionFixture } from '../src/qaMissionCampaign.js';

test('understand-team mission randomizes a multi-team player context', () => {
  const mission=QA_MISSIONS.find(item=>item.missionId==='player.understand-team');
  assert.ok(mission);
  assert.equal(mission.world,'player');
  assert.match(mission.action,/captain, roster, and season/i);
  const fixture=buildQaMissionFixture('player.understand-team','team-seed-1');
  assert.equal(fixture.player.name, fixture.target.roster[1]);
  assert.notEqual(fixture.target.teamId,fixture.distractor.teamId);
  assert.notEqual(fixture.target.seasonId,fixture.distractor.seasonId);
  assert.notEqual(fixture.target.teamName,fixture.distractor.teamName);
  assert.equal(fixture.target.roster.length,5);
  assert.ok(fixture.target.roster.includes(fixture.target.captainName));
  assert.equal(fixture.semantic.persona_has_multiple_team_contexts,true);
});

test('understand-team fixture is deterministic for exact replay', () => {
  assert.deepEqual(buildQaMissionFixture('player.understand-team','repeat-me'),buildQaMissionFixture('player.understand-team','repeat-me'));
  assert.notDeepEqual(buildQaMissionFixture('player.understand-team','repeat-me'),buildQaMissionFixture('player.understand-team','new-seed'));
});

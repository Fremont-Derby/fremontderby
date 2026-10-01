import test from 'node:test';
import assert from 'node:assert/strict';
import { launchMission } from '../src/missionLaunch.js';

test('a mission starts only with a persona and a plain task', () => {
  assert.equal(launchMission({ persona: '', task: 'Find the next match' }).ok, false);
  assert.equal(launchMission({ persona: 'player', task: 'fixture json' }).ok, false);
  assert.equal(launchMission({ persona: 'player', task: 'Find the next match' }).ok, true);
});

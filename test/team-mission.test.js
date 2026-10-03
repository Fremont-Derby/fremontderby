import test from 'node:test';
import assert from 'node:assert/strict';
import { teamMissionLine, launchLine } from '../src/teamMission.js';
import { renderProfilePage } from '../src/profilePage.js';

test('the team mission and the launch are named', () => {
  assert.equal(teamMissionLine({ name: 'Owls' }), 'Team mission: understand Owls.');
  assert.equal(launchLine({ name: 'find my team' }), 'Launch: find my team.');
  const html = renderProfilePage();
  assert.match(html, /Team mission: understand Owls/);
  assert.match(html, /Launch: find my team/);
});

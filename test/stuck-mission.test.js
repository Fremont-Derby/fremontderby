import test from 'node:test';
import assert from 'node:assert/strict';
import { missionIdentityLine, stuckPathLine } from '../src/stuckMission.js';
import { renderProfilePage } from '../src/profilePage.js';

test('a mission names itself and a stuck path', () => {
  assert.equal(missionIdentityLine({ name: 'find my team' }), 'Mission: find my team.');
  assert.equal(stuckPathLine({ stuck: true }), 'Stuck: open Profile, then try the mission again.');
  const html = renderProfilePage();
  assert.match(html, /Mission: find my team/);
  assert.match(html, /Stuck: open Profile, then try the mission again/);
});

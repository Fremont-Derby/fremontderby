import test from 'node:test';
import assert from 'node:assert/strict';
import { missionCompletionLine, teamContextLine } from '../src/completionTeam.js';
import { renderProfilePage } from '../src/profilePage.js';

test('a completed mission and the team role are named', () => {
  assert.equal(missionCompletionLine({ name: 'find my next match', done: true }), 'find my next match is complete.');
  assert.equal(teamContextLine({ name: 'Owls', role: 'player' }), 'Team Owls: you are player.');
  const html = renderProfilePage();
  assert.doesNotMatch(html, /find my next match is complete/);
  assert.doesNotMatch(html, /Team Owls: you are player/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { personaMissionLine, missionChromeLine } from '../src/missionChrome.js';
import { renderProfilePage } from '../src/profilePage.js';

test('a persona mission names the task, done rule, and abort', () => {
  assert.equal(personaMissionLine({ name: 'find my next match' }), 'Persona mission: find my next match.');
  assert.equal(missionChromeLine({ task: 'find the match', done: 'the match is named', abort: 'stop' }), 'Task find the match. Done when the match is named. Abort: stop.');
  const html = renderProfilePage();
  assert.doesNotMatch(html, /Persona mission: find my next match/);
  assert.doesNotMatch(html, /Abort: stop/);
});

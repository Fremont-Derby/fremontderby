import test from 'node:test';
import assert from 'node:assert/strict';
import { standingsContextLine, missionTaskLine } from '../src/standingsTask.js';
import { renderStandingsPage } from '../src/standingsPage.js';

test('standings name the place and the task', () => {
  assert.equal(standingsContextLine({ team: 'Owls', place: 1 }), 'Owls is in place 1.');
  assert.equal(missionTaskLine({ task: 'find my standings' }), 'Task: find my standings');
  const html = renderStandingsPage();
  assert.doesNotMatch(html, /Owls is in place 1/);
  assert.match(html, /Task: find my standings/);
});

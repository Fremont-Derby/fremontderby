import test from 'node:test';
import assert from 'node:assert/strict';
import { levelResultLine, stuckPathLine } from '../src/missionResult.js';
import { renderProfilePage } from '../src/profilePage.js';

test('a level result and a stuck path are named', () => {
  assert.equal(levelResultLine({ level: 'find my next match', complete: true }), 'find my next match is complete.');
  assert.equal(stuckPathLine({ name: 'player mission', stuck: true }), 'Stuck on player mission. Start again.');
  const html = renderProfilePage();
  assert.match(html, /find my next match is complete/);
  assert.match(html, /Stuck on player mission. Start again/);
});

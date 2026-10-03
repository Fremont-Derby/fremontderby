import test from 'node:test';
import assert from 'node:assert/strict';
import { missionLaunchLine, testerPathLine } from '../src/missionLaunch.js';
import { renderStandingsPage } from '../src/standingsPage.js';

test('a mission launch is named and the preview is not the tester path', () => {
  assert.equal(missionLaunchLine({ name: 'find my next match' }), 'Launch find my next match.');
  assert.equal(testerPathLine({ preview: false }), 'Tester path: play the mission.');
  assert.equal(testerPathLine({ preview: true }), '');
  const html = renderStandingsPage();
  assert.match(html, /Launch find my next match/);
  assert.match(html, /Tester path: play the mission/);
});

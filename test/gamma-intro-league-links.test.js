import assert from 'node:assert/strict';
import test from 'node:test';
import { renderIntroPage } from '../src/publicPages.js';

test('intro page links live league surfaces', () => {
  const html = renderIntroPage();
  assert.match(html, /href="\/schedule">Schedule</);
  assert.match(html, /href="\/standings">Standings</);
  assert.match(html, /href="\/teams">Teams</);
  assert.match(html, /href="\/players">Players</);
});

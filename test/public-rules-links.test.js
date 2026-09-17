import assert from 'node:assert/strict';
import test from 'node:test';
import { renderRulesPage } from '../src/publicPages.js';

test('rules page links back to live league surfaces', () => {
  const html = renderRulesPage();
  assert.match(html, /League Rules · Fremont Derby/);
  assert.match(html, /href="\/schedule">Schedule</);
  assert.match(html, /href="\/standings">Standings</);
  assert.match(html, /href="\/teams">Teams</);
  assert.match(html, /href="\/players">Players</);
  assert.match(html, /four active players/i);
});

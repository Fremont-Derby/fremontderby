import assert from 'node:assert/strict';
import test from 'node:test';
import { renderIntroPage } from '../src/publicPages.js';

test('welcome page links to live league surfaces', () => {
  const html = renderIntroPage();
  assert.match(html, /Welcome · Fremont Derby/);
  assert.match(html, /href="\/schedule">Schedule</);
  assert.match(html, /href="\/standings">Standings</);
  assert.match(html, /href="\/teams">Teams</);
  assert.match(html, /href="\/players">Players</);
  assert.match(html, /href="\/profile">Join \/ sign in</);
  assert.match(html, /href="\/rules">Read the rules</);
});

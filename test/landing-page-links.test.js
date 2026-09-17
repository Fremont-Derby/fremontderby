import test from 'node:test';
import assert from 'node:assert/strict';
import { renderLandingPage } from '../src/landingPage.js';

test('home page keeps the deploy proof and links live league surfaces', () => {
  const html = renderLandingPage();
  assert.match(html, /The deployment path is working/);
  assert.match(html, /href="\/schedule">Schedule</);
  assert.match(html, /href="\/standings">Standings</);
  assert.match(html, /href="\/teams">Teams</);
  assert.match(html, /href="\/players">Players</);
  assert.match(html, /data-fd-dru-home/);
});

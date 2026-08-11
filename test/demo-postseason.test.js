import assert from 'node:assert/strict';
import test from 'node:test';

import { renderDemoSeasonPage } from '../src/demoSeasonPage.js';

test('demo season now shows the complete fictional postseason without production persistence', () => {
  const html = renderDemoSeasonPage();
  assert.match(html, /Postseason example/);
  assert.match(html, /4 postseason players\/team/);
  assert.match(html, /Declared anchors/);
  assert.match(html, /The four scheduled matches stay recorded as a 2–2 tie/);
  assert.match(html, /Season champion: Break Room Bandits/);
  assert.match(html, /never replaces or rewrites the four scheduled postseason player results/);
  assert.match(html, /nothing on this page writes to Supabase|Nothing on this page writes to Supabase/i);
});

test('demo scoring language matches team-owned scoring authorization', () => {
  const html = renderDemoSeasonPage();
  assert.match(html, /each team maintains its own rack history/i);
  assert.match(html, /Eligible teammates can score their side/i);
  assert.doesNotMatch(html, /each player keeps an independent rack history/i);
});

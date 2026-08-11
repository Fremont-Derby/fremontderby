import test from 'node:test';
import assert from 'node:assert/strict';
import { renderDemoSeasonPage } from '../src/demoSeasonPage.js';

test('Season 1 War Games combines the disposable dry run and completed fixture', () => {
  const html = renderDemoSeasonPage();

  assert.match(html, /SEASON 1 WAR GAMES/);
  assert.match(html, /Season 1 War Games/);
  assert.match(html, /Start the test drive/);
  assert.match(html, /Captain \+ lineup/);
  assert.match(html, /Score Match 1/);
  assert.match(html, /Reset all War Games/);
  assert.match(html, /28 team matchups/);
  assert.match(html, /3 active players\/team/);
  assert.match(html, /<th>W-L<\/th>/);
  assert.match(html, /Round 1/);
  assert.match(html, /Round 7/);
  assert.match(html, /Break Room Bandits/);
  assert.match(html, /Jamie Park \(sub\)/);
  assert.match(html, /Maya Banks vs Eli Torres/);
  assert.match(html, /Postseason outcome/);
  assert.match(html, /Season champion/);
  assert.match(html, /fd\.captainSandbox\.v1/);
  assert.match(html, /fd\.playerSandbox\.v1/);
  assert.doesNotMatch(html, /fetch\s*\(/);
  assert.doesNotMatch(html, /\/api\//);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { renderDemoSeasonPage } from '../src/demoSeasonPage.js';

test('Try a League Night presents War Games as a guided isolated product tour', () => {
  const html = renderDemoSeasonPage();

  assert.match(html, /Test Drive the App/);
  assert.match(html, /War Games practice/);
  assert.match(html, /fictional players and results/i);
  assert.match(html, /cannot affect the real season/i);
  assert.match(html, /Start as captain/);
  assert.match(html, /Form team \+ lineup/);
  assert.match(html, /Score Match 1/);
  assert.match(html, /Inspect the season/);
  assert.match(html, /Tester controls · War Games/);
  assert.match(html, /Reset practice state/);
  assert.match(html, /See current teams/);
  assert.match(html, /Read the rules/);
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
  assert.match(html, /captainProgress/);
  assert.doesNotMatch(html, /THROWAWAY FAKE DATA/);
  assert.doesNotMatch(html, /DELETE BEFORE LAUNCH/);
  assert.doesNotMatch(html, /fetch\s*\(/);
  assert.doesNotMatch(html, /\/api\//);
});

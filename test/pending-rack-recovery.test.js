import assert from 'node:assert/strict';
import test from 'node:test';

import { renderScorecardPage } from '../src/scorecardPage.js';

test('owned empty pending rack cell is directly actionable', () => {
  const html = renderScorecardPage();

  assert.match(html, /const canAnswerPending=editable&&!rack&&state==='pending'/);
  assert.match(html, /editable&&\(rack\|\|canAnswerPending\)/);
  assert.match(html, /button\.textContent=rack\?value:'\+'/);
  assert.match(html, /button\.dataset\.pending=String\(canAnswerPending\)/);
  assert.match(html, /waiting for your team/);
});

test('pending rack editor can append the missing owned submission instead of editing a nonexistent rack', () => {
  const html = renderScorecardPage();

  assert.match(html, /const answeringPending=!ownRack&&Boolean\(opponentRack\)&&number===own\.length\+1/);
  assert.match(html, /const existing=Boolean\(own\[rackNumber-1\]\)/);
  assert.match(html, /const body=existing\?\{rackNumber,winnerSide:winner,scoringTeamId\}:\{winnerSide:winner,scoringTeamId\}/);
  assert.match(html, /cellValue\(opponentRack,otherSide\)/);
});

test('Add Rack label always reflects this scoring teams next submission even when opponent is ahead', () => {
  const html = renderScorecardPage();

  assert.match(html, /const nextRack=own\.length\+1/);
  assert.doesNotMatch(html, /const nextRack=Math\.max\(own\.length,opponent\.length\)\+1/);
});

test('stale same-team conflict refreshes immediately and gives an in-view instruction', () => {
  const html = renderScorecardPage();

  assert.match(html, /error\.message\.includes\('Score changed on another device'\)/);
  assert.match(html, /await loadAll\(\{quiet:true\}\)/);
  assert.match(html, /Score changed on another phone\. We refreshed it—check the current rack before scoring\./);
  assert.match(html, /winnerPicker\.dataset\.open='false'/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { renderAdminSeasonTeamsPage } from '../src/adminSeasonTeamsPage.js';

test('season team admin keeps action feedback visible on phones', () => {
  const html = renderAdminSeasonTeamsPage();

  assert.match(html, /class="state" data-state role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(html, /\.state\{position:fixed;/);
  assert.match(html, /\.state:empty\{display:none\}/);
  assert.match(html, /@media\(max-width:520px\)[\s\S]*\.state\{left:10px;right:10px;bottom:10px;width:auto;transform:none\}/);
  assert.match(html, /setState\(error\.message,'error'\);button\.disabled=false/);
  assert.match(html, /reserved a season slot/);
  assert.match(html, /added to the season/);
});

test('season team admin keeps the first view concise', () => {
  const html = renderAdminSeasonTeamsPage();

  assert.match(html, /<h1>Season teams<\/h1><p>Reserve returning teams and add qualified new teams\.<\/p>/);
  assert.doesNotMatch(html, /Historical seasons stay unchanged/);
  assert.match(html, /openSlots\.textContent=total\?[\s\S]*:'Choose a season'/);
  assert.match(html, /renderCapacity\(\);render\(\);setState\(''\)/);
  assert.doesNotMatch(html, /setState\('Ready','ok'\)/);
});

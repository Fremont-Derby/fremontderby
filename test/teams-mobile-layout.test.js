import test from 'node:test';
import assert from 'node:assert/strict';

import { renderTeamsPage } from '../src/teamsPage.js';

test('Teams keeps management tables inside narrow phone width', () => {
  const html = renderTeamsPage();

  assert.match(html, /@media\(max-width:840px\)/);
  assert.match(html, /\.panel\{overflow:hidden\}/);
  assert.match(html, /table\{width:100%;min-width:0;table-layout:fixed\}/);
  assert.match(html, /td\{overflow-wrap:anywhere;word-break:break-word\}/);
  assert.match(html, /\.actions\{display:grid;grid-template-columns:1fr;gap:6px\}/);
  assert.match(html, /\.actions button\{width:100%;min-height:44px/);

  assert.doesNotMatch(html, /\.panel\{overflow-x:auto\}/);
  assert.doesNotMatch(html, /table\{min-width:680px\}/);
});

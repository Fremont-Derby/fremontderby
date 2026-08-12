import test from 'node:test';
import assert from 'node:assert/strict';
import { designSystemStyles } from '../src/designSystem.js';
import { renderLineupPage } from '../src/lineupPage.js';

test('lineup score handoff is treated as a touch-friendly shared action', () => {
  const html = renderLineupPage();
  assert.match(html, /class="score-link"/);
  assert.match(html, />Score the three matches<\/a>/);
  assert.match(designSystemStyles, /--fd-control-min: 46px;/);
  assert.match(designSystemStyles, /button, \.button, a\.button, \.score-link,[\s\S]*\{\s*min-height: var\(--fd-control-min\);/);
});

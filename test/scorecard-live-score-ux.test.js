import test from 'node:test';
import assert from 'node:assert/strict';

import { renderScorecardPage } from '../src/scorecardPage.js';

test('live scorecard promotes the captain submission score and removes redundant action cards', () => {
  const html = renderScorecardPage();

  assert.match(html, /Live individual score/);
  assert.match(html, /\.submission\[data-value="W"\]/);
  assert.match(html, /\.submission\[data-value="L"\]/);
  assert.match(html, /new MutationObserver\(syncEnhancements\)/);
  assert.match(html, /document\.querySelector\('\[data-edit-current\]'\)\?\.remove\(\)/);
  assert.match(html, /document\.querySelector\('\.quick-actions \.details'\)\?\.remove\(\)/);
  assert.match(html, /Undo last rack/);
});

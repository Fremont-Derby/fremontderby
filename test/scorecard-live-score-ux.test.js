import test from 'node:test';
import assert from 'node:assert/strict';

import { renderScorecardPage } from '../src/scorecardPage.js';

test('live scorecard promotes the captain submission score and removes redundant action cards', () => {
  const html = renderScorecardPage();

  assert.match(html, /Live individual score/);
  assert.match(html, /\.submission\[data-value="W"\]/);
  assert.match(html, /\.submission\[data-value="L"\]/);
  assert.match(html, /window\.fdRackLedgerState/);
  assert.match(html, /state\.ownSide === 'A'/);
  assert.match(html, /state\.ownSide === 'B'/);
  assert.ok(html.includes('ownConfirmed:Boolean(comparison?.own_confirmed_at)'));
  assert.match(html, /if \(canUndo\) undoButton\.disabled = false/);
  assert.match(html, /Undo last rack & unlock/);
  assert.match(html, /This also unlocks your submitted score/);
  assert.match(html, /new MutationObserver\(syncEnhancements\)/);
  assert.match(html, /document\.querySelector\('\[data-edit-current\]'\)\?\.remove\(\)/);
  assert.match(html, /document\.querySelector\('\.quick-actions \.details'\)\?\.remove\(\)/);
});

// This contract intentionally stays page-local so shared sandbox reconciliation remains unchanged.

import test from 'node:test';
import assert from 'node:assert/strict';

import { renderScorecardPage, resolveRaceCompletion } from '../src/scorecardPage.js';

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

test('race completion respects unequal targets on either side', () => {
  assert.deepEqual(
    resolveRaceCompletion({ scoreA: 4, scoreB: 3, targetA: 4, targetB: 7 }),
    { winnerSide: 'A', scoreA: 4, scoreB: 3 },
  );
  assert.deepEqual(
    resolveRaceCompletion({ scoreA: 3, scoreB: 7, targetA: 4, targetB: 7 }),
    { winnerSide: 'B', scoreA: 3, scoreB: 7 },
  );
  assert.equal(resolveRaceCompletion({ scoreA: 3, scoreB: 6, targetA: 4, targetB: 7 }), null);
});

test('finished races replace Add Rack with a clear completion state', () => {
  const html = renderScorecardPage();

  assert.match(html, /function syncRaceCompletion\(\)/);
  assert.match(html, /addRack\.hidden = true/);
  assert.match(html, /winnerPicker\.hidden = true/);
  assert.match(html, /Race complete — /);
  assert.match(html, /Review the racks, then confirm your side below/);
  assert.match(html, /Waiting for the other side to agree/);
  assert.match(html, /edit a rack or undo the last rack/);
  assert.match(html, /dataRaceComplete/);
});

// This contract intentionally stays page-local so shared sandbox reconciliation remains unchanged.

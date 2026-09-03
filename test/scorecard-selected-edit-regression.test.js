import test from 'node:test';
import assert from 'node:assert/strict';

import { liveRackLedgerAdapterSource } from '../src/liveRackLedgerAdapter.js';
import { renderScorecardPage } from '../src/scorecardPage.js';

// Human-validation regression for #2165.
test('live scorecard keeps chosen opening and rack-edit result visibly selected', () => {
  const html = renderScorecardPage();

  assert.match(html, /\.opening-option\[aria-pressed="true"\]/);
  assert.match(html, /\.edit-result\[aria-pressed="true"\]/);
  assert.match(html, /background:#08783f!important/);
  assert.match(html, /color:#fff!important/);
  assert.match(html, /\.opening-option\[aria-pressed="true"\]:disabled\{\s*opacity:1/);
  assert.match(html, /\.opening-option\[aria-pressed="false"\]/);
  assert.match(html, /\.edit-result\[aria-pressed="false"\]/);
});

test('live rack mutations send the loaded own-rack snapshot explicitly', () => {
  assert.match(liveRackLedgerAdapterSource, /let expectedOwnRacks=\[\]/);
  assert.match(liveRackLedgerAdapterSource, /expectedOwnRacks=Array\.isArray\(comparisonBody\.comparison\?\.own_racks\)/);
  assert.match(liveRackLedgerAdapterSource, /winnerSide:input\.winnerSide,expectedRacks:expectedOwnRacks/);
  assert.match(liveRackLedgerAdapterSource, /body\.rackNumber=input\.rackNumber/);
  assert.match(liveRackLedgerAdapterSource, /score-racks\/undo[\s\S]*expectedRacks:expectedOwnRacks/);
  assert.match(liveRackLedgerAdapterSource, /score-confirm[\s\S]*expectedRacks:expectedOwnRacks/);
});
